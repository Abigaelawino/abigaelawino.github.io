import { NextResponse } from 'next/server';
import { getProjectBySlug } from '@/lib/content';

export const dynamic = 'force-static';

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const project = getProjectBySlug(params.slug);
  return NextResponse.json({
    slug: params.slug,
    found: Boolean(project),
    title: project?.frontmatter.title ?? null,
  });
}
