# CivicFix API reference (v1)

Base URL: `http://localhost:5000/api/v1` (development). All responses are JSON.

## Conventions

**Success envelope**

```json
{ "success": true, "message": "optional", "data": { }, "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 } }
```

**Error envelope**

```json
{ "success": false, "message": "Please correct the highlighted fields", "errors": [{ "field": "title", "message": "Title must be 5-120 characters" }] }
```

**Authentication.** Login and registration set an `httpOnly` cookie named `civicfix_token` (a signed JWT, HS256). Browsers send it automatically with `withCredentials: true`. API clients may instead send `Authorization: Bearer <token>`, but the token is never returned in a response body, so in practice use the cookie (Postman's cookie jar handles it).

**CSRF guard.** Every `POST`, `PATCH` and `DELETE` must include the header `X-Requested-With: XMLHttpRequest`, otherwise the API answers `403`.

**Status codes used**

| Code | Meaning |
|---|---|
| 200 / 201 | OK / created |
| 400 | Malformed request (bad JSON, invalid upload) |
| 401 | Not logged in, or session expired/invalid |
| 403 | Logged in but not allowed (wrong role, not the owner, deactivated, missing CSRF header) |
| 404 | Resource or route not found |
| 409 | Conflict (duplicate email or department, edit after review started, concurrent status change, last admin) |
| 413 | Request body too large |
| 422 | Validation failed (field errors included) or invalid status transition |
| 429 | Rate limit exceeded |
| 503 | Database unavailable |

## Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | none | `200` with `{ status: "ok", database: "connected" }`, or `503` when MongoDB is down |

## Authentication `/auth`

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | none | `name, email, password, confirmPassword, phone?` | Always creates a **citizen**; a `role` field is ignored. Rate limited (20 / 15 min / IP). |
| POST | `/auth/login` | none | `email, password` | Same `401` message for unknown email and wrong password. Rate limited. |
| POST | `/auth/logout` | none | none | Clears the cookie. |
| GET | `/auth/me` | any | none | Current user, plus `complaintCount` for citizens. |
| PATCH | `/auth/me` | any | `name?, phone?` | Email and role cannot be changed here. |
| PATCH | `/auth/me/password` | any | `currentPassword, newPassword` | Rate limited. |

Password rule: 8-72 characters with at least one upper-case letter, one lower-case letter and one digit.

## Complaints `/complaints`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/complaints` | citizen | Create. `multipart/form-data` (with optional `image` file) or JSON. |
| GET | `/complaints` | citizen / admin | Citizens get **only their own**; admins get all. Supports the list query parameters below. |
| GET | `/complaints/summary` | citizen / admin | Counts by status and the 5 most recently updated complaints (own complaints for citizens). |
| GET | `/complaints/:id` | owner / admin | Complaint, timeline, and `permissions { canEdit, canDelete, nextStatuses }`. |
| PATCH | `/complaints/:id` | owner (citizen) | Edit while status is in `CITIZEN_EDITABLE_STATUSES` (default `Pending`); otherwise `409`. Accepts `removeAttachment=true` or a new `image`. |
| DELETE | `/complaints/:id` | owner / admin | Owner only while editable; admin any time. Also deletes history and the image file. |
| GET | `/complaints/:id/attachment` | owner / admin | Streams the image. Images are never publicly accessible. |
| GET | `/complaints/:id/activity` | owner / admin | Timeline. Internal notes and staff-only records are excluded for citizens at the database query level. |
| POST | `/complaints/:id/updates` | owner / admin | Citizens: `publicMessage` (comment). Admins: `publicMessage` and/or `internalNote`. Citizens sending `internalNote` get `403`. |
| GET | `/complaints/reference/:referenceNumber` | none | Public tracking. Returns only reference, title, category, priority, status, area, department name, dates and status/assignment events. |

**Complaint fields**

| Field | Rules |
|---|---|
| `title` | required, 5-120 chars |
| `description` | required, 20-2000 chars |
| `category` | required: `Garbage`, `Roads & Potholes`, `Streetlights`, `Water Supply`, `Drainage & Sewage`, `Sanitation`, `Other` |
| `priority` | `Low`, `Medium` (default), `High`, `Urgent` |
| `address` | required, 5-250 chars |
| `city` | required, 2-80 chars |
| `latitude`, `longitude` | optional, both or neither, valid ranges |
| `image` | optional file field, JPEG/PNG/WebP, max `MAX_UPLOAD_MB` (default 2 MB), content verified by magic bytes |

Fields such as `status`, `referenceNumber`, `citizenId`, `departmentId` and `assignedTo` are ignored if sent by a citizen (mass-assignment protection).

**List query parameters** (`GET /complaints`, `GET /admin/complaints`)

| Param | Values |
|---|---|
| `search` | text, matches reference number, title, city or address (case-insensitive, regex-escaped) |
| `status` | one of the five statuses |
| `category` | one of the categories |
| `priority` | one of the priorities |
| `department` | department ObjectId |
| `from`, `to` | ISO dates (`YYYY-MM-DD`); `to` includes the whole day |
| `sort` | `newest` (default), `oldest`, `priority`, `priority_asc`, `updated` |
| `page`, `limit` | `limit` 1-50 |

Values outside these whitelists return `422`. Operator objects like `status[$ne]=x` are stripped before validation.

**Create response example**

```json
{
  "success": true,
  "message": "Complaint submitted. Your reference number is CF-2026-000019",
  "data": { "complaint": { "_id": "...", "referenceNumber": "CF-2026-000019", "status": "Pending", "...": "..." } }
}
```

## Admin `/admin` (administrators only)

| Method | Path | Body / query | Description |
|---|---|---|---|
| GET | `/admin/dashboard` | none | Totals per status, resolution rate, average resolution days, per-category and per-priority counts, last 10 activity records. All aggregated from MongoDB. |
| GET | `/admin/complaints` | list query params | All complaints with citizen name/email and department. |
| PATCH | `/admin/complaints/:id/status` | `status, publicMessage?, internalNote?` | Enforces the workflow below. `publicMessage` is **required** for `Rejected` (the reason). Uses a conditional update, so concurrent changes return `409`. |
| PATCH | `/admin/complaints/:id/assign` | `departmentId? (id or null), assignedTo? (staff name), internalNote?` | Department must exist and be active. Not allowed on rejected complaints. |
| GET | `/admin/users` | `search, role, active, page, limit` | Users with `complaintCount`. |
| GET | `/admin/users/:id` | none | Account details, complaints by status, 5 recent complaints. |
| PATCH | `/admin/users/:id/status` | `isActive` | Activate/deactivate. Refuses to deactivate yourself or the last active administrator. |
| GET | `/admin/departments` | `active=true` optional | Departments with assigned and open complaint counts. |
| POST | `/admin/departments` | `name, description?` | Name unique, case-insensitive. |
| PATCH | `/admin/departments/:id` | `name?, description?, isActive?` | Edit or reactivate. |
| DELETE | `/admin/departments/:id` | none | Soft delete: sets `isActive=false` so past complaints keep their reference. |

**Status workflow**

| From | Allowed next statuses |
|---|---|
| Pending | Under Review, Rejected |
| Under Review | In Progress, Rejected |
| In Progress | Resolved, Under Review |
| Resolved | In Progress (reopen; clears `resolvedAt`) |
| Rejected | none (final) |

Every status change, assignment, update and note creates a `ComplaintActivity` record with actor, role and timestamp.

## Public `/public`

| Method | Path | Description |
|---|---|---|
| GET | `/public/stats` | Total, resolved, in progress, pending, resolution rate, average resolution days, areas covered, per-category counts. |
| GET | `/public/recent-complaints?limit=6` | Latest non-rejected complaints with only `referenceNumber, title, category, status, city, createdAt` (max 12). |
| GET | `/public/meta` | Category, priority and status option lists. |
