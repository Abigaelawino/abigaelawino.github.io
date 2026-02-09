const { escapeHtml } = require('./utils/escape-html.js');

const DEFAULT_HOME_LINKS = {
  resume: '/resume/abigael-awino-resume.pdf',
  github: 'https://github.com/abigaelawino',
  linkedin: 'https://www.linkedin.com/in/abigaelawino/',
};

function renderHomePage(featuredProject, links = DEFAULT_HOME_LINKS) {
  const quickLinks = {
    ...DEFAULT_HOME_LINKS,
    ...links,
  };

  const featuredProjectMarkup = featuredProject
    ? `
      <article class="home-featured__card" data-home-featured>
        <p class="home-featured__eyebrow">Featured project</p>
        <h2 class="home-featured__title">${escapeHtml(featuredProject.title)}</h2>
        <p class="home-featured__summary">${escapeHtml(featuredProject.summary)}</p>
        <div class="home-featured__actions">
          <a class="home-featured__cta home-featured__cta--primary" href="/projects/${escapeHtml(
            featuredProject.slug,
          )}" data-analytics-event="home_featured_case_study_click" data-analytics-prop-slug="${escapeHtml(
            featuredProject.slug,
          )}">Read case study</a>
          <a class="home-featured__cta" href="${escapeHtml(featuredProject.repo)}" target="_blank" rel="noopener noreferrer" data-analytics-event="home_featured_repo_click" data-analytics-prop-slug="${escapeHtml(
            featuredProject.slug,
          )}">View repository</a>
        </div>
      </article>
    `.trim()
    : `
      <article class="home-featured__card" data-home-featured>
        <p class="home-featured__eyebrow">Featured project</p>
        <h2 class="home-featured__title">Project spotlight coming soon</h2>
        <p class="home-featured__summary">Browse the projects page for recent case studies in ML, analytics, and production data tooling.</p>
        <div class="home-featured__actions">
          <a class="home-featured__cta home-featured__cta--primary" href="/projects" data-analytics-event="home_browse_projects_click">Browse projects</a>
        </div>
      </article>
    `.trim();

  return `
    <section class="home-page" data-home-page>
      <style>
        .home-page { display: grid; gap: 1.5rem; }
        .home-hero { display: grid; gap: 0.9rem; }
        .home-hero__title { margin: 0; font-size: clamp(1.8rem, 5vw, 2.8rem); line-height: 1.15; }
        .home-hero__body { margin: 0; font-size: 1rem; line-height: 1.6; }
        .home-hero__links { display: grid; gap: 0.6rem; grid-template-columns: 1fr; }
        .home-hero__link {
          border: 1px solid #1f2937;
          border-radius: 0.5rem;
          padding: 0.7rem 0.95rem;
          text-decoration: none;
          color: inherit;
          font-weight: 600;
          text-align: center;
        }
        .home-featured__card { border: 1px solid #d1d5db; border-radius: 0.75rem; padding: 1rem; display: grid; gap: 0.8rem; }
        .home-featured__eyebrow { margin: 0; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.08em; color: #4b5563; }
        .home-featured__title { margin: 0; font-size: 1.4rem; line-height: 1.2; }
        .home-featured__summary { margin: 0; line-height: 1.55; }
        .home-featured__actions { display: flex; flex-direction: column; gap: 0.6rem; }
        .home-featured__cta { text-decoration: none; font-weight: 600; }
        .home-featured__cta--primary { color: #0f172a; }
        @media (min-width: 48rem) {
          .home-page { gap: 2rem; }
          .home-hero__links { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .home-featured__actions { flex-direction: row; gap: 1rem; }
        }
      </style>
      <header class="home-hero">
        <h1 class="home-hero__title">Data science solutions from exploratory insight to production-ready outcomes.</h1>
        <p class="home-hero__body">I am Abigael Awino, a data scientist building machine learning and analytics systems that are measurable, explainable, and useful to decision-makers.</p>
        <nav class="home-hero__links" aria-label="Primary profile links">
          <a class="home-hero__link" href="${escapeHtml(quickLinks.resume)}" download data-analytics-event="home_resume_download">Resume</a>
          <a class="home-hero__link" href="${escapeHtml(quickLinks.github)}" target="_blank" rel="noopener noreferrer" data-analytics-event="home_github_click">GitHub</a>
          <a class="home-hero__link" href="${escapeHtml(quickLinks.linkedin)}" target="_blank" rel="noopener noreferrer" data-analytics-event="home_linkedin_click">LinkedIn</a>
        </nav>
      </header>
      ${featuredProjectMarkup}
    </section>
  `.trim();
}

module.exports = {
  DEFAULT_HOME_LINKS,
  renderHomePage,
};
