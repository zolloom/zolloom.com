import { describe, expect, it } from 'vitest';
import { DEFAULT_MODE, MODES, THEME_COLORS, TITLES, hashForMode, isMode, modeFromHash, otherMode } from '../../src/assets/js/lib/mode.js';

describe('mode', () => {
  it('reads the mode from the URL hash, case-insensitively', () => {
    expect(modeFromHash('#coder')).toBe('coder');
    expect(modeFromHash('#CODER')).toBe('coder');
    expect(modeFromHash('#designer')).toBe('designer');
  });

  it('falls back to the default mode for empty or unknown hashes', () => {
    for (const hash of ['', '#', '#contact', undefined, null]) {
      expect(modeFromHash(hash)).toBe(DEFAULT_MODE);
    }
  });

  it('keeps the default mode out of the URL', () => {
    expect(hashForMode('designer')).toBe('');
    expect(hashForMode('coder')).toBe('#coder');
  });

  it('round-trips every mode through the hash', () => {
    for (const mode of MODES) expect(modeFromHash(hashForMode(mode))).toBe(mode);
  });

  it('toggles between the two modes', () => {
    expect(otherMode('designer')).toBe('coder');
    expect(otherMode('coder')).toBe('designer');
  });

  it('validates modes', () => {
    expect(isMode('coder')).toBe(true);
    expect(isMode('admin')).toBe(false);
  });

  it('has a title and a hex theme colour for every mode', () => {
    for (const mode of MODES) {
      expect(TITLES[mode]).toMatch(/Zoltan Elek/);
      expect(THEME_COLORS[mode]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
