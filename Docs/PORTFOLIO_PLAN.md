# Data Science Portfolio Website Plan — Netlify-compliant (Next.js + shadcn/ui)

## Goals & Audience

- Showcase end-to-end data projects with clear impact, rigor, and reproducibility.
- Target hiring managers, data leads, and peers.
- Optimize for fast scanning: strong project summaries + deep case studies.

## Information Architecture

### Home

- Value proposition (1–2 lines), featured project, and quick links (Resume / GitHub / LinkedIn)

### Projects

- Grid with filters (ML, analytics, visualization, NLP, time series)
- Each card links to a case study page

### About

- Short bio, strengths, toolkit, speaking/publications

### Blog / Notes

- Short write-ups: experiments, paper notes, implementation logs

### Contact

- Netlify Form (spam protected) + social links + availability

### Resume

- Web-friendly summary + downloadable PDF

## Project Case Study Template

- **Summary**: problem, context, success metric
- **Data**: sources, size, cleaning steps, caveats
- **Methods**: models/algorithms, feature engineering, evaluation approach
- **Results**: metrics with baselines, visuals, business impact
- **Reproducibility**: repo link, environment specs, how to run
- **Reflection**: next steps, trade-offs, lessons learned

## Visual & UX Guidelines (shadcn/ui)

- **Tone**: clean, professional, minimalist palette via shadcn tokens
- **Components**: Card, Button, Navigation Menu, Badge/Tag, Tabs/Accordion for case studies
- **Typography**: shadcn typography patterns + optional custom font
- **Navigation**: sticky top nav + CTAs (View Resume, Contact)
- **Cards**: consistent project cards with tags, summary, primary CTA ("Read case study")
- **Mobile-first**: verify 360–414px layouts and keyboard/focus behavior

## Tech Stack (Netlify-first)

### Framework

- **Next.js + TypeScript** (standard build for Netlify Next.js runtime)
- Do NOT use `output: 'export'` — let Netlify handle SSR/functions

### UI

- **shadcn/ui + Tailwind CSS**

### Content Management

- **Decap CMS** (formerly Netlify CMS) for content editing
- MDX for projects/blog (`content/projects`, `content/blog`)
- Admin interface at `/admin`

### Data Viz

- Recharts/Plotly for interactive; static PNGs for heavier plots

### Analytics

- Privacy-friendly (Plausible or self-hosted)

### Deployment

- **Netlify** (PR preview deploys, branch deploys, custom domain)

## Netlify Deployment Requirements

### 1) Next.js on Netlify

- Use Netlify's Next.js runtime (don't force static export)
- Next features supported:
  - `next/image` ✓
  - API routes ✓ (become Netlify Functions)
  - Middleware/Edge ✓ (within Netlify constraints)

### 2) netlify.toml (baseline)

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_ENV = "production"
  NEXT_TELEMETRY_DISABLED = "1"
```

### 3) Local dev must match deploy

- Primary: `netlify dev` (proxy + functions + Next runtime)
- Secondary: `npm run dev` (for quick iteration)

### 4) Forms (Contact) — Netlify-native

- Use Netlify Forms for contact form
- Spam protection: honeypot field + optional reCAPTCHA
- Add privacy statement on form

### 5) Security headers + CSP

- Content-Security-Policy (CSP)
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- Strict-Transport-Security (HSTS)

### 6) Preview deploys and PR checks

- Netlify deploy previews on every PR
- CI must block merges on failures:
  - lint
  - typecheck
  - tests
  - coverage gate
  - build

## Performance, Accessibility, SEO

### Performance

- Use `next/image` + modern formats
- Code-split heavy viz (dynamic imports)
- Avoid shipping large JSON blobs client-side

### Accessibility

- Semantic HTML, focus states, skip-to-content link
- alt text for charts; table summaries where appropriate

### SEO

- Per-page titles/descriptions
- Open Graph images per project
- Sitemap and robots.txt
- Canonical URLs if needed

## Content Pipeline (MDX + Decap CMS)

### Projects: `content/projects/*.mdx`

Frontmatter fields:

- `title`, `date`, `tags`, `summary`, `tech`, `repo`, `cover`, `status`

### Blog: `content/blog/*.mdx`

Frontmatter fields:

- `title`, `date`, `tags`, `summary`, `readingTime`

### Auto-generate

- Project index from frontmatter
- Tag filtering + search (client-side)

### Decap CMS Configuration

- Config: `admin/config.yml`
- Admin UI: `/admin`
- Supports MDX editing via Netlify Identity

## Data & Visualization Standards

- Always show baselines and uncertainty where applicable
- Consistent units, labels, and encodings across charts
- Downloadables for key artifacts:
  - Model cards
  - Notebook links
  - Small CSV samples (sanitized)

## Integration & Automation (CI/CD)

### CI Pipeline (GitHub Actions)

- eslint
- `tsc --noEmit`
- `prettier --check`
- tests (Node.js built-in test runner)
- coverage gate: 100% statements/lines/functions/branches
- `next build` must pass

### Pre-commit (local)

- format + lint staged files
- optional typecheck on commit (or pre-push)

### Netlify Deploy Controls

- Preview deploys for PRs
- Branch deploys for staging (optional)
- Production deploy only from `main` branch

## Netlify Runbooks (operational compliance)

### Document

- Required env vars (and where set in Netlify)
- CLI commands: `netlify login`, `netlify link`, `netlify dev`, `netlify deploy`, `netlify deploy --prod`
- How form submissions are reviewed/handled
- How headers/CSP are tested (curl + Lighthouse)

### Audit

- Build hooks/webhooks
- Allowed deploy branches
- Team access

## Security & Privacy

- No secrets in repo; only env vars in Netlify
- Minimal data collection; explicit privacy note on Contact page
- Dependency hygiene:
  - Pin major versions
  - Routine audits
  - Avoid sketchy MDX plugins

## Launch Checklist (Netlify-specific)

- [ ] ≥ 3 polished case studies using the template
- [ ] Resume PDF uploaded + linked
- [ ] OG/Twitter cards validated
- [ ] Lighthouse > 90 across categories
- [ ] Contact form tested end-to-end (submission + notifications)
- [ ] 100% coverage enforced in CI
- [ ] Netlify deploy verifies:
  - [ ] headers/CSP present
  - [ ] preview deploy URLs smoke-tested
  - [ ] build logs clean and reproducible
- [ ] Decap CMS configured and accessible at `/admin`

## Roadmap

### Week 1

- Next.js + shadcn/ui setup, layout + nav, theming
- Netlify baseline config + preview deploys
- Decap CMS setup with Netlify Identity

### Week 2

- MDX pipeline + project cards + case study template
- Tag filtering + SEO metadata
- Decap CMS content schemas

### Week 3

- Add 2 featured projects + blog index
- Analytics + OG images + performance pass

### Week 4

- Finish projects, finalize About/Resume/Contact
- Accessibility polish + Lighthouse + ship

## Netlify-specific "Gotchas"

1. **Don't rely on local-only behavior** — use `netlify dev` for parity with production
2. **Update CSP immediately** when adding third-party scripts (analytics, embeds)
3. **Keep coverage gates strict**, but isolate UI snapshot tests so they don't become brittle
4. **Ensure package.json has valid `name` and `version`** — npm will fail with "Invalid Version" otherwise
5. **Build dependencies must be in `dependencies`**, not `devDependencies` — Netlify uses `NODE_ENV=production`
