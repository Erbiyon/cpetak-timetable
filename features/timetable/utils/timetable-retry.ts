/**
 * Executes a timetable service mutation with automatic exponential backoff
 * when MySQL encounters a transient deadlock or lock wait timeout.
 */
export async function withTimetableRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 50,
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      const isDeadlock =
        error?.code === "P2034" || // Prisma transaction conflict/deadlock
        error?.message?.includes("deadlock") ||
        error?.message?.includes("Lock wait timeout exceeded") ||
        error?.message?.includes("write conflict");

      if (isDeadlock && attempt <= maxRetries) {
        const jitter = Math.floor(Math.random() * 30);
        const delay = baseDelayMs * Math.pow(2, attempt - 1) + jitter;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
