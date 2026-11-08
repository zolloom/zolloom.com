# Secrets

Secrets are stored encrypted in `secrets/` with [sops](https://github.com/getsops/sops) + age. Both the owner's key and the agent VM's key are recipients (see `.sops.yaml`). Never commit a decrypted copy. The `.decrypted~*` files that the VS Code sops extension creates are gitignored.

## `secrets/cloudflare.sops.yaml`

| Key | What it is |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Account API token `zolloom-deploy`, used by wrangler to deploy and to set up the zone |
| `CLOUDFLARE_ACCOUNT_ID` | ID of the Cloudflare account that owns the `zolloom.com` zone (not a secret, kept here so `sops exec-env` provides both) |

### Creating the token

1. Cloudflare dashboard → **Manage Account** → **Account API Tokens** → **Create Token** → **Custom token** → **Get started**.
2. Token name: `zolloom-deploy`.
3. Permissions. Each row has its own scope dropdown. Pick the scope **first**, because the account-level permissions only appear when the row is set to **Account**.

   | Scope | Permission | Access | Why |
   | --- | --- | --- | --- |
   | Account | Workers Scripts | Edit | deploy the site as a Worker with static assets |
   | Account | Account Settings | Read | wrangler reads the account |
   | Zone | Zone | Read | find the `zolloom.com` zone |
   | Zone | Workers Routes | Edit | attach `zolloom.com` to the Worker |
   | Zone | DNS | Edit | swap the apex record from the old server to the Worker (the mail records stay untouched) |
   | Zone | Zone Settings | Edit | Always Use HTTPS, HSTS, minimum TLS 1.2 |
   | Zone | Single Redirect | Edit | `www.zolloom.com` → `zolloom.com` (301) |

4. **Zone Resources**: Include → Specific zone → `zolloom.com`.
5. **Client IP Address Filtering**: leave empty (GitHub Actions runners have changing IPs).
6. **TTL**: one year is a sensible expiry. Put a reminder in your calendar to rotate it.
7. **Continue to summary** → **Create Token**. Copy the token (it starts with `cfat_`). It is shown only once.

The account ID: Account home → the **⋯** menu next to the account name → **Copy account ID**.

### Filling in the file

```sh
git fetch && git checkout deploy-cloudflare
sops secrets/cloudflare.sops.yaml   # replace both REPLACE_ME values, save, close
git commit -am "Fill Cloudflare secrets" && git push
```

### GitHub Actions secrets (repo owner only)

Collaborators can't set Actions secrets, so the repo owner runs this once (needs `gh` logged in as the owner). The values go straight from sops to GitHub, without passing through the terminal or shell history:

```sh
sops -d --extract '["CLOUDFLARE_API_TOKEN"]' secrets/cloudflare.sops.yaml | gh secret set CLOUDFLARE_API_TOKEN -R zolloom/zolloom.com
sops -d --extract '["CLOUDFLARE_ACCOUNT_ID"]' secrets/cloudflare.sops.yaml | gh secret set CLOUDFLARE_ACCOUNT_ID -R zolloom/zolloom.com
```

Without `gh`: GitHub → repo **Settings** → **Secrets and variables** → **Actions** → **New repository secret**, once for each of the two names above.

### Rotating

Create a new token with the same permissions, put it in the sops file, run the first `gh secret set` command again, then delete the old token in Cloudflare.
