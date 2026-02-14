'use client';

import { useState, useMemo } from 'react';

export interface BlogPost {
  slug: string;
  frontmatter: {
    title: string;
    date: string;
    tags: string[];
    summary: string;
    readingTime: string;
    status: 'published' | 'draft';
  };
  content: string;
}

export function useBlogFilters(posts: BlogPost[]) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get all unique tags from published posts
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts
      .filter(post => post.frontmatter.status === 'published')
      .forEach(post => {
        post.frontmatter.tags.forEach(tag => tags.add(tag));
      });
    return Array.from(tags).sort();
  }, [posts]);

  // Filter posts based on selected tags and published status
  const filteredPosts = useMemo(() => {
    const publishedPosts = posts.filter(post => post.frontmatter.status === 'published');

    if (selectedTags.length === 0) {
      return publishedPosts;
    }
    return publishedPosts.filter(post =>
      selectedTags.some(tag => post.frontmatter.tags.includes(tag))
    );
  }, [posts, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const clearFilters = () => {
    setSelectedTags([]);
  };

  return {
    selectedTags,
    allTags,
    filteredPosts,
    toggleTag,
    clearFilters,
  };
}
