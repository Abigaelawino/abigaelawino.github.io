const test = require('node:test');
const assert = require('node:assert/strict');

const { PROJECTS_DIR, loadCollectionEntries, projectSchema } = require('../src/content.js');
const { DEFAULT_HOME_LINKS, renderHomePage } = require('../src/home.js');

const projects = loadCollectionEntries(PROJECTS_DIR, projectSchema);

test('home page renders hero value proposition and primary CTA links', () => {
  const page = renderHomePage(projects[0]);

  assert.match(page, /data-home-page/);
  assert.match(
    page,
    /Data science solutions from exploratory insight to production-ready outcomes\./
  );
  assert.match(page, /Primary profile links/);
  assert.match(page, /Resume/);
  assert.match(page, /GitHub/);
  assert.match(page, /LinkedIn/);
  assert.match(page, /data-analytics-event="home_resume_download"/);
  assert.match(page, /data-analytics-event="home_github_click"/);
  assert.match(page, /data-analytics-event="home_linkedin_click"/);
  assert.match(page, new RegExp(DEFAULT_HOME_LINKS.resume.replaceAll('/', '\\/')));
  assert.match(page, /https:\/\/github\.com\/abigaelawino/);
  assert.match(page, /https:\/\/www\.linkedin\.com\/in\/abigaelawino\//);
});

test('home page renders featured project with case study and repository CTAs', () => {
  const featured = projects[1];
  const page = renderHomePage(featured);

  assert.match(page, /Featured project/);
  assert.match(page, new RegExp(featured.title));
  assert.match(page, new RegExp(`\\/projects\\/${featured.slug}`));
  assert.match(page, /Read case study/);
  assert.match(page, /data-analytics-event="home_featured_case_study_click"/);
  assert.match(page, new RegExp(featured.repo.replaceAll('/', '\\/')));
  assert.match(page, /View repository/);
  assert.match(page, /data-analytics-event="home_featured_repo_click"/);
});

test('home page uses mobile-first behavior for CTA layout', () => {
  const page = renderHomePage(projects[0]);

  assert.match(
    page,
    /\.home-hero__links \{ display: grid; gap: 0\.6rem; grid-template-columns: 1fr; \}/
  );
  assert.match(page, /@media \(min-width: 48rem\)/);
  assert.match(page, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
});

test('home page falls back when a featured project is unavailable', () => {
  const page = renderHomePage();

  assert.match(page, /Project spotlight coming soon/);
  assert.match(page, /Browse projects/);
  assert.match(page, /href="\/projects"/);
});
