import Link from 'next/link';
import type { Metadata } from 'next';
import '../page.css';

export const metadata: Metadata = {
  title: 'Resume',
  description:
    "Download Abigael Awino's professional resume and view a concise web summary of experience, skills, and qualifications in data science and machine learning.",
  openGraph: {
    title: 'Resume · Abigael Awino',
    description:
      "Download Abigael Awino's professional resume and view a concise web summary of experience, skills, and qualifications in data science.",
    url: 'https://abigaelawino.github.io/resume',
    images: [
      {
        url: '/assets/og.png',
        width: 1200,
        height: 630,
        alt: 'Resume · Abigael Awino Data Science Professional',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resume · Abigael Awino',
    description:
      "Download Abigael Awino's professional resume and view experience, skills, and qualifications in data science.",
    images: ['/assets/og.png'],
  },
  alternates: {
    canonical: 'https://abigaelawino.github.io/resume',
  },
};

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
