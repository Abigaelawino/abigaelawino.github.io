import { BlogClient } from './blog-client';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import type { Metadata } from 'next';
import { siteUrl } from '@/lib/site';

async function getBlogPosts() {
  const blogDir = join(process.cwd(), 'content/blog');

  try {
    const fileNames = readdirSync(blogDir);
    const posts = fileNames
      .filter(name => name.endsWith('.mdx'))
      .map(fileName => {
        const fullPath = join(blogDir, fileName);
        const fileContents = readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        return {
          slug: fileName.replace(/\.mdx$/, ''),
          frontmatter: {
            title: data.title || '',
            date: data.date || '',
            tags: data.tags || [],
            summary: data.summary || '',
            readingTime: data.readingTime?.toString() || '1',
            status: data.status || 'published',
          },
          content,
        };
      })
      .sort(
        (a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
      );

    return posts;
  } catch (error) {
    console.error('Error reading blog posts:', error);
    return [];
  }
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
