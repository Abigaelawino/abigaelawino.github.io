import { NextResponse } from 'next/server';
import { getProjectBySlug } from '@/lib/content';

export const dynamic = 'force-static';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  return NextResponse.json({
    slug,
    found: Boolean(project),
    title: project?.frontmatter.title ?? null,
  });
}
