import { NextResponse } from 'next/server';
import projectsIndex from '@/src/generated/projects-index.json';
import blogIndex from '@/src/generated/blog-index.json';

export const dynamic = 'force-static';

export async function GET() {
  const projects = projectsIndex as Array<{ slug: string }>;
  const blog = blogIndex as Array<{ slug: string }>;

  return NextResponse.json({
    projects: {
      count: projects.length,
      first: projects[0]?.slug ?? null,
    },
    blog: {
      count: blog.length,
      first: blog[0]?.slug ?? null,
    },
  });
}
