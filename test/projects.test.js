const test = require('node:test');
const assert = require('node:assert/strict');

const { PROJECTS_DIR, loadCollectionEntries, projectSchema } = require('../src/content.js');
const {
  CASE_STUDY_SECTIONS,
  SUPPORTED_PROJECT_FILTERS,
  filterProjectsByTag,
  renderProjectCaseStudy,
  renderProjectCard,
  renderProjectsPage,
} = require('../src/projects.js');

const projects = loadCollectionEntries(PROJECTS_DIR, projectSchema);

test('supported project filters include required tag categories', () => {
  const filterValues = SUPPORTED_PROJECT_FILTERS.map(filter => filter.value);

  assert.deepEqual(filterValues, ['ml', 'analytics', 'visualization', 'nlp', 'time-series']);
});

test('projects can be filtered by normalized tag aliases', () => {
  const timeSeriesProjects = filterProjectsByTag(projects, 'time series');
  assert.ok(timeSeriesProjects.length > 0);
  assert.ok(
    timeSeriesProjects.every(project => project.tags.join(' ').toLowerCase().includes('time'))
  );

  const nlpProjects = filterProjectsByTag(projects, 'nlp');
  assert.ok(nlpProjects.length > 0);
});

test('projects filter returns all projects when tag is "all"', () => {
  const allProjects = filterProjectsByTag(projects, 'all');

  assert.equal(allProjects.length, projects.length);
  assert.deepEqual(allProjects, projects);
});

test('project card includes case study CTA and repo link', () => {
  const card = renderProjectCard(projects[0]);

  assert.match(card, /Read case study/);
  assert.match(card, /View repo/);
  assert.match(card, /data-project-card/);
  assert.match(card, /data-analytics-event="projects_case_study_click"/);
  assert.match(card, /data-analytics-event="projects_repo_click"/);
});

test('projects page renders filter toolbar and cards grid', () => {
  const page = renderProjectsPage(projects);

  assert.match(page, /aria-label="Project tag filters"/);
  assert.match(page, /data-projects-grid/);
  assert.match(page, /data-filter="ml"/);
  assert.match(page, /data-filter="nlp"/);
  assert.match(page, /data-filter="time-series"/);
  assert.match(page, /data-analytics-event="projects_filter_click"/);
});

test('project case study renders all required sections and repo link', () => {
  const caseStudy = renderProjectCaseStudy(projects[0]);

  assert.equal(CASE_STUDY_SECTIONS.length, 6);
  assert.match(caseStudy, /data-case-study=/);
  assert.match(caseStudy, /Summary/);
  assert.match(caseStudy, /Data/);
  assert.match(caseStudy, /Methods/);
  assert.match(caseStudy, /Results/);
  assert.match(caseStudy, /Reproducibility/);
  assert.match(caseStudy, /Reflection/);
  assert.match(caseStudy, /View source repository/);
  assert.match(caseStudy, /data-analytics-event="case_study_repo_click"/);
});
