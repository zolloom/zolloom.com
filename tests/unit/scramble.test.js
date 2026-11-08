// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { GLYPHS, scrambleElement, scrambleFrame } from '../../src/assets/js/lib/scramble.js';

const fixed = () => 0; // always picks GLYPHS[0]

describe('scrambleFrame', () => {
  it('shows only glyphs at the start and the text at the end', () => {
    expect(scrambleFrame('abc', 0, fixed)).toBe(GLYPHS[0].repeat(3));
    expect(scrambleFrame('abc', 1, fixed)).toBe('abc');
  });

  it('reveals characters left to right', () => {
    expect(scrambleFrame('abcd', 0.5, fixed)).toBe(`ab${GLYPHS[0]}${GLYPHS[0]}`);
  });

  it('keeps whitespace in place', () => {
    expect(scrambleFrame('a b\nc', 0, fixed, 'x')).toBe('x x\nx');
  });

  it('clamps progress outside 0..1', () => {
    expect(scrambleFrame('ab', -2, fixed, 'x')).toBe('xx');
    expect(scrambleFrame('ab', 7, fixed, 'x')).toBe('ab');
  });

  it('uses only the provided glyph set', () => {
    const out = scrambleFrame('hello world', 0, Math.random, '01');
    expect(out.replace(/\s/g, '')).toMatch(/^[01]+$/);
  });
});

describe('scrambleElement', () => {
  function manualClock() {
    let time = 0;
    const queue = [];
    return {
      now: () => time,
      raf: (cb) => queue.push(cb),
      advance(ms) {
        time += ms;
        const callbacks = queue.splice(0);
        for (const cb of callbacks) cb();
      },
    };
  }

  it('scrambles nested text nodes and restores the original text', async () => {
    document.body.innerHTML = '<h1 id="t">Writing <em>clean</em> code</h1>';
    const el = document.getElementById('t');
    const clock = manualClock();
    const done = scrambleElement(el, { duration: 100, glyphs: 'x', random: fixed, ...clock });

    expect(el.textContent).toBe('xxxxxxx xxxxx xxxx');
    expect(el.querySelector('em')).not.toBeNull();

    clock.advance(50);
    expect(el.textContent).not.toBe('Writing clean code');

    clock.advance(60);
    await done;
    expect(el.innerHTML).toBe('Writing <em>clean</em> code');
  });

  it('restarting mid-animation never captures scrambled text', async () => {
    document.body.innerHTML = '<p id="p">hello</p>';
    const el = document.getElementById('p');
    const clock = manualClock();
    const first = scrambleElement(el, { duration: 100, glyphs: 'x', random: fixed, ...clock });
    clock.advance(10);
    const second = scrambleElement(el, { duration: 100, glyphs: 'x', random: fixed, ...clock });
    await first;
    clock.advance(200);
    await second;
    expect(el.textContent).toBe('hello');
  });
});
