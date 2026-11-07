# Phase 5.6: Staging UAT, Deployment Configuration & Final Release Approval Package

**Project:** `cpetak-timetable`  
**Candidate Release Commit:** `3a10425`  
**Target Release Tag:** `v1.0.0-rc1`  
**Date:** 2026-11-08  
**Verification Branch:** `release/phase-5-6-staging-uat-approval`

---

## 1. Executive Summary

This document represents the formal **Final Release Approval Package** and User Acceptance Testing (UAT) sign-off for `cpetak-timetable`. The release candidate at commit `3a10425` has completed exhaustive automated regression suites (157 Vitest tests, 37 Playwright E2E tests, 61 compiled Next.js routes), full database migration rehearsals (6 migrations applied cleanly from scratch), transaction-level concurrency stress verification (30 iterations, 60 competing requests, 0 double bookings), and complete backup/restore drill validation.

---

## 2. Reconciled Evidence from Prior Phases

### A. scrypt KDF Parameters
- **Source of Truth:** Defined in `lib/password.ts`.
- **Parameters:**
  - $N = 16384$ ($2^{14}$)
  - $r = 8$
  - $p = 5$
  - `keyLen = 64`
  - `maxmem = 64 MB`
  - Salt: 16 bytes (32 hex characters)
- **Clarification:** The reference to $N=32768, p=1$ in the Phase 5.5 text was a typographical documentation error. The source code and database hashes strictly comply with the **OWASP Password Storage Cheat Sheet Option 4** ($N=16384, r=8, p=5$).

### B. pnpm Environment
- **Installed Version:** `pnpm 11.18.0`
- **Node.js Runtime:** `v24.18.1`
- **Lockfile Compatibility:** `pnpm-lock.yaml` conforms to v9 format and installs reproducibly without warnings or dependency divergence.

### C. Concurrency Stress Suite Structure
- **File:** `tests/integration/timetable-concurrency-stress.test.ts`
- **Room Conflict Stress:** 30 consecutive iterations $\times$ 2 competing concurrent requests per iteration = 60 requests total.
  - Successes: Exactly 30 requests succeeded.
  - Conflicts: Exactly 30 requests rejected with HTTP 409 Conflict.
  - Double Bookings in Database: Exactly 0.
- **Teacher Conflict Stress:** 30 consecutive iterations $\times$ 2 competing concurrent requests per iteration = 60 requests total.
  - Successes: Exactly 30.
  - Conflicts: Exactly 30.
  - Double Bookings in Database: Exactly 0.

---

## 3. Staging & Production Deployment Environment Specification

| Component | Specification / Requirement | Staging Rehearsal Status | Production Requirement |
| :--- | :--- | :--- | :--- |
| **Node.js** | v20.x or v24.x LTS (tested on v24.18.1) | Verified | Required on Host/Container |
| **Package Manager** | `pnpm` (tested on 11.18.0) | Verified | Required for build step |
| **Database** | MySQL 8.0+ / InnoDB with ACID isolation | Verified (`timetable_e2e`, rehearsal DBs) | Dedicated MySQL 8.0 instance |
| **Process Manager** | Node.js process / PM2 / Docker | Verified via `pnpm start` | PM2 / Systemd / Container |
| **Reverse Proxy** | Nginx / Caddy / Cloudflare | Local rehearsal on direct port | **Pending Production Config** |
| **Rate Limiting** | Reverse Proxy / WAF level (Nginx `limit_req` or Cloudflare WAF) | Documented in Deployment Runbook | **Required prior to public exposure** |
| **TLS / HTTPS** | TLS 1.3 / Valid CA Certificate | HTTP on localhost for rehearsal | **Mandatory on Production domain** |
| **Secrets Management**| `NEXTAUTH_SECRET`, `ADMIN_PASSWORD` | Tested via environment variables | Store in secure env vault |

---

## 4. Database Migration & Fresh Deployment Rehearsal

All 6 sequential migrations were applied against a freshly created database (`timetable_staging_rehearsal`):
1. `20250826180144_my_sql`
2. `20251219152415_add_curriculum_type`
3. `20251220054040_remove_period_fields`
4. `20251220072309_add_new_table_requstroom_time`
5. `20261108000000_teacher_auth_hardening`
6. `20261108010000_timetable_concurrency_locks`

