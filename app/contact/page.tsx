import Link from 'next/link';
import '../page.css';

export default function ContactPage() {
  return (
    <div className="page-content">
      <h1>Contact</h1>
      <p>Reach out via the secure contact form or connect on LinkedIn/GitHub.</p>
      <p><Link href="/">← Back to Home</Link></p>
    </div>
  );
}