'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Menu, X } from 'lucide-react';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="min-h-screen bg-background">
          <a
            className="absolute left-0 top-auto w-0.25 h-0.25 overflow-hidden -m-1 p-0 border-0"
            href="#main-content"
          >
            Skip to content
          </a>

          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <nav
              className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8"
              aria-label="Site navigation"
            >
              <Link
                href="/"
                className="font-bold text-xl hover:text-primary transition-colors text-foreground"
              >
                <span className="hidden sm:inline">Abigael Awino Portfolio</span>
                <span className="sm:hidden">AA Portfolio</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-2">
                <NavigationMenu>
                  <NavigationMenuList className="flex gap-2">
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Button variant="ghost" asChild>
                          <Link
                            href="/projects"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            Projects
                          </Link>
                        </Button>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Button variant="ghost" asChild>
                          <Link
                            href="/about"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            About
                          </Link>
                        </Button>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Button variant="ghost" asChild>
                          <Link
                            href="/blog"
                            className="hover:bg-accent hover:text-accent-foreground"
                          >
                            Blog
                          </Link>
                        </Button>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>

                <div className="flex items-center gap-2 ml-4 pl-4 border-l">
                  <Button
                    variant="default"
                    asChild
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Link href="/contact">Contact</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/resume">View Resume</Link>
                  </Button>
                </div>
              </div>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </nav>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container px-4 py-4 space-y-2">
                  <Button variant="ghost" asChild className="w-full justify-start">
                    <Link href="/projects" onClick={() => setMobileMenuOpen(false)}>
                      Projects
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="w-full justify-start">
                    <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
                      About
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="w-full justify-start">
                    <Link href="/blog" onClick={() => setMobileMenuOpen(false)}>
                      Blog
                    </Link>
                  </Button>
                  <div className="pt-2 border-t space-y-2">
                    <Button
                      variant="default"
                      asChild
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                        Contact
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/resume" onClick={() => setMobileMenuOpen(false)}>
                        View Resume
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </header>

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
