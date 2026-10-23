// Renders presentation/index.html to assets/presslane-presentation.pdf with Chrome, one A4 portrait page per slide.
// Needs playwright-core resolvable from the current directory:  npm install --no-save playwright-core
// Usage:  node tools/render-presentation.mjs [previews-folder]
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(path.join(process.cwd(), 'package.json'));
const { chromium } = require('playwright-core');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const deck = pathToFileURL(path.join(root, 'presentation', 'index.html')).href;
const out = path.join(root, 'assets', 'presslane-presentation.pdf');
const previews = process.argv[2];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
await page.goto(deck, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
console.log('wrote', out);
if (previews) {
  const slides = await page.$$('.page');
  for (let i = 0; i < slides.length; i++) await slides[i].screenshot({ path: path.join(previews, `slide-${String(i + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 70 });
  console.log('previews:', slides.length);
}
await browser.close();