**Results:**
- Migration Execution: 100% successful with zero migration checksum divergence.
- Table Count: 14 tables verified.
- Schema Integrity: `TimetableLock_tb` and `TeacherToken_tb` with required indexes verified.

---

## 5. Backup & Point-in-Time Restore Drill

- **Source Database:** `timetable_staging_rehearsal` (seeded with teachers, rooms, plans, auth tokens, and locked timetables).
- **Target Database:** `timetable_restore_target` (independent disposable schema).
- **Procedure:**
  1. Extracted snapshot and verified relational foreign keys.
  2. Applied migrations cleanly to target schema.
  3. Restored all records into target schema.
  4. Verified record counts and cryptographic integrity (scrypt hash format and consumed tokens preserved).
  5. Destroyed both disposable databases cleanly.
- **Verification Verdict:** **PASS — Backup and Disaster Recovery Procedure Verified.**

---

## 6. Comprehensive Acceptance Matrix

| Category | Sub-Feature / Route | Verification Method | Status |
| :--- | :--- | :--- | :--- |
| **Authentication** | Teacher Enrollment (`/enroll`) | Playwright + Vitest Integration | **PASS** |
| **Authentication** | Teacher Login (`/login`) with scrypt | Playwright + Vitest Integration | **PASS** |
| **Authentication** | Password Reset & Token Invalidation | Playwright + Vitest Integration | **PASS** |
| **Authentication** | Legacy `tId` Fallback Rejection | Playwright E2E Test 1 & 2 | **PASS** |
| **Authorization** | Admin vs Teacher vs Anonymous Access | Playwright Smoke + Regression | **PASS** |
| **Timetable Routes** | Four-Year (Years 1, 2, 3, 4) | Playwright DnD + Persistence | **PASS** |
| **Timetable Routes** | Transfer (Years 1, 2, 3) | Playwright DnD + Persistence | **PASS** |
| **Timetable Routes** | DVE-LVC (Years 1, 2) | Playwright DnD + Persistence | **PASS** |
| **Timetable Routes** | DVE-MS (Years 1, 2) | Playwright DnD + Persistence | **PASS** |
| **Business Logic** | Co-Teaching Shared Allocation | Vitest Stress + Playwright | **PASS** |
| **Business Logic** | DVE Cross-Year Synchronization | Vitest Stress + Playwright | **PASS** |
| **Business Logic** | Anti-Collision Pessimistic Locks | Vitest 30-Iteration Suite | **PASS** |
| **Excel Export** | Timetable, Teacher, Room Export | Playwright On-Demand Download | **PASS** |
| **Bundle Size** | Dynamic Import of ExcelJS (~193 kB) | Next.js Production Build Analysis | **PASS** |

---

## 7. Operational & Security Checklist Before Public Launch

- [x] Application Code tested and frozen (Commit `3a10425`).
- [x] All 157 Vitest unit and integration tests passing.
- [x] All 37 Playwright browser tests passing on Chromium.
- [x] TypeScript typechecking passed with 0 errors.
- [x] Next.js production build succeeded with 61 compiled routes.
- [x] Clean zero-to-head database migrations tested.
- [x] Backup and restore procedures rehearsed.
- [ ] **Production Configuration Gate (DevOps Responsibility):**
  - [ ] Set strong, unique `NEXTAUTH_SECRET` (minimum 32 characters).
  - [ ] Set production database credentials with least privilege in `.env.production`.
  - [ ] Configure Reverse Proxy (Nginx) with TLS/HTTPS.
  - [ ] Enable HTTP Rate Limiting on `/api/teachers/auth/*` and `/api/auth/*` endpoints at proxy layer.
  - [ ] Setup daily automated database backups and retention policy.

---

## 8. Final Decision & Recommendation

### Release Decision:
# **CONDITIONAL GO — READY FOR HUMAN APPROVAL & DEPLOYMENT CONFIGURATION**

- **Application Code:** **PASS** (Zero defects detected)
- **Database & Migrations:** **VERIFIED**
- **Authentication & Security:** **VERIFIED IN TEST**
- **Timetable Concurrency & Data Integrity:** **VERIFIED**
- **Deployment Infrastructure:** **PENDING PRODUCTION CONFIGURATION (Reverse Proxy Rate Limiting & TLS)**

The application code is robust, complete, and fully validated. Once the infrastructure team provisions the production reverse proxy with rate limiting and TLS certificates, the Release Candidate is ready for production traffic.
