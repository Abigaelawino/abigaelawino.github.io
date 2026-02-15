# Project Content Model & Page Templates

## Site Content Model

This document defines the content structure for portfolio projects, enabling auto-generation of project cards, filters, and SEO metadata.

## Project Frontmatter Fields

Use this once per project in `content/projects/<slug>.mdx`:

```yaml
---
title: '' # Full project title
slug: '' # URL-friendly identifier
date: 'YYYY-MM-DD' # Publication date
status: shipped | iterating | research
featured: false # Boolean: show on home page
summary: '' # 140–180 chars; used on card
result: '' # Short chip: metric or deliverable
methods: [] # Array: ["did"], ["rag"], ["eda"], ["ml"]
domain: [] # Array: ["finance"], ["public-policy"], ["storytelling"]
tags: [] # 3–6 chips: Python, Tableau, Redis, etc.
repo: '' # GitHub repo URL
demo: '' # Optional live demo URL
slides: '' # Optional slides/deck URL
viz: ['static'] # Array: ["recharts"], ["plotly"], ["static"]
artifacts: [] # List of downloadable/viewable items
---
```

This structure enables auto-generation of the Projects grid and filters without manual duplication.

## Cards Layout (Exact Fields + Display Order)

Each card should display (in this order):

1. **Title** — Project name
2. **Summary line** — What it is + why it matters
3. **Result chip** — Metric/deliverable highlight
4. **Tag chips** — 3–5 relevant tags
5. **Actions**:
   - Primary: "Read case study"
   - Secondary: "Code" (repo link)
   - Optional: "Slides" / "Demo"

## Project Page Sections (Recommended Order)

1. **Hero** — Title, 1–2 sentence abstract, result callout, links (Code / Notebook / Slides)
2. **Problem** — What question/problem is being addressed
3. **Data** — Sources, size, coverage, caveats
4. **Approach** — Methods, models, feature engineering
5. **Results** — Visual-first presentation of findings
6. **Validation / Robustness** — If applicable
7. **Artifacts** — Notebooks, dashboards, images
8. **Reproducibility** — How to run
9. **Limitations** — What couldn't be done
10. **Next steps** — Future improvements

## Chart Library Placement Guide

| Section           | Recommended Library | Notes                          |
| ----------------- | ------------------- | ------------------------------ |
| Results (primary) | Recharts            | 2–4 interactive charts max     |
| Validation        | Static images       | Placebo/pre-trends/diagnostics |
| Appendix          | Plotly (optional)   | Collapsed by default           |

## Project Builds

### 1) Baby Names — "How Basic Is Your Name?"

**Card:**

```
Title: How Basic Is Your Name?
Summary: Visual exploration of U.S. baby-name popularity by generation (1880–2024) for shareable data storytelling.
Result: "Top-10 by generation story"
Tags: EDA · Storytelling · Python · Tableau
CTAs: Read case study | Code | Visuals
```

**Frontmatter:**

```yaml
title: 'How Basic Is Your Name?'
slug: 'baby-names-generation-analysis'
date: '2025-01-15'
status: shipped
featured: true
summary: 'Visual exploration of U.S. baby-name popularity by generation (1880–2024) for shareable data storytelling.'
result: 'Top-10 by generation story'
methods: ['eda', 'storytelling']
domain: ['storytelling']
tags: ['Python', 'Tableau', 'Pandas', 'Data Viz']
repo: 'https://github.com/Abigaelawino/baby-names'
viz: ['static']
artifacts:
  - type: 'notebook'
    label: 'Data processing notebook'
    href: 'notebooks/'
  - type: 'visuals'
    label: 'Generation visuals'
    href: 'visualizations/top_10_baby_names/'
```

**Project Page Sections:**

- **Hero**: Result callout: "Top 10 baby names by generation (1880–2024)"
- **Problem**: Trend shifts, generational identity through naming
- **Data**: SSA baby names (100% SS card applications), 1880–2024
- **Approach**: Generation definitions (Boomers, Gen X, Millennials, Gen Z, Gen Alpha), top-10 per cohort computation
- **Results**:
  - Static: PNGs from `visualizations/top_10_baby_names/`
  - Optional interactive: Name popularity line chart, Top 10 bar chart
