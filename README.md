# CivicFix — Smart Complaint Management System

> **Your City. Your Voice. Our Responsibility.**

CivicFix is a full-stack civic complaint platform. Citizens report problems such as garbage, potholes, broken streetlights, water supply, drainage and sanitation issues, attach a photo and location, and follow every step until the issue is resolved. Municipal administrators review complaints, assign them to departments and field staff, move them through a server-enforced status workflow, and monitor performance on a live dashboard.

This is a college full-stack development project built with **React (Vite) + Bootstrap 5** on the front end, **Node.js + Express** REST APIs on the back end, and **MongoDB + Mongoose** for persistence. Authentication uses **JWT in httpOnly cookies** with bcrypt-hashed passwords.

---

## Table of contents

1. [Features](#1-features)
2. [Technology stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Directory structure](#4-directory-structure)
5. [Prerequisites](#5-prerequisites)
6. [Installation](#6-installation)
7. [Environment configuration](#7-environment-configuration)
8. [MongoDB setup](#8-mongodb-setup)
9. [Admin bootstrap](#9-admin-bootstrap)
10. [Demo data seeding](#10-demo-data-seeding)
11. [Running the app](#11-running-the-app)
12. [API documentation](#12-api-documentation)
13. [Database schema](#13-database-schema)
14. [Authentication and security](#14-authentication-and-security)
15. [Tests](#15-tests)
16. [Postman collection](#16-postman-collection)
17. [Git and GitHub](#17-git-and-github)
18. [Deployment](#18-deployment)
19. [Troubleshooting](#19-troubleshooting)
20. [Known limitations](#20-known-limitations)

---

## 1. Features

**Public site**
- Landing page with hero, category cards, "How it works", **live statistics from the database**, and recent complaints shown with privacy protection (no names, street addresses, descriptions or photos).
- Public complaint tracking by reference number (`CF-2026-000123`), no login required.
- About page (mission and processing workflow) and Help page (FAQ, demo contact details clearly marked as non-municipal).
- "Report Issue" requires login and returns the user to the complaint form afterwards.

**Citizens**
- Register (with password confirmation and strength guidance), log in, log out, edit profile, change password.
- Dashboard with totals for submitted, pending, in-progress and resolved complaints, plus recent activity.
- Submit complaints with title, description, category, priority, address, city/area, optional coordinates ("Use my current location") and an optional photo (JPEG/PNG/WebP, 2 MB).
- A unique, human-readable reference number is generated atomically and shown after submission.
- "My complaints" with server-side search, status/category/date filters, sorting and pagination (filters are kept in the URL).
- Complaint details with a database-backed activity timeline, staff updates, assignment and photo.
- Edit or delete a complaint only while it is **Pending** (configurable on the server); comment on complaints at any time unless rejected.

**Administrators**
- Overview analytics from MongoDB aggregations: totals per status, resolution rate, average resolution time, category distribution and a recent-activity feed.
- Complaint management: search, filter (status, category, priority, department, date range), sort (date, priority), full details, status changes, assignment to department and field staff, citizen-visible updates, internal notes, rejection with mandatory reason, and full status history.
- Server-enforced status workflow; each change is recorded with timestamp and actor.
- User management: search, filter, view account details and complaint counts, activate/deactivate accounts. The last active administrator and your own account cannot be deactivated.
- Department management: create, view, edit, deactivate and reactivate.

**Cross-cutting**
- Responsive layouts (phone, tablet, desktop), collapsible navbar and dashboard sidebar, cards on mobile and tables on larger screens.
- Loading states, empty states, retryable error messages, toast notifications, confirmation dialogs for destructive actions, accessible form validation messages.
- Session expiry handling: any `401` logs the user out locally and returns them to the login page.

## 2. Technology stack

| Layer | Technology |
|---|---|
| Front end | React 18, Vite 5, React Router 6, Axios, Bootstrap 5.3, Bootstrap Icons, Public Sans font |
| Back end | Node.js (ES modules), Express 4, express-validator, jsonwebtoken, bcryptjs, multer, helmet, cors, cookie-parser, express-rate-limit, morgan, dotenv |
| Database | MongoDB 6+ (local or Atlas), Mongoose 8 |
| Testing | Node built-in test runner (`node:test`), Supertest, mongodb-memory-server, Postman collection |

**Node.js version:** 18.18 or newer is required; **Node 20 LTS or 22 LTS is recommended**.

## 3. Architecture

```
 Browser (React SPA)                     Express API (/api/v1)                       MongoDB
 ───────────────────                     ─────────────────────                       ───────
 pages / components                      helmet, CORS whitelist, rate limit
   │ hooks (useAsync, useQueryFilters)   CSRF header guard, DB-ready check
   ▼                                     NoSQL key sanitizer
 services/*.js  ── Axios ──cookie──►     routes ─► validators ─► controllers ──Mongoose──► users
 (withCredentials,                                     │            │                       complaints
  X-Requested-With)                      auth middleware (JWT cookie, role check)            complaintactivities
                                         services (status workflow, references,              departments
                                                   activity log, file checks)                counters
                                         centralized error handler (consistent JSON)
```

- **Development:** Vite serves the SPA on `http://localhost:5173` and proxies `/api` to Express on port 5000. The browser sees one origin, so the auth cookie is first-party and no CORS configuration is needed locally.
- **Production:** the front end (static `dist/`) and the API are deployed separately; the API's CORS whitelist and cookie settings (`SameSite=None; Secure`) allow the cross-site requests. See [DEPLOYMENT.md](DEPLOYMENT.md).
- **Authorization is always enforced by the API.** The React route guards only improve the user experience.

## 4. Directory structure

```
CivicFix/
├── README.md                 ← this file
├── DEPLOYMENT.md             ← hosting guide
├── docs/API.md               ← full endpoint reference
├── postman/CivicFix.postman_collection.json
├── package.json              ← convenience scripts for both apps
├── .gitignore
├── server/
│   ├── .env.example
│   ├── package.json
│   ├── scripts/
│   │   ├── createAdmin.js    ← first-admin bootstrap (CLI only)
│   │   └── seed.js           ← demo data
│   ├── src/
│   │   ├── app.js            ← Express app factory (middleware + routes)
│   │   ├── server.js         ← startup: config check, DB connect, listen
│   │   ├── config/           ← env validation, MongoDB connection
│   │   ├── controllers/      ← auth, complaint, admin, public
│   │   ├── middleware/       ← auth, validation, uploads, security, rate limits, errors
│   │   ├── models/           ← User, Complaint, ComplaintActivity, Department, Counter
│   │   ├── routes/           ← /auth, /complaints, /admin, /public
│   │   ├── services/         ← status workflow, reference numbers, tokens, activity log, files
│   │   ├── utils/            ← constants, query builders, sanitizer, ApiError, response helpers
│   │   └── validators/       ← express-validator rule sets
│   ├── tests/                ← unit, config, integration and DB-failure tests
│   └── uploads/              ← local image storage (git-ignored except .gitkeep)
└── client/
    ├── .env.example
    ├── index.html
    ├── vite.config.js        ← dev proxy to the API
    ├── public/favicon.svg
    └── src/
        ├── App.jsx           ← routes
        ├── main.jsx          ← providers + Bootstrap imports
        ├── assets/theme.css  ← design tokens and component styles
        ├── components/       ← Navbar, Footer, Sidebar, ProtectedRoute, AdminRoute, ComplaintCard,
        │                        ComplaintTable, StatusBadge, PriorityBadge, SearchFilterBar, Pagination,
        │                        LoadingSpinner, EmptyState, ErrorMessage, Modal, ConfirmationModal,
        │                        FormInput, ActivityTimeline, PasswordStrength, KpiCard, PageHeader, Logo
        ├── context/          ← AuthContext, ToastContext (toast notifications)
        ├── features/         ← ComplaintForm, AdminComplaintPanel
        ├── hooks/            ← useAsync, useDebounce, useQueryFilters, useDocumentTitle
        ├── layouts/          ← PublicLayout, DashboardLayout
        ├── pages/            ← public/, citizen/, admin/
        ├── services/         ← api.js (Axios instance) + auth/complaint/admin/public services
        └── utils/            ← constants, formatting, client-side validation
```

## 5. Prerequisites

- **Node.js 20 LTS** (or 22 LTS; minimum 18.18) with npm. Check with `node -v`.
- **MongoDB**: either MongoDB Community Server 6+ installed locally, or a free MongoDB Atlas cluster.
- **Git** (for version control).
- Optional: **Postman** for API testing, **MongoDB Compass** to browse data.

## 6. Installation

Unzip `CivicFix-FullStack-Project.zip`, then open a terminal in the `CivicFix` folder.

**Windows PowerShell**

```powershell
cd CivicFix
npm install --prefix server
npm install --prefix client
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
```

**macOS / Linux**

```bash
cd CivicFix
npm install --prefix server
npm install --prefix client
cp server/.env.example server/.env
cp client/.env.example client/.env
```

(`npm run install:all` from the project root does both installs.)

## 7. Environment configuration

### Server: `server/.env`

| Variable | Required | Example / default | Purpose |
|---|---|---|---|
| `PORT` | no | `5000` | API port |
| `NODE_ENV` | no | `development` | `development`, `production` or `test` |
| `MONGODB_URI` | **yes** | `mongodb://127.0.0.1:27017/civicfix` | MongoDB connection string |
| `JWT_SECRET` | **yes** | 96 random hex chars | Signs session tokens. At least 32 characters; the placeholder is refused in production. |
| `JWT_EXPIRES_IN` | no | `1d` | Session length (`12h`, `7d`, ...) |
| `CLIENT_ORIGIN` | no | `http://localhost:5173` | Comma-separated front-end origins allowed by CORS |
| `COOKIE_SECURE` | no | `false` | `true` in production (HTTPS) |
| `COOKIE_SAME_SITE` | no | `lax` | `none` when front end and API are on different sites (requires `COOKIE_SECURE=true`) |
| `COOKIE_DOMAIN` | no | empty | Only set when sharing the cookie across subdomains |
| `MAX_UPLOAD_MB` | no | `2` | Image size limit (max 10) |
| `CITIZEN_EDITABLE_STATUSES` | no | `Pending` | Statuses in which citizens may edit/delete their complaints |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | no | | Used only by `npm run create-admin` |
| `TRUST_PROXY` | no | `false` | `true` behind Render/Railway/Nginx so rate limiting sees real client IPs |

Generate a JWT secret:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste the output into `JWT_SECRET=` in `server/.env`. The server validates configuration on startup and prints which variables are missing or invalid (never their values).

### Client: `client/.env`

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | API base URL. Keep `/api/v1` locally (proxied). In production set the full API URL, e.g. `https://civicfix-api.onrender.com/api/v1`. |
| `VITE_DEV_PROXY_TARGET` | `http://localhost:5000` | Where the Vite dev server forwards `/api` |

## 8. MongoDB setup

**Option A: local MongoDB (Windows)**
1. Download and install *MongoDB Community Server* from mongodb.com (choose "Install MongoD as a Service").
2. Check it is running: `Get-Service MongoDB` should show `Running` (start it with `Start-Service MongoDB`).
3. Keep `MONGODB_URI=mongodb://127.0.0.1:27017/civicfix` in `server/.env`.

**Option B: MongoDB Atlas (cloud, free tier)**
1. Create a free M0 cluster at cloud.mongodb.com.
2. *Database Access*: create a database user with a strong password.
3. *Network Access*: add your current IP (for hosting, add your host's outbound IPs or `0.0.0.0/0` with a strong password).
4. *Connect → Drivers*: copy the connection string and add the database name:
   `MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/civicfix?retryWrites=true&w=majority`

Collections and indexes are created automatically by Mongoose on first use (and by the seed script).

## 9. Admin bootstrap

There is **no HTTP endpoint that grants administrator rights**, and registration always creates citizens. Administrators are created from the server command line:

```powershell
cd server
npm run create-admin -- --email you@yourcity.example --name "Your Name"
```

You will be prompted for a password (8-72 chars, upper-case, lower-case and a number); alternatively set `ADMIN_EMAIL`, `ADMIN_NAME` and `ADMIN_PASSWORD` in `server/.env` and run `npm run create-admin` (remove `ADMIN_PASSWORD` afterwards).

To promote an existing citizen account:

```powershell
npm run create-admin -- --email existing@user.example --promote
```

## 10. Demo data seeding

```powershell
cd server
npm run seed
```

This inserts 6 departments, 1 demo administrator, 4 demo citizens and 18 complaints across all categories, priorities and statuses, each with a realistic status history (including internal notes visible only to admins).

**Demo credentials (development only):**

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@civicfix.local` | `Admin@12345` |
| Citizen | `priya@example.com` | `Citizen@123` |
| Citizen | `arjun@example.com`, `meera@example.com`, `rahul@example.com` | `Citizen@123` |

Behaviour:
- `npm run seed` is **safe to re-run**: departments and users are only created if missing, and complaints are only inserted if the demo citizens have none.
- `npm run seed:reset` **deletes all users, complaints, activity, counters and departments** in the configured database, then seeds again.
- The seed script refuses to run when `NODE_ENV=production`. **Never use these demo accounts in a real deployment.** Create a real administrator with `npm run create-admin` instead.

## 11. Running the app

Use two terminals.

**Terminal 1: API**

```powershell
cd server
npm run dev        # nodemon, restarts on changes  (or: npm start)
```

Expected: `[db] Connected to MongoDB ...` and `CivicFix API listening on http://localhost:5000/api/v1`.
Check: open http://localhost:5000/api/v1/health.

**Terminal 2: front end**

```powershell
cd client
npm run dev
```

Open **http://localhost:5173**. Log in with a demo account or register a new citizen.

**Production build of the front end**

```powershell
cd client
npm run build      # outputs client/dist
npm run preview    # serves the build locally on http://localhost:4173
```

(When previewing locally the proxy is not active; set `VITE_API_BASE_URL=http://localhost:5000/api/v1` before building and add `http://localhost:4173` to `CLIENT_ORIGIN`.)

## 12. API documentation

All endpoints live under `/api/v1`. The complete reference with request fields, query parameters, status codes and examples is in **[docs/API.md](docs/API.md)**.

| Method | Endpoint | Access |
|---|---|---|
| GET | `/health` | public |
| POST | `/auth/register` | public (rate limited) |
| POST | `/auth/login` | public (rate limited) |
| POST | `/auth/logout` | public |
| GET | `/auth/me` | logged in |
| PATCH | `/auth/me` | logged in |
| PATCH | `/auth/me/password` | logged in |
| POST | `/complaints` | citizen |
| GET | `/complaints` | citizen (own) / admin (all) |
| GET | `/complaints/summary` | citizen / admin |
| GET | `/complaints/:id` | owner / admin |
| PATCH | `/complaints/:id` | owner while Pending |
| DELETE | `/complaints/:id` | owner while Pending / admin |
| GET | `/complaints/:id/attachment` | owner / admin |
| GET | `/complaints/reference/:referenceNumber` | public (limited fields) |
| GET | `/complaints/:id/activity` | owner / admin |
| POST | `/complaints/:id/updates` | owner (comment) / admin (update + internal note) |
| GET | `/admin/dashboard` | admin |
| GET | `/admin/complaints` | admin |
| PATCH | `/admin/complaints/:id/status` | admin |
| PATCH | `/admin/complaints/:id/assign` | admin |
| GET | `/admin/users` | admin |
| GET | `/admin/users/:id` | admin |
| PATCH | `/admin/users/:id/status` | admin |
| GET | `/admin/departments` | admin |
| POST | `/admin/departments` | admin |
| PATCH | `/admin/departments/:id` | admin |
| DELETE | `/admin/departments/:id` | admin (soft delete) |
| GET | `/public/stats` | public |
| GET | `/public/recent-complaints` | public |
| GET | `/public/meta` | public |

Routes added beyond the brief: `/health`, `/auth/me` (PATCH), `/auth/me/password`, `/complaints/summary`, `/complaints/:id/attachment`, `/admin/users/:id`, `/admin/users/:id/status`, `/public/meta`.

**Status workflow (enforced on the server):**

```
Pending ─► Under Review ─► In Progress ─► Resolved
   │             │            │   ▲           │
   │             │            │   └── reopen ─┘
   │             │            └─► Under Review
   └─────────────┴─► Rejected  (final; reason required)
```

## 13. Database schema

```
User 1 ──── * Complaint * ──── 0..1 Department
                 │
                 1
                 │
                 * ComplaintActivity * ──── 1 User (actor)
Counter (one document per year: atomic reference sequence)
```

**User**: `name`, `email` (unique, lower-cased), `passwordHash` (bcrypt, 12 rounds, `select: false` so it is never returned by default), `role` (`citizen` | `admin`), `phone`, `isActive`, `lastLoginAt`, `createdAt`, `updatedAt`.

**Complaint**: `referenceNumber` (unique, immutable), `title`, `description`, `category`, `priority`, `priorityWeight` (internal numeric copy so priority sorts by severity, not alphabetically), `status`, `citizenId` → User (immutable), `departmentId` → Department, `assignedTo` (field staff name), `address`, `city`, `latitude`, `longitude`, `attachment { filename, originalName, mimeType, size }`, `createdAt`, `updatedAt`, `resolvedAt`.

**ComplaintActivity** (append-only history): `complaintId` → Complaint, `actorId` → User, `actorRole`, `action` (`CREATED`, `EDITED`, `STATUS_CHANGED`, `ASSIGNED`, `PUBLIC_UPDATE`, `CITIZEN_COMMENT`, `INTERNAL_NOTE`), `previousStatus`, `newStatus`, `publicMessage`, `internalNote`, `visibleToCitizen`, `createdAt`.

**Department**: `name` (unique, case-insensitive collation index), `description`, `isActive`, `createdAt`, `updatedAt`.

**Counter**: `_id` (e.g. `complaint-2026`), `seq`.

**Indexes:** `referenceNumber` (unique), `{citizenId, createdAt}`, `{status, createdAt}`, `category`, `departmentId`, `createdAt`, `{priorityWeight, createdAt}`; `User.email` (unique), `role`, `isActive`; `ComplaintActivity {complaintId, createdAt}` and `createdAt`; `Department.name` (unique, case-insensitive).

**Key decisions**
- *Reference numbers* (`CF-YYYY-NNNNNN`) come from an atomic `findOneAndUpdate({$inc})` on a per-year counter, so concurrent submissions can never collide; the unique index is a second safeguard. The integration tests submit 8 complaints in parallel to check this.
- *History is a separate collection* rather than an embedded array, so it can grow without bloating complaint documents, can be queried across complaints (admin recent-activity feed), and internal notes can be excluded in the database query itself for citizens.
- *Assigned staff is a free-text name* because field workers do not log in to this system; the department reference carries the organisational assignment.
- *Departments are soft-deleted* so historical complaints keep a valid reference.
- *Status changes use a conditional update* (`{_id, status: previous}`), so two administrators changing the same complaint at once cannot overwrite each other silently.

## 14. Authentication and security

| Concern | Implementation |
|---|---|
| Password storage | bcryptjs, 12 salt rounds; hash never returned in responses |
| Sessions | JWT (HS256) in an **httpOnly** cookie (`civicfix_token`); not readable by JavaScript, so XSS cannot steal it. Nothing auth-related is stored in localStorage. |
| Cookie flags | `SameSite=Lax` locally; `SameSite=None; Secure` for cross-site production. Configurable via env. |
| CSRF | State-changing requests require `X-Requested-With: XMLHttpRequest`. Cross-site forms cannot set custom headers, and cross-origin scripts trigger a CORS preflight that the origin whitelist rejects. |
| Authorization | `authenticate` re-loads the user from the DB on every request (deactivation and role changes apply immediately); `requireRole` on admin routes; ownership checks on every complaint resource |
| Admin creation | CLI only (`npm run create-admin`); registration ignores any `role` field |
| Validation | express-validator on every body, param and query; whitelisted enums; regex-escaped search |
| Mass assignment | Controllers copy only whitelisted fields (`pick`), never `req.body` directly |
| NoSQL injection | Keys starting with `$` or containing `.` are stripped from body/query/params; query builders accept only primitive strings |
| Rate limiting | 20 auth attempts / 15 min / IP; 300 API requests / min / IP |
| Uploads | multer with random filenames, MIME whitelist, size limit, **magic-byte verification**, files served only through an authorized route with `nosniff`; failed requests delete their uploaded file |
| Headers | helmet defaults, `x-powered-by` disabled |
| Body size | JSON/urlencoded limited to 100 kB |
| Errors | Central handler; consistent JSON; stack traces only outside production; request bodies, passwords and tokens are never logged |
| Secrets | Only in environment variables; startup validation refuses missing/short/placeholder secrets |
| Account enumeration | Login returns the same message for unknown email and wrong password |

## 15. Tests

```powershell
cd server
npm test            # all suites (needs internet on the first run, see below)
npm run test:unit   # pure logic only: no database, no network
```

| Suite | File | Needs |
|---|---|---|
| Unit: status workflow, query builders, pagination, sanitizer, mass-assignment `pick`, reference format, JWT expiry parsing, image signature checks | `tests/unit.test.js` | nothing |
| Configuration validation | `tests/config.test.js` | installed dependencies |
| Database-failure behaviour (API returns 503, health reports `disconnected`) | `tests/dbFailure.test.js` | installed dependencies |
| Integration: register/login/logout, hashed passwords, duplicate registration, missing fields, invalid login, NoSQL login injection, CSRF guard, tampered token, complaint CRUD, mass assignment, concurrent reference numbers, ownership (another user's complaint), missing complaint, public tracking privacy, citizen attempting admin operations, internal-note privacy, invalid/valid status transitions, rejection reason, edit lock after review, departments, assignment, filtering/search/pagination/date range, dashboard totals, last-admin protection, deactivated users, malformed JSON, unknown routes | `tests/api.test.js` | `mongodb-memory-server` |

`mongodb-memory-server` downloads a MongoDB binary (roughly 100+ MB) into a cache the first time the integration tests run, so that run needs an internet connection. Tests use an in-memory database and never touch your real data.

## 16. Postman collection

1. Start the API and run `npm run seed` (the collection uses the demo accounts).
2. In Postman: **Import** → `postman/CivicFix.postman_collection.json`.
3. The collection variable `baseUrl` defaults to `http://localhost:5000/api/v1`.
4. Run the folders in order (Health → Auth → Complaints → Admin → Public), or use **Run collection**. Each request has a test that checks the expected status code, and IDs are captured into collection variables automatically.

The collection covers authentication, validation errors, duplicate registration, invalid login, complaint creation/listing/details/updates, activity, public tracking, unauthorized and forbidden requests, invalid status transitions, the full status workflow, assignment, departments and user management. Postman's cookie jar keeps the session cookie; every request already has the `X-Requested-With` header.

## 17. Git and GitHub

The repository is ready for Git: `.gitignore` excludes `node_modules/`, all `.env` files (keeping `.env.example`), build output and uploaded images.

```powershell
cd CivicFix
git init
git add .
git commit -m "Initial commit: CivicFix full-stack complaint management system"
git branch -M main
# create an empty repository on GitHub first (no README), then:
git remote add origin https://github.com/<your-username>/civicfix.git
git push -u origin main
```

Before pushing, confirm no secrets are staged: `git status` must not list `server/.env` or `client/.env`.

## 18. Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for step-by-step instructions (MongoDB Atlas + Render for the API + Netlify or Vercel for the front end), the production environment variables, cookie/HTTPS configuration and a post-deployment checklist.

## 19. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `Invalid server configuration: MONGODB_URI is not set` | `server/.env` missing. Run `Copy-Item server\.env.example server\.env` and fill it in. |
| `JWT_SECRET must be at least 32 characters long` | Generate a secret with the command in section 7. |
| `Could not connect to MongoDB` | MongoDB not running (`Start-Service MongoDB`), wrong URI, or Atlas IP not whitelisted. Try `127.0.0.1` instead of `localhost` on Windows. |
| Front end shows "Cannot reach the CivicFix server" | The API is not running on port 5000, or `VITE_DEV_PROXY_TARGET` points elsewhere. |
| Every request returns `503` | API started but MongoDB connection dropped; check `GET /api/v1/health`. |
| Logged in, but every request returns `401` in production | Cookie blocked: set `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=none`, use HTTPS on both sides, and set `TRUST_PROXY=true` on Render/Railway. Some browsers block third-party cookies entirely; see the limitation below. |
| CORS error in the browser console | Add the exact front-end origin (scheme + host, no trailing slash) to `CLIENT_ORIGIN`. |
| `403 Missing X-Requested-With header` in Postman/curl | Add the header `X-Requested-With: XMLHttpRequest`. |
| `429 Too many attempts` | Auth rate limit hit; wait 15 minutes or restart the API in development. |
| Image upload rejected | Only JPEG/PNG/WebP up to `MAX_UPLOAD_MB`; files renamed from other formats are rejected by content check. |
| PowerShell blocks `npm` scripts ("running scripts is disabled") | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use `npm.cmd`. |
| Port 5000 already in use (macOS AirPlay often uses it) | Set `PORT=5050` in `server/.env` and `VITE_DEV_PROXY_TARGET=http://localhost:5050` in `client/.env`. |
| Integration tests hang on first run | `mongodb-memory-server` is downloading MongoDB; allow time and internet access. |

## 20. Known limitations

- **Image storage is local disk** (`server/uploads`). Most free hosts (e.g. Render free tier) have ephemeral disks, so uploaded photos are lost on redeploy/restart. For production, replace `services/fileService.js` and `middleware/upload.js` with object storage (Cloudinary, S3, Azure Blob). Complaint data itself is unaffected.
- **Third-party cookie restrictions:** with the front end and API on different domains, browsers that block third-party cookies (Safari by default, Chrome where enabled) will not keep the session. The robust fix is serving both under one site (e.g. `app.example.com` + `api.example.com` with `COOKIE_DOMAIN=.example.com`, or a reverse proxy/rewrite so the API is under the front end's domain). DEPLOYMENT.md describes both options.
- No email/SMS notifications; citizens see updates on their dashboard.
- No password reset by email (administrators can create accounts via CLI; users can change passwords when logged in).
- Field staff are recorded by name; they do not have their own logins.
- No map view; coordinates link to OpenStreetMap.
- Rate-limit counters are in memory (per process); multiple API instances would need a shared store such as Redis.
- Front-end automated tests (component/E2E) are not included; the back end has unit and integration tests and the Postman collection covers the API end to end.
