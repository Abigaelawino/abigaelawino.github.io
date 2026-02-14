# Netlify Build & Deploy Checklist

This checklist captures all steps for building, testing, and deploying the portfolio website via Netlify CLI so Ralph can verify new renders, rewrite rules, and shadcn/ui updates before publish.

## Prerequisites

### Environment Setup
- [ ] Netlify CLI installed (`npm install -g netlify-cli` or using local version)
- [ ] Logged into Netlify CLI (`netlify login` - already established per README)
- [ ] Site linked (`.netlify/state.json` contains site ID)
- [ ] Node.js dependencies installed (`npm install`)

### Required Environment Variables
Set these in Netlify dashboard or locally for testing:
```bash
# Required for webhooks
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
NETLIFY_BUILD_HOOK=your_build_hook_url_here

# Session management
PARALLEL_SESSIONS=true
SESSION_TIMEOUT=300000
MAX_PARALLEL_SESSIONS=5

# Analytics (optional)
ANALYTICS_DOMAIN=abigaelawino.github.io
ANALYTICS_HOST=https://plausible.io

# Optional: Notifications
SLACK_WEBHOOK_URL=your_slack_webhook_url_here
```

## Build Process

### 1. Pre-build Checks
- [ ] Run linting: `npm run lint`
- [ ] Run security check: `npm run security`
- [ ] Run type checking: `npm run typecheck`
- [ ] Run tests: `npm run test`
- [ ] Validate environment: `node scripts/validate-env.mjs production`

### 2. Static Site Generation
- [ ] Build static assets: `npm run build`
  - This runs `scripts/build.mjs` which:
    - Generates content indexes
    - Renders static HTML pages (home, about, projects, blog, contact, resume)
    - Copies assets to `dist/`
    - Creates sitemap.xml and robots.txt
    - Generates default OG image
- [ ] Verify `dist/` folder structure contains:
  ```
  dist/
  ├── assets/
  │   ├── og.png
  │   └── shell.css
  ├── index.html
  ├── about/
  │   └── index.html
  ├── contact/
  │   └── index.html
  ├── contact/thanks/
  │   └── index.html
  ├── projects/
  │   └── index.html
  ├── blog/
  │   └── index.html
  ├── resume/
  │   ├── index.html
  │   └── abigael-awino-resume.pdf
  ├── robots.txt
  └── sitemap.xml
  ```

### 3. Next.js Build (for API routes/functions)
- [ ] Build Next.js components: `npm run build` (also runs `next build`)
  - This creates `.next/` directory with serverless functions
  - Ensures API routes are properly compiled

### 4. Quality Assurance
- [ ] Run coverage: `npm run coverage`
- [ ] Verify coverage thresholds: `scripts/check-coverage.mjs`
  - >99% statements/lines/functions
  - 95% branches
- [ ] Run shadcn/ui coverage: `npm run shadcn:coverage`

### 5. Pre-deploy Testing
- [ ] Start local server: `npm run start` (serves from `dist/`)
- [ ] Run smoke tests locally: `npm run smoke-test:local`
- [ ] Test all key endpoints:
  - [ ] `/` - Homepage with shadcn/ui components
  - [ ] `/about/` - About page
  - [ ] `/projects/` - Projects listing
  - [ ] `/blog/` - Blog index
  - [ ] `/contact/` - Contact form
  - [ ] `/resume/` - Resume page with PDF download
  - [ ] `/contact/thanks/` - Thank you page

## Deployment Process

### 1. Deploy via Netlify CLI
- [ ] Deploy to production: `npm run deploy`
  - This executes: `npm run build && netlify deploy --prod --dir=dist`
- [ ] Or deploy manually: `netlify deploy --prod --dir=dist`
- [ ] For preview: `netlify deploy --dir=dist` (draft deploy)

### 2. Verification After Deploy
- [ ] Check Netlify deploy logs for errors
- [ ] Run production smoke tests: `npm run smoke-test:prod`
- [ ] Run quick smoke test: `npm run smoke-test:quick`
- [ ] Verify API endpoints are accessible:
  - [ ] `/api/webhooks/build` - GitHub webhook handler
  - [ ] `/api/deployments` - Deployment monitoring
  - [ ] `/api/sessions` - Session management
  - [ ] `/api/optimize` - Asset optimization
  - [ ] `/api/rate-limit` - Rate limiting

