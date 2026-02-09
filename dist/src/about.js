const { escapeHtml } = require('./utils/escape-html.js');

function renderListItems(items, className) {
  return items.map((item) => `<li class="${className}">${escapeHtml(item)}</li>`).join('');
}

const DEFAULT_ABOUT_CONTENT = {
  bio: 'I am Abigael Awino, a data scientist focused on building practical machine learning and analytics systems that move from prototype to production with measurable impact.',
  strengths: [
    'Translate ambiguous business questions into clear, testable data workstreams.',
    'Design reproducible ML and analytics pipelines that hold up in production.',
    'Communicate findings with concise storytelling for technical and non-technical audiences.',
  ],
  toolkit: ['Python', 'SQL', 'Pandas', 'scikit-learn', 'PyTorch', 'Tableau', 'Power BI', 'Git', 'Docker'],
  speaking: [],
  publications: [],
};

function renderAboutPage(content = DEFAULT_ABOUT_CONTENT) {
  const resolved = {
    ...DEFAULT_ABOUT_CONTENT,
    ...content,
  };
  const strengths = Array.isArray(resolved.strengths) ? resolved.strengths : [];
  const toolkit = Array.isArray(resolved.toolkit) ? resolved.toolkit : [];
  const speaking = Array.isArray(resolved.speaking) ? resolved.speaking : [];
  const publications = Array.isArray(resolved.publications) ? resolved.publications : [];
  const hasPublicProfile = speaking.length > 0 || publications.length > 0;

  const publicProfileMarkup = hasPublicProfile
    ? `
      <section class="about-section" data-about-public-profile>
        <h2 class="about-section__title">Speaking &amp; Publications</h2>
        ${
          speaking.length > 0
            ? `
          <div>
            <h3 class="about-section__subtitle">Speaking</h3>
            <ul class="about-list">${renderListItems(speaking, 'about-list__item')}</ul>
          </div>
        `.trim()
            : ''
        }
        ${
          publications.length > 0
            ? `
          <div>
            <h3 class="about-section__subtitle">Publications</h3>
            <ul class="about-list">${renderListItems(publications, 'about-list__item')}</ul>
          </div>
        `.trim()
            : ''
        }
      </section>
    `.trim()
    : '';

  return `
    <section class="about-page" data-about-page>
      <style>
        .about-page { display: grid; gap: 1rem; }
        .about-hero { display: grid; gap: 0.6rem; }
        .about-hero__title { margin: 0; font-size: clamp(1.6rem, 4.8vw, 2.4rem); line-height: 1.2; }
        .about-hero__bio { margin: 0; line-height: 1.6; }
        .about-section { border: 1px solid #d1d5db; border-radius: 0.75rem; padding: 0.9rem; display: grid; gap: 0.75rem; }
        .about-section__title { margin: 0; font-size: 1.15rem; line-height: 1.3; }
        .about-section__subtitle { margin: 0; font-size: 1rem; line-height: 1.3; }
        .about-list { margin: 0; padding-left: 1.15rem; display: grid; gap: 0.45rem; }
        .about-list__item { line-height: 1.5; }
        .about-toolkit { display: grid; gap: 0.5rem; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 0; margin: 0; list-style: none; }
        .about-toolkit__item { border: 1px solid #e5e7eb; border-radius: 999px; padding: 0.35rem 0.65rem; text-align: center; font-size: 0.92rem; }
        @media (min-width: 48rem) {
          .about-page { gap: 1.25rem; }
          .about-toolkit { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
      </style>
      <header class="about-hero">
        <h1 class="about-hero__title">About</h1>
        <p class="about-hero__bio">${escapeHtml(resolved.bio)}</p>
      </header>
      <section class="about-section" data-about-strengths>
        <h2 class="about-section__title">Strengths</h2>
        <ul class="about-list">
          ${renderListItems(strengths, 'about-list__item')}
        </ul>
      </section>
      <section class="about-section" data-about-toolkit>
        <h2 class="about-section__title">Toolkit</h2>
        <ul class="about-toolkit">
          ${renderListItems(toolkit, 'about-toolkit__item')}
        </ul>
      </section>
      ${publicProfileMarkup}
    </section>
  `.trim();
}

module.exports = {
  DEFAULT_ABOUT_CONTENT,
  renderAboutPage,
};
