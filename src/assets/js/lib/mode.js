// View modes: the page has two faces, "designer" (default) and "coder".

export const MODES = Object.freeze(['designer', 'coder']);
export const DEFAULT_MODE = 'designer';

// Titles kept from the original site.
export const TITLES = Object.freeze({
  designer: 'UI/UX designer • Zoltan Elek',
  coder: '<coder> Zoltan Elek',
});

// Must match --blue / --night in main.css (used for theme-color and the wipe).
export const THEME_COLORS = Object.freeze({
  designer: '#00a8ec',
  coder: '#042235',
});

export function isMode(value) {
  return MODES.includes(value);
}

export function modeFromHash(hash) {
  const value = String(hash ?? '').replace(/^#/, '').toLowerCase();
  return isMode(value) ? value : DEFAULT_MODE;
}

export function hashForMode(mode) {
  return mode === DEFAULT_MODE ? '' : `#${mode}`;
}

export function otherMode(mode) {
  return mode === 'coder' ? 'designer' : 'coder';
}
