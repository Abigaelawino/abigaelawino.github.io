#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

function main() {
  console.log('✅ Local setup starting...');

  if (!existsSync('package.json')) {
    throw new Error('package.json not found. Run from repo root.');
  }

  console.log('📦 Installing dependencies...');
  run('npm install');

  console.log('🧩 Generating content indexes...');
  run('npm run generate:content');

  console.log('✅ Local setup complete.');
  console.log('Next: run `netlify dev` for live QA.');
}

main();
