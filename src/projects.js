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

  const tagBadges = project.tags.map((tag) => `<span class="badge badge-secondary">${escapeHtml(tag)}</span>`).join('');
  const techBadges = (project.tech || []).slice(0, 3).map((tech) => `<span class="badge badge-outline">${escapeHtml(tech)}</span>`).join('');

  return `
    <div class="card card-hover" data-project-card data-tags="${escapeHtml(normalizedTags)}">
      <div class="card-header space-y-3">
        <div class="space-y-2">
          <div class="flex flex-wrap gap-1">
            ${tagBadges}
          </div>

          <h2 class="card-title text-xl">${escapeHtml(project.title)}</h2>
          <p class="card-description text-base">${escapeHtml(project.summary)}</p>
        </div>
      </div>

      <div class="card-content space-y-4">
        <div class="flex flex-wrap gap-1">
          ${techBadges}
        </div>

        <div class="flex items-center justify-between text-sm text-muted-foreground">
          <div class="flex items-center gap-1">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            ${new Date(project.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </div>
          <div class="flex items-center gap-1">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            ${Math.round(project.readingTime || 5)} min
          </div>
        </div>
      </div>

      <div class="card-footer flex gap-2 pt-4">
        <a class="button button-primary flex-1" href="/projects/${escapeHtml(project.slug)}" data-analytics-event="projects_case_study_click" data-analytics-prop-slug="${escapeHtml(project.slug)}">
          Read Case Study
          <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
          </svg>
        </a>
        ${project.repo ? `
          <a class="button button-outline button-icon" href="${escapeHtml(project.repo)}" target="_blank" rel="noopener noreferrer" data-analytics-event="projects_repo_click" data-analytics-prop-slug="${escapeHtml(project.slug)}" aria-label="View repository">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
            </svg>
          </a>
        ` : ''}
      </div>
    </div>
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
  const allTags = projects.reduce((tags, project) => {
    project.tags.forEach(tag => {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    });
    return tags;
  }, []);

  return `
    <div class="container space-y-8">
      <!-- Header Section -->
      <div class="text-center space-y-4">
        <h1 class="text-3xl md:text-4xl font-bold tracking-tight">Projects</h1>
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore project case studies in ML, analytics, and production data systems.
        </p>

        ${allTags.length > 0 ? `
          <div class="space-y-3">
            <h3 class="text-lg font-semibold">Topics</h3>
            <div class="flex flex-wrap gap-2 justify-center">
              ${allTags.map(tag => `
                <span class="badge badge-secondary flex items-center gap-1">
                  <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                  </svg>
                  ${escapeHtml(tag)}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Projects Grid -->
      ${projects.length === 0 ? `
        <div class="card">
          <div class="card-content p-12 text-center">
            <p class="text-muted-foreground text-lg">No projects available yet. Check back soon!</p>
          </div>
        </div>
      ` : `
        <div class="grid gap-6 md:grid-cols-2">
          ${cards}
        </div>
      `}

      <!-- Footer -->
      <div class="text-center pt-8">
        <a class="button button-outline" href="/">
          ← Back to Home
        </a>
      </div>
    </div>
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
