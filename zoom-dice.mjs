import { chromium } from '@playwright/test';
import { writeFileSync } from 'fs';

const BASE = 'http://localhost:5180';
const delay = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader'] });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

const shot = async (name) => {
  const buf = await page.screenshot();
  writeFileSync(`/tmp/zd-${name}.png`, buf);
  console.log(`📸 /tmp/zd-${name}.png`);
};

await page.goto(BASE);
await delay(800);
await page.locator('nav a, aside a').filter({ hasText: /backgammon|нарды/i }).first().click();
await delay(4000);

// Zoom in via OrbitControls scroll wheel (zoom in on board center)
const canvas = page.locator('canvas').first();
const box = await canvas.boundingBox();
const cx = box.x + box.width * 0.5;
const cy = box.y + box.height * 0.45;

// Scroll in to zoom closer
await page.mouse.move(cx, cy);
for (let i = 0; i < 8; i++) {
  await page.mouse.wheel(0, -120); // scroll up = zoom in
  await delay(50);
}
await delay(500);
await shot('01-zoomed-before-roll');

// Click the cup
await page.mouse.move(cx, box.y + box.height * 0.3);
await delay(80);
await page.mouse.down();
await delay(60);
await page.mouse.up();
await delay(8000); // longer wait for physics
await shot('02-after-roll');

// Get topbar text to confirm dice values
const topbar = await page.locator('header, [class*="TopBar"], [class*="topbar"]').first().textContent().catch(() => '');
console.log('Топбар:', topbar.trim().substring(0, 80));

await browser.close();
console.log('\n✅ Готово!');
