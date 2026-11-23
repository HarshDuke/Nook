# Nook

Company landing page and project-owner site submission tool. A dependency-free Cloudflare Worker serves HTML, CSS, JavaScript, and a validated intake endpoint. Submissions are stored in D1; the public API never lists them.

## Local development

Requires Node.js 22.13 or newer.

```
npm run build
npm test
npm run dev
```

Preview runs at http://127.0.0.1:5173 with a separate local SQLite database. Local records never become production records. The local preview does not impersonate ChatGPT authentication.

## Source

- `src/landing.html`: company website
- `src/form.html` and `src/form.js`: three-step site-owner intake
- `src/styles.css`: responsive visual design
- `src/worker.js`: routes, server validation, database writes, restricted team view
- `drizzle/`: database schema migrations
- `.openai/hosting.json`: hosting identity and database binding

## Production

Build output is `dist/server/index.js`. The build embeds page content and assets into one Worker. The D1 binding is `DB`; apply the committed migrations when deploying. Never initialize database tables from request handlers.

On Sites hosting, set `AUTH_MODE=sites` and `ADMIN_EMAIL` to the Nook administrator's ChatGPT account email to enable `/admin`. This requires Sites dispatch to validate and inject identity. Never set `AUTH_MODE=sites` on a standalone Worker or run the local preview as a public server. On standalone Cloudflare hosting the `/admin` route is locked, and authorized account members can review submissions in the D1 dashboard.

## Deployment status

The production Worker is `nookinfra` in the owner’s Cloudflare account. Its public URL is https://nookinfra.hvsanghi.workers.dev. The D1 binding `DB` uses `nook-site-submissions`; the schema and a labeled deployment test submission have been verified. Production is deployed directly through the Cloudflare dashboard. GitHub contains the source and `deploy/worker.js` bundle; automatic GitHub deployment is not connected yet.

Both `nookinfra.com/*` and `www.nookinfra.com/*` are configured as Worker routes. The Cloudflare zone is pending the GoDaddy nameserver change to `mariah.ns.cloudflare.com` and `sam.ns.cloudflare.com`. The custom domain is not live until that change propagates.

## Deploy from GitHub to Cloudflare

Connect `HarshDuke/Nook`, branch `main`, as a Workers project named `nookinfra`. Use `npm run build` as the build command and `npm run deploy` as the deploy command. The deployment account must be able to manage Workers and D1. Use the free plan unless an upgrade is explicitly approved.

The deployment script finds or creates `nook-site-submissions`, resolves its real database ID, applies committed migrations, and deploys the Worker. The deployment script validates the database name against the real account database ID; no credentials are written to source. Public site and intake form work without visitor accounts. Email notifications are not configured.

The registrar can remain GoDaddy. Cloudflare Worker custom domains require an active Cloudflare DNS zone; copy existing DNS records before changing nameservers at GoDaddy, then serve `nookinfra.com` and `www.nookinfra.com` through the configured Worker routes. Preserve existing email records.

The intake endpoint validates required fields, lengths, choices and consent. It accepts only same-origin JSON requests, rate limits, uses parameterized SQL, and supports retries with a stable submission reference. Submissions are saved; email notifications are not configured.

Keep all `.env` files, local database files, runtime state, and credentials out of Git. Configure domain DNS from the hosting service's exact records; preserve unrelated MX and email TXT records.
