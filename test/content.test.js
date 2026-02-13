const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');

const {
  generateContentIndexes,
  loadCollectionEntries,
  PROJECTS_DIR,
  BLOG_DIR,
  parseFrontmatter,
  splitFrontmatter,
  parseMdxFile,
} = require('../src/content.js');

test('content collections load and validate frontmatter schema', () => {
  const projects = loadCollectionEntries(PROJECTS_DIR, {
    title: 'string',
    date: 'date',
    tags: 'string[]',
    summary: 'string',
    caseStudyData: 'string',
    caseStudyMethods: 'string',
    caseStudyResults: 'string',
    caseStudyReproducibility: 'string',
    caseStudyReflection: 'string',
    tech: 'string[]',
    repo: 'string',
    cover: 'string',
    status: 'string',
  });

  const blog = loadCollectionEntries(BLOG_DIR, {
    title: 'string',
    date: 'date',
    tags: 'string[]',
    summary: 'string',
    readingTime: 'number',
  });

  assert.ok(projects.length > 0);
  assert.ok(blog.length > 0);
  assert.equal(typeof projects[0].slug, 'string');
  assert.equal(typeof blog[0].slug, 'string');
});

test('generateContentIndexes writes projects and blog index JSON files', () => {
  const outputDir = mkdtempSync(join(tmpdir(), 'content-index-'));
  const result = generateContentIndexes({ outputDir });

  assert.ok(result.projects.length > 0);
  assert.ok(result.blog.length > 0);

  const projectsIndex = JSON.parse(readFileSync(join(outputDir, 'projects-index.json'), 'utf8'));
  const blogIndex = JSON.parse(readFileSync(join(outputDir, 'blog-index.json'), 'utf8'));

  assert.equal(projectsIndex.length, result.projects.length);
  assert.equal(blogIndex.length, result.blog.length);
});

test('frontmatter parsing supports scalars, lists, and list blocks', () => {
  const frontmatter = [
    'title: \"Quoted Title\"',
    'published: true',
    'flag: false',
    'readingTime: 7',
    'tags: [ml, analytics]',
    'tech:',
    '  - node',
    '  - \"TypeScript\"',
    '',
  ].join('\n');

  const parsed = parseFrontmatter(frontmatter);
  assert.equal(parsed.title, 'Quoted Title');
  assert.equal(parsed.published, true);
  assert.equal(parsed.flag, false);
  assert.equal(parsed.readingTime, 7);
  assert.deepEqual(parsed.tags, ['ml', 'analytics']);
  assert.deepEqual(parsed.tech, ['node', 'TypeScript']);
});

test('frontmatter parsing supports empty list values', () => {
  const parsed = parseFrontmatter('tags: []');
  assert.deepEqual(parsed.tags, []);
});

test('frontmatter parsing rejects invalid list entry without a key', () => {
  assert.throws(() => parseFrontmatter('  - orphan'), /Invalid list entry without a key/);
});

test('frontmatter parsing rejects invalid key syntax', () => {
  assert.throws(() => parseFrontmatter('@@bad'), /Invalid frontmatter line/);
});

test('splitFrontmatter parses valid MDX and rejects missing delimiters', () => {
  const source = ['---', 'title: Test', '---', 'Body'].join('\n');
  const parts = splitFrontmatter(source);

  assert.equal(parts.frontmatter.trim(), 'title: Test');
  assert.equal(parts.body.trim(), 'Body');

  assert.throws(() => splitFrontmatter('title: missing dashes'), /must start with a frontmatter block/);
  assert.throws(() => splitFrontmatter(['---', 'title: Test', 'Body'].join('\n')), /closing delimiter/);
});

test('parseMdxFile rejects empty bodies and schema validation failures via loadCollectionEntries', () => {
  const dir = mkdtempSync(join(tmpdir(), 'content-invalid-'));
  mkdirSync(join(dir, 'projects'), { recursive: true });

  const emptyBodyPath = join(dir, 'projects', 'empty-body.mdx');
  writeFileSync(emptyBodyPath, ['---', 'title: Example', 'date: 2026-01-01', 'tags: [ml]', 'summary: ok', 'caseStudyData: ok', 'caseStudyMethods: ok', 'caseStudyResults: ok', 'caseStudyReproducibility: ok', 'caseStudyReflection: ok', 'tech: [node]', 'repo: https://example.com', 'cover: /cover.png', 'status: draft', '---', ''].join('\n'));

  assert.throws(() => parseMdxFile(emptyBodyPath), /MDX body must not be empty/);

  const badDatePath = join(dir, 'projects', 'bad-date.mdx');
  writeFileSync(badDatePath, ['---', 'title: Example', 'date: 2026/01/01', 'tags: [ml]', 'summary: ok', 'caseStudyData: ok', 'caseStudyMethods: ok', 'caseStudyResults: ok', 'caseStudyReproducibility: ok', 'caseStudyReflection: ok', 'tech: [node]', 'repo: https://example.com', 'cover: /cover.png', 'status: draft', '---', 'Body'].join('\n'));

  assert.throws(
    () =>
      loadCollectionEntries(join(dir, 'projects'), {
        title: 'string',
        date: 'date',
        tags: 'string[]',
        summary: 'string',
        caseStudyData: 'string',
        caseStudyMethods: 'string',
        caseStudyResults: 'string',
        caseStudyReproducibility: 'string',
        caseStudyReflection: 'string',
        tech: 'string[]',
        repo: 'string',
        cover: 'string',
        status: 'string',
      }),
    /must use YYYY-MM-DD format/,
  );
});

