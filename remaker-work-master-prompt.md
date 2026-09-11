# Remaker.work - Master Prompt & Architecture Guide

**Version:** 1.0  
**Project Name:** Remaker.work (3D Printing FDM Service)  
**Deployment Target:** Raspberry Pi + Cloudflare Tunnel  
**Domain:** remaker.work  
**Status:** Development Ready

---

## 📋 Executive Summary

This is a complete specification for building a professional 3D printing service website for Remaker.work. The system is designed to run on a Raspberry Pi with minimal overhead while maintaining production quality. Users can upload files, get instant price quotes, track job status in real-time, and manage projects through an intuitive interface.

---

## 🎯 Project Scope

### Business Requirements
- **Service Type:** FDM 3D Printing (currently; Resin support can be added later)
- **Location:** Online-only marketplace
- **Operating Hours:** 8am-5pm weekdays
- **Equipment:** 2 FDM 3D printers
- **Team:** Solo operator (automation-first design)

### Key Features
1. **Public Portal:** Browse services, upload files, get instant quotes
2. **Admin Panel:** Manage projects, update queue status, handle settings
3. **Real-time Queue:** Display current wait times and job status
4. **Project Showcase:** Portfolio grid with filtering by material/purpose
5. **Pricing Engine:** Dynamic cost calculation based on file size, material, time
6. **Automated Emails:** Order confirmations, status updates, invoices
7. **Mobile Responsive:** Works on phone/tablet/desktop

---

## 🛠 Tech Stack (Pi-Optimized)

### Frontend
- **Framework:** Next.js 14 (with App Router)
- **UI Library:** React 18 + TailwindCSS
- **State:** Zustand (lightweight vs Redux)
- **Form Validation:** React Hook Form + Zod
- **File Upload:** TusJS or dropzone.js
- **Real-time:** Socket.io for live queue updates
- **Icons:** Tabler Icons
- **Deployment:** Static export + Vercel or self-hosted

### Backend
- **Runtime:** Node.js 18+ (via NVM on Pi)
- **Framework:** Express.js (lightweight, Pi-friendly)
- **API Style:** REST with Webhooks
- **Authentication:** JWT + HttpOnly Cookies
- **File Upload Handler:** Multer + Sharp (image optimization)
- **Job Queue:** Bull (Redis-backed) OR Node-Cron (simpler, Pi-friendly)
- **Email:** Nodemailer (local SMTP) OR SendGrid API

### Database
- **Primary:** SQLite (included, no external service)
  - OR PostgreSQL (if growth requires)
- **ORM:** Prisma (type-safe, Pi-compatible)
- **Migrations:** Prisma Migrate

### Infrastructure
- **Reverse Proxy:** Nginx (on Pi)
- **Tunneling:** Cloudflare Tunnel (argo-tunnel)
- **SSL/TLS:** Automatic via Cloudflare
- **Environment:** PM2 (process manager for Node.js)
- **Storage:** Local filesystem OR AWS S3 (optional)

### DevOps
- **Version Control:** Git
- **CI/CD:** GitHub Actions (or manual push)
- **Monitoring:** PM2 monitoring + custom logs
- **Backup:** Daily cronjob to cloud storage

---

## 📁 Folder Structure

