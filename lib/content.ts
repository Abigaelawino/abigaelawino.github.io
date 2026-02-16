import readingTime from 'reading-time';
import projectsIndex from '@/src/generated/projects-index.json';

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
  gallery: string[];
  status: 'published' | 'draft';
}

export interface Project {
  slug: string;
  frontmatter: ProjectFrontmatter;
  content: string;
  readingTime: number;
}

type ProjectIndexEntry = {
  slug: string;
  frontmatter: ProjectFrontmatter;
  content: string;
};

const projectEntries = projectsIndex as ProjectIndexEntry[];

export function getProjectSlugs() {
  return projectEntries.map(entry => entry.slug);
}

export function getProjectBySlug(slug: string): Project | null {
  if (!slug || slug === 'undefined' || slug === '') {
    return null;
  }

  const entry = projectEntries.find(project => project.slug === slug);
  if (!entry) {
    return null;
  }

  return {
    slug: entry.slug,
    frontmatter: entry.frontmatter,
    content: entry.content,
    readingTime: readingTime(entry.content).minutes,
  };
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
