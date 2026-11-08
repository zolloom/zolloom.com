import { describe, expect, it } from 'vitest';
import { assembleEmail } from '../../src/assets/js/lib/email.js';

describe('assembleEmail', () => {
  it('joins user and domain', () => {
    expect(assembleEmail('hello', 'zolloom.com')).toBe('hello@zolloom.com');
  });

  it('trims whitespace', () => {
    expect(assembleEmail(' hello ', ' zolloom.com ')).toBe('hello@zolloom.com');
  });

  it.each([
    ['', 'zolloom.com'],
    ['hello', ''],
    ['he@llo', 'zolloom.com'],
    ['hello', 'localhost'],
    [undefined, 'zolloom.com'],
  ])('rejects invalid input (%s, %s)', (user, domain) => {
    expect(() => assembleEmail(user, domain)).toThrow(TypeError);
  });
});
