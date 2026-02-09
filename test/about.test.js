const test = require('node:test');
const assert = require('node:assert/strict');

const { DEFAULT_ABOUT_CONTENT, renderAboutPage } = require('../src/about.js');

test('about page renders concise bio with strengths and toolkit sections', () => {
  const page = renderAboutPage();

  assert.match(page, /data-about-page/);
  assert.match(page, /About/);
  assert.match(page, /data-about-strengths/);
  assert.match(page, /data-about-toolkit/);

  for (const strength of DEFAULT_ABOUT_CONTENT.strengths) {
    assert.match(page, new RegExp(strength.replaceAll('.', '\\.')));
  }

  for (const tool of DEFAULT_ABOUT_CONTENT.toolkit) {
    assert.match(page, new RegExp(tool.replaceAll('+', '\\+')));
  }
});

test('about page keeps mobile-first toolkit layout with desktop enhancement', () => {
  const page = renderAboutPage();

  assert.match(page, /\.about-toolkit \{ display: grid; gap: 0\.5rem; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(page, /@media \(min-width: 48rem\)/);
  assert.match(page, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
});

test('about page omits speaking and publications section when data is not provided', () => {
  const page = renderAboutPage({
    bio: 'Focused on robust experimentation and deployment.',
    strengths: ['Modeling', 'Communication'],
    toolkit: ['Python', 'SQL'],
  });

  assert.doesNotMatch(page, /data-about-public-profile/);
  assert.doesNotMatch(page, /Speaking &amp; Publications/);
});

test('about page renders optional speaking and publication entries when present', () => {
  const page = renderAboutPage({
    speaking: ['MLOps Meetup 2025: Practical model monitoring'],
    publications: ['Model Monitoring Lessons in Production (2025)'],
  });

  assert.match(page, /data-about-public-profile/);
  assert.match(page, /Speaking &amp; Publications/);
  assert.match(page, /MLOps Meetup 2025: Practical model monitoring/);
  assert.match(page, /Model Monitoring Lessons in Production \(2025\)/);
});

test('about page renders speaking block without publications when only speaking is provided', () => {
  const page = renderAboutPage({
    speaking: ['Data Science Summit: Shipping reliable models'],
    publications: [],
  });

  assert.match(page, /data-about-public-profile/);
  assert.match(page, /<h3 class="about-section__subtitle">Speaking<\/h3>/);
  assert.match(page, /Data Science Summit: Shipping reliable models/);
  assert.doesNotMatch(page, /<h3 class="about-section__subtitle">Publications<\/h3>/);
});

test('about page renders publications block without speaking when only publications are provided', () => {
  const page = renderAboutPage({
    speaking: [],
    publications: ['Analytics Playbook (2024)'],
  });

  assert.match(page, /data-about-public-profile/);
  assert.match(page, /<h3 class="about-section__subtitle">Publications<\/h3>/);
  assert.match(page, /Analytics Playbook \(2024\)/);
  assert.doesNotMatch(page, /<h3 class="about-section__subtitle">Speaking<\/h3>/);
});

test('about page tolerates non-array strengths and toolkit inputs', () => {
  const page = renderAboutPage({
    strengths: 'not-an-array',
    toolkit: null,
    speaking: 'not-an-array',
    publications: null,
  });

  assert.match(page, /data-about-strengths/);
  assert.match(page, /data-about-toolkit/);
  assert.doesNotMatch(page, /data-about-public-profile/);
});
