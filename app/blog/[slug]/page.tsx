import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function BlogPostPage({ params }) {
  notFound();
  
  return (
    <div className="page-content">
      <p>Post not found.</p>
      <p><Link href="/blog">← Back to Blog</Link></p>
    </div>
  );
}