const test = require('node:test');
const assert = require('node:assert/strict');

const { BLOG_DIR, blogSchema, loadCollectionEntries, parseMdxFile } = require('../src/content.js');
const {
  formatReadingTime,
  renderBlogCard,
  renderBlogIndexPage,
  renderBlogPostPage,
} = require('../src/blog.js');

const blogPosts = loadCollectionEntries(BLOG_DIR, blogSchema);

test('reading time formatter returns a min-read label', () => {
  assert.equal(formatReadingTime(7), '7 min read');
  assert.equal(formatReadingTime(0), '1 min read');
});

test('blog card renders slug route and reading-time metadata', () => {
  const card = renderBlogCard(blogPosts[0]);

  assert.match(card, /data-blog-card=/);
  assert.match(card, /\/blog\//);
  assert.match(card, /min read/);
  assert.match(card, /data-analytics-event="blog_post_open"/);
});

test('blog card renders when tags are missing', () => {
  const card = renderBlogCard({
    ...blogPosts[0],
    tags: undefined,
  });

  assert.match(card, /data-blog-card=/);
  assert.match(card, /blog-card__tags/);
});

test('blog index page renders list hook and links to posts', () => {
  const page = renderBlogIndexPage(blogPosts);

  assert.match(page, /data-blog-index-page/);
  assert.match(page, /data-blog-post-list/);
  assert.match(page, /href="\/blog\/model-monitoring-lessons"/);
  assert.match(page, /7 min read/);
});

test('blog post page renders mdx body and tags when provided', () => {
  const source = parseMdxFile('content/blog/model-monitoring-lessons.mdx');
  const page = renderBlogPostPage(blogPosts[0], source.body);

  assert.match(page, /data-blog-post-page=/);
  assert.match(page, /data-blog-post-body/);
  assert.match(page, /drift detection and production response workflows/);
  assert.match(page, /data-blog-post-tags/);
});

test('blog post page omits tags hook when tags are empty', () => {
  const page = renderBlogPostPage({
    ...blogPosts[0],
    tags: [],
  });

  assert.doesNotMatch(page, /data-blog-post-tags/);
});

test('blog post page omits tags hook when tags is not an array', () => {
  const page = renderBlogPostPage({
    ...blogPosts[0],
    tags: 'ml',
  });

  assert.doesNotMatch(page, /data-blog-post-tags/);
});
