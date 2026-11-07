import { test, expect } from "@playwright/test";

test.describe("Timetable Navigation & Access Control Smoke Tests", () => {
  test("unauthenticated user accessing /adjust-time-tables route is redirected to /login", async ({ page }) => {
    await page.goto("/adjust-time-tables/adjust-plan-four-year/four-one-year");
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("public home page loads correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.*timetable.*/i);
  });
});

