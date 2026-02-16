'use client';

type NotebookCodeAccordionProps = {
  slug: string;
};

const codeSnippets: Record<string, Array<{ title: string; description: string; code: string }>> = {
  'babynames-ssa-visual-story': [
    {
      title: 'Ingest SSA Files',
      description: 'Load yearly SSA files and concatenate into one dataset.',
      code: `files = sorted(raw_path.glob('yob*.txt'))
all_data = []

for file in files:
    year = int(re.search(r'yob(\\d{4})', file.name).group(1))
    df = pd.read_csv(file, header=None, names=['name', 'sex', 'count'])
    df['year'] = year
    all_data.append(df)

babynames = pd.concat(all_data, ignore_index=True)`,
    },
    {
      title: 'Generation Buckets',
      description: 'Assign generation cohorts for Tableau slicing.',
      code: `babynames["generation"] = np.select(
    [
        babynames["year"].between(1883, 1900),
        babynames["year"].between(1901, 1927),
        babynames["year"].between(1928, 1945),
        babynames["year"].between(1946, 1964),
        babynames["year"].between(1965, 1980),
        babynames["year"].between(1981, 1996),
        babynames["year"].between(1997, 2012),
        babynames["year"].between(2013, 2024),
    ],
    ["Lost", "Greatest", "Silent", "Boomers", "Gen X", "Millennials", "Gen Z", "Gen Alpha"],
    default="Other",
)`,
    },
  ],
  'f5-breach-threat-intelligence': [
    {
      title: 'Diff-in-Diff Model',
      description: 'Compute treated/post indicators and fit the DiD regression.',
      code: `df["treated"] = np.where(df["ticker"] == treated, 1, 0)
df["post"] = np.where(df["date"] >= event_date, 1, 0)
df["treated_post"] = df["treated"] * df["post"]
model = smf.ols("returns ~ treated + post + treated_post", data=df).fit()`,
    },
    {
      title: 'Placebo Window',
      description: 'Shift the event window to validate assumptions.',
      code: `placebo_date = event_date - pd.Timedelta(days=7)
df["post_placebo"] = (df["date"] >= placebo_date).astype(int)
df["treated_post_placebo"] = df["treated"] * df["post_placebo"]
placebo = smf.ols("returns ~ treated + post_placebo + treated_post_placebo", data=df).fit()`,
    },
  ],
  'ssa-disability-outcomes': [
    {
      title: 'Clean Numeric Fields',
      description: 'Remove commas and coerce numeric columns.',
      code: `df_clean["SSA Disability Beneficiaries  age 18-64*"] = (
    df_clean["SSA Disability Beneficiaries  age 18-64*"]
    .str.replace(",", "", regex=False)
    .astype(float)
)`,
    },
    {
      title: 'Tableau Export',
      description: 'Create join keys and export Tableau-ready CSV.',
      code: `df["State-FY"] = df["State Code"].astype(str) + "-" + df["Fiscal Year"].astype(str)
df.to_csv("ssa_disability_tableau_ready.csv", index=False, encoding="utf-8")`,
    },
  ],
};

export function NotebookCodeAccordion({ slug }: NotebookCodeAccordionProps) {
  const snippets = codeSnippets[slug] || [];
  if (snippets.length === 0) return null;

  return (
    <div className="space-y-3">
      {snippets.map(snippet => (
        <details key={snippet.title} className="rounded-lg border bg-muted/20 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            {snippet.title}
          </summary>
          <p className="mt-2 text-sm text-muted-foreground">{snippet.description}</p>
          <pre className="code-block no-scrollbar mt-3">
            <code>{snippet.code}</code>
          </pre>
        </details>
      ))}
    </div>
  );
}
