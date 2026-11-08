// Fixed background canvas: a hairline grid whose cells light up under the
// pointer and fade out. In coder mode lit cells show a 0/1 glyph instead.
import { cellAt, cellKey, decay, gridOffset } from './lib/grid.js';

const LIFETIME = 1100; // ms for a lit cell to fade out
const AMBIENT_EVERY = 1400; // ms between ambient pulses

export function createBackdrop(canvas, { getCellSize, getColors, motion }) {
  const ctx = canvas.getContext('2d');
  const lit = new Map();
  let width = 0;
  let height = 0;
  let size = getCellSize();
  let offsetX = 0;
  let offsetY = 0;
  let colors = getColors();
  let raf = 0;
  let last = 0;

  function draw() {
    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    for (let x = offsetX; x <= width; x += size) {
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, height);
    }
    for (let y = offsetY; y <= height; y += size) {
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(width, Math.round(y) + 0.5);
    }
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1;
    ctx.stroke();

    if (!lit.size) return;
    ctx.font = `500 ${Math.round(size * 0.34)}px ${colors.mono}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const cell of lit.values()) {
      const x = Math.round(offsetX + cell.col * size) + 1;
      const y = Math.round(offsetY + cell.row * size) + 1;
      ctx.globalAlpha = cell.life;
      ctx.fillStyle = colors.lit;
      ctx.fillRect(x, y, size - 1, size - 1);
      if (colors.glyph) {
        ctx.fillStyle = colors.glyph;
        ctx.fillText(cell.glyph, x + size / 2, y + size / 2 + 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  function tick(time) {
    const elapsed = time - last;
    last = time;
    for (const [key, cell] of lit) {
      cell.life = decay(cell.life, elapsed, LIFETIME);
      if (cell.life === 0) lit.delete(key);
    }
    draw();
    raf = lit.size ? requestAnimationFrame(tick) : 0;
  }

  function wake() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function light(col, row, life) {
    const key = cellKey(col, row);
    const cell = lit.get(key);
    if (cell) {
      cell.life = Math.max(cell.life, life);
    } else {
      lit.set(key, { col, row, life, glyph: Math.random() < 0.5 ? '0' : '1' });
    }
    wake();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    size = getCellSize();
    offsetX = gridOffset(width, size);
    offsetY = gridOffset(height, size);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  window.addEventListener(
    'pointermove',
    (event) => {
      if (!motion() || event.pointerType === 'touch') return;
      const { col, row } = cellAt(event.clientX, event.clientY, size, offsetX, offsetY);
      light(col, row, 1);
    },
    { passive: true },
  );

  window.setInterval(() => {
    if (document.hidden || !motion() || !width) return;
    const cols = Math.ceil((width - offsetX) / size);
    const rows = Math.ceil((height - offsetY) / size);
    light(Math.floor(Math.random() * cols), Math.floor(Math.random() * rows), 0.6);
  }, AMBIENT_EVERY);

  new ResizeObserver(resize).observe(canvas);
  resize();

  return {
    refresh() {
      colors = getColors();
      draw();
    },
    geometry() {
      return { size, offsetX, offsetY, width, height };
    },
  };
}
