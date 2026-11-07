import { test, expect } from "@playwright/test";

test.describe("Timetable Navigation & Access Control Smoke Tests", () => {
  test("unauthenticated user accessing /adjust-time-tables route is redirected to /login", async ({ page }) => {
    await page.goto("/adjust-time-tables/adjust-plan-four-year/four-one-year");
    await expect(page).toHaveURL(/.*login.*/);
    await expect(page.getByRole("button", { name: "เข้าสู่ระบบ" })).toBeVisible();
  });

  test("public home page loads correctly and displays title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("ระบบจัดตารางเรียน");
  });
});
