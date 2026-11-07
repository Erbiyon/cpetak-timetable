import { test, expect } from "@playwright/test";

test.describe("Dashboard Browser Characterization & Optimization Suite", () => {
  test("1. Renders Dashboard for Admin with Welcome banner, Clock, TermYear, and Action Cards", async ({ page }) => {
    // Authenticate as Admin
    await page.goto("/login");
    await page.click('button:has-text("ผู้ดูแล")');
    await page.fill('input[id="adminId"], input[placeholder*="รหัสผู้ดูแล"]', "admin");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]:has-text("เข้าสู่ระบบ")');

    await expect(page).toHaveURL(/.*dashboard/);

    // Verify Welcome header
    const welcomeHeading = page.locator("h1:has-text('ยินดีต้อนรับ')");
    await expect(welcomeHeading).toBeVisible();

    // Verify Clock component is visible and contains Thai date/time formatting (e.g. พฤศจิกายน or เวลา)
    const clockText = page.locator("p:has-text('พฤศจิกายน'), p:has-text('เวลา')").first();
    await expect(clockText).toBeVisible();

    // Verify Quick Actions and Management sections are present
    const planCardTitle = page.locator("div:has-text('แผนการเรียน')").first();
    await expect(planCardTitle).toBeVisible();

    const timetableSection = page.locator("h2:has-text('จัดการตารางเรียน')");
    await expect(timetableSection).toBeVisible();
  });

  test("2. Protects Dashboard from unauthenticated users with redirect to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/.*login/);
  });
});

