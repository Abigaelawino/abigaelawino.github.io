const fallbackSiteUrl = 'https://abigael-awino-portfolio.netlify.app';

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || fallbackSiteUrl).replace(/\/$/, '');

export function absoluteUrl(path: string) {
  if (!path) {
    return siteUrl;
  }

  return path.startsWith('/') ? `${siteUrl}${path}` : `${siteUrl}/${path}`;
}
