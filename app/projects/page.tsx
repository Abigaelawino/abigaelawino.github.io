import Link from 'next/link';
import '../page.css';

export default function ProjectsPage() {
  return (
    <div className="page-content">
      <h1>Projects</h1>
      <p>Explore project case studies in ML, analytics, and production data systems.</p>
      <p><Link href="/">← Back to Home</Link></p>
    </div>
  );
}