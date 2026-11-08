// The address is assembled at runtime so it never appears verbatim in the HTML.
export function assembleEmail(user, domain) {
  const u = String(user ?? '').trim();
  const d = String(domain ?? '').trim();
  if (!u || !d || u.includes('@') || !d.includes('.')) {
    throw new TypeError('assembleEmail: expected a user name and a domain');
  }
  return `${u}@${d}`;
}
