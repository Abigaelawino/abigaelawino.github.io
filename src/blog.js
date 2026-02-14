const { escapeHtml } = require('./utils/escape-html.js');

function formatReadingTime(readingTime) {
  const rounded = Math.max(1, Math.round(Number(readingTime) || 0));
  return `${rounded} min read`;
}

function renderTags(tags, className) {
  return tags.map(tag => `<li class="${className}">${escapeHtml(tag)}</li>`).join('');
}

function renderBlogCard(post) {
  const tagBadges = (post.tags || [])
    .map(tag => `<span class="badge badge-secondary">${escapeHtml(tag)}</span>`)
    .join('');

  return `
    <div class="card card-hover" data-blog-card="${escapeHtml(post.slug)}">
      <div class="card-header">
        <h2 class="card-title">
          <a href="/blog/${escapeHtml(post.slug)}" class="text-primary hover:text-primary/80 transition-colors" data-analytics-event="blog_post_open" data-analytics-prop-slug="${escapeHtml(post.slug)}">
            ${escapeHtml(post.title)}
          </a>
        </h2>
        <p class="card-description">${escapeHtml(post.summary)}</p>
      </div>
      <div class="card-content space-y-4">
        <div class="flex items-center gap-4 text-sm text-muted-foreground">
          <div class="flex items-center gap-1">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            ${escapeHtml(post.date)}
          </div>
          <div class="flex items-center gap-1">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            ${escapeHtml(formatReadingTime(post.readingTime))}
          </div>
        </div>
        ${tagBadges ? `<div class="flex flex-wrap gap-2">${tagBadges}</div>` : ''}
      </div>
    </div>
  `.trim();
}

function renderBlogIndexPage(posts) {
  const cards = posts.map(renderBlogCard).join('\n');

  return `
    <div class="container space-y-8">
      <div class="text-center space-y-4">
        <h1 class="text-3xl md:text-4xl font-bold tracking-tight">Blog</h1>
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
          Read notes on model monitoring, analytics implementation, and production workflows.
        </p>
      </div>

      ${
        posts.length === 0
          ? `
        <div class="card">
          <div class="card-content p-12 text-center">
            <p class="text-muted-foreground text-lg">No published posts yet.</p>
          </div>
        </div>
      `
          : `
        <div class="grid gap-6 md:grid-cols-2">
          ${cards}
        </div>
      `
      }

      <div class="text-center">
        <a class="button button-outline" href="/">
          ← Back to Home
        </a>
      </div>
    </div>
  `.trim();
}

function renderBlogPostPage(post, mdxMarkup = '') {
  const tags = Array.isArray(post.tags) ? post.tags : [];
  const tagBadges = tags
    .map(tag => `<span class="badge badge-secondary">${escapeHtml(tag)}</span>`)
    .join('');

  return `
    <div class="container space-y-8">
      <div class="card">
        <div class="card-header space-y-4">
          <div class="flex items-center gap-4 text-sm text-muted-foreground">
            <div class="flex items-center gap-1">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              ${escapeHtml(post.date)}
            </div>
            <div class="flex items-center gap-1">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              ${escapeHtml(formatReadingTime(post.readingTime))}
            </div>
          </div>

          <h1 class="text-3xl md:text-4xl font-bold tracking-tight">${escapeHtml(post.title)}</h1>
          <p class="text-lg text-muted-foreground">${escapeHtml(post.summary)}</p>

          ${tagBadges ? `<div class="flex flex-wrap gap-2">${tagBadges}</div>` : ''}
        </div>
      </div>

      ${
        mdxMarkup
          ? `
        <div class="card">
          <div class="card-content">
            <div class="prose prose-slate max-w-none" data-blog-post-body>
              ${mdxMarkup}
            </div>
          </div>
        </div>
      `
          : ''
      }

      <div class="text-center">
        <a class="button button-outline" href="/blog">
          ← Back to Blog
        </a>
      </div>
    </div>
  `.trim();
}

module.exports = {
  formatReadingTime,
  renderBlogCard,
  renderBlogIndexPage,
  renderBlogPostPage,
};
