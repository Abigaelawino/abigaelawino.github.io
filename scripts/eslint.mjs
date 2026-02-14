import { execSync } from 'node:child_process';

console.log('Running ESLint...');

try {
  // Run ESLint with specific directories to avoid processed files
  const directories = ['src', 'scripts', 'test', 'app', 'components', 'lib'];
  const command = `npx eslint ${directories.join(' ')} --ext .js,.mjs,.cjs,.ts,.tsx --max-warnings=999`;

  execSync(command, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  console.log('✅ ESLint checks passed.');
} catch (error) {
  console.error('❌ ESLint checks failed.');
  process.exit(1);
}
