import Link from 'next/link';
import '../page.css';

export default function BlogPage() {
  return (
    <div className="page-content">
      <h1>Blog</h1>
      <p>Read notes on model monitoring, analytics implementation, and production workflows.</p>
      <p><Link href="/">← Back to Home</Link></p>
    </div>
  );
}