#!/usr/bin/env node

import { execSync } from 'node:child_process';

const startedAt = new Date();
console.log(`\n[refresh:live] Starting MDX refresh at ${startedAt.toLocaleString()}`);

try {
  execSync('npm run generate:content', { stdio: 'inherit' });
  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();
  console.log('\n[refresh:live] ✅ Success');
  console.log(`[refresh:live] Completed at ${finishedAt.toLocaleString()} (${durationMs}ms)`);
  console.log('[refresh:live] If using netlify dev, refresh the browser to see changes.');
} catch (error) {
  console.error('\n[refresh:live] ❌ Failed to refresh live view.');
  if (error instanceof Error) {
    console.error(`[refresh:live] Error: ${error.message}`);
  }
  process.exit(1);
}
