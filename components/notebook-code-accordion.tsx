import { CodeBlock } from '@/components/code-block';

type NotebookCodeAccordionProps = {
  slug: string;
};

const codeSnippets: Record<
  string,
  Array<{ title: string; description: string; code: string; language?: string }>
> = {
  'babynames-ssa-visual-story': [
    {
      title: 'Ingest SSA Files',
      description: 'Load yearly SSA files and concatenate into one dataset.',
      code: `files = sorted(raw_path.glob('yob*.txt'))
print(f'Found {len(files)} files')

all_data = []

for file in files:
    year = int(re.search(r'yob(\\d{4})', file.name).group(1))
    df = pd.read_csv(file, header=None, names=['name', 'sex', 'count'])
    df['year'] = year
    all_data.append(df)

babynames = pd.concat(all_data, ignore_index=True)`,
      language: 'python',
    },
    {
      title: 'Generation Buckets',
      description: 'Assign generation cohorts for Tableau slicing.',
      code: `generation_ranges = {
    'Lost Generation': (1883, 1900),
    'Greatest Generation': (1901, 1927),
    'Silent Generation': (1928, 1945),
    'Baby Boomers': (1946, 1964),
    'Generation X': (1965, 1980),
    'Millennials (Gen Y)': (1981, 1996),
    'Generation Z': (1997, 2012),
    'Generation Alpha': (2013, 2024)
}

def get_generation_data(df, gen_name, year_range):
    start, end = year_range
    gen_data = df[(df['year'] >= start) & (df['year'] <= end)].copy()
    top_names = gen_data.groupby(['name', 'sex'])['count'].sum().sort_values(ascending=False).head(10).reset_index()
    return top_names

generation_data = {}
for gen_name, year_range in generation_ranges.items():
    generation_data[gen_name] = get_generation_data(babynames, gen_name, year_range)

print(f'Data prepared for {len(generation_data)} generations')`,
      language: 'python',
    },
  ],
  'f5-breach-threat-intelligence': [
    {
      title: 'Diff-in-Diff Model',
      description: 'Compute treated/post indicators and fit the DiD regression.',
      code: `# Runs Difference-in-Differences regression
# Estimates the causal effect of an event on stock returns
def run_diff_in_diff(df, event_date, treated):
    start_date = event_date - datetime.timedelta(days=180)

    df = df[(df['date'] >= start_date) & (df['date'] <= event_date)]

    df = df.copy()

    # Treatment indicator: 1 if treated ticker, else 0
    df.loc[:, 'treated'] = np.where(df['ticker'] == treated, 1, 0)

    # Post-event indicator: 1 if date >= event_date, else 0
    df.loc[:, 'post'] = np.where(df['date'] >= event_date, 1, 0)

    # Interaction term: treated * post
    df.loc[:, 'treated_post'] = df['treated'] * df['post']

    # DID regression model
    # Returns ~ treated + post + treated_post
    formula = "returns ~ treated + post + treated_post"
    model = smf.ols(formula=formula, data=df).fit()

    return model`,
      language: 'python',
    },
    {
      title: 'Placebo Window',
      description: 'Shift the event window to validate assumptions.',
      code: `# Placebo Test: Run Difference-in-Differences analysis with a placebo event date
placebo_date = event_date - pd.Timedelta(days=7)

# Run Difference-in-Differences analysis with placebo event date
model_placebo = run_diff_in_diff(prices, placebo_date, "FFIV")
print(model_placebo.summary())`,
      language: 'python',
    },
  ],
  'ssa-disability-outcomes': [
    {
      title: 'Clean Numeric Fields',
      description: 'Remove commas and coerce numeric columns.',
      code: `# Convert numeric-looking strings with commas to floats for calculations
# Convert beneficiary count columns stored as text (object)
# to numeric values so they can be used in calculations
# Commas are removed before conversion

df_clean["SSA Disability Beneficiaries  age 18-64*"] = (
    df_clean["SSA Disability Beneficiaries  age 18-64*"]
    .str.replace(",", "", regex=False)
    .astype(float)
)

# Convert SSI Disabled Child counts from string to numeric

df_clean["SSI Disabled Child (DC) Beneficiaries*"]
    
df_clean["SSI Disabled Child (DC) Beneficiaries*"] = (
    df_clean["SSI Disabled Child (DC) Beneficiaries*"]
    .str.replace(",", "", regex=False)
    .astype(float)
)`,
      language: 'python',
    },
    {
      title: 'Tableau Export',
      description: 'Create join keys and export Tableau-ready CSV.',
      code: `# adding a key column for Tableau joins
df["State-FY"] = df["State Code"] + "-" + df["Fiscal Year"].astype(str)

# Reorder a few important columns up front (optional) ----
front = ["State Code", "Region Code", "Fiscal Year", "Date Type", "Update Date", "State-FY"]
rest = [c for c in df.columns if c not in front]
df = df[front + rest]

# Export Tableau-ready df
df.to_csv("ssa_disability_tableau_ready.csv", index=False, encoding="utf-8")
print("Wrote: ssa_disability_tableau_ready.csv")
print(df.dtypes.head(10))
print(df.shape)`,
      language: 'python',
    },
  ],
};

export function NotebookCodeAccordion({ slug }: NotebookCodeAccordionProps) {
  const snippets = codeSnippets[slug] || [];
  if (snippets.length === 0) return null;

  return (
    <div className="space-y-3">
      {snippets.map(snippet => (
        <details
          key={snippet.title}
          className="rounded-lg border bg-muted/20 p-4 overflow-hidden"
        >
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            {snippet.title}
          </summary>
          <p className="mt-2 text-sm text-muted-foreground">{snippet.description}</p>
          <div className="mt-3">
            <CodeBlock code={snippet.code} language={snippet.language ?? 'text'} />
          </div>
        </details>
      ))}
    </div>
  );
}
