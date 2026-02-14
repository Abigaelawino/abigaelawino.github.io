# Dependency Security Scanning

This project implements comprehensive automated dependency security scanning with weekly vulnerability detection, automated patching for low-risk issues, and notification systems for high-risk vulnerabilities.

## Overview

The security scanning system provides:

- **Automated weekly scans** via GitHub Actions
- **Risk-based vulnerability classification** (Low, Medium, High, Critical)
- **Automated patching** for safe, low-risk vulnerabilities
- **Human review workflows** for high-risk issues
- **Multi-channel notifications** (GitHub Issues, Slack)
- **Detailed reporting** with historical data
- **Pull request integration** for dependency changes

## Architecture

### Core Components

1. **Security Scanner** (`scripts/security-scanner.mjs`)
   - Main scanning engine with npm audit integration
   - Risk assessment and vulnerability categorization
   - Automated patching for safe dependencies
   - Detailed reporting with recommendations

2. **Security Notifier** (`scripts/security-notifier.mjs`)
   - Generates notification templates for different channels
   - Creates GitHub Issues with detailed vulnerability information
   - Formats Slack messages with appropriate severity indicators
   - Produces PR comments for dependency changes

3. **GitHub Actions Workflow** (`.github/workflows/security-scan.yml`)
   - Weekly scheduled scans (Sundays 2 AM UTC)
   - PR-triggered scans for dependency changes
   - Manual scan triggers
   - Artifact storage for reports

4. **Configuration** (`.security-config.json`)
   - Risk level definitions and thresholds
   - Auto-patching rules and exclusions
   - Notification preferences
   - Integration settings

## Security Levels & Handling

### Risk Classification

| Level      | Severities     | Auto-Patch | Review Required | Action Timeline                     |
| ---------- | -------------- | ---------- | --------------- | ----------------------------------- |
| **LOW**    | Low, Moderate  | ✅         | ❌              | Next maintenance window             |
| **MEDIUM** | Moderate       | ❌         | ✅              | Within 1 week                       |
| **HIGH**   | High, Critical | ❌         | ✅              | Within 3 days (critical: immediate) |

### Package Categories

**Safe for Auto-Patching:**

- Development dependencies (`@types/*`, `eslint-*`, `prettier`)
- Testing tools (`jest`, `vitest`)
- Build tools (`chalk`, `rimraf`, `cross-env`)

**Critical Packages (Require Manual Review):**

- Runtime dependencies (`next`, `react`, `react-dom`)
- Security libraries (`jsonwebtoken`, `bcrypt`, `passport`)
- Server frameworks (`express`)

## Usage

### Manual Security Scan

```bash
# Run comprehensive security scan
npm run security

# Run just the scanner (without notifications)
node scripts/security-scanner.mjs

# Generate notifications from existing report
node scripts/security-notifier.mjs
```

### Configuration

Edit `.security-config.json` to customize:

```json
{
  "security": {
    "scanFrequency": "weekly",
    "autoPatch": {
      "enabled": true,
      "maxSeverity": 7,
      "excludedPackages": ["next", "react"],
      "includedPatterns": ["@types/*", "eslint-*"]
    },
    "notifications": {
      "enabled": true,
      "threshold": {
        "createIssue": "high",
        "immediateNotification": "critical"
      }
    }
  }
}
```

### Integration with CI/CD

The security scan runs automatically:

1. **Weekly**: Every Sunday at 2 AM UTC
2. **PRs**: When `package.json` or lock files change
3. **Manual**: Via workflow_dispatch trigger

## Reports & Notifications

### Security Reports

Reports are generated in `.security-reports/` with structure:

```json
{
  "scanDate": "2025-02-14",
  "summary": {
    "totalVulnerabilities": 5,
    "autoPatched": 2,
    "requireReview": 3,
    "riskLevel": "MEDIUM"
  },
  "breakdown": {
    "low": 1,
    "moderate": 2,
    "high": 1,
    "critical": 1
  },
  "requireReview": [...],
  "autoPatched": [...]
}
```

### GitHub Issues

High/critical vulnerabilities automatically create issues with:

- Detailed vulnerability information
- Severity-specific recommendations
- Action timelines
- Links to security advisories

### Slack Notifications

Configurable Slack messages include:

