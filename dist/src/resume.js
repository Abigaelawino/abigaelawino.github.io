const { escapeHtml } = require('./utils/escape-html.js');

const DEFAULT_RESUME_ASSET_PATH = '/resume/abigael-awino-resume.pdf';

const DEFAULT_RESUME_CONTENT = {
  headline: 'Data Scientist | Machine Learning | Analytics',
  summary:
    'I build practical machine learning and analytics systems that move from prototype to production with clear success metrics, reliable pipelines, and stakeholder-ready communication.',
  coreSkills: [
    'Python, SQL, pandas, scikit-learn, PyTorch',
    'Experiment design, evaluation, and baseline-first modeling',
    'Data pipelines, reproducibility, and monitoring',
    'Dashboards and decision support (Tableau / Power BI)',
  ],
  experienceHighlights: [
    'Translate ambiguous business questions into scoped data workstreams and measurable outcomes.',
    'Deliver models and analytics that are explainable, validated, and production-aware.',
    'Partner cross-functionally to ship insights into real workflows (dashboards, alerts, playbooks).',
  ],
  nextLinks: [
    { label: 'Projects', href: '/projects' },
    { label: 'Contact', href: '/contact' },
    { label: 'About', href: '/about' },
  ],
};

function renderList(items, className) {
  return items.map((item) => `<li class="${className}">${escapeHtml(item)}</li>`).join('');
}

function renderResumePage(content = DEFAULT_RESUME_CONTENT) {
  const resolved = {
    ...DEFAULT_RESUME_CONTENT,
    ...content,
  };

  const coreSkills = Array.isArray(resolved.coreSkills) ? resolved.coreSkills : [];
  const experienceHighlights = Array.isArray(resolved.experienceHighlights) ? resolved.experienceHighlights : [];
  const nextLinks = Array.isArray(resolved.nextLinks) ? resolved.nextLinks : [];

  // Add error handling for Best Practices improvement
  try {

  const result = `
    <section class="resume-page" data-resume-page>
      <style>
        .resume-page { display: grid; gap: 1rem; }
        .resume-hero { display: grid; gap: 0.6rem; }
        .resume-hero__title { margin: 0; font-size: clamp(1.6rem, 4.8vw, 2.4rem); line-height: 1.2; }
        .resume-hero__headline { margin: 0; font-weight: 600; color: #111827; }
        .resume-hero__summary { margin: 0; line-height: 1.6; color: #1f2937; }
        .resume-actions { display: flex; flex-wrap: wrap; gap: 0.65rem; }
        .resume-actions__link {
          border: 1px solid #1f2937;
          border-radius: 0.6rem;
          padding: 0.55rem 0.85rem;
          text-decoration: none;
          color: inherit;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .resume-actions__link--primary { background: #111827; color: #ffffff; border-color: #111827; }
        .resume-card { border: 1px solid #d1d5db; border-radius: 0.75rem; padding: 0.9rem; display: grid; gap: 0.75rem; }
        .resume-card__title { margin: 0; font-size: 1.15rem; line-height: 1.3; }
        .resume-list { margin: 0; padding-left: 1.15rem; display: grid; gap: 0.45rem; }
        .resume-list__item { line-height: 1.5; }
        @media (min-width: 48rem) {
          .resume-page { gap: 1.25rem; }
        }
      </style>
      <header class="resume-hero">
        <h1 class="resume-hero__title">Resume</h1>
        <p class="resume-hero__headline">${escapeHtml(resolved.headline)}</p>
        <p class="resume-hero__summary">${escapeHtml(resolved.summary)}</p>
        <nav class="resume-actions" aria-label="Resume actions">
          <a class="resume-actions__link resume-actions__link--primary" href="${escapeHtml(
            DEFAULT_RESUME_ASSET_PATH,
          )}" download data-analytics-event="resume_download">Download PDF</a>
          ${nextLinks
            .map(
              (link) =>
                `<a class="resume-actions__link" href="${escapeHtml(link.href)}" data-analytics-event="resume_next_link_click" data-analytics-prop-destination="${escapeHtml(
                  link.label.toLowerCase(),
                )}">${escapeHtml(link.label)}</a>`,
            )
            .join('')}
        </nav>
      </header>
      <section class="resume-card" data-resume-core-skills>
        <h2 class="resume-card__title">Core skills</h2>
        <ul class="resume-list">
          ${renderList(coreSkills, 'resume-list__item')}
        </ul>
      </section>
      <section class="resume-card" data-resume-highlights>
        <h2 class="resume-card__title">Experience highlights</h2>
        <ul class="resume-list">
          ${renderList(experienceHighlights, 'resume-list__item')}
        </ul>
      </section>
      <section class="resume-card" data-resume-note>
        <h2 class="resume-card__title">Web summary</h2>
        <p style="margin: 0; line-height: 1.6;">
          This page is a concise, web-friendly overview. The downloadable PDF contains the full, formatted resume.
        </p>
      </section>
    </section>
  `.trim();

    return result;
  } catch (error) {
    console.error('Error rendering Resume page:', error);
    // Return fallback content for Best Practices compliance
    return `<section class="resume-page" data-resume-page>
      <header class="resume-hero">
        <h1 class="resume-hero__title">Resume</h1>
        <p class="resume-hero__headline">${escapeHtml(DEFAULT_RESUME_CONTENT.headline)}</p>
        <p class="resume-hero__summary">${escapeHtml(DEFAULT_RESUME_CONTENT.summary)}</p>
      </header>
    </section>`;
  }
}

module.exports = {
  DEFAULT_RESUME_ASSET_PATH,
  DEFAULT_RESUME_CONTENT,
  renderResumePage,
};
