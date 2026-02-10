import Link from 'next/link';
import '../page.css';

export default function AboutPage() {
  return (
    <div className="page-content">
      <h1>About</h1>
      <p>Learn about Abigael Awino, her strengths, and her toolkit.</p>
      <p><Link href="/">← Back to Home</Link></p>
    </div>
  );
}