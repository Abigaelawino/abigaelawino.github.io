# Editor Guide (Projects + Blog + Pages)

This guide explains how to edit the site content safely using **Decap CMS** or direct MDX edits.

## Quick Start (Local)

1. Run `netlify dev`.
2. Open `http://localhost:8888`.
3. If MDX changes do not appear, run `npm run refresh:live` or click `scripts/refresh-live-view.sh`.

---

## Where Content Lives

- **Projects**: `content/projects/*.mdx`
- **Blog posts**: `content/blog/*.mdx`
- **About page**: `content/about.mdx`
- **Settings**: `content/settings.json`
- **Images**: `public/images/**` (preferred)
- **Public assets**: `public/assets/**` (og image, resume)

---

## Decap CMS

Open `/admin` to use the CMS.

### Editing Projects

Required frontmatter fields:
- `title` (string)
- `date` (YYYY-MM-DD)
- `tags` (list)
- `summary` (text)
- `status` (published/draft)
- `cover` (image URL in `/images/...`)
- `gallery` (list of images)
- `repo` (URL)
- `tech` (list)
- `caseStudyData` / `caseStudyMethods` / `caseStudyResults` / `caseStudyReproducibility` / `caseStudyReflection`

The **gallery** drives the carousel headers on project cards.

### Editing Blog Posts

Required frontmatter fields:
- `title`
- `date`
- `tags`
- `summary`
- `readingTime` (integer)
- `cover` (image; defaults to `/assets/og.png` if you omit it)

---

## MDX Components You Can Use

## Editing MDX Files (Detailed)

Every MDX file has two parts:
1. **Frontmatter** (metadata between `---` lines)
2. **Body** (content written in Markdown + MDX components)

Example structure:

```mdx
---
title: Example Project
date: 2026-02-16
tags: [analytics, visualization]
summary: One-line summary used on cards.
cover: /images/projects/example-cover.svg
gallery:
  - /images/projects/example-cover.svg
  - /images/projects/example-detail.png
status: published
---

# Example Project

Intro paragraph here.
```

### Frontmatter rules

- Dates must be `YYYY-MM-DD`.
- `status` must be `published` or `draft`.
- `cover` and `gallery` should point to `/images/...` in `public/images`.
- `tags` and `tech` are required list fields for projects.

### Body content tips

- Use headings (`##`) to break sections.
- Use MDX components (`Chart`, `Table`, `Card`) for richer blocks.
- Use standard Markdown for lists and text.

### Chart (Recharts)

```mdx
<Chart
  type="bar"
  title="Example Chart"
  data={[
    { name: 'A', value: 10 },
    { name: 'B', value: 25 }
  ]}
  height={220}
  color="#2563eb"
/>
```

- `type`: `bar` | `line` | `pie`
- `data`: array of `{ name, value }`
- `height`: chart height in px
- `color`: optional hex color

### Inline code (shadcn style)

Inline code is styled using the shadcn typography pattern. Example:

```mdx
Use the `treated_post` term to capture the breach impact.
```

### Table (shadcn/ui)

```mdx
<Table>
  <TableCaption>Sample data</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Value</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Example</TableCell>
      <TableCell>42</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Card (shadcn/ui)

```mdx
<Card>
  <CardHeader>
    <CardTitle>Key Result</CardTitle>
  </CardHeader>
  <CardContent>
    Short narrative or metric callout.
  </CardContent>
</Card>
```

---

## Images

- Store images in `public/images/` and reference them as `/images/...`.
- Example: `cover: /images/projects/my-project-cover.svg`

External images (GitHub raw URLs) are allowed but should be used sparingly.

## Images & Galleries

- **Project cards** pull images from `gallery` (carousel).
- **Blog cards** use `cover`.
- Store images in `public/images/...` and reference them as `/images/...`.

## Common File Edits

### Projects
- File path: `content/projects/<slug>.mdx`
- Update frontmatter and section content.
- Add charts/tables under a `## Visualizations` heading.

### Blog posts
- File path: `content/blog/<slug>.mdx`
- Ensure `cover` and `readingTime` are set.

### About
- File path: `content/about.mdx`

## Refreshing Local Views

If MDX changes do not appear:

- Run `npm run refresh:live`, or
- Click `scripts/refresh-live-view.sh`

---

## Common Pitfalls

1. **Missing required frontmatter** → build will fail.
2. **Wrong date format** → must be `YYYY-MM-DD`.
3. **Charts with empty data** → make sure `data` is a proper array of objects.
4. **CMS not reflecting updates** → run `npm run refresh:live`.

---

## Page-Specific Notes

### Projects
- Each project card reads `cover` and `gallery`.
- Project detail pages use MDX for inline charts/tables/code blocks.

### Blog
- Blog cards on the home page show the `cover` image.
- Use `readingTime` to control the label in blog lists.

### About
- Edit `content/about.mdx` for bio and skills.

---

## QA Checklist

- Open `/projects` and verify card carousels load images.
- Open `/projects/<slug>` and verify charts/tables render.
- Open `/blog` and verify latest posts appear.
- Open `/admin` and verify CMS loads.
