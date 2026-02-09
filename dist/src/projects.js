const SUPPORTED_PROJECT_FILTERS = [
  { value: 'ml', label: 'ML' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'visualization', label: 'Visualization' },
  { value: 'nlp', label: 'NLP' },
  { value: 'time-series', label: 'Time Series' },
];

const CASE_STUDY_SECTIONS = [
  { key: 'summary', title: 'Summary' },
  { key: 'caseStudyData', title: 'Data' },
  { key: 'caseStudyMethods', title: 'Methods' },
  { key: 'caseStudyResults', title: 'Results' },
  { key: 'caseStudyReproducibility', title: 'Reproducibility' },
  { key: 'caseStudyReflection', title: 'Reflection' },
];

const { escapeHtml } = require('./utils/escape-html.js');

function normalizeTag(tag) {
  return String(tag).trim().toLowerCase().replaceAll('_', '-').replaceAll(/\s+/g, '-');
}

function filterProjectsByTag(projects, tag) {
  const normalizedTag = normalizeTag(tag);
  if (normalizedTag === 'all') {
    return projects;
  }

  return projects.filter((project) => project.tags.some((projectTag) => normalizeTag(projectTag) === normalizedTag));
}

function renderTagPills(tags) {
  return tags
    .map((tag) => `<li class="project-card__tag">${escapeHtml(tag)}</li>`)
    .join('');
}

function renderProjectCard(project) {
  const normalizedTags = project.tags.map((tag) => normalizeTag(tag)).join(',');

  return `
    <article class="project-card" data-project-card data-tags="${escapeHtml(normalizedTags)}">
      <img
        class="project-card__cover"
        src="${escapeHtml(project.cover)}"
        alt="Cover image for ${escapeHtml(project.title)}"
        loading="lazy"
        decoding="async"
        fetchpriority="low"
        width="1200"
        height="675"
      />
      <div class="project-card__body">
        <p class="project-card__meta">${escapeHtml(project.date)}</p>
        <h2 class="project-card__title">${escapeHtml(project.title)}</h2>
        <p class="project-card__summary">${escapeHtml(project.summary)}</p>
        <ul class="project-card__tags">${renderTagPills(project.tags)}</ul>
        <div class="project-card__actions">
          <a class="project-card__cta" href="/projects/${escapeHtml(project.slug)}" data-analytics-event="projects_case_study_click" data-analytics-prop-slug="${escapeHtml(project.slug)}">Read case study</a>
          <a class="project-card__repo" href="${escapeHtml(project.repo)}" data-analytics-event="projects_repo_click" data-analytics-prop-slug="${escapeHtml(project.slug)}">View repo</a>
        </div>
      </div>
    </article>
  `.trim();
}

function renderFilterButtons() {
  const allButton =
    '<button class="projects-filter__button is-active" data-filter="all" data-filter-button type="button" aria-pressed="true" aria-controls="projects-grid" data-analytics-event="projects_filter_click" data-analytics-prop-filter="all">All</button>';
  const buttons = SUPPORTED_PROJECT_FILTERS
    .map(
      (filter) =>
        `<button class="projects-filter__button" data-filter="${filter.value}" data-filter-button type="button" aria-pressed="false" aria-controls="projects-grid" data-analytics-event="projects_filter_click" data-analytics-prop-filter="${escapeHtml(filter.value)}">${escapeHtml(filter.label)}</button>`,
    )
    .join('');

  return `${allButton}${buttons}`;
}

