'use client';

import { useState, useMemo } from 'react';

export interface Project {
  slug: string;
  frontmatter: {
    title: string;
    date: string;
    tags: string[];
    summary: string;
    tech: string[];
    repo?: string;
    cover: string;
    status: 'published' | 'draft';
  };
  content: string;
  readingTime: number;
}

export function useProjectFilters(projects: Project[]) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach(project => {
      project.frontmatter.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [projects]);

  // Filter projects based on selected tags
  const filteredProjects = useMemo(() => {
    if (selectedTags.length === 0) {
      return projects;
    }
    return projects.filter(project =>
      selectedTags.some(tag => project.frontmatter.tags.includes(tag))
    );
  }, [projects, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const clearFilters = () => {
    setSelectedTags([]);
  };

  return {
    selectedTags,
    allTags,
    filteredProjects,
    toggleTag,
    clearFilters,
  };
}
