import { MDXRemote } from 'next-mdx-remote/rsc';
import { Chart } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';

type InlineCodeProps = React.ComponentProps<'code'>;

function InlineCode({ className, ...props }: InlineCodeProps) {
  if (className?.includes('language-')) {
    return <code className={className} {...props} />;
  }

  return (
    <code
      className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
      {...props}
    />
  );
}

const components = {
  Chart,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
  code: InlineCode,
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
