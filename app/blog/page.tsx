import { BlogClient } from './blog-client';
import type { Metadata } from 'next';
import { siteUrl } from '@/lib/site';
import blogIndex from '@/src/generated/blog-index.json';

async function getBlogPosts() {
  const entries = blogIndex as Array<{
    slug: string;
    frontmatter: {
      title?: string;
      date?: string;
      tags?: string[];
      summary?: string;
      readingTime?: number;
      status?: string;
    };
    content: string;
  }>;

  return entries
    .map(entry => {
      const status: 'published' | 'draft' =
        entry.frontmatter.status === 'draft' ? 'draft' : 'published';
      return {
        slug: entry.slug,
        frontmatter: {
          title: entry.frontmatter.title || '',
          date: entry.frontmatter.date || '',
          tags: entry.frontmatter.tags || [],
          summary: entry.frontmatter.summary || '',
          readingTime: entry.frontmatter.readingTime?.toString() || '1',
          status,
        },
        content: entry.content,
      };
    })
    .sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
}

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Read notes on model monitoring, analytics implementation, and production workflows. Discover insights on data science best practices and machine learning deployment.',
  openGraph: {
    title: 'Blog · Abigael Awino',
    description:
      'Read notes on model monitoring, analytics implementation, and production workflows. Discover insights on data science best practices.',
    url: `${siteUrl}/blog`,
    images: [
      {
        url: '/assets/og.png',
        width: 1200,
        height: 630,
        alt: 'Blog · Abigael Awino Data Science Insights',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog · Abigael Awino',
    description:
      'Read notes on model monitoring, analytics implementation, and production workflows.',
    images: ['/assets/og.png'],
  },
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return <BlogClient posts={posts} />;
}
