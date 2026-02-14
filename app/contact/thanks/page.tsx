import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowLeft, Mail, Phone } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thank You - Contact',
  description:
    'Your message has been successfully sent. Thank you for reaching out to Abigael Awino.',
  openGraph: {
    title: 'Thank You - Contact · Abigael Awino',
    description: 'Your message has been successfully sent. Thank you for reaching out.',
    url: 'https://abigaelawino.github.io/contact/thanks',
    images: [
      {
        url: '/assets/og.png',
        width: 1200,
        height: 630,
        alt: 'Thank You - Contact Abigael Awino',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Thank You - Contact · Abigael Awino',
    description: 'Your message has been successfully sent. Thank you for reaching out.',
    images: ['/assets/og.png'],
  },
  alternates: {
    canonical: 'https://abigaelawino.github.io/contact/thanks',
  },
};

export default function ContactThanksPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <Card className="text-center">
          <CardHeader className="pb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Thank You!</CardTitle>
            <CardDescription>Your message has been successfully sent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                I appreciate you taking the time to reach out. I'll review your message and get back
                to you within 24-48 hours.
              </p>
              <div className="flex justify-center gap-6 pt-2">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>contact@abigaelawino.com</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button asChild>
                <Link
                  href="/"
                  data-analytics-event="nav_home"
                  data-analytics-prop-location="contact_thanks"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>

              <Button variant="outline" asChild>
                <Link
                  href="/resume"
                  data-analytics-event="nav_resume"
                  data-analytics-prop-location="contact_thanks"
                >
                  View Resume
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
