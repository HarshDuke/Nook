# Nook

Company landing page and project-owner site submission tool. A dependency-free Cloudflare Worker serves HTML, CSS, JavaScript, and a validated intake endpoint. Submissions are stored in D1; the public API never lists them.

## Company capacity workspace

The working screening application is at `/capacity`. New customers and new datasets are handled through the application; no code changes or AI connection are needed.

1. Run `npm run dev`, then open `http://127.0.0.1:5173/capacity`.
2. Create a company or choose an existing one.
3. Choose a site, or select New site and enter its details.
4. Upload interval CSV data or select a previously saved dataset. Synthetic examples are explicitly labeled.
5. Set the connection, host growth, battery and economic assumptions; give the run a title and notes.
6. Click **Evaluate & save run**. The server runs the model and stores an immutable report and its input snapshot, tied to that company, site and dataset.
7. Reopen any run, select up to four runs to compare, or export a frozen run JSON, comparison CSV, interval dispatch CSV or print-to-PDF summary. Evaluating changed assumptions creates a new run and preserves the original.

Data persists across restarts in `.sites-runtime/preview.sqlite` locally, and in the configured D1 database when hosted. Keep that local directory out of Git and back it up before moving machines. GitHub stores application source and synthetic tests, never customer records or uploaded profiles. Local and production databases are separate.

The four cases are no battery, low, moderate and high. All batteries have **4-hour nameplate duration**; their AC power is **10%, 25% and 50% of resulting IT load**, respectively. The model solves battery and IT capacity together, accounts for recharge, efficiency, usable SOC and end-of-life retention, and sizes to 99% of fully served UTC days by default. It also reports strict 100% headroom coverage using the same installed battery, shortfall hours and MWh, costs and an indicative residual budget for site/capacity rights. This is historical headroom adequacy, not a guarantee of overall data-center uptime. Complete annual data is required for annual financial outputs; short profiles are explicitly provisional. Tariff, cooling, utility permission, physical buildability, and commercial terms still need diligence.

### Capacity workspace hosting and access

This commit adds software; it does not deploy the live website. For hosting, apply `drizzle/0001_capacity_workspace.sql` through the normal migration process and deploy the rebuilt Worker. Set `CAPACITY_LAB_TOKEN` as a private server-side secret, at least 24 random characters, and enter it on the workspace connection screen. It is held in browser session storage, not a URL. The public intake remains public; company, dataset and run APIs are restricted. Sites-dispatch administrator authentication is also supported when that trusted hosting mode is correctly configured. Do not enable local-development bypass in production.

The local server binds to loopback and enables capacity access only for that local preview. A full annual simulation is CPU-intensive; benchmark the chosen Worker plan's CPU/memory limits before hosting it. The Node local path has no Worker CPU budget. No plan upgrade or production secret is configured by this commit.

### Capacity source and API

- `src/capacity/model.mjs`: deterministic calculation engine, separate from AI.
- `src/capacity/api.mjs`: authorization, validation, company/site/dataset records and immutable run reports.
- `src/capacity/index.html`, `app.js`, `workspace.js`, `style.css`: working interface and exports.
- `scripts/database.mjs`: SQLite adapter with atomic dataset chunk writes; production uses the same D1-style interface.
- `tests/capacity-model.test.mjs` and `tests/capacity-workspace.test.mjs`: numerical and full workflow verification.

Private API routes: `GET/POST /api/capacity/companies`, `GET /api/capacity/companies/:id`, `POST .../:id/sites`, `POST .../:id/datasets`, `GET /api/capacity/datasets/:id`, `GET /api/capacity/runs?companyId=...&offset=...`, `POST /api/capacity/companies/:id/runs`, `GET /api/capacity/runs/:id`. Run exports include IDs, model version, data fingerprint, input assumptions and saved results for a future AI integration. No endpoint can overwrite a saved run.

### Sky Harbour worked example

The selected researched working cases are now **Sugar Land (SGR)** and **Nashville (BNA)**, one host-load profile per site. Run `npm run analyze:skyharbour-two-sites` to regenerate 15-minute and hourly CSVs, complete component/weather audit CSVs, event logs, importable projects and capacity comparisons. Run `npm run seed:skyharbour-two-sites` to save both sites, datasets and runs under Sky Harbour in the local company workspace. The commands use no AI or network dependency.

See [the complete research and numerical assumption ledger](examples/skyharbour-two-sites/research.md), [the reproducible generator](examples/skyharbour-two-sites/generate.mjs) and [computed results](examples/skyharbour-two-sites/results.json). Nashville gas heating is documented for the newer hangars; Sugar Land heat pumps are an explicit unverified assumption. Weather is generated from NOAA temperature normals, not observed hourly data. The raw area/equipment illustrations require substantial scaling to match the user's imposed 6 MW peak; raw peaks, scaling factors and implied W/sf are preserved so that this does not become a false site forecast.

The earlier Stewart sensitivities below remain historical examples, separate from the selected working cases.

```
npm run seed:skyharbour
npm run dev
```

Open `/capacity` and choose **Sky Harbour**. The seed command adds the labeled Stewart sample site, three synthetic full-year datasets and three saved runs through the same private application API. It is idempotent: rerunning it does not duplicate unchanged runs. No AI connection, hosted credentials or network data download is required.

`npm run analyze:skyharbour` independently regenerates raw 15-minute CSVs, component/temperature CSVs, project JSON, summary/economic-sensitivity CSVs and a self-contained interactive HTML report in `outputs/skyharbour/`. Small reference results and the generator are committed under `examples/skyharbour/`; generated bulk data stays out of Git.

The example uses the user-assumed 10 MW connection and 6 MW peak, not verified Sky Harbour capacity. Latest public reporting lists Stewart in development. The three research-informed shapes test electrified climate control, non-electric heating and prolonged winter demand; they are unweighted sensitivities, not probability forecasts. See [the research](examples/skyharbour/research.md) and [the reference results](examples/skyharbour/results.md). Every generated interval and saved sample is explicitly marked synthetic.

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

