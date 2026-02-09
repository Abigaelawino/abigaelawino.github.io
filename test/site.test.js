const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getSiteTitle,
  renderAboutPage,
  renderHomePage,
  renderBlogCard,
  renderBlogIndexPage,
  renderBlogPostPage,
  renderContactPage,
  renderResumePage,
} = require('../src/index.js');

test('getSiteTitle returns a non-empty string', () => {
  const title = getSiteTitle();
  assert.equal(typeof title, 'string');
  assert.ok(title.length > 0);
});

test('index exports home page renderer', () => {
  assert.equal(typeof renderHomePage, 'function');
});

test('index exports about page renderer', () => {
  assert.equal(typeof renderAboutPage, 'function');
});

test('index exports blog page renderers', () => {
  assert.equal(typeof renderBlogCard, 'function');
  assert.equal(typeof renderBlogIndexPage, 'function');
  assert.equal(typeof renderBlogPostPage, 'function');
});

test('index exports contact page renderer', () => {
  assert.equal(typeof renderContactPage, 'function');
});

test('index exports resume page renderer', () => {
  assert.equal(typeof renderResumePage, 'function');
});
