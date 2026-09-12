# Remaker.work

Professional FDM 3D Printing Service — monorepo.

- **Frontend:** Next.js 14 (App Router) + React 18 + TailwindCSS → `apps/frontend` (port 3000)
- **Backend:** Express + TypeScript + Prisma + SQLite → `apps/backend` (port 5000)

## Quick Start

```bash
# 1. Install all workspaces
npm install

# 2. Setup backend env + database
cp apps/backend/.env.example apps/backend/.env
npm run db:migrate     # creates SQLite DB + tables
npm run db:seed        # seeds admin user + sample data

# 3. Setup frontend env
cp apps/frontend/.env.local.example apps/frontend/.env.local

# 4. Run both apps
npm run dev:all
```

- Frontend: http://localhost:3000
- Backend:  http://localhost:5000
- Health:   http://localhost:5000/health

## Default admin (from seed)

- Email: `admin@remaker.work`
- Password: `admin1234`

> Change these via `apps/backend/.env` before deploying.

## Scripts (root)

| Command | Description |
|---|---|
| `npm run dev:all` | Run backend + frontend together |
| `npm run build` | Build both apps |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

See `remaker-work-master-prompt.md` for the full architecture spec — note that it's the original aspirational spec and has drifted from the code in a few places (see below).

## Current status (modernization pass)

- **Order flow is now real, not just a price preview.** `/upload` still lets anyone get an instant quote with no login. Confirming an order ("ยืนยันสั่งพิมพ์") requires an account — `/login` and `/register` are now built, and `/dashboard` lists a customer's own orders.
- **Queue feature was removed** (see the `remove_queue` migration) — the master prompt and parts of `QUICK-START.md` still describe it; treat those as historical, not current.
- **Payment gateway is intentionally not integrated yet.** Checkout moves an order to `PENDING` and the admin panel/manual invoicing handles the rest for now.
- Pricing preview now parses STL/OBJ geometry server-side for print-time and material-weight estimates, uses the calibrated Bambu Lab P1S timing model, and applies the cost/margin formula from `internal-remaker-desktop`. Unsupported upload formats still use a conservative file-size fallback. The browser never supplies its own estimated time or weight.

## macOS note — port 5000 conflict

On macOS, port **5000** is used by the AirPlay Receiver (ControlCenter). If the
backend fails with `EADDRINUSE :5000`, either:

1. Disable it: **System Settings → General → AirDrop & Handoff → AirPlay Receiver → Off**, or
2. Run the backend on another port and point the frontend at it:

   ```bash
   # apps/backend/.env
   PORT=5055
   # apps/frontend/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:5055
   ```

On Raspberry Pi / Linux (the deployment target) port 5000 is free, so the
defaults work as-is.

## Security notes

- `next@14.2.15` and `multer@1.x` have known advisories flagged by `npm audit`.
  Before production, run `npm audit` and upgrade (Next.js patched release, multer 2.x).
- Change `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `apps/backend/.env`
  before deploying. The admin API requires a Bearer token; unauthenticated
  requests return 401.
- As of this modernization pass, the backend **refuses to start in production** (`NODE_ENV=production`) if `JWT_SECRET` or `ADMIN_PASSWORD` are still set to their default placeholder values — this is a deliberate fail-fast check in `apps/backend/src/config.ts`, not a bug.
