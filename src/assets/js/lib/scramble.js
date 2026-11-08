// Letter-shuffle effect, a modern take on the jQuery "shuffleLetters" plugin
// the original site used. Characters resolve left to right; whitespace stays put
// so line breaks don't jump.

export const GLYPHS = '01<>/{}[]=+*#$%&_';

export function scrambleFrame(text, progress, random = Math.random, glyphs = GLYPHS) {
  const revealed = Math.floor(text.length * Math.min(1, Math.max(0, progress)));
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    out += i < revealed || /\s/.test(ch) ? ch : glyphs[Math.floor(random() * glyphs.length)];
  }
  return out;
}

const originals = new WeakMap();
const cancels = new WeakMap();

function textNodes(el) {
  const walker = el.ownerDocument.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */);
  const nodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!originals.has(node)) originals.set(node, node.nodeValue);
    nodes.push(node);
  }
  return nodes;
}

export function scrambleElement(el, options = {}) {
  const {
    duration = 700,
    glyphs = GLYPHS,
    random = Math.random,
    raf = (cb) => requestAnimationFrame(cb),
    now = () => performance.now(),
  } = options;

  cancels.get(el)?.();
  const nodes = textNodes(el);

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      cancels.delete(el);
      for (const node of nodes) node.nodeValue = originals.get(node);
      resolve();
    };
    cancels.set(el, finish);

    const start = now();
    const frame = () => {
      if (done) return;
      const progress = (now() - start) / duration;
      if (progress >= 1) {
        finish();
        return;
      }
      for (const node of nodes) {
        node.nodeValue = scrambleFrame(originals.get(node), progress, random, glyphs);
      }
      raf(frame);
    };
    frame();
  });
}
