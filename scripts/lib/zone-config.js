// Desired Cloudflare zone configuration for zolloom.com, as pure data and helpers,
// so scripts/cloudflare-zone.js stays a thin API runner and this part is unit-tested.

export const ZONE_NAME = 'zolloom.com';

// Rules this project owns carry this ref prefix. Anything else in the same phase
// (added by hand in the dashboard) is left alone when the phase is rewritten.
export const RULE_REF_PREFIX = 'zolloom-site:';

const ONE_YEAR = 31536000;

// Zone-wide settings. Assets-only Workers never run code, so HTTPS and HSTS have to
// be enforced here. HSTS leaves includeSubDomains off: the legacy cPanel subdomains
// (webmail, cpanel, autodiscover, ...) still live on the old host.
export const desiredSettings = {
  always_use_https: 'on',
  automatic_https_rewrites: 'on',
  min_tls_version: '1.2',
  security_header: {
    strict_transport_security: {
      enabled: true,
      max_age: ONE_YEAR,
      include_subdomains: false,
      preload: false,
      nosniff: true,
    },
  },
};

export function wwwRedirectRule(zoneName = ZONE_NAME) {
  return {
    ref: `${RULE_REF_PREFIX}www-to-apex`,
    description: `www.${zoneName} -> ${zoneName} (301)`,
    expression: `(http.host eq "www.${zoneName}")`,
    action: 'redirect',
    action_parameters: {
      from_value: {
        status_code: 301,
        target_url: { expression: `concat("https://${zoneName}", http.request.uri.path)` },
        preserve_query_string: true,
      },
    },
    enabled: true,
  };
}

// Deep equality for the JSON values the settings API returns.
export function sameValue(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(b);
  // Only the keys we specify matter: the API may return extra fields.
  return keys.every((k) => sameValue(a[k], b[k]));
}

// Returns the settings whose current value differs from the desired one.
export function settingsToChange(current, desired = desiredSettings) {
  return Object.entries(desired)
    .filter(([id, value]) => !sameValue(current[id], value))
    .map(([id, value]) => ({ id, value }));
}

const RULE_FIELDS = ['ref', 'description', 'expression', 'action', 'action_parameters', 'enabled'];

function stripRule(rule) {
  return Object.fromEntries(RULE_FIELDS.filter((f) => f in rule).map((f) => [f, rule[f]]));
}

// Keeps rules this project doesn't own (in their order), then appends ours.
// The rules API rejects read-only fields (id, version, last_updated) on PUT.
export function mergeRules(existing, ours) {
  const foreign = (existing ?? []).filter((r) => !r.ref?.startsWith(RULE_REF_PREFIX));
  return [...foreign, ...ours].map(stripRule);
}

export function rulesUpToDate(existing, ours) {
  const owned = (existing ?? []).filter((r) => r.ref?.startsWith(RULE_REF_PREFIX));
  return owned.length === ours.length && ours.every((rule, i) => sameValue(stripRule(owned[i]), rule));
}
