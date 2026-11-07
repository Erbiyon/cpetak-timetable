# Security RFC 001: Teacher Authentication Hardening & Credential Lifecycle Architecture

## 1. Executive Summary & Problem Statement
Prior to Phase 5.1, the application verified Teacher credentials in `lib/auth.ts` via:
```typescript
if (teacher && credentials.password === teacher.tId)
```
Every Teacher account used its publicly accessible staff identifier `tId` as its permanent plaintext password. Because `tId` is publicly queryable and displayed across timetable, teacher directory, and curriculum routes, any unauthenticated or low-privileged user could impersonate any Teacher without guessing.

## 2. Hardened Architecture & Design Decisions
1. **Separation of Identity and Credential:**
   - `tId` remains the public staff identifier for display and curriculum association.
   - Dedicated `passwordHash` field is added to `Teacher_tb`.
2. **Cryptographic Algorithm (scrypt KDF):**
   - Implemented via Node.js native `crypto.scrypt` (asynchronous) with OWASP-recommended parameters:
     - Memory cost $N = 16384$ ($2^{14}$)
     - Block size $r = 8$
     - Parallelization $p = 1$
     - Key length = 64 bytes
     - Salt = 16 cryptographically secure random bytes
     - Output format: `scrypt$16384$8$1$<salt_hex>$<hash_hex>`
     - Verification with timing-safe comparison (`crypto.timingSafeEqual`).
3. **Verified Enrollment Lifecycle:**
   - Account enrollment status tracked via `isEnrolled: Boolean` (default `false`).
   - Admin initiates enrollment token via `POST /api/teacher/enrollment/create`.
   - Raw single-use tokens are 32 bytes hex, strictly time-limited (24 hours).
   - Only `SHA-256(rawToken)` is stored in `TeacherToken_tb`; raw tokens are never persisted in the database.
   - Teacher sets individual password ($\ge 8$ chars, $\ne tId$) via `POST /api/teacher/enrollment/complete`.
   - Token is atomically marked consumed (`consumedAt: DateTime`).
4. **Account Recovery & Password Reset Delivery:**
   - Public endpoint `POST /api/teacher/reset-password/request` returns generic message to prevent account enumeration.
   - Admin-assisted recovery workflow ensures secure delivery when email infrastructure is not present.
   - Password reset completion via `POST /api/teacher/reset-password/confirm` consumes token atomically and increments `sessionVersion`.
5. **Session Revocation via `sessionVersion`:**
   - `Teacher_tb.sessionVersion` tracks credential generation.
   - When password reset occurs, `sessionVersion` increments.
   - Active JWT sessions validate `sessionVersion` against the database; mismatched sessions are rejected immediately.
6. **Fail-Closed Enforcement:**
   - Unenrolled accounts (`isEnrolled === false` or `passwordHash === null`) **CANNOT** log in.
   - Legacy login attempt using `password === teacher.tId` is rejected without fallback.
   - Admin credentials remain independent and protected.

