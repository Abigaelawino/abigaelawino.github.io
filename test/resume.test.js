const test = require('node:test');
const assert = require('node:assert/strict');

const { DEFAULT_RESUME_ASSET_PATH, renderResumePage } = require('../src/resume.js');

test('resume page renders core sections and download link', () => {
  const page = renderResumePage();

  assert.match(page, /data-resume-page/);
  assert.match(page, /data-resume-core-skills/);
  assert.match(page, /data-resume-highlights/);
  assert.match(page, /data-resume-note/);
  assert.match(page, /Resume/);
  assert.match(page, new RegExp(DEFAULT_RESUME_ASSET_PATH.replace(/\//g, '\\/')));
  assert.match(page, /data-analytics-event="resume_download"/);
});

test('resume page renders custom skills, highlights, and nav links', () => {
  const custom = {
    headline: 'Data Ops Engineer',
    summary: 'Precision instrumentation for ML delivery.',
    coreSkills: ['Data modeling', 'Streaming'],
    experienceHighlights: ['Shift to ML observability'],
    nextLinks: [
      { label: 'Projects', href: '/projects' },
      { label: 'Contact', href: '/contact' },
    ],
  };

  const page = renderResumePage(custom);

  assert.match(page, /Data Ops Engineer/);
  assert.match(page, /Precision instrumentation for ML delivery./);
  assert.match(page, /Data modeling/);
  assert.match(page, /Streaming/);
  assert.match(page, /Shift to ML observability/);
  assert.match(page, /href="\/projects"/);
  assert.match(page, /href="\/contact"/);
});

test('resume page tolerates non-array values without throwing', () => {
  const page = renderResumePage({
    coreSkills: 'not-an-array',
    experienceHighlights: null,
    nextLinks: 'not-an-array',
  });

  assert.match(page, /data-resume-core-skills/);
  assert.match(page, /data-resume-highlights/);
  assert.match(page, /Download PDF/);
});
