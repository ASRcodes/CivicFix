# Deploying CivicFix

CivicFix deploys as two pieces:

| Piece | What it is | Example host |
|---|---|---|
| API | Node/Express app in `server/` | Render, Railway, Fly.io, a VPS |
| Front end | Static files built from `client/` (`client/dist`) | Netlify, Vercel, Render Static Site |
| Database | MongoDB | MongoDB Atlas |

The steps below use **MongoDB Atlas + Render (API) + Netlify (front end)**, all of which have free tiers. Other hosts work the same way with the same environment variables. *These instructions have not been run against a live account as part of producing this project; host dashboards change, so adapt the menu names as needed.*

---

## 1. Database: MongoDB Atlas

1. Create a free M0 cluster.
2. **Database Access** → add a user with a long random password (role: *Read and write to any database*).
3. **Network Access** → allow your API host. Render's free tier has no fixed outbound IP, so `0.0.0.0/0` is the usual choice; it is acceptable only with a strong database password.
4. **Connect → Drivers** → copy the URI and insert the database name:
   ```
   mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/civicfix?retryWrites=true&w=majority
   ```
   URL-encode special characters in the password (`@` → `%40`, `#` → `%23`).

## 2. API: Render Web Service

1. Push the repository to GitHub (see README section 17).
2. Render → **New → Web Service** → select the repository.
3. Settings:
   - **Root directory:** `server`
   - **Runtime:** Node
   - **Build command:** `npm ci --omit=dev` (or `npm install --omit=dev`)
   - **Start command:** `npm start`
   - **Health check path:** `/api/v1/health`
4. **Environment variables:**

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | your Atlas URI |
   | `JWT_SECRET` | a new 64+ character random string (never reuse the dev one) |
   | `JWT_EXPIRES_IN` | `1d` |
   | `CLIENT_ORIGIN` | your front-end URL, e.g. `https://civicfix.netlify.app` (no trailing slash) |
   | `COOKIE_SECURE` | `true` |
   | `COOKIE_SAME_SITE` | `none` if the front end calls the API cross-site (option A below); `lax` if you proxy (option B) |
   | `TRUST_PROXY` | `true` |
   | `MAX_UPLOAD_MB` | `2` |

   Render provides `PORT` automatically; the server reads it.
5. Deploy, then open `https://YOUR-API.onrender.com/api/v1/health`. Expect `{"success":true,"data":{"status":"ok","database":"connected",...}}`.
6. **Create the first administrator** from Render's **Shell** tab (paid plans), or from your own machine with the production `MONGODB_URI` set temporarily:
   ```powershell
   cd server
   $env:MONGODB_URI="mongodb+srv://..."; $env:JWT_SECRET="any-32+-char-value-for-this-command-only"; npm run create-admin -- --email admin@yourdomain.example --name "City Admin"
   ```
   Do **not** run `npm run seed` against production; it refuses to run when `NODE_ENV=production`, and the demo passwords are public.

## 3. Front end: Netlify

1. Netlify → **Add new site → Import an existing project** → select the repository.
2. Settings:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/dist`
3. Choose how the browser reaches the API.

### Option A: direct cross-site calls (simplest)

- Netlify env var: `VITE_API_BASE_URL=https://YOUR-API.onrender.com/api/v1`
- API env: `COOKIE_SAME_SITE=none`, `COOKIE_SECURE=true`, `CLIENT_ORIGIN=https://YOUR-SITE.netlify.app`

Limitation: the session cookie is a *third-party* cookie here, and browsers that block third-party cookies (Safari by default, Chrome when the user enables blocking) will not keep users logged in.

### Option B: proxy the API through Netlify (recommended)

The browser only talks to your Netlify domain, so the cookie is first-party and works in every browser.

- Edit `client/public/_redirects` so the API rule comes **before** the SPA rule:
  ```
  /api/*  https://YOUR-API.onrender.com/api/:splat  200
  /*      /index.html                                200
  ```
- Netlify env var: `VITE_API_BASE_URL=/api/v1`
- API env: `COOKIE_SAME_SITE=lax`, `COOKIE_SECURE=true`, `CLIENT_ORIGIN=https://YOUR-SITE.netlify.app`

**Vercel instead of Netlify:** root directory `client`, framework *Vite*. `client/vercel.json` already rewrites all routes to `index.html`; for option B add a rewrite `{ "source": "/api/(.*)", "destination": "https://YOUR-API.onrender.com/api/$1" }` **before** the catch-all.

4. Deploy, then redeploy whenever you change `VITE_*` variables (they are baked in at build time).

## 4. Cookie and HTTPS notes

- `COOKIE_SECURE=true` requires HTTPS end to end (Render and Netlify provide it automatically).
- `SameSite=None` is only accepted by browsers together with `Secure`; the server refuses to start with `none` + insecure.
- `TRUST_PROXY=true` is needed behind Render/Railway/Heroku-style proxies so `Secure` cookies and per-IP rate limiting work correctly.
- With a custom domain (e.g. `app.city.example` and `api.city.example`) the two are *same-site*, so `SameSite=lax` works without a proxy. Set `COOKIE_DOMAIN` only if you need the cookie on several subdomains.

## 5. Uploaded images in production

Images are stored on the API server's local disk (`server/uploads`). On hosts with ephemeral disks (Render free tier, Heroku, most containers) they disappear on every deploy or restart. Options:
- Attach a persistent disk (Render paid plans) mounted at `server/uploads`, or
- Replace the storage layer (`src/middleware/upload.js`, `src/services/fileService.js`) with Cloudinary/S3.

Complaint records are unaffected either way; only the photo would be missing, and the UI shows "The photo could not be loaded".

## 6. Post-deployment checklist

- [ ] `GET /api/v1/health` returns `database: connected`.
- [ ] Register a citizen on the live site, log out, log in again (confirms the cookie works).
- [ ] Refresh a dashboard page: the session persists and deep links load (SPA rewrite works).
- [ ] Submit a complaint and receive a reference number; track it on `/track`.
- [ ] Log in as the administrator created with `create-admin`; change a status; the citizen sees it.
- [ ] Browser console shows no CORS errors.
- [ ] No demo accounts exist in the production database.
- [ ] `JWT_SECRET` and database password exist only in the host's environment settings.
