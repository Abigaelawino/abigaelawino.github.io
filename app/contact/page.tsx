import Link from 'next/link';
import { ContactForm } from '../../components/contact-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Github, Linkedin, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Abigael Awino to discuss your data science challenges. Reach out via the secure contact form or connect on LinkedIn and GitHub for collaborations.',
  openGraph: {
    title: 'Contact · Abigael Awino',
    description:
      'Get in touch with Abigael Awino to discuss your data science challenges. Reach out via the secure contact form or connect on LinkedIn and GitHub.',
    url: 'https://abigaelawino.github.io/contact',
    images: [
      {
        url: '/assets/og.png',
        width: 1200,
        height: 630,
        alt: 'Contact Abigael Awino · Data Science Collaborations',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact · Abigael Awino',
    description:
      'Get in touch with Abigael Awino to discuss your data science challenges and collaborations.',
    images: ['/assets/og.png'],
  },
  alternates: {
    canonical: 'https://abigaelawino.github.io/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Get in Touch</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          I'd love to hear about your data science challenges and discuss how I can help.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Contact Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email
              </CardTitle>
              <CardDescription>
                For project inquiries, collaborations, or general questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a
                  href="mailto:contact@abigaelawino.com"
                  data-analytics-event="cta_email"
                  data-analytics-prop-location="contact_page"
                >
                  Send Email
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Linkedin className="h-5 w-5" />
                LinkedIn
              </CardTitle>
              <CardDescription>Professional networking and career opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a
                  href="https://linkedin.com/in/abigaelawino"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-analytics-event="cta_linkedin"
                  data-analytics-prop-location="contact_page"
                >
                  Connect on LinkedIn
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                GitHub
              </CardTitle>
              <CardDescription>View my open-source projects and contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a
                  href="https://github.com/abigaelawino"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-analytics-event="cta_github"
                  data-analytics-prop-location="contact_page"
                >
                  Visit GitHub
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Send a Message</CardTitle>
              <CardDescription>
                Fill out the form below and I'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Availability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-semibold text-green-700">Available for Projects</span>
            </div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✅ Open to freelance and consulting projects</p>
            <p>✅ Available for full-time opportunities</p>
            <p>✅ Quick response time: 24-48 hours</p>
            <p>⏰ Priority slots available for urgent projects</p>
          </div>
          <p className="text-sm">
            For urgent matters, please mention it in your message and I'll respond as soon as
            possible.
          </p>
        </CardContent>
      </Card>

      {/* Back Navigation */}
      <div className="text-center">
        <Button variant="outline" asChild>
          <Link
            href="/"
            data-analytics-event="nav_home"
            data-analytics-prop-location="contact_page"
          >
            ← Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
