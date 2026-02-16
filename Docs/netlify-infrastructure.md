# Netlify Infrastructure

This document describes the current Netlify setup for the Next.js portfolio site.

## Runtime

- Next.js runtime is enabled via `@netlify/plugin-nextjs`.
- Netlify publishes `.next` as defined in `netlify.toml`.
- Redirects and security headers are managed in `netlify.toml`.

## CMS

- Decap CMS lives in `public/admin`.
- `/admin/*` redirects to `/admin/index.html` for a clean CMS URL.

## Serverless functions

Functions are located in `netlify/functions` and are exposed as:
- `/.netlify/functions/asset-optimization`
- `/.netlify/functions/build-webhook`
- `/.netlify/functions/deployment-monitoring`
- `/.netlify/functions/form-validator`
- `/.netlify/functions/issue-verification`
- `/.netlify/functions/rate-limiter`
- `/.netlify/functions/session-manager`

These are primarily used for monitoring, verification, and local tooling.

## Environment configuration

Core environment variables (set in Netlify or locally):
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_TELEMETRY_DISABLED`
- `NODE_VERSION`

Optional integrations:
- `GITHUB_WEBHOOK_SECRET`
- `NETLIFY_BUILD_HOOK`
- `SLACK_WEBHOOK_URL`

## Observability

Monitoring and dashboards are generated via scripts in `scripts/` and documented in `docs/netlify-performance-monitoring.md` and `docs/netlify-function-health-monitoring.md`.
