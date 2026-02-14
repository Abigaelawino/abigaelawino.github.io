import Link from 'next/link';
import { getAllProjects, getAllTags } from '@/lib/content';
import { Calendar, Clock, ArrowRight, Tag as TagIcon } from 'lucide-react';

export default function ProjectsPage() {
  const projects = getAllProjects();
  const allTags = getAllTags();

  return (
    <div className="projects-page">
      <div className="projects-header">
        <h1>Projects</h1>
        <p>Explore project case studies in ML, analytics, and production data systems.</p>
        
        {allTags.length > 0 && (
          <div className="tags-overview">
            <h3>Topics</h3>
            <div className="tags-list">
              {allTags.map(tag => (
                <span key={tag} className="topic-tag">
                  <TagIcon size={14} />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="no-projects">
          <p>No projects available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div key={project.slug} className="project-card">
              <div className="project-card-image">
                <img src={project.frontmatter.cover} alt={project.frontmatter.title} />
              </div>
              
              <div className="project-card-content">
                <div className="project-card-meta">
                  <div className="project-tags">
                    {project.frontmatter.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="tag">
                        <TagIcon size={12} />
                        {tag}
                      </span>
                    ))}
                    {project.frontmatter.tags.length > 3 && (
                      <span className="tag-more">+{project.frontmatter.tags.length - 3}</span>
                    )}
                  </div>
                  <div className="project-date">
                    <Calendar size={14} />
                    {new Date(project.frontmatter.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                <h2 className="project-title">{project.frontmatter.title}</h2>
                <p className="project-summary">{project.frontmatter.summary}</p>

                <div className="project-tech-list">
                  {project.frontmatter.tech.slice(0, 4).map(tech => (
                    <span key={tech} className="tech-tag">{tech}</span>
                  ))}
                  {project.frontmatter.tech.length > 4 && (
                    <span className="tech-tag-more">+{project.frontmatter.tech.length - 4}</span>
                  )}
                </div>

                <div className="project-card-footer">
                  <span className="reading-time">
                    <Clock size={14} />
                    {Math.round(project.readingTime)} min read
                  </span>
                  <Link href={`/projects/${project.slug}`} className="read-more">
                    Read case study
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="projects-footer">
        <Link href="/" className="back-link">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}