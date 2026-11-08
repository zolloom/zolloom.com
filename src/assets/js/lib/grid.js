// Pure helpers for the background grid and the square-wipe transition.

export function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

export function easeOutCubic(t) {
  return 1 - (1 - clamp01(t)) ** 3;
}

export function easeInOutCubic(t) {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2;
}

// Centres the grid so the leftover space is split evenly on both edges.
export function gridOffset(length, size) {
  return (length % size) / 2;
}

export function cellAt(x, y, size, offsetX = 0, offsetY = 0) {
  return {
    col: Math.floor((x - offsetX) / size),
    row: Math.floor((y - offsetY) / size),
  };
}

export function cellKey(col, row) {
  return `${col}:${row}`;
}

export function decay(life, elapsed, lifetime) {
  return Math.max(0, life - elapsed / lifetime);
}

// Start time (0..spread) for every cell of a cols×rows grid, growing with the
// distance from the origin cell, plus a little jitter so the edge feels organic.
export function wipeDelays(cols, rows, originCol, originRow, options = {}) {
  const { spread = 0.55, jitter = 0.1, random = Math.random } = options;
  const maxDistance =
    Math.hypot(
      Math.max(originCol, cols - 1 - originCol),
      Math.max(originRow, rows - 1 - originRow),
    ) || 1;
  const delays = new Float32Array(cols * rows);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const distance = Math.hypot(col - originCol, row - originRow) / maxDistance;
      delays[row * cols + col] = Math.min(spread, distance * (spread - jitter) + random() * jitter);
    }
  }
  return delays;
}

export function cellProgress(t, delay, span) {
  return clamp01((t - delay) / span);
}
