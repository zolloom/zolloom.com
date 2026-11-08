import { describe, expect, it } from 'vitest';
import {
  RULE_REF_PREFIX,
  desiredSettings,
  mergeRules,
  rulesUpToDate,
  sameValue,
  settingsToChange,
  wwwRedirectRule,
} from '../../scripts/lib/zone-config.js';

describe('sameValue', () => {
  it('compares primitives', () => {
    expect(sameValue('on', 'on')).toBe(true);
    expect(sameValue('off', 'on')).toBe(false);
    expect(sameValue(null, {})).toBe(false);
  });

  it('ignores extra fields the API returns', () => {
    expect(sameValue({ a: 1, extra: 2 }, { a: 1 })).toBe(true);
    expect(sameValue({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it('compares nested objects', () => {
    expect(sameValue({ x: { y: [1, 2] } }, { x: { y: [1, 2] } })).toBe(true);
    expect(sameValue({ x: { y: [1, 3] } }, { x: { y: [1, 2] } })).toBe(false);
  });
});

describe('settingsToChange', () => {
  it('lists only differing settings', () => {
    const current = { ...desiredSettings, always_use_https: 'off', min_tls_version: '1.0' };
    expect(settingsToChange(current).map((c) => c.id)).toEqual(['always_use_https', 'min_tls_version']);
  });

  it('is empty when the zone already matches', () => {
    expect(settingsToChange(structuredClone(desiredSettings))).toEqual([]);
  });

  it('treats missing settings as changes', () => {
    expect(settingsToChange({})).toHaveLength(Object.keys(desiredSettings).length);
  });
});

describe('wwwRedirectRule', () => {
  const rule = wwwRedirectRule('example.com');

  it('redirects www to the https apex, keeping path and query', () => {
    expect(rule.expression).toBe('(http.host eq "www.example.com")');
    expect(rule.action_parameters.from_value).toEqual({
      status_code: 301,
      target_url: { expression: 'concat("https://example.com", http.request.uri.path)' },
      preserve_query_string: true,
    });
  });

  it('is tagged as owned by this project', () => {
    expect(rule.ref.startsWith(RULE_REF_PREFIX)).toBe(true);
  });
});

describe('mergeRules / rulesUpToDate', () => {
  const ours = [wwwRedirectRule()];
  const foreign = { id: 'f1', ref: 'manual', expression: 'true', action: 'redirect', version: '3' };

  it('keeps foreign rules first and drops read-only fields', () => {
    const stale = { ...ours[0], id: 'o1', expression: 'old', last_updated: 'x' };
    const merged = mergeRules([foreign, stale], ours);
    expect(merged).toEqual([{ ref: 'manual', expression: 'true', action: 'redirect' }, ours[0]]);
  });

  it('handles an empty phase', () => {
    expect(mergeRules(undefined, ours)).toEqual(ours);
  });

  it('detects whether our rules are current', () => {
    expect(rulesUpToDate([foreign], ours)).toBe(false);
    expect(rulesUpToDate([foreign, { ...ours[0], id: 'o1', version: '2' }], ours)).toBe(true);
    expect(rulesUpToDate([{ ...ours[0], enabled: false }], ours)).toBe(false);
  });
});
