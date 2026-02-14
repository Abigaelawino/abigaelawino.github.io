import Link from 'next/link';
import { getAllProjects, getAllTags } from '@/lib/content';
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
import { Calendar, Clock, ArrowRight, Tag as TagIcon, Github, ExternalLink } from 'lucide-react';

export default function ProjectsPage() {
  const projects = getAllProjects();
  const allTags = getAllTags();

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Projects</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore project case studies in ML, analytics, and production data systems.
        </p>

        {allTags.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Topics</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {allTags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  <TagIcon size={12} />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              No projects available yet. Check back soon!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {projects.map(project => (
            <Card key={project.slug} className="flex flex-col">
              <CardHeader className="space-y-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {project.frontmatter.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {project.frontmatter.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.frontmatter.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-xl">{project.frontmatter.title}</CardTitle>
                  <CardDescription className="text-base">
                    {project.frontmatter.summary}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <div className="flex flex-wrap gap-1">
                  {project.frontmatter.tech.slice(0, 4).map(tech => (
                    <Badge key={tech} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {project.frontmatter.tech.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{project.frontmatter.tech.length - 4}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(project.frontmatter.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {Math.round(project.readingTime)} min
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2 pt-4">
                <Button asChild className="flex-1">
                  <Link href={`/projects/${project.slug}`}>
                    Read Case Study
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

      {/* Footer */}
      <div className="text-center pt-8">
        <Button asChild variant="outline">
          <Link href="/">← Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
