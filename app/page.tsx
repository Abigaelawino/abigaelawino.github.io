import Link from 'next/link';
import { getAllProjects } from '@/lib/content';
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
import { ArrowRight, Calendar, Clock, ExternalLink, Github } from 'lucide-react';
import type { Metadata } from 'next';
import { siteUrl } from '@/lib/site';
import blogIndex from '@/src/generated/blog-index.json';
import { ProjectCardCarousel } from '@/components/project-card-carousel';
import { BlogCardCarousel } from '@/components/blog-card-carousel';
import './page.css';

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Data science solutions bridging exploratory analysis to production-ready outcomes. Explore machine learning projects, analytics implementations, and end-to-end data solutions.',
  openGraph: {
    title: 'Abigael Awino · Data Science Portfolio',
    description:
      'Data science solutions bridging exploratory analysis to production-ready outcomes. Explore machine learning projects, analytics implementations, and end-to-end data solutions.',
    url: siteUrl,
    images: [
      {
        url: '/assets/og.png',
        width: 1200,
        height: 630,
        alt: 'Abigael Awino · Data Science Portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Abigael Awino · Data Science Portfolio',
    description:
      'Data science solutions bridging exploratory analysis to production-ready outcomes.',
    images: ['/assets/og.png'],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function HomePage() {
  const projects = getAllProjects().slice(0, 3); // Get first 3 projects for featured section
  const blogPosts = (blogIndex as Array<{
    slug: string;
    frontmatter: { title?: string; date?: string; tags?: string[]; summary?: string; cover?: string };
    content: string;
  }>)
    .map(entry => ({
      slug: entry.slug,
      frontmatter: {
        title: entry.frontmatter.title || '',
        date: entry.frontmatter.date || '',
        tags: entry.frontmatter.tags || [],
        summary: entry.frontmatter.summary || '',
        cover: entry.frontmatter.cover,
      },
      content: entry.content,
    }))
    .sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime())
    .slice(0, 3);

  return (
    <div className="page-content space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Data Science Portfolio</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          End-to-end data projects showcasing rigorous analysis, reproducible methods, and
          production-ready solutions.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link
              href="/projects"
              data-analytics-event="cta_projects"
              data-analytics-prop-location="hero"
            >
              View Projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link
              href="/contact"
              data-analytics-event="cta_contact"
              data-analytics-prop-location="hero"
            >
              Get in Touch
            </Link>
          </Button>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Featured Projects</h2>
          <p className="text-muted-foreground">
            Recent work in machine learning, analytics, and data visualization
          </p>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Projects coming soon! Check back later.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
              <Card key={project.slug} className="flex flex-col">
                <ProjectCardCarousel
                  images={
                    project.frontmatter.gallery?.length
                      ? project.frontmatter.gallery
                      : [project.frontmatter.cover]
                  }
                  title={project.frontmatter.title}
                />
                <CardHeader>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {project.frontmatter.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle className="text-xl">{project.frontmatter.title}</CardTitle>
                  <CardDescription>{project.frontmatter.summary}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="flex flex-wrap gap-1 mb-4">
                    {project.frontmatter.tech.slice(0, 3).map(tech => (
                      <Badge key={tech} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(project.frontmatter.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {Math.round(project.readingTime)} min
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link
                      href={`/projects/${project.slug}`}
                      data-analytics-event="project_read_more"
                      data-analytics-prop-project={project.slug}
                      data-analytics-prop-location="home_featured"
                    >
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  {project.frontmatter.repo && (
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href={project.frontmatter.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View repository"
                        data-analytics-event="project_repo"
                        data-analytics-prop-project={project.slug}
                        data-analytics-prop-location="home_featured"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Latest Writing */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Latest Writing</h2>
          <p className="text-muted-foreground">
            Deep dives on data cleaning, visualization choices, and model validation
          </p>
        </div>

        {blogPosts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Blog posts coming soon.</p>
            </CardContent>
          </Card>
        ) : (
          <BlogCardCarousel posts={blogPosts} />
        )}

        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link href="/blog" data-analytics-event="cta_blog" data-analytics-prop-location="home">
              View All Posts
            </Link>
          </Button>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Let's Work Together</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          I'm passionate about solving complex data challenges. Whether you need analysis, ML
          models, or data infrastructure, I'd love to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link
              href="/contact"
              data-analytics-event="cta_contact"
              data-analytics-prop-location="footer"
            >
              Contact Me
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link
              href="/about"
              data-analytics-event="cta_about"
              data-analytics-prop-location="footer"
            >
              Learn More
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