```
remaker-work/
├── apps/
│   ├── frontend/                 # Next.js app
│   │   ├── app/                  # App router pages
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # Home/hero
│   │   │   ├── pricing/page.tsx   # Pricing page
│   │   │   ├── gallery/page.tsx   # Portfolio
│   │   │   ├── upload/page.tsx    # File upload & quote
│   │   │   ├── queue/page.tsx     # Queue status
│   │   │   ├── faq/page.tsx
│   │   │   ├── admin/             # Admin portal (protected)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── projects/page.tsx    # CRUD projects
│   │   │   │   ├── gallery/page.tsx     # Manage showcase
│   │   │   │   ├── queue/page.tsx       # Update status
│   │   │   │   ├── settings/page.tsx    # Config
│   │   │   │   └── analytics/page.tsx
│   │   │   └── api/                # API routes
│   │   │       ├── auth/[...nextauth].ts
│   │   │       ├── upload/route.ts       # File upload
│   │   │       ├── quote/route.ts        # Price calculator
│   │   │       ├── projects/route.ts
│   │   │       ├── queue/route.ts
│   │   │       ├── gallery/route.ts
│   │   │       └── webhooks/stripe.ts
│   │   ├── components/
│   │   │   ├── ui/               # Reusable components
│   │   │   ├── forms/
│   │   │   ├── layout/
│   │   │   └── admin/
│   │   ├── lib/
│   │   │   ├── api.ts            # API client
│   │   │   ├── auth.ts           # NextAuth config
│   │   │   ├── constants.ts
│   │   │   └── utils.ts
│   │   ├── public/               # Static assets
│   │   ├── styles/
│   │   ├── .env.local
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   └── backend/                  # Express.js API
│       ├── src/
│       │   ├── index.ts          # Entry point
│       │   ├── middleware/
│       │   │   ├── auth.ts
│       │   │   ├── errorHandler.ts
│       │   │   └── cors.ts
│       │   ├── routes/
│       │   │   ├── projects.ts
│       │   │   ├── upload.ts
│       │   │   ├── queue.ts
│       │   │   ├── gallery.ts
│       │   │   └── admin.ts
│       │   ├── controllers/
│       │   ├── services/
│       │   │   ├── pricing.ts    # Price calculation
│       │   │   ├── email.ts      # Email service
│       │   │   └── fileHandler.ts
│       │   ├── utils/
│       │   └── types/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── .env
│       ├── package.json
│       └── tsconfig.json
│
├── docs/
│   ├── API.md                    # Full API documentation
│   ├── DEPLOYMENT.md             # Pi + Cloudflare setup
│   ├── DATABASE.md               # Schema explanation
│   ├── PRICING-LOGIC.md          # How pricing works
│   └── ADMIN-GUIDE.md            # Using admin panel
│
├── scripts/
│   ├── setup.sh                  # Initial setup script
│   ├── deploy.sh                 # Deploy to Pi
│   ├── backup.sh                 # Daily backup
│   └── seed.ts                   # Seed test data
│
├── .github/
│   └── workflows/
│       ├── lint.yml
│       ├── test.yml
│       └── deploy.yml            # Auto-deploy on push
│
├── docker-compose.yml            # For local dev (optional)
├── .env.example
├── README.md
└── package.json                  # Root workspace

```

---

## 🗄 Database Schema (Prisma)

### Core Models

```prisma
// User & Authentication
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String?
  role          Role      @default(CUSTOMER)  // CUSTOMER | ADMIN
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  projects      Project[]
}

enum Role {
  CUSTOMER
  ADMIN
}

// Project (Job/Order)
model Project {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // File Info
  fileName      String
  fileSize      Int       // bytes
  filePath      String    // local storage path
  fileUrl       String?   // public download URL
  
  // Configuration
  material      String    // PLA, PETG, ABS, TPU
  infill        Int       @default(20) // 0-100
  layerHeight   Float     @default(0.2) // mm
  supportType   String    @default("None") // None, Tree, Linear
  
  // Output
  estimatedTime Int       // minutes
  estimatedCost Float     // THB
  actualCost    Float?
  
  // Status
  status        Status    @default(QUOTED)
  priority      Int       @default(0)
  
  // Metadata
  purpose       String?   // Prototype, Gift, Testing, etc.
  notes         String?
  
  // Timeline
  quotedAt      DateTime  @default(now())
  orderedAt     DateTime?
  startedAt     DateTime?
  completedAt   DateTime?
  pickupAt      DateTime?
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum Status {
  QUOTED        // Quote generated, awaiting payment
  PENDING       // Paid, awaiting printing
  PRINTING      // Currently printing
  COMPLETED     // Done, ready for pickup
  DELIVERED     // Picked up or shipped
  CANCELLED     // Cancelled by user or admin
}

// Gallery / Showcase
model GalleryItem {
  id            String    @id @default(cuid())
  title         String
  description   String?
  imageUrl      String
  
  // Reference
  projectId     String?   // Optional link to real project
  material      String
  purpose       String    // Board game, Functional, Display, etc.
  
  // Display
  featured      Boolean   @default(false)
  order         Int       @default(0)
  
  // Metadata
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// Queue Status (for real-time display)
model QueueStatus {
  id            String    @id @default(cuid())
  totalMinutes  Int       // Total estimated time in queue
  itemsCount    Int       // How many jobs in queue
  machinesActive Int      // How many printers running
  lastUpdated   DateTime  @updatedAt
  
  // Admin can manually update
  statusMessage String?   // e.g., "Queue paused for maintenance"
}

// Pricing Configuration
model PricingConfig {
  id            String    @id @default(cuid())
  
  // Base rates
  baseCostPerHour Float   // THB
  materialCosts  Json     // { "PLA": 50, "PETG": 75, "ABS": 100 }
  
  // Rules
  minOrder      Float
  rushFee       Float     // % extra for expedited
  
  // File size limits
  maxFileSize   Int       // bytes
  
  // Updated by admin
  updatedAt     DateTime  @updatedAt
}

// Email Log (for debugging)
model EmailLog {
  id            String    @id @default(cuid())
  projectId     String
  recipient     String
  subject       String
  status        String    // SENT | FAILED
  error         String?
  sentAt        DateTime  @default(now())
}
```

