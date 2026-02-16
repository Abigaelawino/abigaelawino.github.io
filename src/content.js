const { readFileSync, readdirSync, mkdirSync, writeFileSync } = require('node:fs');
const { join, basename } = require('node:path');

const CONTENT_ROOT = 'content';
const PROJECTS_DIR = join(CONTENT_ROOT, 'projects');
const BLOG_DIR = join(CONTENT_ROOT, 'blog');

const projectSchema = {
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
  gallery: 'string[]',
  status: 'string',
};

const blogSchema = {
  title: 'string',
  date: 'date',
  tags: 'string[]',
  summary: 'string',
  readingTime: 'number',
};

function parseScalar(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  if (trimmed === 'true') {
    return true;
  }

  if (trimmed === 'false') {
    return false;
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (inner.length === 0) {
      return [];
    }

    return inner
      .split(',')
      .map(part => parseScalar(part))
      .map(part => String(part));
  }

  return trimmed;
}

function parseFrontmatter(frontmatterBlock) {
  const data = {};
  const lines = frontmatterBlock.split('\n');
  let activeListKey = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      continue;
    }

    if (/^\s+-\s+/.test(line)) {
      if (!activeListKey) {
        throw new Error(`Invalid list entry without a key: "${line}"`);
      }

      const listValue = line.replace(/^\s*-\s+/, '');
      data[activeListKey].push(String(parseScalar(listValue)));
      continue;
    }

    const match = line.match(/^([A-Za-z][\w-]*):(?:\s*(.*))?$/);
    if (!match) {
      throw new Error(`Invalid frontmatter line: "${line}"`);
    }

    const [, key, rawValue = ''] = match;
    const value = rawValue.trim();

    if (value.length === 0) {
      data[key] = [];
      activeListKey = key;
      continue;
    }

    data[key] = parseScalar(value);
    activeListKey = null;
  }

  return data;
}

function splitFrontmatter(sourceText) {
  const lines = sourceText.split('\n');
  if (lines[0]?.trim() !== '---') {
    throw new Error('MDX file must start with a frontmatter block delimited by ---');
  }

  let closingIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '---') {
      closingIndex = i;
      break;
    }
  }

  if (closingIndex === -1) {
    throw new Error('Frontmatter closing delimiter (---) not found');
  }

  return {
    frontmatter: lines.slice(1, closingIndex).join('\n'),
    body: lines
      .slice(closingIndex + 1)
      .join('\n')
      .trim(),
  };
}

function assertSchema(entry, schema, sourcePath) {
  for (const [field, expectedType] of Object.entries(schema)) {
    if (!(field in entry)) {
      throw new Error(`${sourcePath}: missing required frontmatter field "${field}"`);
    }

    const value = entry[field];

    if (expectedType === 'string') {
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${sourcePath}: field "${field}" must be a non-empty string`);
      }
      continue;
    }

    if (expectedType === 'number') {
      if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
        throw new Error(`${sourcePath}: field "${field}" must be a positive number`);
      }
      continue;
    }

    if (expectedType === 'date') {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error(`${sourcePath}: field "${field}" must use YYYY-MM-DD format`);
      }

      const parsed = new Date(`${value}T00:00:00.000Z`);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(`${sourcePath}: field "${field}" must be a valid date`);
      }
      continue;
    }

    if (expectedType === 'string[]') {
      if (
        !Array.isArray(value) ||
        value.length === 0 ||
        value.some(item => typeof item !== 'string' || item.trim().length === 0)
      ) {
        throw new Error(`${sourcePath}: field "${field}" must be a non-empty string array`);
      }
      continue;
    }
  }
}

function parseMdxFile(filePath) {
  const source = readFileSync(filePath, 'utf8');
  const { frontmatter, body } = splitFrontmatter(source);
  const data = parseFrontmatter(frontmatter);

  if (body.length === 0) {
    throw new Error(`${filePath}: MDX body must not be empty`);
  }

  return {
    frontmatter: data,
    body,
  };
}

function loadCollectionEntries(collectionDir, schema) {
  const entries = [];

  for (const name of readdirSync(collectionDir)) {
    if (!name.endsWith('.mdx')) {
      continue;
    }

    const filePath = join(collectionDir, name);
    const slug = basename(name, '.mdx');
    const parsed = parseMdxFile(filePath);

    assertSchema(parsed.frontmatter, schema, filePath);

    entries.push({
      slug,
      frontmatter: parsed.frontmatter,
      content: parsed.body,
    });
  }

  return entries.sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));
}

function generateContentIndexes(options = {}) {
  const outputDir = options.outputDir ?? join('src', 'generated');

  const projects = loadCollectionEntries(PROJECTS_DIR, projectSchema);
  const blog = loadCollectionEntries(BLOG_DIR, blogSchema);

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, 'projects-index.json'), `${JSON.stringify(projects, null, 2)}\n`);
  writeFileSync(join(outputDir, 'blog-index.json'), `${JSON.stringify(blog, null, 2)}\n`);

  return { projects, blog, outputDir };
}

module.exports = {
  BLOG_DIR,
  CONTENT_ROOT,
  PROJECTS_DIR,
  blogSchema,
  generateContentIndexes,
  loadCollectionEntries,
  parseFrontmatter,
  parseMdxFile,
  projectSchema,
  splitFrontmatter,
};