- Overall risk level indicators
- Vulnerability breakdown counts
- Critical issue mentions
- Color-coded severity levels

### PR Comments

Pull requests changing dependencies receive:

- Scan results summary
- High-priority vulnerability details
- Merge recommendations
- Risk level assessment

## Workflow Examples

### Low-Risk Auto-Patching

```
🔧 Auto-patching eslint-plugin-import (low)
✅ Successfully patched eslint-plugin-import

✅ LOW severity vulnerabilities found - auto-patching attempted
```

### High-Risk Review Required

```
⚠️ HIGH/CITICAL vulnerabilities found - manual review required

High Priority Review Items:
• axios (high): Server-Side Request Forgery (SSRF)
• express (critical): Denial of Service (DoS)
```

### GitHub Issue Creation

Issues are created with:

- Auto-generated titles based on severity
- Structured vulnerability breakdown
- Recommended action items
- Appropriate labels and priority

## Best Practices

### Dependency Management

1. **Regular Updates**: Keep dependencies updated to latest stable versions
2. **Lock Files**: Commit `package-lock.json` to ensure reproducible builds
3. **Review Changes**: Carefully review dependency updates in PRs
4. **Security Scanning**: Run security scans before major releases

### Response Procedures

1. **Critical Vulnerabilities**: Patch immediately with testing
2. **High Vulnerabilities**: Plan patching within 3 days
3. **Moderate Vulnerabilities**: Address in next maintenance window
4. **Low Vulnerabilities**: Monitor and patch when convenient

### Configuration Maintenance

1. **Review Exclusions**: Regularly review critical package exclusions
2. **Update Thresholds**: Adjust risk levels based on project requirements
3. **Test Notifications**: Verify notification channels work correctly
4. **Monitor Reports**: Review security reports weekly

## Troubleshooting

### Common Issues

**Scan Fails:**

- Check network connectivity
- Verify npm registry access
- Check for malformed package.json

**Auto-Patching Fails:**

- Verify package has fixes available
- Check for version conflicts
- Review exclusion lists

**Notifications Not Working:**

- Verify GitHub token permissions
- Check Slack webhook configuration
- Review notification thresholds

### Debug Mode

Run with debug information:

```bash
DEBUG=security:* npm run security
```

### Report Analysis

Examine detailed reports:

```bash
# View latest report
cat .security-reports/security-report-$(date +%Y-%m-%d).json

# Analyze trends
ls -la .security-reports/security-report-*.json | tail -10
```

## Integration Points

### Existing Security Tools

The scanner integrates with:

- **npm audit**: Primary vulnerability source
- **GitHub Security Advisories**: Additional vulnerability context
- **Dependabot**: Complementary automated updates

### Development Workflow

Security scanning fits into:

1. **Development**: Local scans during development
2. **CI/CD**: Automated checks in pull requests
3. **Deployment**: Pre-deployment security validation
4. **Operations**: Weekly maintenance and monitoring

## Monitoring & Alerts

### Key Metrics

- **Vulnerability Count**: Total vulnerabilities over time
- **Auto-Patch Success Rate**: Percentage of successful automated patches
- **Time to Resolution**: Average time to address vulnerabilities
- **Risk Level Trend**: Overall security posture changes

### Alert Escalation

1. **Critical**: Immediate Slack mentions + GitHub Issues
2. **High**: GitHub Issues + Slack notifications
3. **Moderate**: GitHub Issues
4. **Low**: Documentation only

## Compliance & Auditing

### Security Standards

The scanning system supports:

- **OWASP Dependency Check**: Vulnerability detection
- **SOC 2**: Security monitoring and incident response
- **ISO 27001**: Information security management
- **GDPR**: Data protection and privacy

### Audit Trail

All security activities are logged:

- Scan dates and results
- Automated patch actions
- Issue creation and resolution
- Notification delivery

## Future Enhancements

### Planned Features

1. **Enhanced Analytics**: Vulnerability trend analysis
2. **Custom Policies**: Organization-specific security rules
3. **Integration Hub**: Connection with more security tools
4. **Automated Testing**: Patch validation in staging
5. **Compliance Reporting**: Automated compliance documentation

### Extensibility

The system is designed for easy extension:

- Custom risk assessment algorithms
- Additional notification channels
- Integration with external security tools
- Custom report formats and templates
