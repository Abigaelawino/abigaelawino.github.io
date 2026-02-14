import Link from 'next/link';
import '../page.css';

export default function ResumePage() {
  return (
    <div className="page-content">
      <h1>Resume</h1>
      <p>Download a PDF resume and view a concise web summary.</p>
      <p>
        <Link href="/">← Back to Home</Link>
      </p>
    </div>
  );
}
