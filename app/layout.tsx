import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="min-h-screen bg-background">
          <a 
            className="absolute left-0 top-auto w-0.25 h-0.25 overflow-hidden"
            href="#main-content"
          >
            Skip to content
          </a>
          
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <nav className="container flex h-14 items-center justify-between" aria-label="Site navigation">
              <Link 
                href="/" 
                className="font-bold text-xl hover:text-primary transition-colors"
              >
                Abigael Awino Portfolio
              </Link>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/projects">Projects</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/about">About</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/blog">Blog</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/contact">Contact</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/resume">Resume</Link>
                </Button>
              </div>
            </nav>
          </header>
          
          <main id="main-content" tabIndex={-1} className="container py-8">
            {children}
          </main>
          
          <footer className="border-t py-8 mt-16">
            <div className="container text-center text-muted-foreground">
              <p>&copy; 2024 Abigael Awino. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}