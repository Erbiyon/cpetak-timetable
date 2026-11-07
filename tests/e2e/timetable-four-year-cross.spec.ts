import { test, expect } from "@playwright/test";

test.describe("Four-Year Timetable Cross-Page Regression Tests", () => {
  const FOUR_YEAR_ROUTES = [
    {
      year: "ปี 1",
      path: "/adjust-time-tables/adjust-plan-four-year/four-one-year",
      header: "ตารางเรียน 4 ปี ปี 1",
    },
    {
      year: "ปี 2",
      path: "/adjust-time-tables/adjust-plan-four-year/four-two-year",
      header: "ตารางเรียน 4 ปี ปี 2",
    },
    {
      year: "ปี 3",
      path: "/adjust-time-tables/adjust-plan-four-year/four-three-year",
      header: "ตารางเรียน 4 ปี ปี 3",
    },
    {
      year: "ปี 4",
      path: "/adjust-time-tables/adjust-plan-four-year/four-four-year",
      header: "ตารางเรียน 4 ปี ปี 4",
    },
  ];

  test.beforeEach(async ({ page }) => {
    // Authenticate as Admin
    await page.goto("/login");
    await page.getByRole("tab", { name: "ผู้ดูแลระบบ" }).click();
    await page.locator("#admin-id").fill("admin");
    await page.locator("#admin-password").fill("admin123");
    await page
      .getByRole("tabpanel", { name: "ผู้ดูแลระบบ" })
      .getByRole("button", { name: "เข้าสู่ระบบ" })
      .click();
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });
  });

  for (const route of FOUR_YEAR_ROUTES) {
    test(`renders ${route.year} page correctly with shared components and navigation`, async ({
      page,
    }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(route.path));

      // Verify page header after data loading finishes
      await expect(
        page.getByText(new RegExp(route.header))
      ).toBeVisible({ timeout: 20000 });

      // Verify action buttons
      await expect(
        page.getByRole("button", { name: /จัดตารางทั้งหลักสูตร/ })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /ล้างทั้งหลักสูตร/ })
      ).toBeVisible();

      // Verify timetable grid (days)
      await expect(page.getByRole("cell", { name: "จ.", exact: true })).toBeVisible();
      await expect(page.getByRole("cell", { name: "อ.", exact: true })).toBeVisible();
      await expect(page.getByRole("cell", { name: "พ.", exact: true })).toBeVisible();
      await expect(page.getByRole("cell", { name: "พฤ.", exact: true })).toBeVisible();
      await expect(page.getByRole("cell", { name: "ศ.", exact: true })).toBeVisible();

      // Verify plan status container
      await expect(
        page.getByText(new RegExp(`แผนการเรียน.*${route.year}`))
      ).toBeVisible();
    });
  }
});

