import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { generateContentIndexes } = require('../src/content.js');

const outputDir = join('src', 'generated');
const { projects, blog } = generateContentIndexes({ outputDir });

console.log(`Generated content indexes: ${projects.length} projects, ${blog.length} blog posts.`);
