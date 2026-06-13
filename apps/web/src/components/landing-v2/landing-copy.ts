import {
  BrainCircuit,
  DatabaseZap,
  FileJson,
  FileSpreadsheet,
  FlaskConical,
  LineChart,
  Sparkles,
  Table2,
} from 'lucide-react';

export const navLinks = [
  { label: 'What it does', href: '#features' },
  { label: 'Formats', href: '#formats' },
  { label: 'AI Analyst', href: '#ai-analyst' },
  { label: 'ML Lab', href: '#ml-lab' },
];

export const heroCopy = {
  eyebrow: 'NO-CODE DATA WORKSPACE',
  headline: ['Throw data at it.', 'Get answers back.'],
  subheadline:
    'Upload CSVs, JSON, Excel, TSV, or Parquet files and turn them into charts, AI explanations, and ML experiments before your spreadsheet starts gaslighting you.',
  primaryCta: 'Enter Workspace',
  secondaryCta: 'See the chaos handled',
  scrollHint: 'Scroll. The dataset gets weirder.',
  orbitBadges: [
    { id: 'csv', label: 'CSV', detail: "The people's champion. Usually innocent." },
    { id: 'json', label: 'JSON', detail: 'Nested like it has family secrets.' },
    { id: 'excel', label: 'Excel', detail: 'Bold of you to trust merged cells.' },
    { id: 'parquet', label: 'Parquet', detail: 'Fast, columnar, and smug about it.' },
    { id: 'ai', label: 'AI', detail: 'Ask questions. Get fewer "it depends" answers.' },
  ],
};

export const phoenixJourneyCopy = {
  label: 'SCROLL STORY',
  headline: 'Watch the chaos get domesticated.',
  body: 'The Data Phoenix carries one ugly file through the whole product loop. Scroll moves the creature, the scene, and the interface.',
  steps: [
    {
      id: 'upload',
      eyebrow: 'STEP 01',
      title: 'Upload',
      headline: 'File enters. Panic exits.',
      body: 'A messy dataset drops into the workspace. CSV, JSON, Excel, TSV, Parquet - all invited, all inspected.',
      punchline: 'The commas tried to unionize. We handled it.',
      previewTitle: 'messy_upload.csv',
      previewMeta: '48,213 rows / 17 columns / 3 warnings',
      tokens: ['CSV', 'TSV', 'XLSX', 'JSON', 'NULL'],
      color: '#22d3ee',
      animation: 'chunk-drop',
    },
    {
      id: 'profile',
      eyebrow: 'STEP 02',
      title: 'Profile',
      headline: 'The file gets interrogated.',
      body: 'DataCanvas reads schema, missing values, duplicates, correlations, and suspicious columns before you touch a chart.',
      punchline: 'The dataset can run, but it cannot hide.',
      previewTitle: 'schema scan',
      previewMeta: 'numeric 8 / categorical 5 / text 4',
      tokens: ['schema', 'missing', 'dupes', 'corr', 'types'],
      color: '#a3e635',
      animation: 'scan-line',
    },
    {
      id: 'visualize',
      eyebrow: 'STEP 03',
      title: 'Visualize',
      headline: 'Charts appear without a ritual sacrifice.',
      body: 'The workspace suggests useful charts from the data shape, then lets you explore relationships interactively.',
      punchline: 'Bar chart when useful. Scatter when spicy.',
      previewTitle: 'visual map',
      previewMeta: 'recommended: scatter + heatmap',
      tokens: ['bar', 'line', 'scatter', 'heatmap', 'axis'],
      color: '#38bdf8',
      animation: 'bars-grow',
    },
    {
      id: 'ask',
      eyebrow: 'STEP 04',
      title: 'Ask AI',
      headline: 'The dataset starts talking back.',
      body: 'Ask natural-language questions and get answers grounded in columns, rows, charts, and actual patterns.',
      punchline: 'Less "it depends," more "revenue dipped here."',
      previewTitle: 'AI analyst',
      previewMeta: 'response grounded in profile + sample rows',
      tokens: ['why?', 'explain', 'outlier', 'trend', 'misc'],
      color: '#f0abfc',
      animation: 'type-chat',
    },
    {
      id: 'train',
      eyebrow: 'STEP 05',
      title: 'Train ML',
      headline: 'The phoenix dives into model land.',
      body: 'Run classification, regression, or clustering experiments and compare metrics without notebook archaeology.',
      punchline: 'Untitled-47.ipynb has left the chat.',
      previewTitle: 'model run',
      previewMeta: 'accuracy 0.91 / f1 0.88 / drift low',
      tokens: ['R2', 'F1', 'AUC', 'k=3', 'train'],
      color: '#facc15',
      animation: 'metric-rings',
    },
  ],
};

