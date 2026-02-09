Findings

  - The demo repo (awino-potfolio (https://github.com/Abigaelawino/awino-potfolio)) is a stock Next.js/Netlify Platform Starter: package.json exposes the standard npm run dev, npm run
    build, npm run start, and npm run lint scripts, while netlify.toml publishes .next after running npm run build. That’s the “golden” setup Netlify expects (build > .next, netlify dev
    working, hooks documented), so our current repo should match that level of out‑of‑the-box Netlify integration.
  - We already deploy a static dist/ output via npm run build + netlify deploy --prod --dir=dist, but the sample confirms we’re missing the standard dev script, the .next build input, and
    the associated edge/Netlify folders that keep the pipeline aligned with the Next.js workflow. Without npm run dev, netlify dev/tmux helper sessions cannot start, and without the
    canonical build folder we diverge from the IDE/Netlify expectations.
  - The demo also keeps its Netlify folder organized (e.g., netlify/edge-functions), which suggests they rely on Netlify’s CLI+MCP capabilities; it would be worth documenting equivalent
    settings in our Netlify epic so the new helper sessions reproduce the same secure, feature-complete environment.

  Actionable next steps

  1. Keep the abigaelawino-github-io-6n3 task as a priority so our package.json exposes a dev script that can be used both locally (npm run dev) and by netlify dev, matching the example
     project’s behavior.
  2. Complete abigaelawino-github-io-6p7/abigaelawino-github-io-6s2 so our published folder mirrors the reduced, secure output structure Netlify’s starter implies and so the shared shell
     styling/linting stays in a single stylesheet.
  3. Document Netlify CLI/MCP expectations (build hooks, edge functions, security headers) inside the new epics (Netlify ops/security) so every helper session can reproduce the same high-
     standard setup you see in shiny-mandazi-a2b798.
