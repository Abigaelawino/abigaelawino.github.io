const { escapeHtml } = require('./utils/escape-html.js');

function formatReadingTime(readingTime) {
  const rounded = Math.max(1, Math.round(Number(readingTime) || 0));
  return `${rounded} min read`;
}

function renderTags(tags, className) {
  return tags.map((tag) => `<li class="${className}">${escapeHtml(tag)}</li>`).join('');
}

function renderBlogCard(post) {
  return `
    <article class="blog-card" data-blog-card="${escapeHtml(post.slug)}">
      <p class="blog-card__meta">${escapeHtml(post.date)} <span aria-hidden="true">·</span> ${escapeHtml(formatReadingTime(post.readingTime))}</p>
      <h2 class="blog-card__title"><a href="/blog/${escapeHtml(post.slug)}" data-analytics-event="blog_post_open" data-analytics-prop-slug="${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a></h2>
      <p class="blog-card__summary">${escapeHtml(post.summary)}</p>
      <ul class="blog-card__tags">
        ${renderTags(post.tags || [], 'blog-card__tag')}
      </ul>
    </article>
  `.trim();
}

function renderBlogIndexPage(posts) {
  const cards = posts.map(renderBlogCard).join('\n');

  return `
    <section class="blog-index-page" data-blog-index-page>
      <style>
        .blog-index-page { display: grid; gap: 1rem; }
        .blog-index-page__header { display: grid; gap: 0.5rem; }
        .blog-index-page__header h1 { margin: 0; font-size: clamp(1.6rem, 4.8vw, 2.3rem); line-height: 1.2; }
        .blog-index-page__header p { margin: 0; line-height: 1.55; }
        .blog-index-page__grid { display: grid; gap: 0.8rem; }
        .blog-card { border: 1px solid #d1d5db; border-radius: 0.75rem; padding: 0.9rem; display: grid; gap: 0.55rem; }
        .blog-card__meta { margin: 0; color: #4b5563; font-size: 0.92rem; }
        .blog-card__title { margin: 0; font-size: 1.2rem; line-height: 1.3; }
        .blog-card__title a { color: inherit; text-decoration: none; }
        .blog-card__summary { margin: 0; line-height: 1.55; }
        .blog-card__tags { display: flex; gap: 0.4rem; flex-wrap: wrap; margin: 0; padding: 0; list-style: none; }
        .blog-card__tag { border: 1px solid #e5e7eb; border-radius: 999px; padding: 0.2rem 0.55rem; font-size: 0.82rem; }
        @media (min-width: 48rem) {
          .blog-index-page { gap: 1.2rem; }
          .blog-index-page__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      </style>
      <header class="blog-index-page__header">
        <h1>Blog</h1>
        <p>Notes on model reliability, analytics implementation, and production data workflows.</p>
      </header>
      <div class="blog-index-page__grid" data-blog-post-list>
        ${cards}
      </div>
    </section>
  `.trim();
}

function renderBlogPostPage(post, mdxMarkup = '') {
  const tags = Array.isArray(post.tags) ? post.tags : [];
  const tagsMarkup =
    tags.length > 0
      ? `
        <ul class="blog-post-page__tags" data-blog-post-tags>
          ${renderTags(tags, 'blog-post-page__tag')}
        </ul>
      `.trim()
      : '';

  return `
    <article class="blog-post-page" data-blog-post-page="${escapeHtml(post.slug)}">
      <style>
        .blog-post-page { display: grid; gap: 0.95rem; }
        .blog-post-page__header { display: grid; gap: 0.55rem; }
        .blog-post-page__meta { margin: 0; color: #4b5563; font-size: 0.95rem; }
        .blog-post-page__title { margin: 0; font-size: clamp(1.7rem, 5vw, 2.5rem); line-height: 1.2; }
        .blog-post-page__summary { margin: 0; line-height: 1.55; }
        .blog-post-page__tags { display: flex; gap: 0.45rem; flex-wrap: wrap; margin: 0; padding: 0; list-style: none; }
        .blog-post-page__tag { border: 1px solid #e5e7eb; border-radius: 999px; padding: 0.25rem 0.65rem; font-size: 0.85rem; }
        .blog-post-page__content { line-height: 1.7; display: grid; gap: 0.75rem; }
        .blog-post-page__content img { max-width: 100%; height: auto; }
        .blog-post-page__content pre {
          margin: 0;
          overflow-x: auto;
          border: 1px solid #e5e7eb;
          border-radius: 0.6rem;
          padding: 0.75rem;
          background: #f9fafb;
        }
        .blog-post-page__content code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
      </style>
      <header class="blog-post-page__header">
        <p class="blog-post-page__meta">${escapeHtml(post.date)} <span aria-hidden="true">·</span> ${escapeHtml(formatReadingTime(post.readingTime))}</p>
        <h1 class="blog-post-page__title">${escapeHtml(post.title)}</h1>
        <p class="blog-post-page__summary">${escapeHtml(post.summary)}</p>
        ${tagsMarkup}
      </header>
      <section class="blog-post-page__content" data-blog-post-body>
        ${mdxMarkup}
      </section>
    </article>
  `.trim();
}

module.exports = {
  formatReadingTime,
  renderBlogCard,
  renderBlogIndexPage,
  renderBlogPostPage,
};
