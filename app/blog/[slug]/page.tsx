import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { Button } from '@/components/ui/button';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-static';
export const dynamicParams = false;
export const revalidate = false;

async function getBlogPost(slug: string) {
  try {
    const fullPath = join(process.cwd(), 'content/blog', `${slug}.mdx`);
    const fileContents = readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      frontmatter: data,
      content,
    };
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  const fs = await import('fs');
  const path = await import('path');

  try {
    const blogDir = path.join(process.cwd(), 'content/blog');
    const fileNames = fs.readdirSync(blogDir);

    return fileNames
      .filter(name => name.endsWith('.mdx'))
      .map(fileName => ({
        slug: fileName.replace(/\.mdx$/, ''),
      }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getBlogPost(params.slug);

  if (!post) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  const title = post.frontmatter.title || 'Untitled Post';
  const summary = post.frontmatter.summary || post.content.slice(0, 160).replace(/\n/g, ' ').trim();
  const tags = post.frontmatter.tags?.slice(0, 5).join(', ') || '';

  return {
    title: `${title} · Blog`,
    description: `${summary}${tags ? ` Topics: ${tags}.` : ''} Data science insights and technical tutorials by Abigael Awino.`,
    keywords: ['data science', 'blog', 'tutorial', ...(post.frontmatter.tags || [])],
    openGraph: {
      title: `${title} · Blog | Abigael Awino`,
      description: `${summary}${tags ? ` Topics: ${tags}.` : ''}`,
      url: `${siteUrl}/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.frontmatter.date,
      modifiedTime: post.frontmatter.updated,
      authors: ['Abigael Awino'],
      section: 'Blog',
      tags: post.frontmatter.tags || [],
      images: [
        {
          url: '/assets/og.png',
          width: 1200,
          height: 630,
          alt: `${title} · Blog Post`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · Blog`,
      description: `${summary}${tags ? ` Topics: ${tags}.` : ''}`,
      images: ['/assets/og.png'],
    },
    alternates: {
      canonical: `${siteUrl}/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <article className="space-y-6">
        <Button variant="outline" asChild className="w-fit">
          <Link href="/blog">← Back to Blog</Link>
        </Button>

        <header className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            {post.frontmatter.title || 'Untitled Post'}
          </h1>
          {post.frontmatter.summary && (
            <p className="text-xl text-muted-foreground">{post.frontmatter.summary}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {post.frontmatter.date && (
              <time dateTime={post.frontmatter.date}>
                {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            )}
            {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.frontmatter.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="prose prose-gray max-w-none">
          {/* Blog content would be rendered here with MDX processing */}
          <div className="whitespace-pre-wrap">{post.content}</div>
        </div>
      </article>
    </div>
  );
}
