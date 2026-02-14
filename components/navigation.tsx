'use client';

import { useState } from 'react';
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

interface NavigationProps {
  siteName: string;
}

export function Navigation({ siteName }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav
        className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Site navigation"
      >
        <Link
          href="/"
          className="font-bold text-xl hover:text-primary transition-colors text-foreground"
          data-analytics-event="nav_home"
          data-analytics-prop-location="header"
        >
          <span className="hidden sm:inline">{siteName}</span>
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
                      data-analytics-event="nav_projects"
                      data-analytics-prop-location="header"
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
                      data-analytics-event="nav_about"
                      data-analytics-prop-location="header"
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
                      data-analytics-event="nav_blog"
                      data-analytics-prop-location="header"
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
              data-analytics-event="cta_contact"
              data-analytics-prop-location="header"
            >
              <Link href="/contact">Contact</Link>
            </Button>
            <Button
              variant="outline"
              asChild
              data-analytics-event="cta_resume"
              data-analytics-prop-location="header"
            >
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
              <Link
                href="/projects"
                onClick={() => setMobileMenuOpen(false)}
                data-analytics-event="nav_projects"
                data-analytics-prop-location="mobile_menu"
              >
                Projects
              </Link>
            </Button>
            <Button variant="ghost" asChild className="w-full justify-start">
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                data-analytics-event="nav_about"
                data-analytics-prop-location="mobile_menu"
              >
                About
              </Link>
            </Button>
            <Button variant="ghost" asChild className="w-full justify-start">
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                data-analytics-event="nav_blog"
                data-analytics-prop-location="mobile_menu"
              >
                Blog
              </Link>
            </Button>
            <div className="pt-2 border-t space-y-2">
              <Button
                variant="default"
                asChild
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                data-analytics-event="cta_contact"
                data-analytics-prop-location="mobile_menu"
              >
                <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                  Contact
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="w-full"
                data-analytics-event="cta_resume"
                data-analytics-prop-location="mobile_menu"
              >
                <Link href="/resume" onClick={() => setMobileMenuOpen(false)}>
                  View Resume
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