### 3. Content Verification
- [ ] Verify shadcn/ui components render correctly:
  - [ ] Card components with proper hover effects
  - [ ] Button variants (primary, secondary, outline, ghost)
  - [ ] Badge components for tags
  - [ ] Responsive design on mobile/desktop
- [ ] Check SEO elements:
  - [ ] Meta titles and descriptions
  - [ ] Open Graph tags
  - [ ] Structured data
  - [ ] Sitemap accessible at `/sitemap.xml`
  - [ ] Robots.txt accessible at `/robots.txt`
- [ ] Verify analytics are working (if configured)
- [ ] Test form submissions (contact form)

## Post-deploy Monitoring

### 1. Function Monitoring
Check Netlify function logs for:
- [ ] Webhook processing errors
- [ ] Session management issues
- [ ] API endpoint errors
- [ ] Asset optimization problems

### 2. Performance Verification
- [ ] Run Lighthouse audit manually if needed
- [ ] Check Core Web Vitals
- [ ] Verify asset compression
- [ ] Test page load speeds

### 3. Security Verification
- [ ] Verify security headers are present
- [ ] Test CSP policy effectiveness
- [ ] Check for mixed content warnings
- [ ] Verify HTTPS redirects work

## Troubleshooting

### Build Issues
1. **Build fails on static generation**
   - Check `scripts/build.mjs` logs
   - Verify content files exist in `content/`
   - Check for missing assets in `assets/`

2. **Next.js build fails**
   - Check for TypeScript errors
   - Verify imports in API routes
   - Check environment variables

### Deploy Issues
1. **Deploy hangs or fails**
   - Check Netlify CLI authentication: `netlify status`
   - Verify site ID in `.netlify/state.json`
   - Check internet connectivity

2. **API routes not working**
   - Verify `.next/` directory was created
   - Check function logs in Netlify dashboard
   - Verify `netlify.toml` redirects are correct

### Runtime Issues
1. **Pages not loading**
   - Check `dist/` folder structure
   - Verify file permissions
   - Check for 404 errors in browser console

2. **Forms not working**
   - Verify `public/__forms.html` exists
   - Check form submission endpoints
   - Verify Netlify Forms is enabled

## Automation

### CI/CD Pipeline
- [ ] GitHub Actions workflow runs on push
- [ ] Automated tests pass
- [ ] Build succeeds
- [ ] Deploy triggers automatically for main branch

### Webhook Automation
- [ ] GitHub webhook configured
- [ ] Build webhook URL set in environment
- [ ] Webhook signature verification working
- [ ] Automated builds trigger on push

## Maintenance

### Regular Tasks
- [ ] Update dependencies: `npm audit fix`
- [ ] Review and update security headers
- [ ] Monitor function usage and limits
- [ ] Check analytics data (if configured)
- [ ] Verify SSL certificates (handled by Netlify)

### Backup and Recovery
- [ ] Content backed up in Git repository
- [ ] Environment variables documented
- [ ] Configuration files version controlled
- [ ] Deployment rollback procedure documented

## Quick Reference Commands

```bash
# Development
npm run dev                    # Start dev server with watch mode
npm run start                  # Serve built dist/ folder

# Building and Testing
npm run build                  # Build static site + Next.js
npm run ci                     # Full CI pipeline (lint, security, test, build)
npm run coverage               # Run test coverage
npm run smoke-test             # Test local endpoints
npm run smoke-test:prod       # Test production site

# Deployment
npm run deploy                # Build and deploy to production
netlify deploy --prod --dir=dist  # Manual production deploy
netlify deploy --dir=dist     # Draft deploy

# Monitoring
netlify status                # Check CLI authentication
netlify logs                  # View function logs
netlify open:admin           # Open Netlify dashboard
```

## Configuration Files

### Key Files to Monitor
- `netlify.toml` - Build configuration, redirects, headers
- `package.json` - Scripts and dependencies
- `scripts/build.mjs` - Static site generation
- `netlify/functions/` - Serverless functions
- `.netlify/state.json` - Site linkage
- `public/__forms.html` - Netlify Forms definitions

### Environment-Specific Notes
- **Production**: Uses `dist/` as publish directory
- **Development**: Uses `.next/` for API routes, `dist/` for static
- **Preview**: Same as production but with deploy preview URLs