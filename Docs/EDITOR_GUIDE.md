# Editor Guide (Projects + Blog + Pages)

This guide explains how to edit the site content safely using **Decap CMS** or direct MDX edits.

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

## Common Pitfalls

1. **Missing required frontmatter** → build will fail.
2. **Wrong date format** → must be `YYYY-MM-DD`.
3. **Charts with empty data** → make sure `data` is a proper array of objects.
4. **CMS not reflecting updates** → run `npm run refresh:live`.

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

The **gallery** drives the carousel headers on project cards and the project page visual carousel.

### Editing Blog Posts

Required frontmatter fields:
- `title`
- `date`
- `tags`
- `summary`
- `readingTime` (integer)
- `cover` (image; defaults to `/assets/og.png` if you omit it)

---

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

### Recommended project structure

Use this order for all project MDX files to keep the site consistent:

1. `## Page Guide` (short bullets for navigation)
2. `## Highlights` (key outcomes or challenges)
3. `## Summary` (problem, context, success metric)
4. `## Data` (sources, volume, quality)
5. `## Methods` (modeling, pipeline, evaluation)
6. `## Results` (metrics and business impact)
7. `## Notebook Highlights` (optional)
8. `## Notebook Snippets` (optional)
9. `## Tableau Workbook Details` (optional)
10. `## Visualizations` (charts + images for the Visualizations panel)
11. `## Deliverables` (artifacts and outputs)

Project-specific sections are okay, but keep the core order above.

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

### Interactive charts (manual edit)

The **Interactive charts** tab on project pages is not driven by MDX. Those blocks are hard-coded in:

- `components/project-charts.tsx` (per-project interactive charts)

To edit a chart block:
1. Open `components/project-charts.tsx`.
2. Find the `if (slug === '<project-slug>')` section for your project.
3. Update the `ChartPanel` blocks or Plotly configs inside that section.

Example (Recharts block):

```tsx
<ChartPanel title="Top 10 Names Overall" description="Most common names">
  <Chart
    type="bar"
    data={[
      { name: 'James', value: 5000 },
      { name: 'Mary', value: 4800 },
    ]}
    height={240}
    color="#e14f7a"
  />
</ChartPanel>
```

Example (Plotly block):

```tsx
<ChartPanel title="Revenue Trend" description="Monthly lift">
  <div className="h-[260px]">
    <PlotlyChart
      data={[
        {
          type: 'scatter',
          mode: 'lines+markers',
          x: ['Jan', 'Feb', 'Mar'],
          y: [120, 180, 250],
          line: { color: '#2563eb', width: 3 },
        },
      ]}
      layout={{
        xaxis: { title: 'Month' },
        yaxis: { title: 'Revenue ($K)' },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
      }}
      className="h-full w-full"
    />
  </div>
</ChartPanel>
```

If you add a new project with interactive charts:
1. Add a new `if (slug === '<your-slug>')` block in `components/project-charts.tsx`.
2. Add the slug to `projectHasCharts` in `app/projects/[slug]/page.tsx` so the Visualizations panel appears.
3. (Optional) Update `visualizationHighlights` in `app/projects/[slug]/page.tsx` to control the summary badges above the charts.

### Inline code (shadcn style)

Inline code is styled using the shadcn typography pattern. Example:

```mdx
Use the `treated_post` term to capture the breach impact.
```

### Code blocks (scroll + line numbers)

Code blocks automatically render with a light gray background, Shiki syntax highlighting, line numbers, and a scroll area. Use standard Markdown fences:

````mdx
```ts
export function TypographyInlineCode() {
  return (
    <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
      @radix-ui/react-alert-dialog
    </code>
  )
}
```
````

### Visualizations section placement

If you want charts/images grouped under the Visualizations panel on the project page, add a top-level section header in the MDX body:

```mdx
## Images

- Store images in `public/images/` and reference them as `/images/...`.
- Example: `cover: /images/projects/my-project-cover.svg`

External images (GitHub raw URLs) are allowed but should be used sparingly.

## Images & Galleries

- **Project cards** pull images from `gallery` (carousel).
- **Blog cards** use `cover`.
- Store images in `public/images/...` and reference them as `/images/...`.

## MDX Components You Can Use

### Code Accordion (line-numbered snippets)

Use `CodeAccordion` to drop line-numbered code snippets anywhere inside a project or blog MDX file. This uses Shiki highlighting and the same line-numbered style as regular code fences.

```mdx
<CodeAccordion
  items={[
    {
      title: 'Load SSA files',
      description: 'Concatenate yearly files into one DataFrame.',
      language: 'python',
      code: `files = sorted(raw_path.glob('yob*.txt'))
all_data = []

for file in files:
    year = int(re.search(r'yob(\\d{4})', file.name).group(1))
    df = pd.read_csv(file, header=None, names=['name', 'sex', 'count'])
    df['year'] = year
    all_data.append(df)

babynames = pd.concat(all_data, ignore_index=True)`,
    },
  ]}
/>
```

Notes:
- `items` is an array of `{ title, description?, language?, code }`.
- `language` drives syntax highlighting (ex: `python`, `ts`, `sql`).
- Line numbers are always shown.

## Notebook Highlights
## Notebook Snippets
```

Use this area for code blocks, notebook notes, or Tableau workbook field choices.

### Project notebook snippets (auto)

Each project page can include auto-loaded notebook snippets (used in the Notebook Summary panel) by editing:

- `components/notebook-code-accordion.tsx`

Add or update snippets under the matching `slug` key. The notebook code shown there is sourced from the project repositories and rendered with line numbers.

### Deliverables section placement

If you add a `## Deliverables` header, that content appears right after the Data section.

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

## Quick Start (Local)

1. Run `netlify dev`.
2. Open `http://localhost:8888`.
3. If MDX changes do not appear, run `npm run refresh:live` or click `scripts/refresh-live-view.sh`.

---

## Refreshing Local Views

If MDX changes do not appear:

- Run `npm run refresh:live`, or
- Click `scripts/refresh-live-view.sh`

---

## Tableau Workbook Details
## Visualizations

<Chart ... />

![Notebook figure](https://example.com/figure.png)
```

Everything below that header is routed into the Visualizations area instead of the Detailed Analysis panel.

### Work Artifacts section (Notebook + Tableau)

If you add any of these headers, their content is grouped into the **Work Artifacts** section after Methods:

```mdx
## Where Content Lives

- **Projects**: `content/projects/*.mdx`
- **Blog posts**: `content/blog/*.mdx`
- **About page**: `content/about.mdx`
- **Settings**: `content/settings.json`
- **Images**: `public/images/**` (preferred)
- **Public assets**: `public/assets/**` (og image, resume)

---
