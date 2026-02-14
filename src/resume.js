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

  return `
    <div class="container space-y-8">
      <!-- Header -->
      <div class="text-center space-y-4">
        <h1 class="text-4xl font-bold tracking-tight">Resume</h1>
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
          Download a PDF resume and view a concise web summary.
        </p>
        <div class="flex flex-wrap gap-3 justify-center">
          <a class="button button-primary" href="${escapeHtml(
            DEFAULT_RESUME_ASSET_PATH,
          )}" download data-analytics-event="resume_download">
            <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Download PDF
          </a>
          ${nextLinks
            .map(
              (link) =>
                `<a class="button button-outline" href="${escapeHtml(link.href)}" data-analytics-event="resume_next_link_click" data-analytics-prop-destination="${escapeHtml(
                  link.label.toLowerCase(),
                )}">${escapeHtml(link.label)}</a>`,
            )
            .join('')}
        </div>
      </div>

      <!-- Professional Summary -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">${escapeHtml(resolved.headline)}</h2>
        </div>
        <div class="card-content">
          <p class="text-muted-foreground">${escapeHtml(resolved.summary)}</p>
        </div>
      </div>

      <!-- Core Skills -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Core Skills</h2>
        </div>
        <div class="card-content">
          <ul class="space-y-2">
            ${coreSkills.map(skill => `
              <li class="flex items-start gap-2">
                <svg class="h-4 w-4 mt-0.5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>${escapeHtml(skill)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>

      <!-- Experience Highlights -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Experience Highlights</h2>
        </div>
        <div class="card-content">
          <ul class="space-y-3">
            ${experienceHighlights.map(highlight => `
              <li class="flex items-start gap-3">
                <div class="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span class="text-muted-foreground">${escapeHtml(highlight)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>

      <!-- Web Summary Note -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">About This Page</h2>
        </div>
        <div class="card-content">
          <p class="text-muted-foreground">
            This page is a concise, web-friendly overview. The downloadable PDF contains the full, formatted resume with complete work history, education, and additional details.
          </p>
        </div>
      </div>

      <!-- Back Navigation -->
      <div class="text-center">
        <a class="button button-outline" href="/">
          ← Back to Home
        </a>
      </div>
    </div>
  `.trim();

  } catch (error) {
    console.error('Error rendering Resume page:', error);
    // Return fallback content for Best Practices compliance
    return `<div class="container">
      <div class="text-center space-y-4">
        <h1 class="text-4xl font-bold tracking-tight">Resume</h1>
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto">${escapeHtml(DEFAULT_RESUME_CONTENT.headline)}</p>
        <p class="text-muted-foreground">${escapeHtml(DEFAULT_RESUME_CONTENT.summary)}</p>
      </div>
    </div>`;
  }
}

module.exports = {
  DEFAULT_RESUME_ASSET_PATH,
  DEFAULT_RESUME_CONTENT,
  renderResumePage,
};
