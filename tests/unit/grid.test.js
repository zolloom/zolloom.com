import { describe, expect, it } from 'vitest';
import {
  cellAt,
  cellKey,
  cellProgress,
  clamp01,
  decay,
  easeInOutCubic,
  easeOutCubic,
  gridOffset,
  wipeDelays,
} from '../../src/assets/js/lib/grid.js';

describe('grid helpers', () => {
  it('clamps to 0..1', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(3)).toBe(1);
  });

  it('eases from 0 to 1 and stays monotonic', () => {
    for (const ease of [easeOutCubic, easeInOutCubic]) {
      expect(ease(0)).toBe(0);
      expect(ease(1)).toBe(1);
      let previous = 0;
      for (let t = 0; t <= 1; t += 0.05) {
        expect(ease(t)).toBeGreaterThanOrEqual(previous);
        previous = ease(t);
      }
    }
  });

  it('centres the grid by splitting the remainder', () => {
    expect(gridOffset(1000, 56)).toBe(24);
    expect(gridOffset(560, 56)).toBe(0);
  });

  it('maps points to cells, including negative space and offsets', () => {
    expect(cellAt(0, 0, 50)).toEqual({ col: 0, row: 0 });
    expect(cellAt(149, 51, 50)).toEqual({ col: 2, row: 1 });
    expect(cellAt(10, 10, 50, 20, 20)).toEqual({ col: -1, row: -1 });
  });

  it('builds stable keys', () => {
    expect(cellKey(3, -1)).toBe('3:-1');
  });

  it('decays life linearly and never below zero', () => {
    expect(decay(1, 500, 1000)).toBe(0.5);
    expect(decay(0.2, 1000, 1000)).toBe(0);
  });

  it('computes per-cell progress inside its window', () => {
    expect(cellProgress(0.1, 0.2, 0.5)).toBe(0);
    expect(cellProgress(0.45, 0.2, 0.5)).toBeCloseTo(0.5);
    expect(cellProgress(1, 0.2, 0.5)).toBe(1);
  });
});

describe('wipeDelays', () => {
  const noJitter = { jitter: 0, random: () => 0 };

  it('starts at the origin and reaches the spread at the farthest corner', () => {
    const delays = wipeDelays(10, 6, 0, 0, { spread: 0.5, ...noJitter });
    expect(delays).toHaveLength(60);
    expect(delays[0]).toBe(0);
    expect(delays[59]).toBeCloseTo(0.5);
  });

  it('grows with distance from the origin', () => {
    const delays = wipeDelays(9, 9, 4, 4, noJitter);
    const at = (col, row) => delays[row * 9 + col];
    expect(at(4, 4)).toBe(0);
    expect(at(5, 4)).toBeLessThan(at(6, 4));
    expect(at(6, 4)).toBeLessThan(at(8, 8));
  });

  it('never exceeds the spread, even with jitter', () => {
    const delays = wipeDelays(20, 20, 3, 17, { spread: 0.55, jitter: 0.1, random: () => 0.999 });
    for (const d of delays) expect(d).toBeLessThanOrEqual(0.55);
  });

  it('handles a single-cell grid', () => {
    expect(Array.from(wipeDelays(1, 1, 0, 0, noJitter))).toEqual([0]);
  });
});
