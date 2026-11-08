import { createBackdrop } from './backdrop.js';
import { createWipe } from './wipe.js';
import { createSquare } from './square-view.js';
import { assembleEmail } from './lib/email.js';
import { scrambleElement } from './lib/scramble.js';
import { THEME_COLORS, TITLES, hashForMode, modeFromHash, otherMode } from './lib/mode.js';

const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const motion = () => !reducedMotion.matches;

const cssVar = (name) => getComputedStyle(root).getPropertyValue(name).trim();

/* ---------- e-mail ---------- */

const EMAIL = assembleEmail('hello', 'zolloom.com');

for (const link of document.querySelectorAll('[data-email]')) link.href = `mailto:${EMAIL}`;
for (const el of document.querySelectorAll('[data-email-text]')) {
  el.textContent = el.dataset.emailText === 'quoted' ? `"${EMAIL}"` : EMAIL;
}

const copyStatus = document.querySelector('[data-copy-status]');

async function copyEmail(button) {
  let copied = true;
  try {
    await navigator.clipboard.writeText(EMAIL);
  } catch {
    copied = false;
  }
  const label = button.querySelector('[data-copy-label]') ?? button;
  label.dataset.idle ??= label.textContent;
  label.textContent = copied ? button.dataset.copied : button.dataset.failed;
  copyStatus.textContent = copied ? 'E-mail address copied to clipboard.' : `Copy failed. The address is ${EMAIL}.`;
  window.clearTimeout(Number(button.dataset.timer));
  button.dataset.timer = String(
    window.setTimeout(() => {
      label.textContent = label.dataset.idle;
      copyStatus.textContent = '';
    }, 1800),
  );
}

for (const button of document.querySelectorAll('[data-copy-email]')) {
  button.addEventListener('click', () => copyEmail(button));
}

/* ---------- visuals ---------- */

const backdrop = createBackdrop(document.querySelector('[data-backdrop]'), {
  getCellSize: () => Number.parseFloat(cssVar('--cell')) || 56,
  getColors: () => ({
    line: cssVar('--grid-line'),
    lit: cssVar('--grid-lit'),
    glyph: cssVar('--grid-glyph') === 'transparent' ? '' : cssVar('--grid-glyph'),
    mono: cssVar('--font-mono'),
  }),
  motion,
});

const wipe = createWipe(document.querySelector('[data-wipe]'), { geometry: backdrop.geometry });
const square = createSquare(document.querySelector('[data-square]'), {
  motion,
  tilt: () => finePointer.matches,
});

/* ---------- mode ---------- */

const modeButtons = document.querySelectorAll('[data-mode-set]');
const themeColor = document.querySelector('meta[name="theme-color"]');
let mode = modeFromHash(window.location.hash);
let switching = false;

function applyMode(next) {
  mode = next;
  root.dataset.mode = next;
  for (const button of modeButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.modeSet === next));
  }
  document.title = TITLES[next];
  themeColor.content = THEME_COLORS[next];
  const url = `${window.location.pathname}${window.location.search}${hashForMode(next)}`;
  window.history.replaceState(null, '', url);
  backdrop.refresh();
  square.setMode(next);
}

function scrambleVisible() {
  if (!motion() || mode !== 'coder') return;
  for (const el of document.querySelectorAll('[data-show="coder"] [data-scramble], [data-show="coder"][data-scramble]')) {
    scrambleElement(el, { duration: 650 });
  }
}

async function setMode(next, origin) {
  if (next === mode || switching) return;
  if (!motion()) {
    applyMode(next);
    return;
  }
  switching = true;
  try {
    await wipe.run({ ...origin, color: THEME_COLORS[next], onCovered: () => applyMode(next) });
  } finally {
    switching = false;
  }
  scrambleVisible();
}

function centerOf(el) {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

for (const button of modeButtons) {
  button.addEventListener('click', (event) => {
    const origin = event.detail > 0 ? { x: event.clientX, y: event.clientY } : centerOf(button);
    setMode(button.dataset.modeSet, origin);
  });
}

// "/" toggles the mode, a nod to the "designer / <coder>" separator.
window.addEventListener('keydown', (event) => {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target instanceof HTMLElement && event.target.isContentEditable) return;
  event.preventDefault();
  const target = document.querySelector(`[data-mode-set="${otherMode(mode)}"]`);
  setMode(otherMode(mode), centerOf(target));
});

window.addEventListener('hashchange', () => {
  const next = modeFromHash(window.location.hash);
  setMode(next, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
});

/* ---------- pointer readout ---------- */

const readX = document.querySelector('[data-x]');
const readY = document.querySelector('[data-y]');
let pointer = null;
window.addEventListener(
  'pointermove',
  (event) => {
    if (event.pointerType === 'touch') return;
    const first = pointer === null;
    pointer = { x: event.clientX, y: event.clientY };
    if (!first) return;
    requestAnimationFrame(() => {
      readX.textContent = String(Math.round(pointer.x)).padStart(4, '0');
      readY.textContent = String(Math.round(pointer.y)).padStart(4, '0');
      pointer = null;
    });
  },
  { passive: true },
);

/* ---------- boot ---------- */

for (const el of document.querySelectorAll('[data-year]')) el.textContent = String(new Date().getFullYear());

applyMode(mode);

const fontsReady = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]);
fontsReady.then(() => {
  backdrop.refresh();
  root.classList.add('is-ready');
  scrambleVisible();
});
