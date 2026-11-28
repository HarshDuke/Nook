# Nook customer portal

Run Node 24 and npm ci inside portal/. Run npm test for the invite and company-access regression test. The site's existing build and test commands run from the repository root.

## Connect a deployment

Sign in to Convex under the Nook owner account. From portal/, run npx convex dev --once and choose the Nook team and project. Accept the managed WorkOS environment when prompted. Configure the production environment when running npx convex deploy. Enable Google OAuth in the associated WorkOS environment and finish its production Google credential setup. The registered callback is https://app.nookinfra.com/api/portal/callback.

Set PORTAL_ORIGIN to https://app.nookinfra.com. Verify that WORKOS_CLIENT_ID and WORKOS_API_KEY exist in that same deployment. Keep credentials in provider settings.

Route app.nookinfra.com to the existing Nook Worker. Set the Worker's PORTAL_ORIGIN to the same origin and CONVEX_SITE_URL to the deployment's HTTPS HTTP-actions URL ending in .convex.site. Build and deploy the Worker with those bindings preserved. The public site and intake stay on the existing hostname.

## First login and reports

Regular users sign in at /login. New Google identities require approval. Approved users can also sign in with their personal codes. Administrators use /admin-login with the dedicated administrator code. The Users and Activity tabs provide invitations, approvals, revocation, company assignments, report publication and recorded activity. Actions performed through the shared administrator login are attributed to that account.

On a fresh deployment, generate a random case-sensitive code of 12–128 characters with a cryptographically secure generator, keep it in approved credential storage and pass only its SHA-256 hex digest to the internal store:provisionAdministrator mutation. Verify the new login and dashboard before removing any previous administrator access.

Run npx convex run --prod seed:skyHarbour to create the two synthetic Sky Harbour drafts. Share each approved report in Admin and assign the viewer to Sky Harbour. Production acceptance requires testing Google sign-in at the configured callback, an invite in a separate browser, company isolation and revocation.
