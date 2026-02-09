# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

- Keep focus styling centralized in `scripts/build.mjs` `SHELL_CSS` so page templates can omit duplicate `:focus-visible` rules.
- When adding page-specific JS/CSS or media, ensure `scripts/build.mjs` copies `assets/` (and optional `images/`) into `dist/` so production output matches local templates.
- When capturing Node test coverage output in scripts, prefer `--test-reporter-destination` (and parse the written TAP) instead of relying on `spawnSync` captured stdout/stderr, which can be empty depending on the environment.
- For analytics events, add `data-analytics-event` (and optional `data-analytics-prop-*`) attributes in render helpers and handle tracking centrally in `assets/analytics.js` to avoid repeating per-page listeners.
- If delaying navigation on analytics events, include a short timeout fallback so users never get stuck when the provider script hasn't loaded yet.
- Centralize SEO markup + sitemap/robots generation in `src/seo.js`, and resolve the canonical base URL from Netlify env vars (`SITE_URL`, `URL`, `DEPLOY_PRIME_URL`) so previews and production share correct metadata.
- In sandboxed environments where `$HOME` is read-only, set `XDG_CONFIG_HOME` to a workspace path before invoking the Netlify CLI so it can write its config store without `EACCES` errors.

---

## 2026-02-08 - abigaelawino-github-io-3su.13
- Removed duplicated `:focus-visible` rules from page-level inline styles so focus states come from shared `shell.css`.
- Improved semantic grouping by using `<nav>` wrappers for link clusters (contact social links; resume actions) and list semantics for the global shell navigation links.
- Hardened blog post content styling for embedded images/code blocks (responsive images; scrollable code blocks).
- Build now copies `assets/` (and optional `images/`) into `dist/` so code-split JS and media ship correctly.
- Files changed: `scripts/build.mjs`, `src/about.js`, `src/blog.js`, `src/contact.js`, `src/home.js`, `src/projects.js`, `src/resume.js`
- **Learnings:**
  - Centralize shared accessibility styles (focus ring) in `shell.css` to avoid repeated inline CSS across templates.
  - `scripts/build.mjs` is the source of truth for what ships; static directories like `assets/` must be copied explicitly or routes will 404 in production.
---

## 2026-02-09 - abigaelawino-github-io-3su.13
- Added lightweight, optimized SVG project cover images and wired project MDX frontmatter to reference them so the projects grid has non-broken, sized media.
- Fixed `npm run coverage` by writing TAP output via Node's `--test-reporter-destination`, then parsing the saved report for thresholds.
- Files changed: `content/projects/customer-churn-case-study.mdx`, `content/projects/sales-forecasting-dashboard.mdx`, `content/projects/support-ticket-nlp-triage.mdx`, `images/projects/churn-risk-cover.svg`, `images/projects/retail-forecast-cover.svg`, `images/projects/ticket-nlp-cover.svg`, `scripts/run-coverage.mjs`
- **Learnings:**
  - Node's test runner output may not be captured via `spawnSync` pipes; writing the reporter output to a destination file is more reliable for coverage automation.
---

## 2026-02-09 - abigaelawino-github-io-3su.11
- Integrated privacy-friendly analytics (Plausible) via `scripts/build.mjs` with opt-in env overrides and safe defaults (disabled on localhost + Do Not Track; enabled by default only when `NODE_ENV=production`).
- Added centralized CTA event tracking via `assets/analytics.js` using `data-analytics-event` / `data-analytics-prop-*` attributes across the key pages (home, projects, case studies, blog, resume, contact).
- Files changed: `assets/analytics.js`, `scripts/build.mjs`, `src/blog.js`, `src/contact.js`, `src/home.js`, `src/projects.js`, `src/resume.js`, `test/blog.test.js`, `test/contact.test.js`, `test/home.test.js`, `test/projects.test.js`, `test/resume.test.js`
- **Learnings:**
  - Event delegation + data attributes keeps analytics wiring consistent and avoids page-specific JS duplication.
  - When using a hosted privacy-friendly provider, inject the provider script only when configured (or in production builds) so local preview builds don't leak events.
---

## 2026-02-09 - abigaelawino-github-io-3su.11
- Gated Plausible script injection at runtime (Do Not Track + localhost) so pageviews are never sent in those scenarios.
- Added a navigation-delay timeout fallback so CTA tracking can’t block clicks if the analytics callback never fires (e.g., provider script still loading).
- Files changed: `assets/analytics.js`, `scripts/build.mjs`
- **Learnings:**
  - Queued analytics stubs may not execute callbacks; navigation delays should always have a bounded fallback.
---

## 2026-02-09 - abigaelawino-github-io-3su.12
- Added canonical + Open Graph/Twitter metadata across all rendered pages via a shared SEO helper.
- Generated a default social card image at `/assets/og.png` during the build.
- Build now writes `sitemap.xml` and `robots.txt` into `dist/` with absolute URLs derived from the deployment base URL.
- Files changed: `scripts/build.mjs`, `src/seo.js`, `test/seo.test.js`
- **Learnings:**
  - Using Netlify-provided URL env vars keeps canonical URLs and sitemaps correct across deploy previews and production.
---

## 2026-02-09 - abigaelawino-github-io-3su.15
- Ran the full quality gate (`npm run ci`) to confirm lint/security/typecheck/tests/build/coverage all pass before release.
- Added a `/contact/thanks/` confirmation page and wired the contact form `action` to it for a predictable post-submit UX.
- Verified the static dev server redirects local POSTs to `/contact/` over to the thanks page (mirrors the Netlify Forms flow for quick smoke checks).
- Files changed: `src/contact.js`, `src/index.js`, `src/seo.js`, `scripts/build.mjs`, `test/contact.test.js`, `.ralph-tui/progress.md`
- **Learnings:**
  - A dedicated thanks page + explicit form `action` makes Netlify form submissions easier to validate and avoids “POST stays on same page” ambiguity.
  - Netlify CLI expects to write to the XDG config dir; sandboxed homes require `XDG_CONFIG_HOME` to be set to a writable workspace path.
---
