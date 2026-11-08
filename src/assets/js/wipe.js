// Full-screen square wipe used when switching modes: squares in the new
// background colour grow out from the click point, the mode flips while the
// screen is covered, then the squares shrink away to reveal the new face.
import { cellProgress, easeInOutCubic, wipeDelays } from './lib/grid.js';

const SPREAD = 0.55;

export function createWipe(canvas, { geometry }) {
  const ctx = canvas.getContext('2d');

  function frame(cells, delays, t, grow, color, geo) {
    const { size } = geo;
    ctx.clearRect(0, 0, geo.width, geo.height);
    ctx.fillStyle = color;
    for (let i = 0; i < cells.length; i += 1) {
      const p = easeInOutCubic(cellProgress(t, delays[i], 1 - SPREAD));
      const scale = grow ? p : 1 - p;
      if (scale <= 0) continue;
      const s = (size + 1) * scale;
      const cell = cells[i];
      ctx.fillRect(cell.x + (size - s) / 2, cell.y + (size - s) / 2, s, s);
    }
  }

  function phase(cells, delays, duration, grow, color, geo) {
    return new Promise((resolve) => {
      const start = performance.now();
      const step = (time) => {
        const t = Math.min(1, (time - start) / duration);
        frame(cells, delays, t, grow, color, geo);
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  return {
    async run({ x, y, color, onCovered, duration = 460 }) {
      const geo = geometry();
      const { size, offsetX, offsetY, width, height } = geo;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // One extra ring of cells so partial cells at the edges are covered too.
      const startX = offsetX - size;
      const startY = offsetY - size;
      const cols = Math.ceil((width - startX) / size);
      const rows = Math.ceil((height - startY) / size);
      const cells = [];
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          cells.push({ x: startX + col * size, y: startY + row * size });
        }
      }
      const originCol = Math.floor((x - startX) / size);
      const originRow = Math.floor((y - startY) / size);
      const delays = wipeDelays(cols, rows, originCol, originRow, { spread: SPREAD });

      canvas.hidden = false;
      await phase(cells, delays, duration, true, color, geo);
      onCovered();
      await phase(cells, delays, duration, false, color, geo);
      ctx.clearRect(0, 0, width, height);
      canvas.hidden = true;
    },
  };
}
