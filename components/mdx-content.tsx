'use client';

import { MDXRemote } from 'next-mdx-remote/rsc';
import { Chart } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const components = {
  Chart,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  // Add any other custom components here
};

interface MDXContentProps {
  content: string;
}

export function MDXContent({ content }: MDXContentProps) {
  return (
    <div className="mdx-content">
      <MDXRemote source={content} components={components} />
    </div>
  );
}
