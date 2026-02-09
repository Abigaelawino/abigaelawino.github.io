import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getSiteTitle } = require('../src/index.js');
const { generateContentIndexes } = require('../src/content.js');

assert.equal(typeof getSiteTitle, 'function', 'getSiteTitle must be a function');
assert.equal(typeof getSiteTitle(), 'string', 'getSiteTitle() must return a string');
assert.equal(typeof generateContentIndexes, 'function', 'generateContentIndexes must be a function');

console.log('Type checks passed.');
