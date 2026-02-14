import Link from 'next/link';

export default function BlogPage() {
  const posts = [
    {
      slug: 'model-monitoring-lessons',
      frontmatter: {
        title: 'What Broke in Production and How We Fixed It',
        date: '2026-01-20',
        tags: ['ml', 'monitoring', 'reliability'],
        summary: 'A short breakdown of model drift signals, alerting thresholds, and rollback playbooks.',
        readingTime: '7',
        status: 'published'
      }
    }
  ];
  
  const publishedPosts = posts.filter(post => post.frontmatter.status === 'published');

  return (
    <div className="page-content">
      <h1>Blog</h1>
      <p>Read notes on model monitoring, analytics implementation, and production workflows.</p>
      
      <div className="posts-grid">
        {publishedPosts.length === 0 ? (
          <p>No published posts yet.</p>
        ) : (
          publishedPosts.map((post) => (
            <article key={post.slug} className="post-card">
              <Link href={`/blog/${post.slug}`}>
                <h2>{post.frontmatter.title}</h2>
                <p className="post-meta">
                  {new Date(post.frontmatter.date).toLocaleDateString()} • {post.frontmatter.readingTime} min read
                </p>
                <p className="post-summary">{post.frontmatter.summary}</p>
                <div className="post-tags">
                  {post.frontmatter.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            </article>
          ))
        )}
      </div>
      
      <p><Link href="/">← Back to Home</Link></p>
    </div>
  );
}