test('schema validation reports missing and invalid fields', () => {
  const dir = mkdtempSync(join(tmpdir(), 'content-schema-'));
  mkdirSync(join(dir, 'blog'), { recursive: true });

  // Non-mdx files should be ignored.
  writeFileSync(join(dir, 'blog', 'note.txt'), 'ignore me');

  // Missing required field (summary).
  writeFileSync(
    join(dir, 'blog', 'missing-field.mdx'),
    ['---', 'title: Test', 'date: 2026-01-01', 'tags: [ml]', 'readingTime: 7', '---', 'Body'].join('\n'),
  );

  assert.throws(
    () =>
      loadCollectionEntries(join(dir, 'blog'), {
        title: 'string',
        date: 'date',
        tags: 'string[]',
        summary: 'string',
        readingTime: 'number',
      }),
    /missing required frontmatter field "summary"/,
  );

  // Invalid date that matches the format but is not a real date.
  writeFileSync(
    join(dir, 'blog', 'bad-real-date.mdx'),
    ['---', 'title: Test', 'date: 2026-13-40', 'tags: [ml]', 'summary: ok', 'readingTime: 7', '---', 'Body'].join('\n'),
  );

  assert.throws(
    () =>
      loadCollectionEntries(join(dir, 'blog'), {
        title: 'string',
        date: 'date',
        tags: 'string[]',
        summary: 'string',
        readingTime: 'number',
      }),
    /must be a valid date/,
  );

  // Invalid number (must be positive).
  writeFileSync(
    join(dir, 'blog', 'bad-number.mdx'),
    ['---', 'title: Test', 'date: 2026-01-01', 'tags: [ml]', 'summary: ok', 'readingTime: 0', '---', 'Body'].join('\n'),
  );

  assert.throws(
    () =>
      loadCollectionEntries(join(dir, 'blog'), {
        title: 'string',
        date: 'date',
        tags: 'string[]',
        summary: 'string',
        readingTime: 'number',
      }),
    /must be a positive number/,
  );

  // Invalid string[] (must be non-empty).
  writeFileSync(
    join(dir, 'blog', 'bad-array.mdx'),
    ['---', 'title: Test', 'date: 2026-01-01', 'tags: []', 'summary: ok', 'readingTime: 7', '---', 'Body'].join('\n'),
  );

  assert.throws(
    () =>
      loadCollectionEntries(join(dir, 'blog'), {
        title: 'string',
        date: 'date',
        tags: 'string[]',
        summary: 'string',
        readingTime: 'number',
      }),
    /must be a non-empty string array/,
  );
});

test('schema validation rejects whitespace-only string', () => {
  const dir = mkdtempSync(join(tmpdir(), 'content-whitespace-'));
  mkdirSync(join(dir, 'blog'), { recursive: true });

  writeFileSync(
    join(dir, 'blog', 'whitespace-title.mdx'),
    ['---', 'title: "   "', 'date: 2026-01-01', 'tags: [ml]', 'summary: ok', 'readingTime: 7', '---', 'Body'].join('\n'),
  );

  assert.throws(
    () =>
      loadCollectionEntries(join(dir, 'blog'), {
        title: 'string',
        date: 'date',
        tags: 'string[]',
        summary: 'string',
        readingTime: 'number',
      }),
    /must be a non-empty string/,
  );
});

test('loadCollectionEntries skips non-mdx files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'content-skip-'));
  mkdirSync(join(dir, 'blog'), { recursive: true });

  writeFileSync(join(dir, 'blog', 'readme.txt'), 'ignore me');
  writeFileSync(join(dir, 'blog', 'data.json'), '{"ignore": true}');
  writeFileSync(
    join(dir, 'blog', 'valid.mdx'),
    ['---', 'title: Valid', 'date: 2026-01-01', 'tags: [test]', 'summary: ok', 'readingTime: 5', '---', 'Body'].join('\n'),
  );

  const entries = loadCollectionEntries(join(dir, 'blog'), {
    title: 'string',
    date: 'date',
    tags: 'string[]',
    summary: 'string',
    readingTime: 'number',
  });

  assert.equal(entries.length, 1);
  assert.equal(entries[0].slug, 'valid');
});
