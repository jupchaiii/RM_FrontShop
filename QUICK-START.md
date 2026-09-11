# Remaker.work - Quick Start Guide (30 Minutes)

**Target:** Get the application running locally before deploying to Pi.

---

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org))
- Git
- A code editor (VS Code recommended)
- 2GB free disk space

Check versions:
```bash
node --version  # v18.0.0+
npm --version   # v8.0.0+
git --version   # 2.0+
```

---

## Step 1: Clone & Install (5 minutes)

```bash
# Clone the repository
git clone <your-repo-url> remaker-work
cd remaker-work

# Install root dependencies
npm install

# Install frontend dependencies
cd apps/frontend
npm install

# Install backend dependencies
cd ../backend
npm install
cd ../..
```

**Expected output:** No errors, lots of dependencies installed.

---

## Step 2: Setup Environment Files (2 minutes)

### Backend
```bash
# Copy template
cp apps/backend/.env.example apps/backend/.env

# Edit (use any text editor)
# For local dev, keep defaults - they're set for localhost
nano apps/backend/.env

# Key settings for local dev:
# - DATABASE_URL=file:./prisma/data.db  ✓ Keep this
# - PORT=5000  ✓ Keep this
# - NODE_ENV=development  ✓ Keep this
```

### Frontend
```bash
# Copy template
cp apps/frontend/.env.example apps/frontend/.env

# Key settings for local dev:
# - NEXT_PUBLIC_API_URL=http://localhost:5000  ✓ Set this
```

---

## Step 3: Setup Database (3 minutes)

```bash
cd apps/backend

# Create database and run migrations
npx prisma migrate dev --name init

# When prompted for name, just hit Enter or type "init"

# Seed database with test data (optional)
npx prisma db seed

# Verify database was created
ls -la prisma/
# You should see: data.db (the SQLite file)

cd ../..
```

**What this does:**
- Creates SQLite database at `apps/backend/prisma/data.db`
- Creates tables (Users, Projects, Gallery, etc.)
- Seeds with sample data (optional)

---

## Step 4: Start the Application (2 minutes)

**Option A: Run both simultaneously (recommended)**
```bash
npm run dev:all
```

This starts:
- Frontend (Next.js) on `http://localhost:3000`
- Backend (Express) on `http://localhost:5000`