- **Artifacts**: Notebook folder + Tableau folder + embedded images
- **Reproducibility**: Run notebook → outputs CSV → refresh visuals
- **Next steps**: Volatility metric, gender split, uniqueness index

**Build Components:**

- `components/charts/NameTrendLine.tsx` (Recharts)
- `components/charts/TopNamesBar.tsx` (Recharts)
- Data: `content/data/babynames/name_trends_sample.json` (small sample only)

---

### 2) F5 Breach — Difference-in-Differences Stock Impact

**Card:**

```
Title: Causal Impact of 2025 F5 Cyber Breach
Summary: Estimated breach impact on FFIV daily returns using DiD with competitor + benchmark controls.
Result: "~9–10% drop (p<0.001)"
Tags: Causal Inference · DiD · Python · Statsmodels
CTAs: Read case study | Code | Slides
```

**Frontmatter:**

```yaml
title: 'Causal Impact of 2025 F5 Cyber Breach'
slug: 'f5-breach-did-analysis'
date: '2025-01-10'
status: shipped
featured: true
summary: 'Estimated breach impact on FFIV daily returns using DiD with competitor + benchmark controls.'
result: '~9–10% drop (p<0.001)'
methods: ['did', 'causal-inference']
domain: ['finance', 'security']
tags: ['Python', 'Statsmodels', 'DiD', 'Causal Inference', 'yfinance']
repo: 'https://github.com/Abigaelawino/f5-breach-analysis'
slides: 'https://github.com/Abigaelawino/f5-breach-analysis/tree/main/slides'
viz: ['recharts', 'static']
artifacts:
  - type: 'notebook'
    label: 'DiD analysis notebook'
    href: 'notebook/'
  - type: 'slides'
    label: 'Presentation slides'
    href: 'slides/'
```

**Project Page Sections:**

- **Hero**: Callout: "DiD estimate: -0.0951 treated_post (p < 0.001)"
- **Problem**: Quantify causal market impact of breach beyond overall market movement
- **Data**:
  - Source: Yahoo Finance via yfinance
  - Window: 2025-04-18 → 2025-12-12, event: 2025-10-16
  - Tickers: FFIV (treated), AKAM, NET, CSCO (controls), SPY, VTI (benchmarks)
- **Approach**:
  - Model: `returns ~ treated + post + treated_post`
  - Checks: parallel trends, placebo, difference-in-trends
- **Results**:
  - Recharts: Daily returns by ticker, Event impact line
  - Static: Key slides
- **Validation**: Pre-trends chart, Placebo chart, Trend-test chart
- **Reproducibility**: `pip install -r requirements.txt` → run notebook

**Build Components:**

- `components/charts/ReturnsMultiLine.tsx` (Recharts)
- `components/charts/EventImpactLine.tsx` (Recharts)
- Data: `content/data/f5-breach/returns.json` (precomputed)

---

### 3) LangChain + Redis RAG (CLI Demo)

**Card:**

```
Title: Conversational RAG with Redis
Summary: Built a CLI assistant that retrieves context from a Redis vector store and persists chat memory across sessions.
Result: "RAG + persistent memory"
Tags: RAG · Vector Search · LLM · Python · Redis
CTAs: Read case study | Code
```

**Frontmatter:**

```yaml
title: 'Conversational RAG with Redis'
slug: 'langchain-redis-rag'
date: '2025-01-05'
status: shipped
featured: false
summary: 'Built a CLI assistant that retrieves context from a Redis vector store and persists chat memory across sessions.'
result: 'RAG + persistent memory'
methods: ['rag', 'llm']
domain: ['ai', 'systems']
tags: ['Python', 'LangChain', 'Redis', 'OpenAI', 'Vector Search']
repo: 'https://github.com/Abigaelawino/redis-rag-cli'
viz: ['static']
artifacts:
  - type: 'code'
    label: 'Main script'
    href: 'redis_example.py'
```