---

## 🔌 API Endpoints (Backend)

### Public Endpoints

**Authentication**
```
POST /api/auth/register        # Create user account
POST /api/auth/login           # Login
POST /api/auth/logout          # Logout
POST /api/auth/refresh         # Refresh JWT
```

**Pricing & Quote**
```
POST /api/quote                # Calculate price from file
  Body: { file, material, infill, layerHeight, supportType, ... }
  Response: { estimatedTime, estimatedCost, breakdown }

GET /api/materials             # List available materials with specs
GET /api/pricing/config        # Public pricing info
```

**Projects (User)**
```
GET /api/projects              # List user's projects
GET /api/projects/:id          # Get single project
POST /api/projects             # Create new project (upload file)
  Body: FormData with file + config
  Response: { projectId, ...quote }
PATCH /api/projects/:id        # Update project config
PUT /api/projects/:id/checkout # Process payment
DELETE /api/projects/:id       # Cancel project

GET /api/projects/:id/download # Download finished file (if allowed)
```

**Queue**
```
GET /api/queue/status          # Current queue info
  Response: { 
    totalMinutes, 
    itemsCount, 
    machinesActive,
    statusMessage,
    yourPosition (if logged in)
  }

GET /api/queue/history         # Job history (admin-only)
```

**Gallery**
```
GET /api/gallery               # List all showcase items
GET /api/gallery/:id           # Single item
```

**Support**
```
POST /api/support/contact      # Contact form
GET /api/support/faq           # FAQ list
```

### Admin Endpoints (Protected by JWT + Role)

**Project Management**
```
GET /api/admin/projects                # All projects (paginated)
PATCH /api/admin/projects/:id/status   # Update status
PATCH /api/admin/projects/:id/cost     # Update final cost
DELETE /api/admin/projects/:id         # Delete project

GET /api/admin/projects/:id/timeline   # Print timeline
```

**Queue Management**
```
POST /api/admin/queue/reorder          # Reorder queue
PATCH /api/admin/queue/status          # Update queue message
POST /api/admin/queue/manual-add       # Add manual job
```

**Gallery Management**
```
POST /api/admin/gallery                # Add new gallery item
PATCH /api/admin/gallery/:id           # Edit item
DELETE /api/admin/gallery/:id          # Remove item
PATCH /api/admin/gallery/reorder       # Change display order
```

**Settings**
```
GET /api/admin/settings                # Get all settings
PATCH /api/admin/settings              # Update settings
GET /api/admin/settings/pricing        # Pricing config
PATCH /api/admin/settings/pricing      # Update pricing
```

**Analytics**
```
GET /api/admin/analytics/dashboard     # Dashboard stats
GET /api/admin/analytics/revenue       # Revenue over time
GET /api/admin/analytics/materials     # Material usage
```

---

## 💰 Pricing Logic (Reference Implementation)

File: `apps/backend/src/services/pricing.ts`

