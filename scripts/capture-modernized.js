const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
  const dir = path.join(process.cwd(), 'test-results', 'modernized');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Capturing Modernized Login page...');
  await page.goto('http://localhost:3000/login');
  await page.screenshot({ path: path.join(dir, 'login.png') });

  console.log('Logging in as Admin...');
  await page.click('button:has-text("ผู้ดูแล")');
  await page.fill('input[id="adminId"], input[placeholder*="รหัสผู้ดูแล"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]:has-text("เข้าสู่ระบบ")');
  await page.waitForURL('**/dashboard');
  await page.screenshot({ path: path.join(dir, 'dashboard.png') });

  console.log('Capturing Modernized Four-Year Timetable...');
  await page.goto('http://localhost:3000/adjust-time-tables/adjust-plan-four-year/four-one-year');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(dir, 'timetable-four-year.png') });

  console.log('Capturing Modernized Transfer Timetable...');
  await page.goto('http://localhost:3000/adjust-time-tables/adjust-plan-transfer/transfer-one-year');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(dir, 'timetable-transfer.png') });

  console.log('Capturing Modernized Teachers...');
  await page.goto('http://localhost:3000/teachers');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(dir, 'teachers.png') });

  console.log('Capturing Modernized Rooms...');
  await page.goto('http://localhost:3000/rooms');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(dir, 'rooms.png') });

  // Mobile Viewport Capture
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/dashboard');
  await page.screenshot({ path: path.join(dir, 'dashboard-mobile.png') });

  await browser.close();
  console.log('All modernized screenshots captured successfully.');
})();
