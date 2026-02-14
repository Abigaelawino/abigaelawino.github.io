import { getAllProjects } from '@/lib/content';
import { ProjectsClient } from './projects-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Explore project case studies in machine learning, analytics, and production data systems. Discover end-to-end data science projects with rigorous analysis and reproducible methods.',
  openGraph: {
    title: 'Projects · Abigael Awino',
    description:
      'Explore project case studies in machine learning, analytics, and production data systems. Discover end-to-end data science projects.',
    url: 'https://abigaelawino.github.io/projects',
    images: [
      {
        url: '/assets/og.png',
        width: 1200,
        height: 630,
        alt: 'Projects · Abigael Awino Data Science Portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Projects · Abigael Awino',
    description:
      'Explore project case studies in machine learning, analytics, and production data systems.',
    images: ['/assets/og.png'],
  },
  alternates: {
    canonical: 'https://abigaelawino.github.io/projects',
  },
};

export default function ProjectsPage() {
  const allProjects = getAllProjects();

  return <ProjectsClient projects={allProjects} />;
}
