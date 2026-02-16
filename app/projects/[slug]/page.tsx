import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProjectBySlug, getAllProjects } from '@/lib/content';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, Github, Clock, Tag, Calendar } from 'lucide-react';
import { MDXContent } from '@/components/mdx-content';
import { ProjectCharts } from '@/components/project-charts';
import { siteUrl } from '@/lib/site';
import blogIndex from '@/src/generated/blog-index.json';

export const dynamic = 'force-static';
export const dynamicParams = false;
export const revalidate = false;

type MdxSplit = {
  analysisContent: string;
  visualizationsContent: string | null;
};

function splitMdxContent(content: string | undefined): MdxSplit {
  if (!content) {
    return { analysisContent: '', visualizationsContent: null };
  }

  const marker = /(^|\n)##\s+Visualizations\s*\n/i;
  const match = content.match(marker);
  if (!match || match.index === undefined) {
    return { analysisContent: content, visualizationsContent: null };
  }

  const markerIndex = match.index + (match[1] ? match[1].length : 0);
  const analysis = content.slice(0, markerIndex).trim();
  const visuals = content
    .slice(markerIndex)
    .replace(/^##\s+Visualizations\s*\n/i, '')
    .trim();

  return {
    analysisContent: analysis,
    visualizationsContent: visuals || null,
  };
}

const visualizationHighlights: Record<
  string,
  Array<{ label: string; value: string; note: string }>
> = {
  'babynames-ssa-visual-story': [
    {
      label: 'Births (2024)',
      value: '3.33M',
      note: 'Latest SSA total births snapshot.',
    },
    {
      label: 'Top Name',
      value: 'James',
      note: 'Most common across the full dataset.',
    },
    {
      label: 'Unique Names (2024)',
      value: '29,225',
      note: 'Counts unique names for the most recent year.',
    },
  ],
  'f5-breach-threat-intelligence': [
    {
      label: 'Event Window',
      value: 'Oct 16–23',
      note: 'Primary impact window used for the DiD visuals.',
    },
    {
      label: 'Max Drawdown',
      value: '-10.7%',
      note: 'Largest daily return drop around the breach.',
    },
    {
      label: 'DiD Effect',
      value: '-9.5%',
      note: 'Estimated breach impact coefficient.',
    },
  ],
  'ssa-disability-outcomes': [
    {
      label: 'Top State FY2021',
      value: 'KS 60.6%',
      note: 'Highest favorable determination rate.',
    },
    {
      label: 'Lowest State FY2021',
      value: 'DC 26.9%',
      note: 'Lowest favorable determination rate.',
    },
    {
      label: 'COVID Marker',
      value: 'FY2020',
      note: 'Structural break highlighted in the trend.',
    },
  ],
};

export async function generateStaticParams() {
  const projects = getAllProjects();
  return projects
    .map(project => ({
      slug: project.slug,
    }))
    .filter(params => params.slug !== undefined);
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  if (!resolvedParams?.slug) {
    return {
      title: 'Project Not Found',
      description: 'The requested project case study could not be found.',
    };
  }

  const project = getProjectBySlug(resolvedParams.slug);

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
      url: `${siteUrl}/projects/${project.slug}`,
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
      canonical: `${siteUrl}/projects/${project.slug}`,
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  if (!resolvedParams?.slug) {
    notFound();
  }

  const project = getProjectBySlug(resolvedParams.slug);

  if (!project) {
    notFound();
  }

  const { frontmatter, content, readingTime } = project;
  const { analysisContent, visualizationsContent } = splitMdxContent(content);
  const projectHasCharts = [
    'customer-segmentation-dashboard',
    'ecommerce-recommendation-engine',
    'babynames-ssa-visual-story',
    'f5-breach-threat-intelligence',
    'ssa-disability-outcomes',
  ].includes(resolvedParams.slug);
  const shouldRenderVisualizations = projectHasCharts || Boolean(visualizationsContent);
  const highlights = visualizationHighlights[resolvedParams.slug] ?? [
    {
      label: 'Interactive Views',
      value: '3+',
      note: 'Primary charts highlight the core story.',
    },
    {
      label: 'Static Figures',
      value: '2+',
      note: 'Notebook exports and report snapshots.',
    },
    {
      label: 'Data Samples',
      value: '1+',
      note: 'Inline tables or summaries support the charts.',
    },
  ];
  const relatedPosts = (() => {
    const entries = blogIndex as Array<{
      slug: string;
      frontmatter: {
        title?: string;
        date?: string;
        summary?: string;
        tags?: string[];
      };
    }>;

    const projectTags = new Set([
      ...(frontmatter.tags || []),
      ...(frontmatter.tech || []),
    ].map(tag => tag.toLowerCase()));

    return entries
      .map(post => {
        const tags = (post.frontmatter.tags || []).map(tag => tag.toLowerCase());
        const overlap = tags.filter(tag => projectTags.has(tag));
        return {
          ...post,
          overlapCount: overlap.length,
        };
      })
      .filter(post => post.overlapCount > 0)
      .sort((a, b) => {
        if (b.overlapCount !== a.overlapCount) {
          return b.overlapCount - a.overlapCount;
        }
        const dateA = a.frontmatter.date ? new Date(a.frontmatter.date).getTime() : 0;
        const dateB = b.frontmatter.date ? new Date(b.frontmatter.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);
  })();

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

        {shouldRenderVisualizations && (
          <Card id="visualizations">
            <CardHeader>
              <CardTitle>Visualizations</CardTitle>
              <CardDescription>
                Interactive charts and notebook-derived figures grouped for quick review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {highlights.map(item => (
                  <Card key={item.label} className="bg-card/80">
                    <CardHeader>
                      <CardDescription>{item.label}</CardDescription>
                      <CardTitle className="text-2xl">{item.value}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">{item.note}</CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                <aside className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
                  <div className="font-semibold text-foreground">Navigate</div>
                  <a className="block text-muted-foreground hover:text-foreground" href="#viz-interactive">
                    Interactive charts
                  </a>
                  <a className="block text-muted-foreground hover:text-foreground" href="#viz-notebook">
                    Notebook figures
                  </a>
                </aside>
                <div className="space-y-8">
                  <section id="viz-interactive" className="space-y-4">
                    <h3 className="text-lg font-semibold">Interactive charts</h3>
                    <div className="space-y-4">
                      <ProjectCharts slug={resolvedParams.slug} />
                    </div>
                  </section>
                  {visualizationsContent && (
                    <section id="viz-notebook" className="space-y-4">
                      <h3 className="text-lg font-semibold">Notebook figures</h3>
                      <div className="prose prose-slate max-w-none">
                        <MDXContent content={visualizationsContent} />
                      </div>
                    </section>
                  )}
                </div>
              </div>
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
        {analysisContent && (
          <Card>
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none">
                <MDXContent content={analysisContent} />
              </div>
            </CardContent>
          </Card>
        )}

        {relatedPosts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Related Blog Posts</CardTitle>
              <CardDescription>Additional context and implementation notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {relatedPosts.map(post => (
                <div key={post.slug} className="flex flex-col gap-1">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-base font-semibold hover:text-primary"
                  >
                    {post.frontmatter.title || 'Untitled Post'}
                  </Link>
                  {post.frontmatter.summary && (
                    <p className="text-sm text-muted-foreground">{post.frontmatter.summary}</p>
                  )}
                </div>
              ))}
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
