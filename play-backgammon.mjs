import { chromium } from '@playwright/test';
import { writeFileSync } from 'fs';

const BASE = 'http://localhost:5180';
const delay = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader'], // программный GL для надёжного WebGL
});
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

const shot = async (name) => {
  const buf = await page.screenshot();
  writeFileSync(`/tmp/bg-${name}.png`, buf);
  console.log(`📸 /tmp/bg-${name}.png`);
};

// 1. Открываем нарды
await page.goto(BASE);
await delay(800);
await page.locator('nav a, aside a').filter({ hasText: /backgammon|нарды/i }).first().click();
await delay(4000); // ждём полную загрузку 3D
await shot('01-board');

// 2. Roll dice
await page.locator('button').filter({ hasText: /roll dice|бросить/i }).first().click();
await delay(2000); // стакан рендерится
await shot('02-cup');

// 3. Кликаем по стакану через JavaScript — прямое событие на canvas
// (3D raycast через pointer events в headless WebGL)
const canvas = page.locator('canvas').first();
const box = await canvas.boundingBox();
console.log('Canvas box:', JSON.stringify(box));

if (box) {
  // Стакан при camera(0,22,18) + cup(0,5.2,0):
  // world X=0 → экранный центр (fraction 0.5 от canvas width)
  // world Y=5.2 над доской → верхняя треть (fraction ~0.30)
  const attempts = [
    [0.50, 0.30],
    [0.50, 0.33],
    [0.48, 0.31],
    [0.50, 0.28],
  ];

  let clicked = false;
  for (const [fx, fy] of attempts) {
    const cx = box.x + box.width  * fx;
    const cy = box.y + box.height * fy;
    console.log(`🎲 Попытка клика: (${Math.round(cx)}, ${Math.round(cy)}) [${fx}, ${fy}]`);

    await page.mouse.move(cx, cy);
    await delay(80);
    await page.mouse.down();
    await delay(60);
    await page.mouse.up();
    await delay(600);

    const status = await page.locator('header, [class*="TopBar"]').first().textContent().catch(() => '');
    console.log('  статус:', status.substring(0, 60).trim());

    // Если статус изменился на "Rolling" и анимация пошла — достаточно
    const hint = await page.locator('text=Click to roll').count();
    if (hint === 0) {
      console.log('  ✅ Стакан сработал!');
      clicked = true;
      break;
    }
  }

  if (!clicked) console.log('⚠️  Стакан не кликнулся через pointer events');

  await delay(5000); // ждём физику
  await shot('03-after-roll');
}

// 4. Финальное состояние
await delay(2000);
await shot('04-final');

await browser.close();
console.log('\n✅ Готово!');
