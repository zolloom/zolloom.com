// Copies the self-hosted web fonts from @fontsource packages into src/assets/fonts.
// Self-hosting avoids a third-party request (and the GDPR question that comes with Google Fonts).
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'src/assets/fonts');

const files = [
  ['@fontsource-variable/geist', 'geist-latin-wght-normal.woff2'],
  ['@fontsource-variable/geist', 'geist-latin-ext-wght-normal.woff2'],
  ['@fontsource-variable/geist-mono', 'geist-mono-latin-wght-normal.woff2'],
  ['@fontsource-variable/geist-mono', 'geist-mono-latin-ext-wght-normal.woff2'],
  ['@fontsource/instrument-serif', 'instrument-serif-latin-400-italic.woff2'],
  ['@fontsource/instrument-serif', 'instrument-serif-latin-ext-400-italic.woff2'],
];

mkdirSync(out, { recursive: true });
for (const [pkg, file] of files) {
  copyFileSync(join(root, 'node_modules', pkg, 'files', file), join(out, file));
  console.log(`copied ${file}`);
}
