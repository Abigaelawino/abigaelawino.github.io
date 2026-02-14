import { ReactNode } from 'react';
import { Navigation } from '@/components/navigation';
import { StructuredData } from '@/components/structured-data';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://abigaelawino.github.io'),
  title: {
    template: '%s · Abigael Awino',
    default: 'Abigael Awino · Data Science Portfolio',
  },
  description:
    'Data scientist specializing in machine learning, analytics, and production-ready data solutions. End-to-end project development from data collection to deployment.',
  keywords: [
    'data science',
    'machine learning',
    'analytics',
    'Python',
    'TensorFlow',
    'PyTorch',
    'data engineering',
    'statistics',
  ],
  authors: [{ name: 'Abigael Awino' }],
  creator: 'Abigael Awino',
  publisher: 'Abigael Awino',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://abigaelawino.github.io',
    title: 'Abigael Awino · Data Science Portfolio',
    description:
      'Data scientist specializing in machine learning, analytics, and production-ready data solutions. End-to-end project development from data collection to deployment.',
    siteName: 'Abigael Awino Portfolio',
    images: [
      {
        url: '/assets/og.png',
        width: 1200,
        height: 630,
        alt: 'Abigael Awino · Data Science Portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Abigael Awino · Data Science Portfolio',
    description:
      'Data scientist specializing in machine learning, analytics, and production-ready data solutions.',
    images: ['/assets/og.png'],
    creator: '@abigaelawino',
  },
  verification: {
    google: 'verify-google-site-code',
    yandex: 'verify-yandex-site-code',
  },
  alternates: {
    canonical: 'https://abigaelawino.github.io',
    languages: {
      'en-US': 'https://abigaelawino.github.io',
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
      </head>
      <body>
        <div className="min-h-screen bg-background">
          <a
            className="absolute left-0 top-auto w-0.25 h-0.25 overflow-hidden -m-1 p-0 border-0"
            href="#main-content"
          >
            Skip to content
          </a>

          <Navigation siteName="Abigael Awino Portfolio" />

          <main id="main-content" tabIndex={-1} className="container py-8 px-4 sm:px-6 lg:px-8">
            {children}
          </main>

          <footer className="border-t py-8 mt-16">
            <div className="container text-center text-muted-foreground px-4 sm:px-6 lg:px-8">
              <p>&copy; 2024 Abigael Awino. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
