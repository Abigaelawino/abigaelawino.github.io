import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function TagPage({ params }) {
  notFound();
  
  return (
    <div className="page-content">
      <p>Tag not found.</p>
      <p><Link href="/tags">← Back to Tags</Link></p>
    </div>
  );
}