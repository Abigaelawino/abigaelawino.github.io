import Link from 'next/link';
import './page.css';

export default function HomePage() {
  return (
    <div className="page-content">
      <h1>Welcome to Abigael Awino's Portfolio</h1>
      <p>Data science solutions bridging exploratory analysis to production-ready outcomes.</p>
      <div className="links">
        <Link href="/projects">View Projects</Link> | 
        <Link href="/about">About</Link> | 
        <Link href="/contact">Contact</Link>
      </div>
    </div>
  );
}