**Option B: Run separately** (if the above doesn't work)

Terminal 1 - Backend:
```bash
cd apps/backend
npm run dev
# Wait for: "Listening on port 5000"
```

Terminal 2 - Frontend:
```bash
cd apps/frontend
npm run dev
# Wait for: "▲ Next.js ... ready - started server on"
```

---

## Step 5: Verify Everything Works (3 minutes)

### Backend Check
```bash
# In new terminal
curl http://localhost:5000/health
# Should respond: { "status": "ok" }
```

### Frontend Check
Open browser and visit:
```
http://localhost:3000
```

You should see:
- Remaker.work homepage
- Services section
- Upload form

### Database Check
```bash
# In backend terminal, run Prisma Studio
npx prisma studio

# Opens GUI at http://localhost:5555
# You can browse tables and test data
```

---

## Step 6: Test Core Workflow (10 minutes)

### 1. Upload a Test File
1. Go to `http://localhost:3000`
2. Click "ประเมินราคา" (Estimate Price)
3. Upload a small `.stl` file (or use test file in `/test-files`)
4. Select material: PLA
5. Click "ประเมินราคา"
6. Should see quote with price breakdown

### 2. Create Account
1. Click "Login / Register"
2. Fill in email and password
3. Should redirect to dashboard

### 3. Admin Panel
1. Go to `http://localhost:3000/admin`
2. Login with test admin (check `prisma/seed.ts` for credentials)
3. You should see:
   - Dashboard with stats
   - Projects list
   - Queue status
   - Gallery management

### 4. Check API Responses
```bash
# Get all projects (admin only, needs auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/projects

# Get queue status (public)
curl http://localhost:5000/api/queue/status
```

---

## Common Issues & Fixes

### ❌ Port 3000 or 5000 already in use

```bash
# Check what's using the port
lsof -i :3000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change port in .env
# NEXT_PUBLIC_API_URL=http://localhost:3001
```

### ❌ "Cannot find module" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules apps/*/node_modules
npm install
cd apps/frontend && npm install
cd ../backend && npm install
```

### ❌ Database migration error

```bash
# Reset database completely
cd apps/backend
rm prisma/data.db
npx prisma migrate dev --name init
npx prisma db seed
```

### ❌ Frontend can't connect to backend

Check:
1. Backend is running on port 5000
2. `.env` has `NEXT_PUBLIC_API_URL=http://localhost:5000`
3. No firewall blocking localhost traffic

### ❌ "POST /api/quote 500 error"

```bash
# Check backend logs in terminal
# Should show the error message
# Common: file size too large, invalid material, etc.
```

---

## Project Structure Overview

After setup, your folders look like:

```
remaker-work/
├── apps/
│   ├── frontend/          ← Next.js (React)
│   │   ├── app/           ← Pages
│   │   ├── components/    ← React components
│   │   └── package.json
│   │
│   └── backend/           ← Express.js API
│       ├── src/           ← TypeScript code
│       ├── prisma/        ← Database schema
│       │   └── data.db    ← SQLite file (created by migrate)
│       └── package.json
│
├── docs/                  ← Documentation
├── scripts/               ← Setup scripts
├── package.json           ← Root config
└── .env                   ← Environment (DO NOT COMMIT)
```

---

## Next Steps After Local Testing

### Before Deploying to Pi:

1. **Create a Cloudflare Account**
   - Go to [cloudflare.com](https://cloudflare.com)
   - Add your domain `remaker.work`
   - Point DNS to Cloudflare nameservers
   - Create Tunnel (install cloudflared on Pi)

2. **Prepare Pi**
   ```bash
   # On Raspberry Pi
   sudo apt update
   sudo apt install -y nodejs npm nginx postgresql
   nvm install 18
   npm install -g pm2
   ```

3. **Test with Production-like Settings**
   ```bash
   # On your dev machine, set
   NODE_ENV=production
   npm run build
   npm start
   ```

4. **Setup Email Service**
   - Option 1: Use Postfix (local SMTP) - easier for Pi
   - Option 2: Use SendGrid API - more reliable
   - Get API key and add to `.env`

5. **Configure Payment Gateway**
   - Stripe (international)
   - OmiseGO (Thailand-based)
   - Or start with manual quotes first

---

## Useful Commands

```bash
# View database
npx prisma studio

# Reset database completely
npx prisma migrate reset

# View logs
npm run logs

# Run tests
npm run test

# Build for production
npm run build

# Check code style
npm run lint

# Format code
npm run format
```

---

## File Locations to Know

**Development:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Database: `apps/backend/prisma/data.db`
- Uploads: `apps/backend/uploads/` (created on first upload)

**Production (Pi):**
- Frontend: `https://remaker.work`
- Backend: `https://api.remaker.work`
- Database: `/home/remakerio/data.db`
- Uploads: `/home/remakerio/uploads/`

---

## Development Tips

### Hot Reload
- Frontend: Changes auto-reload in browser
- Backend: Use `npm run dev` (watches file changes)

### Debugging
```bash
# Add debugger statement in code
debugger;

# Then in Chrome, go to chrome://inspect
```

### Environment Variables
- `.env` = local-only, git-ignored
- `.env.example` = template, can commit
- `.env.production` = production overrides

### Database Queries
```bash
# Use Prisma Studio GUI
npx prisma studio

# Or raw SQL (for advanced users)
sqlite3 apps/backend/prisma/data.db
```

---

## Testing Checklist

Before saying "it works!", verify:

- [ ] Frontend loads at `http://localhost:3000`
- [ ] Can navigate all pages (Home, Upload, Gallery, FAQ, Admin)
- [ ] Upload form accepts file and shows quote
- [ ] Can create account
- [ ] Admin panel loads with login
- [ ] Database records appear in Prisma Studio
- [ ] API endpoints respond (test with curl or Postman)
- [ ] Email config tested (check logs for errors)
- [ ] Can log in as a customer, upload a file, and complete a real order (not just a price preview)

---

## Getting Help

If something doesn't work:

1. **Check the logs** - Most errors are printed to terminal
2. **Read error message** - Usually tells you exactly what's wrong
3. **Check Master Prompt** - See `remaker-work-master-prompt.md`
4. **Check docs folder** - Detailed API and setup guides
5. **Google the error** - 99% of Node/React errors have answers online

---

## 🎉 Congrats!

You now have Remaker.work running locally! 

Next steps:
1. Explore the codebase
2. Customize branding/colors
3. Test admin features
4. Setup email/payment
5. Deploy to Raspberry Pi (follow DEPLOYMENT.md)

**Enjoy! 🚀**
