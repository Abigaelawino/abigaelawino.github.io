# abigaelawino.github.io

This repository tracks the Netlify Next Platform Starter-based portfolio site outlined in `Docs/PORTFOLIO_PLAN.md`, with shadcn/ui components and MCP-managed updates.

## Deployment

- `npm run build` generates the `dist/` directory that mirrors the template's production output.
- `npm run deploy` runs the build and then uses the already-installed Netlify CLI to deploy `dist/` to the configured Netlify site (`.netlify/state.json` contains the site ID).
- Netlify builds (via `netlify.toml`) now publish `dist/`, matching the stock Next Platform Starter output so both CLI deploys and Netlify’s GitHub-triggered builds resolve the same folder.
- The CLI login is already established per the user's note; rerun `netlify status` if the session expires.
- `npm run dev` runs `scripts/dev.mjs`, which rebuilds whenever `src`, `content`, `assets`, or `scripts` change and starts the lightweight dev server at `http://localhost:3000`. That mirrors the stock `netlify dev`/Next.js dev workflow so tmux or helper sessions can hot-reload changes while keeping generated assets in `dist/`.
- `npm run start` launches `scripts/dev-server.mjs`, serving the built `dist/` folder so `netlify dev` and CLI helpers can rely on the same static output path as production.

## Netlify alignment
- The build/publish flow follows the Next.js framework guidance from Netlify: `npm run build` performs the site export before `netlify deploy` publishes from `dist/` as described in [Netlify's Next.js overview](https://docs/netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) and [https://www.netlify.com/with/nextjs/](https://www.netlify.com/with/nextjs/).
- Our static site generation mirrors the [Netlify Next Platform Starter](https://github.com/netlify-templates/next-platform-starter) structure, so the repository delivers pre-rendered HTML that the platform expects while remaining compatible with the [OpenNextJS Netlify starter](https://github.com/opennextjs/opennextjs-netlify) expectations around `npm run build`, `dist/` publishing, and `netlify.toml` configuration.

`npm run build` now renders the home, about, contact, projects, and blog index pages using the shared render helpers (`src/home.js`, `src/about.js`, `src/contact.js`, `src/projects.js`, `src/blog.js`) and writes the resulting HTML documents into `dist/`. Each page uses the shell markup from `scripts/build.mjs`, so the Netlify publish step delivers full static pages rather than just assets. Tests under `test/` already validate the render helpers (e.g., `blog.test.js`, `projects.test.js`), which ensures the generated HTML stays aligned with the expected structure.

### Testing & coverage
`npm run coverage` captures the TAP stream that Node's built-in test runner emits instead of relying on the now-unsupported `--test-reporter-destination` flag. `scripts/run-coverage.mjs` writes that TAP output to `coverage/node-coverage.tap`, summaries the totals at `coverage/coverage-summary.json`, and lets `scripts/check-coverage.mjs` enforce the >99% thresholds for statements/lines/functions and 95% for branches. That means the GH Actions `npm run ci` job and the Netlify build no longer hit the "bad option" failure when collecting coverage information.
## Codex + Netlify MCP

- Codex clients connect to Netlify via the Model Context Protocol using the Netlify MCP server (`@netlify/mcp`). This repo adds a local Codex configuration (`.codex/config.toml`) so Codex will execute `npx -y @netlify/mcp` automatically and can manage Netlify resources from the workspace.
- See `https://developers.netlify.com/guides/write-mcps-on-netlify/`, `https://docs.netlify.com/build/build-with-ai/netlify-mcp-server/`, and `https://github.com/netlify/netlify-mcp` for more background if adjustments are needed.
