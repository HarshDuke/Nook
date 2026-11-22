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

Set the production `ADMIN_EMAIL` environment variable to the Nook administrator's ChatGPT account email to enable `/admin`. Team access requires platform-injected authenticated identity and checks the configured email server-side. Never run the standalone preview as a public server: it does not provide the platform authentication boundary.

The intake endpoint validates required fields, lengths, choices and consent. It accepts only same-origin JSON requests, rate limits, uses parameterized SQL, and supports retries with a stable submission reference. Submissions are saved; email notifications are not configured.

Keep all `.env` files, local database files, runtime state, and credentials out of Git. Configure domain DNS from the hosting service's exact records; preserve unrelated MX and email TXT records.
