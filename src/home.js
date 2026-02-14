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
      <div class="card card-hover">
        <div class="card-header">
          <div class="badge badge-secondary">Featured project</div>
          <h2 class="card-title">${escapeHtml(featuredProject.title)}</h2>
          <p class="card-description">${escapeHtml(featuredProject.summary)}</p>
        </div>
        <div class="card-content">
          <div class="flex flex-col sm:flex-row gap-2">
            <a class="button button-primary button-lg" href="/projects/${escapeHtml(
              featuredProject.slug
            )}" data-analytics-event="home_featured_case_study_click" data-analytics-prop-slug="${escapeHtml(
              featuredProject.slug
            )}">View Projects →</a>
            <a class="button button-outline button-lg" href="${escapeHtml(featuredProject.repo)}" target="_blank" rel="noopener noreferrer" data-analytics-event="home_featured_repo_click" data-analytics-prop-slug="${escapeHtml(
              featuredProject.slug
            )}">View Repository</a>
          </div>
        </div>
      </div>
    `.trim()
    : `
      <div class="card">
        <div class="card-header">
          <div class="badge badge-secondary">Featured project</div>
          <h2 class="card-title">Project spotlight coming soon</h2>
          <p class="card-description">Browse the projects page for recent case studies in ML, analytics, and production data tooling.</p>
        </div>
        <div class="card-content">
          <a class="button button-primary button-lg" href="/projects" data-analytics-event="home_browse_projects_click">Browse Projects</a>
        </div>
      </div>
    `.trim();

  return `
    <div class="container space-y-12">
      <!-- Hero Section -->
      <section class="text-center space-y-6">
        <h1 class="text-4xl md:text-6xl font-bold tracking-tight">
          Data Science Portfolio
        </h1>
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
          End-to-end data projects showcasing rigorous analysis, reproducible methods, and production-ready solutions.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a class="button button-primary button-lg" href="/projects">
            View Projects
            <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
            </svg>
          </a>
          <a class="button button-outline button-lg" href="/contact">Get in Touch</a>
        </div>
      </section>

      <!-- Featured Projects -->
      <section class="space-y-8">
        <div class="text-center space-y-2">
          <h2 class="text-3xl font-bold tracking-tight">Featured Projects</h2>
          <p class="text-muted-foreground">
            Recent work in machine learning, analytics, and data visualization
          </p>
        </div>
        ${featuredProjectMarkup}
      </section>

      <!-- Call to Action -->
      <section class="text-center space-y-4">
        <h2 class="text-2xl font-bold tracking-tight">Let's Work Together</h2>
        <p class="text-muted-foreground max-w-md mx-auto">
          I'm passionate about solving complex data challenges. Whether you need analysis,
          ML models, or data infrastructure, I'd love to help.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a class="button button-primary" href="/contact">Contact Me</a>
          <a class="button button-outline" href="/about">Learn More</a>
        </div>
      </section>
    </div>
  `.trim();
}

module.exports = {
  DEFAULT_HOME_LINKS,
  renderHomePage,
};