```typescript
interface QuoteRequest {
  fileSize: number;        // bytes
  material: string;        // PLA, PETG, etc.
  infill: number;          // 0-100
  estimatedPrintTime: number; // minutes (calculated from file)
  supportType: string;     // None, Tree, Linear
}

function calculateQuote(req: QuoteRequest): {
  estimatedTime: number;
  estimatedCost: number;
  breakdown: object;
} {
  const config = getPricingConfig();
  
  // 1. Material cost
  const materialCost = config.materialCosts[req.material] || 50;
  
  // 2. Print time cost
  const hourlyRate = config.baseCostPerHour; // e.g., 100 THB/hour
  const printCost = (req.estimatedPrintTime / 60) * hourlyRate;
  
  // 3. Infill surcharge
  const infillMultiplier = 1 + (req.infill / 100) * 0.5; // 0-50% extra
  
  // 4. Support surcharge
  let supportCost = 0;
  if (req.supportType === "Tree") supportCost = printCost * 0.3;
  else if (req.supportType === "Linear") supportCost = printCost * 0.15;
  
  // 5. Total
  const subtotal = 
    materialCost + 
    (printCost * infillMultiplier) + 
    supportCost;
  
  const tax = subtotal * 0.07; // 7% VAT
  const total = subtotal + tax;
  
  return {
    estimatedTime: req.estimatedPrintTime,
    estimatedCost: Math.ceil(total),
    breakdown: {
      material: materialCost,
      printTime: printCost,
      infillSurcharge: (printCost * infillMultiplier) - printCost,
      supportCost,
      subtotal,
      tax,
      total
    }
  };
}
```

**Load pricing from:** `/Users/paisit/Documents/internal-remaker-desktop`
- Read existing pricing rules
- Import into PricingConfig model during setup
- Allow admin to override via UI

---

## 🚀 Deployment Guide (Raspberry Pi + Cloudflare)

### Phase 1: Local Development Setup

```bash
# Clone repo
git clone <repo> remaker-work
cd remaker-work

# Setup Node.js on Pi (if not installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
nvm install 18
nvm use 18

# Install dependencies
npm install
cd apps/frontend && npm install
cd ../backend && npm install

# Setup environment files
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env

# Database setup
cd apps/backend
npx prisma migrate dev --name init
npx prisma db seed

# Run locally
npm run dev:all
```

### Phase 2: Prepare Pi for Deployment

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y nginx postgresql curl git nodejs npm

# Create app user
sudo useradd -m -s /bin/bash remakerio
sudo su - remakerio

# Install PM2 globally (for process management)
npm install -g pm2

# Setup directories
mkdir -p ~/apps/remaker-work
mkdir -p ~/apps/data/uploads
mkdir -p ~/logs
```

### Phase 3: Configure Cloudflare Tunnel

```bash
# On Pi, download & install Cloudflare Tunnel
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm.deb
sudo dpkg -i cloudflared.deb

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create remaker-work

# Configure tunnel to route to localhost:3000 (Frontend) and :5000 (API)
# Create ~/.cloudflared/config.yml:

ingress:
  - hostname: remaker.work
    service: http://localhost:3000
  - hostname: api.remaker.work
    service: http://localhost:5000
  - hostname: admin.remaker.work
    service: http://localhost:3000/admin
  - service: http_status:404

# Install as systemd service
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

### Phase 4: Deploy Application

```bash
# SSH into Pi
ssh user@pi-ip

# Pull code
cd ~/apps/remaker-work
git pull origin main

# Build
cd apps/frontend
npm run build
cd ../backend
npm run build

# Start services with PM2
pm2 start apps/backend/dist/index.js --name "remaker-api" --env production
pm2 start "cd apps/frontend && npm run start" --name "remaker-web"

# Save PM2 config
pm2 save
pm2 startup

# Setup Nginx reverse proxy
sudo nano /etc/nginx/sites-available/remaker-work

# Content:
upstream frontend {
  server 127.0.0.1:3000;
}
upstream backend {
  server 127.0.0.1:5000;
}

server {
  listen 80;
  server_name localhost;

  location / {
    proxy_pass http://frontend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  location /api {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
  }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/remaker-work /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

### Phase 5: Backup & Monitoring

```bash
# Daily backup script (backup.sh)
#!/bin/bash
BACKUP_DIR="/home/remakerio/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
cp ~/apps/remaker-work/prisma/data.db $BACKUP_DIR/data_$TIMESTAMP.db

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz ~/apps/data/uploads/

# Upload to cloud storage or external drive
# rsync -av $BACKUP_DIR/ remote:/backups/remaker/

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

