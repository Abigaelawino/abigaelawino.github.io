import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function ProjectPage({ params }) {
  notFound();
  
  return (
    <div className="page-content">
      <p>Project not found.</p>
      <p><Link href="/projects">← Back to Projects</Link></p>
    </div>
  );
}