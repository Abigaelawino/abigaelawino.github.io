import { BlogClient } from './blog-client';
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

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return <BlogClient posts={posts} />;
}
