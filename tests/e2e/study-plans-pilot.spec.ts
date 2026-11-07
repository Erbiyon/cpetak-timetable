import { test, expect } from "@playwright/test";

test.describe("Study Plans Browser Characterization & Pilot Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as Admin
    await page.goto("/login");
    await page.click('button:has-text("ผู้ดูแล")');
    await page.fill('input[id="adminId"], input[placeholder*="รหัสผู้ดูแล"]', "admin");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]:has-text("เข้าสู่ระบบ")');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("1. Renders Four-Year Plan page with title, year selector, and curriculum tables", async ({ page }) => {
    await page.goto("/study-plans/four-year-plan");
    await expect(page).toHaveURL(/.*study-plans\/four-year-plan/);

    // Verify main headings using specific role or class to avoid strict mode collision with navbar h1
    const heading = page.getByRole("heading", { name: "แผนการเรียนสำหรับนักศึกษาที่เข้ารับการศึกษาในปีการศึกษา" });
    await expect(heading).toBeVisible();

    const subHeading = page.locator("h3:has-text('4 ปี')");
    await expect(subHeading).toBeVisible();

    // Verify year selector exists
    const yearSelectTrigger = page.locator('button[role="combobox"]');
    await expect(yearSelectTrigger).toBeVisible();

    // Verify cards for term/year combinations are rendered
    const planCards = page.locator(".bg-card");
    await expect(planCards.first()).toBeVisible();
  });

  test("2. Navigates smoothly between study plans (Four-Year -> Transfer -> DVE)", async ({ page }) => {
    await page.goto("/study-plans/four-year-plan");
    await expect(page.locator("h3")).toContainText("4 ปี");

    await page.goto("/study-plans/transfer-plan");
    await expect(page.locator("h3")).toContainText("เทียบโอน");

    await page.goto("/study-plans/dve-lvc-plan");
    await expect(page.locator("h3")).toContainText("ปวส. (ปวช.)");

    await page.goto("/study-plans/dve-msix-plan");
    await expect(page.locator("h3")).toContainText("ปวส. (ม.6)");
  });
});

