import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProjectBySlug, getAllProjects } from '@/lib/content';
import { ArrowLeft, ExternalLink, Github, Clock, Tag } from 'lucide-react';

export async function generateStaticParams() {
  const projects = getAllProjects();
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const project = getProjectBySlug(params.slug);
  
  if (!project) {
    return {
      title: 'Project Not Found',
    };
  }

  return {
    title: `${project.frontmatter.title} | Case Study`,
    description: project.frontmatter.summary,
  };
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const project = getProjectBySlug(params.slug);
  
  if (!project) {
    notFound();
  }

  const { frontmatter, content, readingTime } = project;

  return (
    <div className="case-study-page">
      <div className="case-study-header">
        <Link href="/projects" className="back-link">
          <ArrowLeft size={20} />
          Back to Projects
        </Link>
        
        <div className="case-study-meta">
          <div className="meta-tags">
            {frontmatter.tags.map((tag) => (
              <span key={tag} className="tag">
                <Tag size={14} />
                {tag}
              </span>
            ))}
          </div>
          <div className="meta-info">
            <span className="reading-time">
              <Clock size={14} />
              {Math.round(readingTime)} min read
            </span>
            <span className="date">{new Date(frontmatter.date).toLocaleDateString()}</span>
          </div>
        </div>

        <h1 className="case-study-title">{frontmatter.title}</h1>
        <p className="case-study-summary">{frontmatter.summary}</p>

        <div className="case-study-tech">
          <strong>Technologies:</strong> {frontmatter.tech.join(', ')}
        </div>

        <div className="case-study-links">
          {frontmatter.repo && (
            <a href={frontmatter.repo} target="_blank" rel="noopener noreferrer" className="link-button">
              <Github size={16} />
              View Repository
            </a>
          )}
        </div>
      </div>

      <div className="case-study-content">
        <div className="case-study-image">
          <img src={frontmatter.cover} alt={frontmatter.title} />
        </div>

        <div className="case-study-sections">
          {/* Summary Section */}
          <section className="case-study-section">
            <h2>Summary</h2>
            <div className="section-content">
              <div className="summary-grid">
                <div className="summary-item">
                  <h3>Problem</h3>
                  <p>Implemented a solution to address critical business challenges through data-driven approaches.</p>
                </div>
                <div className="summary-item">
                  <h3>Context</h3>
                  <p>Leveraged available data sources and industry best practices to develop an effective solution.</p>
                </div>
                <div className="summary-item">
                  <h3>Success Metric</h3>
                  <p>Achieved measurable improvements in key performance indicators through systematic implementation.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Section */}
          {frontmatter.caseStudyData && (
            <section className="case-study-section">
              <h2>Data</h2>
              <div className="section-content">
                <p>{frontmatter.caseStudyData}</p>
              </div>
            </section>
          )}

          {/* Methods Section */}
          {frontmatter.caseStudyMethods && (
            <section className="case-study-section">
              <h2>Methods</h2>
              <div className="section-content">
                <p>{frontmatter.caseStudyMethods}</p>
              </div>
            </section>
          )}

          {/* Results Section */}
          {frontmatter.caseStudyResults && (
            <section className="case-study-section">
              <h2>Results</h2>
              <div className="section-content">
                <p>{frontmatter.caseStudyResults}</p>
              </div>
            </section>
          )}

          {/* Reproducibility Section */}
          {frontmatter.caseStudyReproducibility && (
            <section className="case-study-section">
              <h2>Reproducibility</h2>
              <div className="section-content">
                <p>{frontmatter.caseStudyReproducibility}</p>
                {frontmatter.repo && (
                  <div className="reproducibility-links">
                    <a href={frontmatter.repo} target="_blank" rel="noopener noreferrer" className="repo-link">
                      <Github size={16} />
                      View on GitHub
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Reflection Section */}
          {frontmatter.caseStudyReflection && (
            <section className="case-study-section">
              <h2>Reflection</h2>
              <div className="section-content">
                <p>{frontmatter.caseStudyReflection}</p>
              </div>
            </section>
          )}

          {/* Additional Content */}
          {content && (
            <section className="case-study-section">
              <h2>Detailed Analysis</h2>
              <div className="section-content markdown-content">
                <p>{content}</p>
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="case-study-footer">
        <Link href="/projects" className="back-link">
          <ArrowLeft size={20} />
          Back to Projects
        </Link>
      </div>
    </div>
  );
}