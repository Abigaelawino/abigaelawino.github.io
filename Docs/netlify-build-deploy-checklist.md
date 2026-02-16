# Netlify Build & Deploy Checklist

This checklist reflects the current Next.js + Netlify runtime setup.

## Prerequisites

- Netlify CLI installed
- Logged into Netlify CLI (`netlify login`)
- Site linked (`.netlify/state.json`)
- Dependencies installed (`npm install`)

## Build

1. Pre-build checks
   - `npm run lint`
   - `npm run security`
   - `npm run typecheck`
   - `npm run test`

2. Build
   - `npm run build`
   - Confirms `.next/` output is created

3. Coverage
   - `npm run coverage`
   - Enforces strict thresholds via `scripts/check-coverage.mjs`

## Local QA

1. Netlify parity
   - `netlify dev`
   - Confirm local proxy at `http://localhost:8888`

2. Key routes
   - `/`
   - `/about`
   - `/projects`
   - `/projects/<slug>`
   - `/blog`
   - `/blog/<slug>`
   - `/contact`
   - `/contact/thanks`
   - `/resume`
   - `/sitemap.xml`
   - `/robots.txt`
   - `/admin` (Decap CMS)

## Deploy

- Production deploy: `netlify deploy --prod`
- Preview deploy: `netlify deploy`
- Check logs in Netlify UI for build/runtime errors

## Post-deploy checks

- Verify security headers and CSP
- Confirm CMS loads at `/admin`
- Smoke test contact form submission
- Verify OG image at `/assets/og.png`
