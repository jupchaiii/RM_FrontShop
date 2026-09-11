# Remaker.work Backend - Environment Variables Template

Copy this to `apps/backend/.env` and fill in your values.

> ⚠️ **Not all of this is implemented yet.** This file is a forward-looking reference for features that may be built later (payment gateways, S3, Redis, webhooks, Sentry, etc.). For what the app actually reads today, see `apps/backend/.env.example` and `apps/backend/src/config.ts` — those are the source of truth.

```bash
# ==========================================
# DATABASE
# ==========================================
DATABASE_URL="file:./prisma/data.db"
# For PostgreSQL: postgresql://user:password@localhost:5432/remaker_work

# ==========================================
# SERVER
# ==========================================
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000,https://remaker.work,https://admin.remaker.work

# ==========================================
# JWT / AUTHENTICATION
# ==========================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRY=30d

# Admin password (hash with bcrypt in production)
ADMIN_EMAIL=admin@remaker.work
ADMIN_PASSWORD=change-me-in-production

# ==========================================
# EMAIL SERVICE
# ==========================================
# Option 1: SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@remaker.work

# Option 2: SMTP (Gmail, Mailgun, etc.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=noreply@remaker.work

# Option 3: Local SMTP (Postfix on Pi)
SMTP_HOST=localhost
SMTP_PORT=25

# ==========================================
# PAYMENT GATEWAY
# ==========================================
# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# OmiseGO (Thailand-based)
OMISE_SECRET_KEY=skey_live_xxxxxxxxxxxxx
OMISE_PUBLIC_KEY=pkey_live_xxxxxxxxxxxxx

# ==========================================
# FILE UPLOAD
# ==========================================
# Local storage
UPLOAD_DIR=/home/remakerio/apps/data/uploads
MAX_FILE_SIZE=104857600  # 100MB in bytes

# S3 Storage (optional)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=remaker-work-uploads
AWS_REGION=ap-southeast-1

# ==========================================
# WEBHOOKS & NOTIFICATIONS
# ==========================================
# WhatsApp Notify
WHATSAPP_API_KEY=your-whatsapp-business-api-key
WHATSAPP_PHONE_ID=your-phone-number-id
ADMIN_WHATSAPP=+66987654321

# Line Notify (Thailand popular)
LINE_NOTIFY_TOKEN=your-line-notify-token
LINE_NOTIFY_MESSAGE_ENABLED=true

# Discord Webhook (optional for logging)
DISCORD_WEBHOOK_URL=https://discordapp.com/api/webhooks/xxxxx

# ==========================================
# LOGGING
# ==========================================
LOG_LEVEL=debug  # debug, info, warn, error
LOG_FILE=/home/remakerio/logs/app.log

# ==========================================
# MONITORING & ANALYTICS
# ==========================================
# Optional: PM2 monitoring
PM2_MONITORING_ENABLED=false
PM2_INSTANCE_NAME=remaker-api

# Optional: Sentry error tracking
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# ==========================================
# BUSINESS LOGIC
# ==========================================
# Operating hours (ISO format)
BUSINESS_HOURS_START=08:00
BUSINESS_HOURS_END=17:00
BUSINESS_DAYS=1,2,3,4,5  # 1=Monday, 5=Friday

# Queue settings
QUEUE_PAUSE_MESSAGE=
QUEUE_MAINTENANCE_MODE=false
MAX_QUEUE_HOURS=48

# Estimated print time per gram (adjust based on experience)
PRINT_TIME_PER_GRAM=0.5  # hours

# ==========================================
# 3D PRINTER SPECIFICATIONS
# ==========================================
# Max build volume (mm)
PRINTER_MAX_X=200
PRINTER_MAX_Y=200
PRINTER_MAX_Z=200

# Number of active printers
NUM_PRINTERS=2

# ==========================================
# PRICING (moved to database, but can override here)
# ==========================================
BASE_COST_PER_HOUR=100  # THB
MIN_ORDER=50            # THB

# ==========================================
# CACHING (optional)
# ==========================================
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600  # seconds

# ==========================================
# DEVELOPMENT ONLY
# ==========================================
DEBUG=remaker:*
SKIP_ENV_VALIDATION=false
```

---

## Notes

1. **Development:** Use this template as-is with test values
2. **Production:** Replace all `xxxxx` placeholders with real credentials
3. **Security:** Never commit `.env` to git; use `.env.example` instead
4. **Secrets Management:** Consider using Pi's secure vault or environment variable manager
5. **Email:** Start with SMTP (easier to setup), upgrade to SendGrid if needed
6. **Payment:** Test with Stripe sandbox first, then switch to live keys

## Setup Steps

```bash
# 1. Copy template
cp .env.example .env

# 2. Fill in required values
nano .env

# 3. Validate (during startup, app checks required env vars)
npm run dev

# 4. For production, use PM2 with env file
pm2 start src/index.ts --name "remaker-api" --env /path/to/.env
```

## Required vs Optional

**Required (app won't start without):**
- DATABASE_URL
- JWT_SECRET
- ADMIN_EMAIL / ADMIN_PASSWORD
- UPLOAD_DIR

**Required (for full functionality):**
- Email service (SENDGRID_API_KEY or SMTP_*)
- Payment gateway (STRIPE_SECRET_KEY or OMISE_SECRET_KEY)

**Optional (nice-to-have):**
- Webhooks (WhatsApp, Line, Discord)
- S3 storage (if want cloud backup)
- Redis caching
- Sentry monitoring

## Sensitive Information

These should be stored in Pi's keyring or hardware encrypted:
- JWT_SECRET
- STRIPE_SECRET_KEY
- SENDGRID_API_KEY
- Database password (if PostgreSQL)

## Pi-Specific Notes

On Raspberry Pi, you might want to:
1. Use SQLite (no setup needed) instead of PostgreSQL
2. Store uploads locally instead of S3
3. Use Postfix (local SMTP) instead of SendGrid API
4. Run smaller instances with lower timeouts

```bash
# Example Pi-optimized setup
DATABASE_URL="file:./data.db"
SMTP_HOST=localhost
SMTP_PORT=25
UPLOAD_DIR=/mnt/storage/uploads  # External USB drive
MAX_FILE_SIZE=52428800  # 50MB
NODE_ENV=production
```
