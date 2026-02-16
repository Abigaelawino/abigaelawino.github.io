# Dependency Security Scanning System

This document describes the automated dependency security scanning system implemented for the portfolio website.

## Overview

The security scanning system provides comprehensive vulnerability detection and automated remediation for npm dependencies with the following features:

- **Automated Weekly Scans**: Runs every Sunday at 2 AM UTC via GitHub Actions
- **Risk-Based Classification**: Categorizes vulnerabilities by severity and risk level
- **Automated Patching**: Automatically patches low-risk vulnerabilities
- **Human Review System**: Flags high-risk vulnerabilities for manual review
- **Notification System**: Creates GitHub issues and notifications for critical findings
- **Integration with GitHub Security Advisories**: Leverages official security databases

## Components

### 1. Security Scanner (`scripts/security-scanner.mjs`)

Main scanning engine that performs vulnerability analysis and automated patching.

**Features:**

- Parses npm audit output and categorizes vulnerabilities
- Implements risk-based decision making for auto-patching
- Generates detailed security reports with recommendations
- Handles both direct and indirect dependencies

**Configuration:**

```javascript
const CONFIG = {
  RISK_LEVELS: {
    LOW: { severity: ['low', 'moderate'], autoPatch: true },
    MEDIUM: { severity: ['moderate'], autoPatch: false, requireReview: true },
    HIGH: { severity: ['high', 'critical'], autoPatch: false, requireReview: true },
  },
  SAFE_PACKAGES: ['@types/*', 'eslint-*', 'prettier', 'jest', 'vitest'],
  CRITICAL_PACKAGES: ['next', 'react', 'react-dom', 'express', 'jsonwebtoken'],
};
```

### 2. Security Notifier (`scripts/security-notifier.mjs`)

Handles notification generation for security findings.

**Features:**

- Generates GitHub issue templates with detailed vulnerability information
- Creates Slack notification payloads
- Produces PR comments for dependency changes
- Includes actionable recommendations and severity-based prioritization

### 3. Security Check (`scripts/security-check.mjs`)

Lightweight validation for CI/CD pipelines.

**Features:**

- Content security validation for MDX files
- Basic vulnerability detection
- Integration with existing CI pipeline

### 4. GitHub Workflow (`.github/workflows/security-scan.yml`)

Automated execution environment for security scanning.

**Schedule:**

- Weekly scans: Sundays at 2 AM UTC
- Manual triggers via `workflow_dispatch`
- Automatic runs on PRs affecting dependencies

**Workflow Steps:**

1. Checkout repository with full history
2. Setup Node.js environment
3. Install dependencies securely
4. Run comprehensive security scan
5. Upload security reports as artifacts
6. Create GitHub issues for high/critical vulnerabilities
7. Comment on PRs with security scan results

## Usage

### Running Security Scans

**Manual Full Scan:**

```bash
node scripts/security-scanner.mjs
```

**Quick Security Check:**

```bash
npm run security
```

**Generate Notifications:**

```bash
node scripts/security-notifier.mjs
```

### Reading Security Reports

Security reports are saved to `.security-reports/security-report-YYYY-MM-DD.json` with the following structure:

```json
{
  "scanDate": "2026-02-14",
  "summary": {
    "totalVulnerabilities": 1,
    "autoPatched": 1,
    "patchFailed": 0,
    "requireReview": 0,
    "riskLevel": "LOW"
  },
  "breakdown": {
    "low": 1,
    "moderate": 0,
    "high": 0,
    "critical": 0
  },
  "autoPatched": [...],
  "patchFailures": [...],
  "requireReview": [...]
}
```

## Risk Management Strategy

### Auto-Patching Criteria

Vulnerabilities are automatically patched when:

- Severity is low or moderate
- Package is in safe packages list
- Package is not a critical production dependency
- Fix is available via npm

### Manual Review Requirements

Vulnerabilities require manual review when:

- Severity is high or critical
- Package is in critical packages list (React, Next.js, etc.)
- No automatic fix is available
- Package is a direct production dependency

### Notification Thresholds

- **Issues created automatically**: High and critical severity
- **Slack notifications**: Critical severity (if configured)
- **PR comments**: Any vulnerabilities found in dependency changes

## Integration with Development Workflow

### CI/CD Integration

The security scan is integrated into the CI pipeline:

```bash
npm run ci  # Includes security scan
```

### Development Workflow

1. **During Development**: Run `npm run security` before commits
2. **PR Creation**: Automated security scan runs on dependency changes
3. **Merge**: Security scan must pass for critical vulnerabilities
4. **Deployment**: Weekly scans ensure ongoing security

### Monitoring and Alerting

- **Weekly Reports**: Automated GitHub issues for findings
- **Slack Integration**: Optional real-time notifications
- **Dashboard**: Security reports available as GitHub artifacts

## Configuration and Customization

### Adding Safe Packages

Edit `scripts/security-scanner.mjs` to modify the `SAFE_PACKAGES` array:

```javascript
SAFE_PACKAGES: [
  '@types/*',
  'eslint-*',
  'prettier',
  // Add your safe packages here
];
```

### Modifying Risk Levels

Adjust risk thresholds in the `RISK_LEVELS` configuration:

```javascript
RISK_LEVELS: {
  LOW: {
    severity: ['low'],
    autoPatch: true,
    maxSeverity: 7
  }
  // Customize as needed
}
```

### Slack Integration

Set up Slack notifications by configuring environment variables:

```bash
SLACK_SECURITY_WEBHOOK=your_webhook_url
```

## Best Practices

### Dependency Management

1. **Regular Updates**: Keep dependencies updated to latest stable versions
2. **Review Changes**: Examine security implications of dependency updates
3. **Lock Files**: Use package-lock.json for reproducible builds
4. **Audit Regularly**: Run security scans frequently, not just weekly

### Security Monitoring

1. **Review Reports**: Check weekly security reports promptly
2. **Address High Priority**: Handle high/critical vulnerabilities immediately
3. **Documentation**: Document security decisions and exceptions
4. **Training**: Stay informed about security best practices

### Incident Response

1. **Critical Vulnerabilities**: Patch immediately within 24 hours
2. **High Severity**: Address within 3-5 days
3. **Moderate Severity**: Schedule for next maintenance window
4. **Low Severity**: Monitor and address during regular updates

## Troubleshooting

### Common Issues

**npm audit failures**:

- Check network connectivity
- Verify npm registry access
- Review package-lock.json integrity

**Auto-patching failures**:

- Check if vulnerability is in indirect dependency
- Verify fix availability
- Review package compatibility

**Workflow failures**:

- Check GitHub Actions logs
- Verify environment variables
- Review repository permissions

### Debug Information

Enable verbose logging:

```bash
DEBUG=security:* node scripts/security-scanner.mjs
```

Check recent security reports:

```bash
ls -la .security-reports/
```

Validate npm audit output:

```bash
npm audit --json
```

## Maintenance and Updates

### Regular Maintenance Tasks

1. **Review Configuration**: Update safe/critical package lists quarterly
2. **Update Thresholds**: Adjust risk levels based on project needs
3. **Monitor false positives**: Refine auto-patching logic
4. **Update Documentation**: Keep this document current

### System Updates

1. **Scanner Updates**: Enhance vulnerability detection logic
2. **Notifier Improvements**: Add new notification channels
3. **Workflow Enhancements**: Optimize GitHub Actions performance
4. **Security Best Practices**: Incorporate latest security standards

---

This security scanning system provides comprehensive protection for the portfolio's dependencies while maintaining development productivity through intelligent automation and clear prioritization of security issues.
