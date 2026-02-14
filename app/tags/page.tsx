import Link from 'next/link';

export default function TagsPage() {
  return (
    <div className="page-content">
      <h1>Tags</h1>
      <p>Browse content by topic and technology.</p>
      <p><Link href="/">← Back to Home</Link></p>
    </div>
  );
}