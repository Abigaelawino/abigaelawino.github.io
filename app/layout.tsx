import { ReactNode } from 'react';
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
        <div className="shell">
          <a className="shell__skip-link" href="#main-content">Skip to content</a>
          <header>
            <nav className="shell__nav" aria-label="Site navigation">
              <a className="shell__brand" href="/">Abigael Awino Portfolio</a>
              <ul className="shell__links">
                <li><a className="shell__link" href="/projects">Projects</a></li>
                <li><a className="shell__link" href="/about">About</a></li>
                <li><a className="shell__link" href="/contact">Contact</a></li>
              </ul>
            </nav>
          </header>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}