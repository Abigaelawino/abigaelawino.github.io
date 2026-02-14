# Smoke Testing

This directory contains scripts for smoke testing the deployed site endpoints.

## Overview

The smoke testing script (`scripts/smoke-test.mjs`) tests key URLs after each build/deploy cycle to confirm:
- HTTP 200 responses
- Expected content is present  
- No broken paths

## Usage

### Quick Mode (Recommended for CI/CD)
Tests only the main pages for quick feedback:
```bash
npm run smoke-test:quick
```

### Full Testing
Tests all endpoints including API and static assets:
```bash
npm run smoke-test:prod
```

### Local Development
Test against local dev server:
```bash
npm run smoke-test
# or
npm run smoke-test http://localhost:8888
```

### Manual Testing
```bash
node scripts/smoke-test.mjs <base-url> [--quick]
```

## Endpoints Tested

### Main Pages (Quick Mode)
- `/` - Homepage
- `/about/` - About page
- `/projects/` - Projects page
- `/blog/` - Blog page
- `/contact/` - Contact page
- `/resume/` - Resume page
- `/contact/thanks/` - Thank you page

### Full Mode Additional Tests
- API endpoints (`/api/*`)
- Static assets (`/assets/*`, `/robots.txt`, `/sitemap.xml`)
- Redirect loop detection

## CI/CD Integration

Add to your CI pipeline:
```json
{
  "scripts": {
    "smoke-test": "node scripts/smoke-test.mjs",
    "smoke-test:prod": "node scripts/smoke-test.mjs https://abigael-awino-portfolio.netlify.app",
    "smoke-test:quick": "node scripts/smoke-test.mjs https://abigael-awino-portfolio.netlify.app --quick"
  }
}
```

## Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed

This makes it easy to use in CI/CD pipelines where non-zero exit codes indicate failure.

## Expected Behavior

The script should be run after each deployment to verify:
1. All main pages return HTTP 200
2. Expected content is present on each page
3. No redirect loops exist
4. Static assets are accessible

Failed tests indicate issues that need to be addressed before considering the deployment successful.