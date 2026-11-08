import { describe, expect, it } from 'vitest';
import { cellDistance, nearestCell, squareCells } from '../../src/assets/js/lib/square.js';

describe('squareCells', () => {
  it('builds the 8×8 ring with the original 1:4 border proportion', () => {
    const cells = squareCells(8, 2);
    expect(cells).toHaveLength(64 - 16);
    const hollow = cells.filter((c) => c.row >= 2 && c.row <= 5 && c.col >= 2 && c.col <= 5);
    expect(hollow).toHaveLength(0);
  });

  it('indexes cells sequentially and alternates bits like a checkerboard', () => {
    const cells = squareCells();
    cells.forEach((cell, i) => expect(cell.index).toBe(i));
    expect(cells[0]).toMatchObject({ row: 0, col: 0, bit: '1' });
    expect(cells[1]).toMatchObject({ row: 0, col: 1, bit: '0' });
  });

  it('gives a solid square when the ring fills it', () => {
    expect(squareCells(4, 2)).toHaveLength(16);
  });

  it.each([
    [0, 1],
    [8, 0],
    [8, 5],
    [8.5, 2],
  ])('rejects invalid geometry (size %s, thickness %s)', (size, thickness) => {
    expect(() => squareCells(size, thickness)).toThrow(RangeError);
  });
});

describe('cell helpers', () => {
  it('measures euclidean distance', () => {
    expect(cellDistance({ row: 0, col: 0 }, { row: 3, col: 4 })).toBe(5);
  });

  it('snaps a point in the hollow centre to the closest ring cell', () => {
    const cells = squareCells();
    const nearest = nearestCell(cells, 3, 2);
    expect(nearest).toMatchObject({ row: 3, col: 1 });
  });

  it('returns null for an empty list', () => {
    expect(nearestCell([], 0, 0)).toBeNull();
  });
});
