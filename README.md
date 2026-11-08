# zolloom.com

Contact page of Zoltan Elek (zolloom): designer / &lt;coder&gt;.

A static site with no build step: everything that ships is in `src/`. Plain HTML, CSS and ES modules, with self-hosted fonts.

## Two faces

- **designer** (default): brand blue `#00a8ec`, the hollow square drawn as an 8×8 grid of cells, and a Figma-style selection frame. Click the square for a ripple.
- **&lt;coder&gt;** (`/#coder`): deep blue, the square turns into bits, a DevTools-style inspect label, and contact details as code. Click the square to reshuffle the bits.

Switch with the toggle or the `/` key. The switch uses a square wipe that starts from the click point. With `prefers-reduced-motion` the switch is instant, and the ambient grid and the scramble effects are off.

## Structure

```
src/
  index.html
  assets/css/main.css        tokens, layout, both faces
  assets/js/main.js          wiring: mode, e-mail, copy, boot
  assets/js/backdrop.js      background grid canvas + pointer trail
  assets/js/wipe.js          square-wipe transition
  assets/js/square-view.js   hero square (cells, tilt, ripple, bits)
  assets/js/lib/             pure logic, unit-tested
  assets/fonts/              Geist, Geist Mono, Instrument Serif (woff2, OFL)
scripts/
  serve.js                   local static server (HOST/PORT env)
  copy-fonts.js              npm run fonts: refresh fonts from @fontsource
  render-assets.js           npm run assets: PNG icons + OG image
tests/unit/                  vitest
tests/e2e/                   playwright (desktop + mobile)
```

## Commands

```sh
npm ci
npm run serve        # http://127.0.0.1:4173 (HOST=… PORT=… to change)
npm run lint         # eslint + stylelint + html-validate
npm test             # unit tests
npm run test:e2e     # browser tests (needs: npx playwright install chromium)
npm run check        # all of the above
```

## Deploying

Production is an assets-only Cloudflare Worker (`wrangler.jsonc`) serving `src/` on the route `zolloom.com/*`. Deploys are manual, on purpose: CI only runs the checks and never deploys. Deploy from the agent VM after the checks pass:

```sh
sops exec-env secrets/cloudflare.sops.yaml 'npm run deploy'
sops exec-env secrets/cloudflare.sops.yaml 'npm run zone -- --check'   # preview zone changes
sops exec-env secrets/cloudflare.sops.yaml 'npm run zone'              # HTTPS, HSTS, TLS 1.2, www -> apex
```

It is a route, not a custom domain, on purpose: the apex A record still points at the old host, because mail (MX, SPF `+a +mx`), `mail.`, `ftp.` and the CalDAV/CardDAV SRV records depend on it. The route only takes over web traffic for `zolloom.com`. Security headers are in `src/_headers`. Tokens and secrets: see `SECRETS.md`.

The address `hello@zolloom.com` is built at runtime, so it never appears in the HTML. Without JavaScript the page shows `hello [at] zolloom.com` and the plain hollow square.