function renderProjectsPage(projects) {
  const cards = projects.map(renderProjectCard).join('\n');

  return `
    <section class="projects-page">
      <style>
        .projects-page { display: grid; gap: 1rem; }
        .projects-page__header { display: grid; gap: 0.45rem; }
        .projects-page__header h1 { margin: 0; font-size: clamp(1.6rem, 4.8vw, 2.3rem); line-height: 1.2; }
        .projects-page__header p { margin: 0; line-height: 1.55; }
        .projects-filter { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .projects-filter__button {
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 0.35rem 0.7rem;
          font: inherit;
          background: #ffffff;
          cursor: pointer;
          font-weight: 600;
        }
        .projects-filter__button.is-active { background: #0f172a; border-color: #0f172a; color: #f9fafb; }
        .projects-grid { display: grid; gap: 0.9rem; }
        .project-card { border: 1px solid #d1d5db; border-radius: 0.75rem; overflow: hidden; background: #ffffff; }
        .project-card__cover { width: 100%; height: auto; display: block; aspect-ratio: 16 / 9; object-fit: cover; background: #f3f4f6; }
        .project-card__body { padding: 0.95rem; display: grid; gap: 0.55rem; }
        .project-card__meta { margin: 0; color: #4b5563; font-size: 0.92rem; }
        .project-card__title { margin: 0; font-size: 1.2rem; line-height: 1.25; }
        .project-card__summary { margin: 0; line-height: 1.55; color: #1f2937; }
        .project-card__tags { display: flex; gap: 0.4rem; flex-wrap: wrap; margin: 0; padding: 0; list-style: none; }
        .project-card__tag { border: 1px solid #e5e7eb; border-radius: 999px; padding: 0.2rem 0.55rem; font-size: 0.82rem; }
        .project-card__actions { display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center; }
        .project-card__cta, .project-card__repo { text-decoration: none; font-weight: 700; }
        .project-card__cta { color: #0f172a; }
        .projects-status { position: absolute; left: -10000px; top: auto; width: 1px; height: 1px; overflow: hidden; }
        @media (min-width: 48rem) {
          .projects-page { gap: 1.25rem; }
          .projects-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      </style>
      <header class="projects-page__header">
        <h1>Projects</h1>
        <p>Case studies covering modeling, analytics, and production-ready data storytelling.</p>
      </header>
      <div class="projects-filter" role="toolbar" aria-label="Project tag filters">
        ${renderFilterButtons()}
      </div>
      <p class="projects-status" role="status" aria-live="polite" aria-atomic="true" data-projects-status></p>
      <div class="projects-grid" id="projects-grid" data-projects-grid>
        ${cards}
      </div>
      <script src="/assets/projects-filter.js" defer></script>
    </section>
  `.trim();
}

function renderCaseStudySection(title, content, dataKey) {
  return `
    <section class="case-study__section" data-case-study-section="${escapeHtml(dataKey)}">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(content)}</p>
    </section>
  `.trim();
}

function renderProjectCaseStudy(project) {
  const sections = CASE_STUDY_SECTIONS.map((section) =>
    renderCaseStudySection(section.title, project[section.key], section.key),
  ).join('\n');

  return `
    <article class="case-study" data-case-study="${escapeHtml(project.slug)}">
      <style>
        .case-study { display: grid; gap: 1rem; }
        .case-study__header { display: grid; gap: 0.4rem; }
        .case-study__meta { margin: 0; color: #4b5563; font-size: 0.95rem; }
        .case-study__title { margin: 0; font-size: clamp(1.7rem, 5vw, 2.5rem); line-height: 1.2; }
        .case-study__section { border: 1px solid #d1d5db; border-radius: 0.75rem; padding: 0.9rem; display: grid; gap: 0.5rem; }
        .case-study__section h2 { margin: 0; font-size: 1.15rem; line-height: 1.3; }
        .case-study__section p { margin: 0; line-height: 1.65; color: #1f2937; }
        .case-study__footer { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .case-study__repo { text-decoration: none; font-weight: 700; border: 1px solid #1f2937; border-radius: 999px; padding: 0.35rem 0.75rem; }
        @media (min-width: 48rem) {
          .case-study { gap: 1.25rem; }
        }
      </style>
      <header class="case-study__header">
        <p class="case-study__meta">${escapeHtml(project.date)}</p>
        <h1 class="case-study__title">${escapeHtml(project.title)}</h1>
      </header>
      ${sections}
      <footer class="case-study__footer">
        <a class="case-study__repo" href="${escapeHtml(project.repo)}" data-analytics-event="case_study_repo_click" data-analytics-prop-slug="${escapeHtml(project.slug)}">View source repository</a>
      </footer>
    </article>
  `.trim();
}

module.exports = {
  CASE_STUDY_SECTIONS,
  SUPPORTED_PROJECT_FILTERS,
  filterProjectsByTag,
  normalizeTag,
  renderProjectCaseStudy,
  renderProjectCard,
  renderProjectsPage,
};
