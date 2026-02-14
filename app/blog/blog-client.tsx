'use client';

import { useBlogFilters } from '@/hooks/use-blog-filters';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight, Tag as TagIcon, X } from 'lucide-react';
import Link from 'next/link';
import { BlogPost } from '@/hooks/use-blog-filters';

interface BlogClientProps {
  posts: BlogPost[];
}

export function BlogClient({ posts }: BlogClientProps) {
  const { selectedTags, allTags, filteredPosts, toggleTag, clearFilters } = useBlogFilters(posts);

  const publishedPosts = posts.filter(post => post.frontmatter.status === 'published');

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Blog</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Read notes on model monitoring, analytics implementation, and production workflows.
        </p>

        {allTags.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">Filter by Topics</h3>
              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear Filters
                </Button>
              )}
            </div>

            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {selectedTags.map(tag => (
                  <Badge
                    key={tag}
                    variant="default"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-center">
              {allTags.map(tag => {
                const isSelected = selectedTags.includes(tag);
                const count = publishedPosts.filter(p => p.frontmatter.tags.includes(tag)).length;
                return (
                  <Badge
                    key={tag}
                    variant={isSelected ? 'default' : 'secondary'}
                    className={`flex items-center gap-1 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'hover:bg-secondary/80'
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    <TagIcon size={12} />
                    {tag}
                    <span className="text-xs opacity-70">({count})</span>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Showing {filteredPosts.length} of {publishedPosts.length} posts
          {selectedTags.length > 0 && ` for "${selectedTags.join(', ')}"`}
        </p>
      </div>

      {/* Blog Posts Grid */}
      {filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <p className="text-muted-foreground text-lg">
              {selectedTags.length > 0
                ? `No posts found matching the selected filters: ${selectedTags.join(', ')}`
                : 'No published posts yet. Check back soon!'}
            </p>
            {selectedTags.length > 0 && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {filteredPosts.map(post => (
            <Card key={post.slug} className="flex flex-col">
              <CardHeader className="space-y-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {post.frontmatter.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <CardTitle className="text-xl">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="hover:text-primary/80 transition-colors"
                    >
                      {post.frontmatter.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-base">
                    {post.frontmatter.summary}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {post.frontmatter.readingTime} min read
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-4">
                <Button asChild className="flex-1">
                  <Link href={`/blog/${post.slug}`}>
                    Read Post
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-8">
        <Button asChild variant="outline">
          <Link href="/">← Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
