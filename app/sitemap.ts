import { MetadataRoute } from 'next';
import { getAllProjects } from '@/lib/content';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

async function getBlogPosts() {
  const blogDir = join(process.cwd(), 'content/blog');

  try {
    const fileNames = readdirSync(blogDir);
    const posts = fileNames
      .filter(name => name.endsWith('.mdx'))
      .map(fileName => {
        const fullPath = join(blogDir, fileName);
        const fileContents = readFileSync(fullPath, 'utf8');
        const { data } = matter(fileContents);

        return {
          slug: fileName.replace(/\.mdx$/, ''),
          frontmatter: data,
        };
      })
      .filter(post => post.frontmatter.published !== false);

    return posts;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://abigaelawino.github.io';
  const currentDate = new Date();

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/resume`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ];

  // Project pages
  const projects = getAllProjects();
  const projectPages = projects.map(project => ({
    url: `${baseUrl}/projects/${project.slug}`,
    lastModified: new Date(project.frontmatter.date),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Blog pages
  const blogPosts = await getBlogPosts();
  const blogPages = blogPosts.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.frontmatter.updated
      ? new Date(post.frontmatter.updated)
      : post.frontmatter.date
        ? new Date(post.frontmatter.date)
        : currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Combine all pages
  return [...staticPages, ...projectPages, ...blogPages];
}
