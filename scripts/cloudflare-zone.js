// Applies the zone settings and redirect rule from scripts/lib/zone-config.js.
// Idempotent: only changes what differs. Needs CLOUDFLARE_API_TOKEN, e.g.
//   sops exec-env secrets/cloudflare.sops.yaml 'node scripts/cloudflare-zone.js --check'
//   sops exec-env secrets/cloudflare.sops.yaml 'node scripts/cloudflare-zone.js'
import {
  ZONE_NAME,
  desiredSettings,
  mergeRules,
  rulesUpToDate,
  settingsToChange,
  wwwRedirectRule,
} from './lib/zone-config.js';

const API = 'https://api.cloudflare.com/client/v4';
const REDIRECT_PHASE = 'http_request_dynamic_redirect';
const check = process.argv.includes('--check');
const token = process.env.CLOUDFLARE_API_TOKEN;

if (!token) {
  console.error('CLOUDFLARE_API_TOKEN is not set (run through sops exec-env).');
  process.exit(1);
}

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok && data.success === true, data };
}

async function apiOrThrow(method, path, body) {
  const r = await api(method, path, body);
  if (!r.ok) throw new Error(`${method} ${path} failed (${r.status}): ${JSON.stringify(r.data.errors ?? r.data)}`);
  return r.data.result;
}

async function main() {
  const zones = await apiOrThrow('GET', `/zones?name=${ZONE_NAME}`);
  if (zones.length !== 1) throw new Error(`expected one zone named ${ZONE_NAME}, found ${zones.length}`);
  const zoneId = zones[0].id;

  const current = {};
  for (const id of Object.keys(desiredSettings)) {
    current[id] = (await apiOrThrow('GET', `/zones/${zoneId}/settings/${id}`)).value;
  }
  const changes = settingsToChange(current);
  for (const { id, value } of changes) {
    console.log(`${check ? 'would set' : 'set'} ${id}: ${JSON.stringify(current[id])} -> ${JSON.stringify(value)}`);
    if (!check) await apiOrThrow('PATCH', `/zones/${zoneId}/settings/${id}`, { value });
  }
  if (changes.length === 0) console.log('settings: up to date');

  const entry = await api('GET', `/zones/${zoneId}/rulesets/phases/${REDIRECT_PHASE}/entrypoint`);
  // A zone that never had a rule in this phase has no entrypoint yet; PUT creates it.
  if (!entry.ok && entry.status !== 404) {
    throw new Error(`reading redirect rules failed (${entry.status}): ${JSON.stringify(entry.data.errors)}`);
  }
  const existing = entry.ok ? entry.data.result.rules : [];
  const ours = [wwwRedirectRule()];
  if (rulesUpToDate(existing, ours)) {
    console.log('redirect rules: up to date');
  } else {
    console.log(`${check ? 'would write' : 'write'} redirect rules: ${ours.map((r) => r.ref).join(', ')}`);
    if (!check) {
      await apiOrThrow('PUT', `/zones/${zoneId}/rulesets/phases/${REDIRECT_PHASE}/entrypoint`, {
        rules: mergeRules(existing, ours),
      });
    }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
