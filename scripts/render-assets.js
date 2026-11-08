// Renders the PNG icons and the Open Graph image with headless Chromium.
// Run after changing favicon.svg or the hero: `npm run assets`.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const src = fileURLToPath(new URL('../src/', import.meta.url));
const svg = readFileSync(`${src}favicon.svg`, 'utf8');
const port = 4199;

const server = spawn(process.execPath, ['scripts/serve.js'], {
  env: { ...process.env, PORT: String(port) },
  stdio: 'ignore',
});

try {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const browser = await chromium.launch();

  for (const [name, size] of [
    ['favicon-32x32.png', 32],
    ['apple-touch-icon.png', 180],
    ['icon-192.png', 192],
    ['icon-512.png', 512],
  ]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    );
    await page.screenshot({ path: `${src}${name}` });
    await page.close();
    console.log(`rendered ${name}`);
  }

  const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await og.emulateMedia({ reducedMotion: 'reduce' });
  await og.goto(`http://127.0.0.1:${port}/?og`);
  await og.addStyleTag({
    content:
      '.foot,.contact,.skip{display:none!important}.page{min-height:630px}:root{--sq:300px;--cell:56px}.title{font-size:4.25rem}',
  });
  await og.waitForTimeout(400);
  await og.screenshot({ path: `${src}assets/img/og.png` });
  console.log('rendered assets/img/og.png');

  await browser.close();
} finally {
  server.kill();
}
