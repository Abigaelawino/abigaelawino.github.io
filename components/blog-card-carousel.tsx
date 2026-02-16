'use client';

import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type BlogPost = {
  slug: string;
  frontmatter: {
    title: string;
    date: string;
    tags: string[];
    summary: string;
  };
};

interface BlogCardCarouselProps {
  posts: BlogPost[];
}

export function BlogCardCarousel({ posts }: BlogCardCarouselProps) {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <Carousel opts={{ loop: posts.length > 1 }}>
        <CarouselContent>
          {posts.map(post => (
            <CarouselItem key={post.slug}>
              <Card className="flex h-full flex-col">
                <CardHeader>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {post.frontmatter.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle className="text-xl">{post.frontmatter.title}</CardTitle>
                  <CardDescription>{post.frontmatter.summary}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link
                      href={`/blog/${post.slug}`}
                      data-analytics-event="blog_read_more"
                      data-analytics-prop-location="home_latest_carousel"
                      data-analytics-prop-post={post.slug}
                    >
                      Read Post
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        {posts.length > 1 && (
          <>
            <CarouselPrevious className="-left-3" />
            <CarouselNext className="-right-3" />
          </>
        )}
      </Carousel>
    </div>
  );
}
