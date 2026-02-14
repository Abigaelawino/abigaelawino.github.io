import { existsSync } from 'node:fs';

const requiredEnvVars = {
  production: ['NODE_ENV'],
  development: ['NODE_ENV'],
  ci: [
    // CI has different requirements - NODE_ENV is set by the workflow
  ],
  webhook: ['GITHUB_WEBHOOK_SECRET', 'NETLIFY_BUILD_HOOK'],
};

const optionalEnvVars = {
  production: ['NETLIFY_BUILD_HOOK'],
};

function validateEnvironment(context = 'production') {
  const errors = [];
  const warnings = [];

  // Check required environment variables
  const required = requiredEnvVars[context] || requiredEnvVars.production;
  for (const envVar of required) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Check optional environment variables
  const optional = optionalEnvVars[context] || [];
  for (const envVar of optional) {
    if (!process.env[envVar]) {
      warnings.push(`Missing optional environment variable: ${envVar}`);
    }
  }

  // Validate specific variable values
  if (
    process.env.NODE_ENV &&
    !['development', 'production', 'test'].includes(process.env.NODE_ENV)
  ) {
    errors.push(
      `Invalid NODE_ENV value: ${process.env.NODE_ENV}. Must be one of: development, production, test`
    );
  }

  // Security-specific validations
  if (process.env.GITHUB_WEBHOOK_SECRET && process.env.GITHUB_WEBHOOK_SECRET.length < 32) {
    warnings.push('GITHUB_WEBHOOK_SECRET should be at least 32 characters long for security');
  }

  return { errors, warnings };
}

function printValidation(errors, warnings) {
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Environment validation passed');
    return true;
  }

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   • ${warning}`));
  }

  if (errors.length > 0) {
    console.log('❌ Errors:');
    errors.forEach(error => console.log(`   • ${error}`));
    return false;
  }

  return true;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const context = process.argv[2] || 'production';
  console.log(`Validating environment for context: ${context}`);

  const { errors, warnings } = validateEnvironment(context);
  const passed = printValidation(errors, warnings);

  if (!passed) {
    process.exit(1);
  }
}

export { validateEnvironment, printValidation };
