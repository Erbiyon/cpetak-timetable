# PRODUCTION DEPLOYMENT RUNBOOK
## Project: `cpetak-timetable`

---

## 1. Prerequisites & Environment Variables

Ensure the production environment configuration (`.env.production` or container environment) specifies:

```env
# Database Connection (MySQL 8.0 InnoDB)
DATABASE_URL="mysql://<user>:<password>@<host>:3306/<database>?connection_limit=25&pool_timeout=10"

# NextAuth Core Security (Must be cryptographically random >= 32 characters)
NEXTAUTH_SECRET="<generate-using-openssl-rand-hex-32>"
NEXTAUTH_URL="https://timetable.cpe.eng.example.ac.th"

# Administrator Root Credentials (Required in Production)
ADMIN_USERNAME="<configured-admin-user>"
ADMIN_PASSWORD="<configured-secure-admin-password>"

# Node Environment
NODE_ENV="production"
PORT=3000
```

---

## 2. Step-by-Step Deployment Procedure

### Step 2.1: Pre-Deployment Database Backup
Always capture an atomic point-in-time snapshot before running database migrations:
```bash
mysqldump -u <user> -p --single-transaction --quick --routines --triggers <database> > pre_release_v1_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2.2: Fetch Approved Release Code
```bash
git fetch origin
git checkout tags/v1.0.0-rc1 # Or approved release commit
```

### Step 2.3: Dependency Installation
Use `pnpm` exclusively:
```bash
pnpm install --frozen-lockfile
```

### Step 2.4: Apply Versioned Prisma Migrations
```bash
pnpm exec prisma migrate deploy
```
*Verify output shows:*
- `20261108000000_teacher_auth_hardening`
- `20261108010000_timetable_concurrency_locks`
- `All migrations have been successfully applied.`

### Step 2.5: Build Next.js Production Assets
```bash
pnpm build
```
*Verify 61 routes compiled and static pages generated.*

### Step 2.6: Start Server Process
Using systemd, Docker, or PM2:
```bash
pnpm start
# Or with PM2: pm2 start npm --name "cpetak-timetable" -- start
```

---

## 3. Post-Deployment Smoke Verification

1. **HTTP Health Check:**
   `curl -fI http://localhost:3000/login` returns HTTP 200.
2. **Admin Authentication:**
   Sign in to `/login` using `$ADMIN_USERNAME` and `$ADMIN_PASSWORD`. Confirm redirection to `/dashboard`.
3. **Teacher Authentication Guard:**
   Attempt login with legacy `tId` as password; verify error `รหัสประจำตัวหรือรหัสผ่านไม่ถูกต้อง`.
4. **Timetable Route Render:**
   Navigate to `/adjust-time-tables/adjust-plan-four-year/four-one-year` and verify timetable grid renders.
5. **Excel Export Test:**
   Click Download Timetable Excel; verify valid `.xlsx` download without console errors.
