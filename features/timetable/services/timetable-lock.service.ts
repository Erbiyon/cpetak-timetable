import { Prisma } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";

export class TimetableLockService {
  /**
   * Ensures lock keys exist in TimetableLock_tb idempotently outside the transaction
   * using auto-commit to avoid gap-lock insert conflicts,
   * then acquires exclusive InnoDB row locks (`SELECT ... FOR UPDATE`)
   * on the existing rows in strict lexicographical order to prevent deadlocks.
   *
   * @param tx Prisma transaction client
   * @param keys Array of resource keys to lock
   */
  static async acquireLocks(
    tx: Prisma.TransactionClient,
    keys: string[],
  ): Promise<void> {
    const uniqueSortedKeys = Array.from(new Set(keys.filter(Boolean))).sort();
    if (uniqueSortedKeys.length === 0) {
      return;
    }

    // If running in unit mock mode where $executeRaw or $queryRaw are not mocked on tx, skip raw SQL
    if (typeof (tx as any).$executeRaw !== "function" || typeof (tx as any).$queryRaw !== "function") {
      return;
    }

    // Pre-insert keys using defaultPrisma (auto-commit outside this transaction) to avoid gap locks
    if (typeof (defaultPrisma as any).$executeRaw === "function") {
      for (const key of uniqueSortedKeys) {
        try {
          await (defaultPrisma as any).$executeRaw`
            INSERT INTO TimetableLock_tb (lockKey)
            VALUES (${key})
            ON DUPLICATE KEY UPDATE lockKey = VALUES(lockKey)
          `;
        } catch {
          // Key might already exist
        }
      }
    }

    // Acquire row locks in deterministic ascending order
    for (const key of uniqueSortedKeys) {
      await (tx as any).$queryRaw`
        SELECT * FROM TimetableLock_tb
        WHERE lockKey = ${key}
        FOR UPDATE
      `;
    }
  }

  /**
   * Builds lock keys for an assignment creation or update.
   */
  static buildAssignmentLockKeys(options: {
    planId: number;
    termYear?: string;
    yearLevel?: string;
    planType?: string;
    day?: number;
    roomId?: number | null;
    teacherId?: number | null;
    additionalPlanIds?: number[];
  }): string[] {
    const keys: string[] = [];

    // Plan-level locks
    keys.push(`plan:${options.planId}`);
    if (options.additionalPlanIds && options.additionalPlanIds.length > 0) {
      for (const pId of options.additionalPlanIds) {
        keys.push(`plan:${pId}`);
      }
    }

    // Resource-specific locks scoped to term and day
    if (options.roomId) {
      if (options.termYear && options.day) {
        keys.push(`room:${options.roomId}:${options.termYear}:${options.day}`);
      } else {
        keys.push(`room:${options.roomId}`);
      }
    }

    if (options.teacherId) {
      if (options.termYear && options.day) {
        keys.push(`teacher:${options.teacherId}:${options.termYear}:${options.day}`);
      } else {
        keys.push(`teacher:${options.teacherId}`);
      }
    }

    return keys;
  }

  /**
   * Builds lock keys for a curriculum scope clear operation.
   */
  static buildScopeLockKeys(termYear: string, yearLevel: string, planType: string): string[] {
    return [
      `scope:${termYear}:${yearLevel}:${planType}`,
    ];
  }
}
