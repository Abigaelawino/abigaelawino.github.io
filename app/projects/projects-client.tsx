'use client';

import { useProjectFilters } from '@/hooks/use-project-filters';
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
import { Calendar, Clock, ArrowRight, Tag as TagIcon, Github, X } from 'lucide-react';
import Link from 'next/link';
import { Project } from '@/hooks/use-project-filters';

interface ProjectsClientProps {
  projects: Project[];
}

export function ProjectsClient({ projects }: ProjectsClientProps) {
  const { selectedTags, allTags, filteredProjects, toggleTag, clearFilters } =
    useProjectFilters(projects);

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
                const count = projects.filter(p => p.frontmatter.tags.includes(tag)).length;
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
                    data-analytics-event="filter_tag"
                    data-analytics-prop-tag={tag}
                    data-analytics-prop-action={isSelected ? 'remove' : 'add'}
                    data-analytics-prop-location="projects_page"
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
        <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
          Showing {filteredProjects.length} of {projects.length} projects
          {selectedTags.length > 0 && ` for "${selectedTags.join(', ')}"`}
        </p>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <p className="text-muted-foreground text-lg">
              {selectedTags.length > 0
                ? `No projects found matching the selected filters: ${selectedTags.join(', ')}`
                : 'No projects available yet. Check back soon!'}
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
          {filteredProjects.map(project => (
            <Card key={project.slug} className="flex flex-col">
              <article className="h-full flex flex-col">
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
                    <Link
                      href={`/projects/${project.slug}`}
                      data-analytics-event="project_read_more"
                      data-analytics-prop-project={project.slug}
                      data-analytics-prop-location="projects_list"
                    >
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
                        data-analytics-event="project_repo"
                        data-analytics-prop-project={project.slug}
                        data-analytics-prop-location="projects_list"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </CardFooter>
              </article>
            </Card>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-8">
        <Button asChild variant="outline">
          <Link
            href="/"
            data-analytics-event="nav_home"
            data-analytics-prop-location="projects_page"
          >
            ← Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
