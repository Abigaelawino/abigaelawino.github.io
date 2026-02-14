# Data Science Portfolio Website Plan

## Goals & Audience

- Showcase end-to-end data projects, communicating impact and rigor.
- Target hiring managers, data leads, and peers; highlight reproducibility and clarity.

## Information Architecture

- Home: value proposition, featured project, quick links to resume/GitHub/LinkedIn.
- Projects: grid with filters (ML, analytics, visualization, NLP, time series); each links to a detailed case study.
- About: short bio, strengths, toolkit, speaking/publications.
- Blog/Notes: short write-ups on experiments, papers, or tech notes.
- Contact: email form (with spam protection), social links, availability.
- Resume: downloadable PDF; keep a web-friendly summary.

## Project Case Study Template

- Summary: problem, context, success metric.
- Data: sources, size, cleaning steps, caveats.
- Methods: models/algorithms, feature engineering, evaluation approach.
- Results: metrics (with baselines), visuals, business impact.
- Reproducibility: repo link, environment specs, how to run.
- Reflection: what you’d do next, trade-offs, lessons.

## Visual & UX Guidelines

- Tone: clean, professional; minimalist color palette using shadcn/ui design tokens
- Components: Leverage shadcn/ui components (Card, Button, Navigation Menu, etc.) for consistency
- Typography: Use shadcn/ui typography system with custom fonts if needed
- Navigation: shadcn/ui Navigation Menu with sticky top nav and clear CTAs (View Resume, Contact)
- Cards: shadcn/ui Card components for consistent project cards with tags, summaries, and primary CTA ("Read case study")
- Mobile-first: ensure shadcn/ui responsive design works at 360–414 px widths

## Tech Stack (focused on shadcn/ui)

- Frontend: Next.js + TypeScript; UI components via shadcn/ui (https://ui.shadcn.com/docs)
- Styling: Tailwind CSS with shadcn/ui component system for consistent design
- Data viz: Recharts or Plotly for interactive charts; embed static matplotlib/Altair PNGs when needed
- Content: Markdown/MDX for blog and case studies; consider a headless CMS (e.g., Contentlayer) later
- Analytics: privacy-friendly (e.g., Plausible or self-hosted) with per-page event tracking
- Deployment: Vercel or Netlify with preview deploys on PRs; set up a custom domain

## Performance, Accessibility, SEO

- Performance: image optimization (next/image), prefetch featured links, code-split heavy viz.
- Accessibility: semantic HTML, focus states, alt text on all figures/charts.
- SEO: per-page titles/descriptions, Open Graph images for projects, sitemap and robots.txt.

## Content Pipeline

- Projects stored as MDX in `content/projects/`; frontmatter fields: `title`, `date`, `tags`, `summary`, `tech`, `repo`, `cover`, `status`.
- Blog posts in `content/blog/`; similar frontmatter plus `readingTime`.
- Auto-generate project index from frontmatter; support tag filtering.

## Data & Visualization Standards

- Always show baselines and confidence where applicable.
- Use consistent color encodings and units across charts.
- Provide downloadable assets for key artifacts (model cards, notebooks, CSV samples).

## Integration & Automation

- CI: lint (`eslint`), type-check (`tsc`), format (`prettier --check`), test (`vitest` or `jest`), build.
- Pre-commit: format + lint staged files.
- Deploy previews on PRs; block merges on failing checks.
- shadcn/ui MCP server integration configured for Codex for component management and updates
- Ensure the local dev workflow exposes `npm run dev`/`netlify dev` with live rebuilds and a lightweight server so helper sessions mirror the Next.js starter experience.
- Coverage gate: add `npm run coverage` with 100% statement/line/function/branch thresholds so every PR must meet the bar before Netlify builds.
- Secure Netlify runbooks: keep `netlify.toml` aligned with the Next Platform Starter template, audit webhooks/hooks, and document the CLI steps required for each deploy so helper sessions reproduce the secure flow.

## Security & Privacy

- No secrets in the repo; use environment variables.
- If collecting emails, enable spam protection (honeypot/Recaptcha) and note privacy in a short policy.
- Prioritize secure coding practices: review dependencies, add CSP/security headers, and keep Netlify forms/bots under tight control per the plan.

## Launch Checklist

- [ ] At least 3 polished case studies following the template.
- [ ] Resume PDF uploaded and linked.
- [ ] Open Graph/Twitter cards configured and validated.
- [ ] Lighthouse scores: >90 for Performance, Accessibility, Best Practices, SEO.
- [ ] Contact form tested end-to-end.
- [ ] Code coverage 100% for statements/lines/functions/branches enforced by the coverage scripts.
- [ ] Netlify deploys verify header/CSP policies, require the secure build pipeline, and log every smoke-test URL hit.

## Roadmap (example)

- Week 1: Set up Next.js, configure shadcn/ui, layout, navigation, theming, initial CI
- Week 2: Implement content pipeline (MDX), iT SHOULD BE BASED project cards, case study page template
- Week 3: Add two featured projects using shadcn/ui components, blog index, analytics, SEO passes
- Week 4: Add remaining projects, polish accessibility with shadcn/ui accessibility features, finalize resume/contact, run Lighthouse and ship
