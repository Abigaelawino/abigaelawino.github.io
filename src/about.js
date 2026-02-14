const { escapeHtml } = require('./utils/escape-html.js');

function renderListItems(items, className) {
  return items.map(item => `<li class="${className}">${escapeHtml(item)}</li>`).join('');
}

const DEFAULT_ABOUT_CONTENT = {
  bio: 'Data scientist passionate about transforming complex data into actionable insights and production-ready solutions.',
  strengths: [
    'End-to-end project development from data collection to deployment',
    'Strong foundation in statistical methods and experimental design',
    'Experience with both structured and unstructured data',
    'Excellent communication of complex technical concepts',
    'Commitment to reproducible research and documentation',
  ],
  skills: [
    {
      category: 'Machine Learning',
      items: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'XGBoost'],
    },
    {
      category: 'Data Engineering',
      items: ['SQL', 'PostgreSQL', 'MongoDB', 'Apache Spark', 'Airflow'],
    },
    { category: 'Programming', items: ['Python', 'JavaScript', 'TypeScript', 'R', 'Bash'] },
    {
      category: 'Analytics & Visualization',
      items: ['Tableau', 'Power BI', 'Matplotlib', 'Seaborn', 'Plotly'],
    },
  ],
  speaking: [],
  publications: [],
};

function renderAboutPage(content = DEFAULT_ABOUT_CONTENT) {
  const resolved = {
    ...DEFAULT_ABOUT_CONTENT,
    ...content,
  };
  const strengths = Array.isArray(resolved.strengths) ? resolved.strengths : [];
  const skills = Array.isArray(resolved.skills) ? resolved.skills : [];
  const speaking = Array.isArray(resolved.speaking) ? resolved.speaking : [];
  const publications = Array.isArray(resolved.publications) ? resolved.publications : [];

  // Add error handling for Best Practices improvement
  try {
    return `
    <div class="container space-y-12">
      <!-- Header -->
      <section class="text-center space-y-4">
        <h1 class="text-4xl font-bold tracking-tight">About Me</h1>
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
          ${escapeHtml(resolved.bio)}
        </p>
      </section>

      <!-- Bio -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Background</h2>
        </div>
        <div class="card-content space-y-4">
          <p class="text-muted-foreground">
            I'm a data scientist with expertise in machine learning, statistical analysis, and data engineering.
            My approach combines rigorous methodology with practical implementation, ensuring that insights aren't just
            theoretically sound but also deliver real business value.
          </p>
          <p class="text-muted-foreground">
            I specialize in developing end-to-end data solutions, from initial data collection and cleaning to
            model deployment and monitoring. My experience spans various industries, allowing me to bring diverse
            perspectives to each unique challenge.
          </p>
        </div>
      </div>

      <!-- Strengths -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Core Strengths</h2>
        </div>
        <div class="card-content">
          <ul class="space-y-3">
            ${strengths
              .map(
                (strength, index) => `
              <li class="flex items-start gap-3">
                <div class="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span class="text-muted-foreground">${escapeHtml(strength)}</span>
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
      </div>

      <!-- Technical Skills -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Technical Toolkit</h2>
          <p class="card-description">Technologies and tools I work with regularly</p>
        </div>
        <div class="card-content">
          <div class="grid gap-6 md:grid-cols-2">
            ${skills
              .map(
                ({ category, items }) => `
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold">${escapeHtml(category)}</h3>
                </div>
                <div class="flex flex-wrap gap-2">
                  ${items
                    .map(
                      item => `
                    <span class="badge badge-secondary">${escapeHtml(item)}</span>
                  `
                    )
                    .join('')}
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>

      <!-- Call to Action -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Let's Connect</h2>
        </div>
        <div class="card-content space-y-4">
          <p class="text-muted-foreground">
            I'm always interested in discussing data challenges, collaborations, or opportunities.
            Feel free to reach out through any of the channels below.
          </p>

          <div class="flex flex-wrap gap-3">
            <a class="button button-primary" href="/contact">
              <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              Get in Touch
            </a>
            <a class="button button-outline" href="https://github.com" target="_blank" rel="noopener noreferrer">
              <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
              GitHub
            </a>
            <a class="button button-outline" href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
              </svg>
              LinkedIn
            </a>
            <a class="button button-outline" href="/projects">
              <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
              View Projects
            </a>
          </div>
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
    console.error('Error rendering About page:', error);
    // Return fallback content for Best Practices compliance
    return `<div class="container">
      <section class="text-center space-y-4">
        <h1 class="text-4xl font-bold tracking-tight">About</h1>
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto">${escapeHtml(DEFAULT_ABOUT_CONTENT.bio)}</p>
      </section>
    </div>`;
  }
}

module.exports = {
  DEFAULT_ABOUT_CONTENT,
  renderAboutPage,
};