export const easterEggCopy = {
  konami: 'Spreadsheet Jailbreak Mode',
  suspiciousCell: 'row 48,213 has entered the chat',
  misc: 'misc is not a strategy',
  footer: 'Excel, if you are reading this, we can explain.',
  csvLongHover: 'comma cult unlocked',
};

export const formatsCopy = {
  headline: 'Bring your weird files.',
  body: 'DataCanvas supports common data formats so you can stop converting everything into "final_final_v7.csv".',
  footer: 'If the file has columns, we are interested. If it has merged cells, we are suspicious.',
  cards: [
    {
      format: 'CSV',
      label: 'Classic. Messy. Somehow still undefeated.',
      hoverLabel: 'comma cult unlocked',
      icon: Table2,
    },
    {
      format: 'TSV',
      label: "CSV's quieter cousin with tab discipline.",
      hoverLabel: 'tabs behaved better than expected',
      icon: Table2,
    },
    {
      format: 'JSON',
      label: 'Great until one object decides to become a tree.',
      hoverLabel: 'nested drama, safely contained',
      icon: FileJson,
    },
    {
      format: 'XLSX',
      label: 'For datasets wearing office clothes.',
      hoverLabel: 'merged cells placed under supervision',
      icon: FileSpreadsheet,
    },
    {
      format: 'Parquet',
      label: "For large data that knows what it's doing.",
      hoverLabel: 'columnar speed, minimal smugness',
      icon: DatabaseZap,
    },
  ],
};

export const aiCopy = {
  headline: 'Ask your data questions without sounding like a SQL wizard.',
  prompts: [
    'Why did revenue dip in March?',
    'Which columns are correlated?',
    'Find outliers and explain why they matter.',
    'Build me a chart that would make sense to a human.',
  ],
  response:
    'I found three suspicious clusters, two missing-value patterns, and one column named "misc" doing crimes.',
  cta: 'Ask the dataset',
};

export const mlCopy = {
  headline: 'Train models without opening a notebook named Untitled-47.',
  body: 'Pick a target, choose a task, run training, compare metrics, and understand what the model learned.',
  microcopy: 'We respect notebooks. We just do not want every beginner trapped inside one.',
  bullets: [
    { label: 'Classification for labels', icon: Sparkles },
    { label: 'Regression for numbers', icon: LineChart },
    { label: 'Clustering for "what groups exist here?"', icon: FlaskConical },
    { label: 'Metrics that do not require a PhD to read', icon: BrainCircuit },
  ],
};

export const proofCopy = {
  headline: 'What happens inside',
  microcopy: 'The boring parts are automated. The interesting parts are yours.',
  items: [
    'Schema detection',
    'Missing value analysis',
    'Outlier detection',
    'Correlation maps',
    'Auto-generated charts',
    'AI explanations',
    'ML experiments',
    'Browser-local session persistence',
  ],
};

export const finalCtaCopy = {
  headline: 'Your dataset is not going to analyze itself.',
  body: 'Open the workspace, upload a file, and let DataCanvas turn the chaos into something you can actually use.',
  primaryCta: 'Start analyzing',
  secondaryCta: 'Read the README',
  footer: 'No datasets were harmed. A few spreadsheets were humbled.',
};
