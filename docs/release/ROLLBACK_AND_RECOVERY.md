# ROLLBACK AND DISASTER RECOVERY PLAN
## Project: `cpetak-timetable`

---

## 1. Rollback Scenarios

### Scenario A: Application Boot Failure or Runtime Fatal Error (Database intact)
If the new Next.js release fails to start or encounters unrecoverable errors:
1. Revert container or traffic to previous stable release image/commit.
2. Restart Node process:
   ```bash
   git checkout <previous-stable-commit>
   pnpm install --frozen-lockfile
   pnpm build
   pnpm start
   ```
*(Note: Database schema changes in Phase 5.3 and 5.2 are backward-compatible and do not break previous application code)*

### Scenario B: Database Schema Rollback (Emergency DDL Reversal)
If a critical database corruption occurs during migration:
1. Stop the application server:
   ```bash
   pnpm stop # Or systemctl stop cpetak-timetable
   ```
2. Revert the database changes safely using DDL:
   ```sql
   -- Rollback Timetable Lock Table
   DROP TABLE IF EXISTS `TimetableLock_tb`;

   -- Rollback Teacher Auth Hardening
   DROP TABLE IF EXISTS `TeacherToken_tb`;
   ALTER TABLE `Teacher_tb`
     DROP COLUMN `sessionVersion`,
     DROP COLUMN `isEnrolled`,
     DROP COLUMN `passwordHash`;
   ```
3. Remove migration records from `_prisma_migrations` if needed:
   ```sql
   DELETE FROM `_prisma_migrations` WHERE migration_name IN (
     '20261108010000_timetable_concurrency_locks',
     '20261108000000_teacher_auth_hardening'
   );
   ```

### Scenario C: Complete Point-in-Time Database Restore
If data integrity was compromised:
1. Stop application traffic.
2. Restore from the pre-deployment mysqldump snapshot:
   ```bash
   mysql -u <user> -p <database> < pre_release_v1_backup_YYYYMMDD_HHMMSS.sql
   ```
3. Restart application.
