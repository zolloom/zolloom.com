// The hero square: 48 cells forming the hollow square. Designer mode shows solid
// cells (click for a ripple), coder mode turns them into bits (click to reshuffle).
import { cellDistance, nearestCell, squareCells } from './lib/square.js';
import { scrambleElement } from './lib/scramble.js';

const SIZE = 8;
const TILT = 12; // max degrees

export function createSquare(root, { motion, tilt }) {
  const grid = root.querySelector('[data-square-grid]');
  const sizeLabels = root.querySelectorAll('[data-square-size]');

  const cells = squareCells(SIZE, 2).map((cell) => {
    const el = document.createElement('span');
    el.className = 'cell';
    el.dataset.bit = cell.bit;
    el.style.gridArea = `${cell.row + 1} / ${cell.col + 1}`;
    el.style.setProperty('--d', `${(cell.row + cell.col) * 26}ms`);
    const fill = document.createElement('i');
    fill.className = 'cell__fill';
    const bit = document.createElement('b');
    bit.className = 'cell__bit';
    bit.textContent = cell.bit;
    el.append(fill, bit);
    return { ...cell, el, fill, bit };
  });
  grid.replaceChildren(...cells.map((cell) => cell.el));
  grid.classList.add('has-cells');

  new ResizeObserver(([entry]) => {
    const side = Math.round(entry.contentRect.width);
    for (const label of sizeLabels) label.textContent = `${side} × ${side}`;
  }).observe(grid);

  function scrambleBits() {
    for (const cell of cells) {
      scrambleElement(cell.bit, { duration: 240 + (cell.row + cell.col) * 50, glyphs: '01' });
    }
  }

  function ripple(origin) {
    for (const cell of cells) {
      cell.fill.animate(
        [
          { transform: 'scale(1) rotate(0deg)' },
          { transform: 'scale(0.3) rotate(90deg)', offset: 0.45 },
          { transform: 'scale(1) rotate(180deg)' },
        ],
        { duration: 900, delay: cellDistance(cell, origin) * 55, easing: 'cubic-bezier(.65,0,.35,1)' },
      );
    }
  }

  root.addEventListener('pointermove', (event) => {
    if (!motion() || !tilt()) return;
    const rect = root.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    grid.style.setProperty('--tilt-x', `${(-y * TILT).toFixed(2)}deg`);
    grid.style.setProperty('--tilt-y', `${(x * TILT).toFixed(2)}deg`);
  });
  root.addEventListener('pointerleave', () => {
    grid.style.removeProperty('--tilt-x');
    grid.style.removeProperty('--tilt-y');
  });

  grid.addEventListener('click', (event) => {
    if (!motion()) return;
    if (document.documentElement.dataset.mode === 'coder') {
      scrambleBits();
      return;
    }
    const rect = grid.getBoundingClientRect();
    const col = Math.floor(((event.clientX - rect.left) / rect.width) * SIZE);
    const row = Math.floor(((event.clientY - rect.top) / rect.height) * SIZE);
    ripple(nearestCell(cells, row, col));
  });

  return {
    setMode(mode) {
      if (mode === 'coder' && motion()) scrambleBits();
    },
  };
}
