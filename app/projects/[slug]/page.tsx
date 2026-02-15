import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProjectBySlug, getAllProjects } from '@/lib/content';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, Github, Clock, Tag, Calendar, MapPin } from 'lucide-react';
import { MDXContent, enhanceContentWithCharts } from '@/components/mdx-content';

export async function generateStaticParams() {
  const projects = getAllProjects();
  return projects
    .map(project => ({
      slug: project.slug,
    }))
    .filter(params => params.slug !== undefined);
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  if (!params?.slug) {
    return {
      title: 'Project Not Found',
      description: 'The requested project case study could not be found.',
    };
  }

  const project = getProjectBySlug(params.slug);

  if (!project) {
    return {
      title: 'Project Not Found',
      description: 'The requested project case study could not be found.',
    };
  }

  const title = project.frontmatter.title;
  const summary = project.frontmatter.summary;
  const tags = project.frontmatter.tags.slice(0, 3).join(', ');
  const tech = project.frontmatter.tech.slice(0, 3).join(', ');

  return {
    title: `${title} · Case Study`,
    description: `${summary} Technologies used: ${tech}. Tags: ${tags}. A comprehensive data science case study with detailed methodology and results.`,
    keywords: [
      ...project.frontmatter.tags,
      ...project.frontmatter.tech,
      'case study',
      'data science',
      'machine learning',
    ],
    openGraph: {
      title: `${title} · Case Study | Abigael Awino`,
      description: `${summary} Technologies: ${tech}. Tags: ${tags}.`,
      url: `https://abigaelawino.github.io/projects/${project.slug}`,
      type: 'article',
      images: [
        {
          url: `/images/projects/${project.slug}-cover.svg`,
          width: 1200,
          height: 630,
          alt: `${title} · Case Study Cover`,
        },
        {
          url: '/assets/og.png',
          width: 1200,
          height: 630,
          alt: 'Abigael Awino · Data Science Portfolio',
        },
      ],
      publishedTime: project.frontmatter.date,
      authors: ['Abigael Awino'],
      section: 'Case Studies',
      tags: project.frontmatter.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · Case Study`,
      description: `${summary} Technologies: ${tech}. Tags: ${tags}.`,
      images: [`/images/projects/${project.slug}-cover.svg`, '/assets/og.png'],
    },
    alternates: {
      canonical: `https://abigaelawino.github.io/projects/${project.slug}`,
    },
  };
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  if (!params?.slug) {
    notFound();
  }

  const project = getProjectBySlug(params.slug);

  if (!project) {
    notFound();
  }

  const { frontmatter, content, readingTime } = project;

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <Button variant="outline" asChild className="w-fit">
              <Link href="/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Link>
            </Button>

            <div className="flex flex-wrap gap-2">
              {frontmatter.tags.map(tag => (
                <Badge key={tag} variant="secondary">
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {Math.round(readingTime)} min read
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(frontmatter.date).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">{frontmatter.title}</h1>
            <p className="text-lg text-muted-foreground">{frontmatter.summary}</p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Technologies</h3>
              <div className="flex flex-wrap gap-2">
                {frontmatter.tech.map(tech => (
                  <Badge key={tech} variant="outline">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>

            {frontmatter.repo && (
              <Button asChild>
                <a href={frontmatter.repo} target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  View Repository
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cover Image */}
      {frontmatter.cover && (
        <Card>
          <CardContent className="p-0">
            <img
              src={frontmatter.cover}
              alt={frontmatter.title}
              className="w-full h-auto rounded-t-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Case Study Sections */}
      <div className="space-y-8">
        {/* Summary Section */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Problem</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Implemented a solution to address critical business challenges through
                    data-driven approaches.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Leveraged available data sources and industry best practices to develop an
                    effective solution.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Success Metric</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Achieved measurable improvements in key performance indicators through
                    systematic implementation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Data Section */}
        {frontmatter.caseStudyData && (
          <Card>
            <CardHeader>
              <CardTitle>Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{frontmatter.caseStudyData}</p>
            </CardContent>
          </Card>
        )}

        {/* Methods Section */}
        {frontmatter.caseStudyMethods && (
          <Card>
            <CardHeader>
              <CardTitle>Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{frontmatter.caseStudyMethods}</p>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {frontmatter.caseStudyResults && (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{frontmatter.caseStudyResults}</p>
            </CardContent>
          </Card>
        )}

        {/* Reproducibility Section */}
        {frontmatter.caseStudyReproducibility && (
          <Card>
            <CardHeader>
              <CardTitle>Reproducibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{frontmatter.caseStudyReproducibility}</p>
              {frontmatter.repo && (
                <Button asChild variant="outline">
                  <a href={frontmatter.repo} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    View on GitHub
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reflection Section */}
        {frontmatter.caseStudyReflection && (
          <Card>
            <CardHeader>
              <CardTitle>Reflection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{frontmatter.caseStudyReflection}</p>
            </CardContent>
          </Card>
        )}

        {/* Additional Content */}
        {content && (
          <Card>
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none">
                <MDXContent content={enhanceContentWithCharts(content, params.slug)} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <Card>
        <CardContent className="pt-6">
          <Button variant="outline" asChild>
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
