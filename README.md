# abigaelawino.github.io

This repository tracks the Netlify-deployed Next.js portfolio site outlined in `Docs/PORTFOLIO_PLAN.md`. It uses shadcn/ui, MDX content, Recharts, and Plotly for data visualization.

## Deployment

- `npm run build` generates content indexes and runs `next build` for the Netlify Next.js runtime.
- Netlify configuration lives in `netlify.toml` and publishes `.next` with `@netlify/plugin-nextjs`.
- `netlify status` confirms the CLI session and site link.

## Local development

- `netlify dev` is the parity workflow and serves the site at `http://localhost:8888` while proxying `next dev` on `3000`. This is the recommended local QA path because it mirrors Netlify routing/headers.
- `npm run dev` starts the full Next.js dev server (hot reload).
- `npm run dev:static` runs `scripts/dev.mjs`, refreshes content indexes, rebuilds the static helper output in `dist/`, and serves it on `3000` for quick static checks.
- `npm run start` serves the `dist/` output for static smoke testing.
- `npm run setup:local` installs dependencies and generates content indexes for a fast local setup.

## Local QA (rapid)

1. Run `netlify dev`.
2. Open `http://localhost:8888`.
3. Make edits and confirm hot reload:
   - `content/**` changes should update project/blog pages.
   - `app/**` changes should update Next.js routes.
4. Quick route pass:
   - `/`, `/about`, `/projects`, `/blog`, `/contact`, `/resume`
   - `/projects/<slug>` and `/blog/<slug>`
   - `/sitemap.xml`, `/robots.txt`, `/admin`

## CMS

- Decap CMS lives at `public/admin/index.html`.
- Netlify redirects `/admin/*` to `/admin/index.html` so the CMS loads from a clean URL.

## Testing & coverage

`npm run coverage` captures Node test output into `coverage/` and enforces strict coverage thresholds. CI runs linting, type checks, tests, build, and coverage via `npm run ci`.

## Codex + Netlify MCP

Codex connects to Netlify via the Model Context Protocol using `@netlify/mcp`. The local `.codex/config.toml` enables automated Netlify operations from this workspace.
