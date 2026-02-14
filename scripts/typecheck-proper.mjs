import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

console.log('Running TypeScript type checking...');

try {
  // Check if tsc is available
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript type checks passed.');
} catch (error) {
  console.error('❌ TypeScript type checks failed.');
  process.exit(1);
}