**Project Page Sections:**

- **Hero**: One-liner: "CLI RAG: retrieval + memory + chain orchestration"
- **Problem**: Make answers grounded in documents and maintain conversational continuity
- **Data**: Example documents for demo purposes
- **Approach**: Retriever + memory + chain composition (see README step list)
- **Results**:
  - Architecture diagram (static)
  - Sample transcript blocks
  - Optional: Latency per question, Token usage charts
- **Reproducibility**: requirements.txt + env var setup (no secrets exposed)

**Build Components:**

- `components/diagrams/RagFlow.tsx` (SVG/JSX diagram)
- `components/charts/LatencyBar.tsx` (optional)

---

### 4) SSA Disability Outcomes (State-Level Map)

**Card:**

```
Title: SSA Disability Claim Outcomes (State-Level)
Summary: Visualized state-level disability claim approval likelihood (2021) to highlight geographic variation in outcomes.
Result: "2021 approval map"
Tags: Public Policy · EDA · Mapping · Python
CTAs: Read case study | Code | Visuals
```

**Frontmatter:**

```yaml
title: 'SSA Disability Claim Outcomes'
slug: 'ssa-disability-state-analysis'
date: '2024-12-20'
status: iterating
featured: false
summary: 'Visualized state-level disability claim approval likelihood (2021) to highlight geographic variation in outcomes.'
result: '2021 approval map'
methods: ['eda', 'mapping']
domain: ['public-policy']
tags: ['Python', 'Plotly', 'Mapping', 'Public Policy', 'EDA']
repo: 'https://github.com/Abigaelawino/ssa-disability-analysis'
viz: ['plotly', 'static']
artifacts:
  - type: 'notebook'
    label: 'Analysis notebook'
    href: 'notebook/'
  - type: 'visuals'
    label: 'State map'
    href: 'images/'
```

**Project Page Sections:**

- **Hero**: Show the 2021 map image immediately
- **Problem**: Understand variation in approval outcomes across states
- **Data**: State-level outcomes from SSA
- **Approach**: Compute/visualize approval likelihood by state
- **Results**:
  - Static: Existing map PNG
  - Interactive (Plotly): Choropleth with hover tooltips, Top/bottom 10 bar chart
- **Reproducibility**: requirements.txt + notebook run instructions

**Build Components:**

- `components/charts/ApprovalMapPlotly.tsx` (Plotly, dynamic import, ssr:false)
- `components/charts/TopBottomStates.tsx` (Recharts)
- Data: `content/data/ssa/approval_2021.json`

---

## Future Project Template (Drop-in)

### Card Copy Template

```
Title: [Clear and specific]
Summary: "Built/estimated X using Y to improve/answer Z"
Result chip: [Metric if available, else deliverable]
Tags: [1 method + 1 domain + 1–3 tech]
CTAs: Read case study | Code | [Slides/Demo]
```

### Project Page MDX Skeleton

```mdx
---
title: ''
slug: ''
date: 'YYYY-MM-DD'
status: shipped | iterating | research
featured: false
summary: ''
result: ''
methods: []
domain: []
tags: []
repo: ''
demo: ''
slides: ''
viz: ['static']
artifacts:
  - type: ''
    label: ''
    href: ''
---

# {title}

## TL;DR

- **What it is**:
- **Main result**:
- **Why it matters**:

## Problem

## Data

## Approach

## Results

## Validation

## Artifacts

## Reproducibility

## Limitations

## Next steps
```

## Implementation Notes (Netlify Compliance)

1. **Prefer static images by default**; add Recharts for lightweight interactivity
2. **If using Plotly**, dynamically import it and limit to 1–2 charts per page:
   ```tsx
   const ApprovalMap = dynamic(() => import('@/components/charts/ApprovalMapPlotly'), {
     ssr: false,
   });
   ```
3. **Keep chart datasets small and precomputed** in `content/data/.../*.json`
4. **Do NOT fetch live data on page load** (unreliable + slow + rate-limits)
5. **Ensure all MDX files have valid frontmatter** before pushing
