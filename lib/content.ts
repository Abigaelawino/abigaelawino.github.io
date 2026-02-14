import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

export interface ProjectFrontmatter {
  title: string;
  date: string;
  tags: string[];
  summary: string;
  caseStudyData?: string;
  caseStudyMethods?: string;
  caseStudyResults?: string;
  caseStudyReproducibility?: string;
  caseStudyReflection?: string;
  tech: string[];
  repo?: string;
  cover: string;
  status: 'published' | 'draft';
}

export interface Project {
  slug: string;
  frontmatter: ProjectFrontmatter;
  content: string;
  readingTime: number;
}

const contentDirectory = path.join(process.cwd(), 'content');

export function getProjectSlugs() {
  try {
    return fs
      .readdirSync(path.join(contentDirectory, 'projects'))
      .filter(file => file.endsWith('.mdx'))
      .map(file => file.replace(/\.mdx$/, ''));
  } catch (error) {
    console.error('Error reading projects directory:', error);
    return [];
  }
}

export function getProjectBySlug(slug: string): Project | null {
  if (!slug || slug === 'undefined' || slug === '') {
    console.error('Invalid slug provided:', slug);
    return null;
  }

  try {
    const fullPath = path.join(contentDirectory, 'projects', `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      frontmatter: data as ProjectFrontmatter,
      content,
      readingTime: readingTime(content).minutes,
    };
  } catch (error) {
    console.error(`Error reading project ${slug}:`, error);
    return null;
  }
}

export function getAllProjects(): Project[] {
  const slugs = getProjectSlugs();
  const projects = slugs
    .filter(slug => slug && slug !== undefined && slug !== 'undefined')
    .map(getProjectBySlug)
    .filter((project): project is Project => project !== null)
    .filter(project => project.frontmatter.status === 'published')
    .sort(
      (a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
    );

  return projects;
}

export function getProjectsByTag(tag: string): Project[] {
  return getAllProjects().filter(project => project.frontmatter.tags.includes(tag));
}

export function getAllTags(): string[] {
  const projects = getAllProjects();
  const tags = new Set<string>();

  projects.forEach(project => {
    project.frontmatter.tags.forEach(tag => tags.add(tag));
  });

  return Array.from(tags).sort();
}