# Crontab entry:
# 0 2 * * * /home/remakerio/backup.sh
```

---

## 🔐 Security Checklist

- [ ] Enable HTTPS via Cloudflare (automatic)
- [ ] Use HttpOnly cookies for JWT tokens
- [ ] Rate limit API endpoints (express-ratelimit)
- [ ] Validate all file uploads (virus scan optional, file type check required)
- [ ] Sanitize user inputs (express-validator)
- [ ] CORS configured for remaker.work only
- [ ] Environment variables not in git (use .env)
- [ ] Database backups encrypted and stored offsite
- [ ] Admin routes protected with middleware
- [ ] Sensitive data masked in logs
- [ ] Regular security updates for dependencies (npm audit)

---

## 📊 Performance Optimization for Pi

1. **Static Export:** Build Next.js as static site where possible (reduces CPU)
2. **Image Optimization:** Use Sharp to compress uploads before storage
3. **Database Indexing:** Add indexes on frequently queried fields (userId, status)
4. **Caching:** Redis for session storage (optional, can use file-based)
5. **Lazy Loading:** Implement for gallery images
6. **API Pagination:** Limit results (20-50 per page)
7. **Queue Monitoring:** Don't poll server too frequently (Socket.io instead)

---

## 🔄 Development Workflow

### Local Development
```bash
npm run dev:all    # Run frontend + backend simultaneously
```

### Code Organization
- Frontend: Use atomic component structure (atoms, molecules, organisms)
- Backend: Follow MVC pattern (routes → controllers → services)
- Shared: Type definitions in `/types` folder

### Git Workflow
```bash
git checkout -b feature/queue-status
# ... make changes ...
git commit -m "feat: add real-time queue status"
git push origin feature/queue-status
# Create PR, get reviewed, merge to main
# GitHub Actions auto-deploys to Pi
```

### Testing
```bash
# Backend
cd apps/backend
npm run test

# Frontend
cd apps/frontend
npm run test
```

---

## 📚 Admin Features Breakdown

### Dashboard (`/admin/dashboard`)
- Total projects this month
- Revenue overview
- Average turnaround time
- Material usage chart
- Current queue status

### Projects (`/admin/projects`)
- Table view: all projects with filters (status, date, material)
- Edit project: change status, override cost, add notes
- Bulk actions: reorder queue, change status, export PDF

### Queue (`/admin/queue`)
- Drag-to-reorder interface
- Set/pause current printer
- Manual add offline job
- Queue message (e.g., "Maintenance mode")

### Gallery (`/admin/gallery`)
- Upload new showcase items
- Reorder display
- Filter by material/purpose
- Feature/unfeature

### Settings
- Pricing config (base rates, material costs)
- Opening hours / status message
- Email configuration
- Backup management

---

## 🚨 Deployment Checklist

Before going live:
- [ ] Domain pointing to Cloudflare nameservers
- [ ] Cloudflare Tunnel running and verified
- [ ] Database migrations completed
- [ ] Admin user created
- [ ] Email service configured (SendGrid or SMTP)
- [ ] File upload directory created and permissions set
- [ ] Backups scheduled
- [ ] PM2 processes saved and startup enabled
- [ ] SSL certificate auto-renewing (Cloudflare handles)
- [ ] Analytics/monitoring configured
- [ ] Test full workflow (upload → quote → payment → delivery)

---

## 📖 Additional Documentation Files

Create these files in `/docs`:

1. **API.md** - Full endpoint reference with examples
2. **DEPLOYMENT.md** - Detailed deployment walkthrough
3. **DATABASE.md** - Schema diagram and relationships
4. **PRICING-LOGIC.md** - How pricing calculation works
5. **ADMIN-GUIDE.md** - Step-by-step admin usage
6. **TROUBLESHOOTING.md** - Common issues and fixes

---

## 🎯 Rollout Timeline

**Week 1:** Setup Pi, install dependencies, local testing
**Week 2:** Build frontend (hero, upload, gallery, queue pages)
**Week 3:** Build backend API (projects, pricing, queue)
**Week 4:** Admin panel + payment integration
**Week 5:** Testing, security audit, final tweaks
**Week 6:** Deploy to Cloudflare Tunnel, launch!

---

## 📞 Support & Questions

For questions during development:
- Check `/docs` folder first
- Review this Master Prompt
- Refer to code comments
- Check GitHub Issues

---

**This Master Prompt is your source of truth for the project. Keep it updated as requirements evolve.**
