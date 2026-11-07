# Production Go-Live Master Checklist & Operational Runbook

**Project:** `cpetak-timetable`  
**Target Release Tag:** `v1.0.0-rc1`  
**Target Architecture:** Next.js 15.5.29 / React 19.1.0 / Prisma 6.16.1 / MySQL 8.0 / Nginx Reverse Proxy  
**Last Updated:** 2026-11-08

---

## 1. PRE-DEPLOYMENT GATES & APPROVALS

All checklist items in this section must be verified before initiating deployment.

### A. Release Identification
- [ ] **Approved Release Commit:** Verify checkout of commit `3a10425` (Application Code) / `2b1a0ed` (Docs Package) or approved tag `v1.0.0-rc1`.
- [ ] **Git Working Tree:** Pristine clean with no uncommitted modifications.
- [ ] **Tag Authorization:** Ensure project owner has explicitly signed off on publishing `v1.0.0-rc1`.

### B. Production Host & Network Prerequisites
- [ ] **Operating System:** Ubuntu 22.04 LTS / Debian 12 / Rocky Linux 9 or hardened Docker container host.
- [ ] **Node.js Environment:** Node.js v20.x or v24.x LTS installed (`node -v`).
- [ ] **Package Manager:** `pnpm` installed (`pnpm -v`).
- [ ] **Database Network Isolation:** MySQL 8.0 listening exclusively on internal interface (`127.0.0.1` or private VPC network). Port 3306 **NEVER** exposed publicly.
- [ ] **Reverse Proxy Installed:** Nginx 1.20+ or Cloudflare Tunnel installed.
- [ ] **TLS Certificate:** Valid TLS certificate issued and installed (e.g. Let's Encrypt / Certbot for `timetable.cpetak.ac.th`).

### C. Security & Secret Provisioning
- [ ] **Production Environment File:** `.env.production` created from template `.env.production.example`.
- [ ] **File Permissions:** `.env.production` restricted (`chmod 600 .env.production`) and owned by application service user (e.g., `www-data` or `timetable`).
- [ ] **NEXTAUTH_SECRET Generated:** High-entropy secret generated via `openssl rand -base64 32` (minimum 32 characters).
- [ ] **Administrator Credentials:** Non-default `ADMIN_USERNAME` and complex `ADMIN_PASSWORD` (16+ chars) configured.
- [ ] **Database Application User:** Dedicated MySQL user (`timetable_app`) with least-privilege permissions (no administrative or root privileges).

---

## 2. PRODUCTION DEPLOYMENT PROCEDURE (STEP-BY-STEP)

Execute these steps in order during the scheduled maintenance window.

### Step 1: Clone or Pull Release Candidate
```bash
git fetch origin --tags
git checkout tags/v1.0.0-rc1
# OR: git checkout release/phase-6-0-production-go-live-preparation
```

### Step 2: Frozen Dependency Installation
Install production dependencies using exact lockfile versions:
```bash
pnpm install --frozen-lockfile
```

### Step 3: Prisma Client Generation
Generate the type-safe database client:
```bash
pnpm exec prisma generate
```

### Step 4: Production Database Migration
Apply all 6 versioned migrations to the production database:
```bash
export DATABASE_URL="mysql://timetable_app:STRONG_PASSWORD@127.0.0.1:3306/timetable_prod"
pnpm exec prisma migrate deploy
```
*Validation:* Ensure output confirms: `6 migrations found in prisma/migrations ... All migrations have been successfully applied.`

### Step 5: Next.js Production Compilation
Build optimized static assets and server bundles:
```bash
pnpm build
```
*Validation:* Verify output completes with `61 routes generated` and shared First Load JS at ~103 kB.

### Step 6: Process Management Startup (PM2 / Systemd)
Launch the application process using PM2:
```bash
pm2 start npm --name "cpetak-timetable" -- run start -- -p 3000
pm2 save
```
*Alternatively, using systemd service:*
```bash
sudo systemctl restart cpetak-timetable.service
sudo systemctl status cpetak-timetable.service
```

### Step 7: Nginx Reverse Proxy & Rate Limiting Activation
Deploy the hardened Nginx configuration from `deploy/nginx/cpetak-timetable.conf`:
```bash
sudo cp deploy/nginx/cpetak-timetable.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/cpetak-timetable.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 3. POST-DEPLOYMENT SMOKE & ACCEPTANCE TESTS

Run through these smoke verification points immediately after launch:

### 1. Health & Security Headers
- [ ] `curl -I https://timetable.cpetak.ac.th` returns `HTTP/2 200` or `307 Redirect` to `/home`.
- [ ] Headers contain `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: SAMEORIGIN`.
- [ ] HTTP requests on port 80 properly redirect (`301 Moved Permanently`) to HTTPS.

### 2. Administrator Operations
- [ ] Log in as Administrator using credentials from `.env.production`.
- [ ] Confirm Dashboard loads cleanly with Action Cards, TermYear, and Clock.
- [ ] Verify Teacher, Room, and Subject tables render active data.

### 3. Teacher Authentication & Access Isolation
- [ ] Confirm unauthenticated visits to `/adjust-time-tables` are redirected to `/login`.
- [ ] Confirm login attempt using legacy `tId` password fails with clear error.
- [ ] Generate a synthetic Teacher Enrollment Token from Admin panel and complete first-time enrollment at `/enroll`.
- [ ] Confirm new teacher logs in successfully and can only access their authorized schedule.

### 4. Timetable Scheduling & Anti-Collision
- [ ] Navigate to Four-Year Year 1 schedule.
- [ ] Drag-and-drop a subject card into a vacant period. Verify persistence after browser reload.
- [ ] Attempt an invalid drop (out of bounds or overlapping room/teacher). Verify immediate rejection.
- [ ] Verify Co-Teaching and DVE synchronization across related terms.

### 5. Excel Export Functionality
- [ ] Click "ดาวน์โหลดตารางเรียน (Excel)" on Timetable view. Confirm `.xlsx` file downloads with Thai text.
- [ ] Click "ดาวน์โหลดตารางผู้สอน" on `/class-schedule`. Confirm valid export.
- [ ] Click "ดาวน์โหลดตารางห้องเรียน" on `/rooms-use`. Confirm valid export.

### 6. Rate Limiting Verification
- [ ] Execute 6 rapid consecutive requests to `/api/teacher/enrollment/complete`.
- [ ] Confirm request 6 receives `HTTP 429 Too Many Requests`.

---

## 4. ROLLBACK & DISASTER RECOVERY PROCEDURES

In the event of an unexpected critical blocker during deployment:

### Scenario A: Application Startup / Build Failure (Zero Database Mutation)
1. Stop the new PM2 process: `pm2 stop cpetak-timetable`
2. Checkout the previous stable release tag: `git checkout tags/vX.Y.Z`
3. Run `pnpm install --frozen-lockfile && pnpm build`
4. Restart application: `pm2 start cpetak-timetable`

### Scenario B: Database Migration or Data Anomaly
1. Enable Nginx Maintenance Mode:
   ```bash
   sudo cp /etc/nginx/maintenance.html /var/www/html/index.html
   sudo systemctl reload nginx
   ```
2. Restore the pre-deployment database backup:
   ```bash
   mysql -u root -p timetable_prod < /var/backups/timetable/timetable_pre_deploy_backup.sql
   ```
3. Checkout previous release tag and rebuild application.
4. Disable maintenance mode and reload Nginx.

---

## 5. SIGN-OFF & OPERATIONAL HANDOFF MATRIX

| Role | Sign-off Responsibility | Status |
| :--- | :--- | :--- |
| **Principal Full-Stack Architect** | Application Code Frozen & Verified (Commit `3a10425`) | **SIGNED OFF** |
| **QA Automation Lead** | 157 Vitest Tests & 37 Playwright Tests 100% Green | **SIGNED OFF** |
| **Database Engineer** | 6 Prisma Migrations & Rehearsal Verified Clean | **SIGNED OFF** |
| **Security Engineer** | scrypt Option 4, Token Invalidation, Rate Limiting Template | **SIGNED OFF** |
| **Site Reliability Engineer (SRE)** | Production Go-Live Checklist & Deployment Runbooks Complete | **READY FOR HANDOFF** |
| **Project Owner / Lead Approver** | Production Launch Window & Server Deployment Approval | **PENDING OWNER DECISION** |
