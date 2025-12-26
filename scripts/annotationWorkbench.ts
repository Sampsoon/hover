import { createServer, IncomingMessage, ServerResponse } from 'http';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENIZED_EXAMPLES_PATH = join(__dirname, '..', 'test-data', 'tokenized-examples.json');
const ANNOTATIONS_PATH = join(__dirname, '..', 'test-data', 'annotated-examples.json');
const EVAL_REPORT_PATH = join(__dirname, '..', 'test-data', 'eval-report.json');
const PORT = 3459;

interface TokenizedExample {
  url: string;
  tokenizedHtml: string;
}

interface Annotation {
  ids: string[];
  type: 'function' | 'variable' | 'object';
}

interface AnnotationEntry {
  url: string;
  expectedAnnotations: Annotation[];
}

interface Comparison {
  correctMatches: { id: string; type: string }[];
  typeMismatches: { id: string; expectedType: string; actualType: string }[];
  falsePositives: { id: string; actualType: string }[];
  falseNegatives: { id: string; expectedType: string }[];
}

interface ExampleResult {
  url: string;
  tokenizedHtml: string;
  metrics?: {
    precision: number;
    recall: number;
    f1: number;
    typeAccuracy: number;
  };
  expected?: { ids: string[]; type: string }[];
  actual?: { ids: string[]; documentation: { type: string } }[];
  comparison?: Comparison;
  error?: string;
}

interface EvalReport {
  timestamp: string;
  model: string;
  config: { url: string };
  aggregate: {
    avgPrecision: number;
    avgRecall: number;
    avgF1: number;
    avgTypeAccuracy: number;
    totalExamples: number;
    successfulExamples: number;
  };
  results: ExampleResult[];
}

function loadTokenizedExamples(): TokenizedExample[] {
  if (!existsSync(TOKENIZED_EXAMPLES_PATH)) {
    return [];
  }
  return JSON.parse(readFileSync(TOKENIZED_EXAMPLES_PATH, 'utf-8'));
}

function loadAnnotations(): AnnotationEntry[] {
  if (!existsSync(ANNOTATIONS_PATH)) {
    return [];
  }
  return JSON.parse(readFileSync(ANNOTATIONS_PATH, 'utf-8'));
}

function loadEvalReport(): EvalReport | null {
  if (!existsSync(EVAL_REPORT_PATH)) {
    return null;
  }
  return JSON.parse(readFileSync(EVAL_REPORT_PATH, 'utf-8'));
}

function saveAnnotationsToFile(annotations: AnnotationEntry[]): void {
  writeFileSync(ANNOTATIONS_PATH, JSON.stringify(annotations, null, 2));
}

function processTokenizedHtml(tokenizedHtml: string, annotations: Annotation[] = [], comparison?: Comparison): string {
  const dom = new JSDOM(`<div id="root">${tokenizedHtml}</div>`);
  const document = dom.window.document;
  const root = document.getElementById('root')!;

  const annotatedIdsWithType = new Map<string, string>();
  annotations.forEach((ann) => {
    ann.ids.forEach((id) => annotatedIdsWithType.set(id, ann.type));
  });

  const correctIds = comparison ? new Set(comparison.correctMatches.map((m) => m.id)) : new Set();
  const typeMismatchIds = comparison ? new Map(comparison.typeMismatches.map((m) => [m.id, m])) : new Map();
  const falsePositiveIds = comparison ? new Set(comparison.falsePositives.map((m) => m.id)) : new Set();
  const falseNegativeIds = comparison ? new Set(comparison.falseNegatives.map((m) => m.id)) : new Set();

  const tokensWithIds = root.querySelectorAll('[data-token-id]');

  tokensWithIds.forEach((element) => {
    const tokenId = element.getAttribute('data-token-id');
    if (!tokenId) {
      return;
    }

    element.classList.add('token');
    element.setAttribute('onclick', `selectToken('${tokenId}', event)`);

    const annotationType = annotatedIdsWithType.get(tokenId);
    if (annotationType) {
      element.classList.add('annotated');
      element.classList.add(`annotated-${annotationType}`);
    }

    if (comparison) {
      if (correctIds.has(tokenId)) {
        element.classList.add('eval-correct');
      } else if (typeMismatchIds.has(tokenId)) {
        element.classList.add('eval-type-mismatch');
        const mismatch = typeMismatchIds.get(tokenId)!;
        element.setAttribute('data-expected-type', mismatch.expectedType);
        element.setAttribute('data-actual-type', mismatch.actualType);
      } else if (falsePositiveIds.has(tokenId)) {
        element.classList.add('eval-false-positive');
      } else if (falseNegativeIds.has(tokenId)) {
        element.classList.add('eval-false-negative');
      }
    }
  });

  return root.innerHTML;
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Annotation Workbench</title>
  <style>
    :root {
      --bg-primary: #fffefc;
      --text-primary: #1b1730;
      --text-secondary: #6a7082;
      --text-disabled: #9aa1af;
      --border-color: rgba(27, 23, 48, 0.12);
      --input-bg: #ffffff;
      --code-bg: #f6f8ff;
      --card-bg: #fffefc;
      --card-bg-hover: #f8f4f0;
      --primary-color: #5f6be1;
      --success-color: #1fb67e;
      --warning-color: #e88888;
      --alert-color: #e03d63;
      --shadow-base: 47, 43, 72;
      --shadow-sm: 0 1px 3px 0 rgba(var(--shadow-base), 0.08), 0 1px 2px 0 rgba(var(--shadow-base), 0.06);
      --shadow-md: 0 4px 6px -1px rgba(var(--shadow-base), 0.12), 0 2px 4px -1px rgba(var(--shadow-base), 0.08);
      --font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --font-monospace: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace;
    }
    * { box-sizing: border-box; }
    body {
      font-family: var(--font-family);
      font-size: 16px;
      line-height: 1.6;
      margin: 0;
      background: var(--bg-primary);
      color: var(--text-primary);
    }
    .container {
      max-width: 1800px;
      margin: 0 auto;
      padding: 16px;
    }
    h1 { color: var(--text-primary); margin-bottom: 8px; font-size: 20px; font-weight: 600; }
    .subtitle { color: var(--text-secondary); margin-bottom: 16px; font-size: 14px; }
    
    .header {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: var(--shadow-sm);
    }
    .header h1 { margin: 0 0 8px 0; }
    .model-info { color: var(--text-secondary); font-size: 13px; margin-bottom: 12px; }
    .aggregate-stats {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .stat-card {
      background: var(--input-bg);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 10px 16px;
      text-align: center;
      min-width: 100px;
    }
    .stat-value {
      font-size: 20px;
      font-weight: bold;
      color: var(--primary-color);
    }
    .stat-value.good { color: var(--success-color); }
    .stat-value.warning { color: var(--warning-color); }
    .stat-value.bad { color: var(--alert-color); }
    .stat-label { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }

    .main-content {
      display: grid;
      grid-template-columns: 300px 1fr 320px;
      gap: 16px;
      height: calc(100vh - 180px);
    }

    .examples-list {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      overflow-y: auto;
      box-shadow: var(--shadow-sm);
    }
    .examples-header {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-color);
      font-weight: 600;
      font-size: 13px;
      position: sticky;
      top: 0;
      background: var(--card-bg);
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .filter-select {
      background: var(--input-bg);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 11px;
    }
    .example-item {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      transition: background 0.2s;
    }
    .example-item:hover { background: var(--card-bg-hover); }
    .example-item.selected { background: rgba(95, 107, 225, 0.1); border-left: 3px solid var(--primary-color); }
    .example-item.has-annotations { border-left: 3px solid var(--success-color); }
    .example-item.selected.has-annotations { border-left: 3px solid var(--primary-color); }
    .example-url {
      font-size: 12px;
      color: var(--primary-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }
    .example-metrics {
      display: flex;
      gap: 8px;
      font-size: 11px;
      color: var(--text-secondary);
    }
    .example-f1 { font-weight: 600; }
    .example-f1.good { color: var(--success-color); }
    .example-f1.warning { color: var(--warning-color); }
    .example-f1.bad { color: var(--alert-color); }
    .f1-bar {
      height: 3px;
      background: var(--border-color);
      border-radius: 2px;
      margin-top: 6px;
      overflow: hidden;
    }
    .f1-bar-fill {
      height: 100%;
      border-radius: 2px;
    }
    .annotation-badge {
      font-size: 10px;
      padding: 1px 4px;
      border-radius: 3px;
      background: var(--success-color);
      color: white;
      margin-left: 4px;
    }

    .code-section {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .code-header {
      padding: 10px 16px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .code-url {
      color: var(--primary-color);
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
    .code-stats {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: var(--text-secondary);
      margin-left: 16px;
    }
    .code-stats strong { color: var(--text-primary); }
    .code-block-wrapper {
      flex: 1;
      overflow: auto;
      padding: 16px;
      background: var(--code-bg);
    }
    .code-block {
      font-family: var(--font-monospace);
      font-size: 12px;
      line-height: 1.4;
      white-space: pre-wrap;
    }
    .code-block * {
      color: inherit !important;
      background: inherit !important;
    }
    .code-block .token {
      cursor: pointer;
      padding: 1px 2px;
      border-radius: 2px;
      color: var(--text-primary) !important;
      background: transparent !important;
    }
    .code-block .token:hover {
      background: rgba(95, 107, 225, 0.15);
    }
    .code-block .token.selected {
      background: rgba(31, 182, 126, 0.3) !important;
      outline: 2px solid var(--success-color);
    }
    .code-block .token.annotated {
      text-decoration: underline dotted var(--text-secondary);
    }
    .code-block .token.annotated-function {
      background: rgba(95, 107, 225, 0.15) !important;
      text-decoration: underline solid var(--primary-color);
    }
    .code-block .token.annotated-variable {
      background: rgba(91, 179, 216, 0.15) !important;
      text-decoration: underline solid #5bb3d8;
    }
    .code-block .token.annotated-object {
      background: rgba(232, 136, 136, 0.15) !important;
      text-decoration: underline solid var(--warning-color);
    }
    .code-block .token.eval-correct {
      outline: 2px solid var(--success-color);
    }
    .code-block .token.eval-type-mismatch {
      outline: 2px solid var(--warning-color);
    }
    .code-block .token.eval-false-positive {
      outline: 2px solid var(--alert-color);
    }
    .code-block .token.eval-false-negative {
      outline: 2px solid #d08850;
    }

    .legend {
      display: flex;
      gap: 12px;
      padding: 8px 16px;
      border-top: 1px solid var(--border-color);
      font-size: 11px;
      flex-wrap: wrap;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }
    .legend-dot.correct { background: var(--success-color); }
    .legend-dot.type-mismatch { background: var(--warning-color); }
    .legend-dot.false-positive { background: var(--alert-color); }
    .legend-dot.false-negative { background: #d08850; }

    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
    }
    .panel {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 12px;
      box-shadow: var(--shadow-sm);
    }
    .panel-title {
      font-weight: 600;
      font-size: 13px;
      margin-bottom: 10px;
      color: var(--text-primary);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: background 0.2s;
    }
    .btn-primary { background: var(--primary-color); color: white; }
    .btn-primary:hover { background: #4f5bd1; }
    .btn-secondary { background: var(--input-bg); color: var(--text-primary); border: 1px solid var(--border-color); }
    .btn-secondary:hover { background: var(--card-bg-hover); }
    .btn-danger { background: var(--alert-color); color: white; }
    .btn-danger:hover { background: #c0334f; }
    .btn-warning { background: var(--warning-color); color: white; }
    .btn-warning:hover { background: #d07878; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-sm { padding: 4px 8px; font-size: 11px; }

    .llm-results {
      max-height: 200px;
      overflow-y: auto;
    }
    .llm-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 0;
      font-size: 12px;
    }
    .type-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: 500;
    }
    .type-badge.function { background: var(--primary-color); color: white; }
    .type-badge.variable { background: #5bb3d8; color: white; }
    .type-badge.object { background: var(--warning-color); color: white; }

    .current-selection {
      min-height: 50px;
    }
    .selected-tokens {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 8px;
    }
    .selected-token {
      background: var(--success-color);
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-family: var(--font-monospace);
    }

    .type-selector {
      display: flex;
      gap: 4px;
      margin-bottom: 8px;
    }
    .type-btn {
      flex: 1;
      padding: 6px;
      border: 2px solid var(--border-color);
      background: var(--input-bg);
      color: var(--text-secondary);
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      transition: border-color 0.2s, background 0.2s;
    }
    .type-btn:hover { border-color: var(--primary-color); }
    .type-btn.active { border-color: var(--success-color); color: var(--text-primary); background: rgba(31, 182, 126, 0.1); }
    .type-btn.function.active { border-color: var(--primary-color); background: rgba(95, 107, 225, 0.1); }
    .type-btn.variable.active { border-color: #5bb3d8; background: rgba(91, 179, 216, 0.1); }
    .type-btn.object.active { border-color: var(--warning-color); background: rgba(232, 136, 136, 0.1); }

    .saved-annotations {
      max-height: 200px;
      overflow-y: auto;
    }
    .annotation-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px;
      background: var(--code-bg);
      border-radius: 4px;
      margin-bottom: 6px;
    }
    .annotation-tokens {
      font-family: var(--font-monospace);
      font-size: 11px;
      color: var(--text-secondary);
      flex: 1;
      margin-left: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .annotation-delete {
      background: none;
      border: none;
      color: var(--alert-color);
      cursor: pointer;
      padding: 2px 4px;
      font-size: 12px;
    }

    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 16px;
      background: var(--success-color);
      color: white;
      border-radius: 6px;
      display: none;
      z-index: 1000;
      font-size: 13px;
      box-shadow: var(--shadow-md);
    }
    .toast.error { background: var(--alert-color); }
    .toast.show { display: block; }

    .no-data {
      text-align: center;
      padding: 40px;
      color: var(--text-secondary);
    }

    .action-buttons {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
  </style>
</head>
<body>
  <div class="container">
    <div id="app"></div>
  </div>
  <div class="toast" id="toast"></div>

  <script>
    let examples = [];
    let annotations = {};
    let evalReport = null;
    let evalResultsMap = {};
    let currentIndex = 0;
    let selectedTokens = [];
    let selectedType = 'function';
    let filter = 'all';

    async function loadData() {
      const res = await fetch('/api/data');
      const data = await res.json();
      examples = data.examples;
      annotations = data.annotations;
      evalReport = data.evalReport;
      
      if (evalReport) {
        evalReport.results.forEach(r => {
          evalResultsMap[r.url] = r;
        });
      }
      
      render();
    }

    function getAnnotationsForUrl(url) {
      return annotations[url] || [];
    }

    function setAnnotationsForUrl(url, anns) {
      annotations[url] = anns;
    }

    function getEvalResultForUrl(url) {
      return evalResultsMap[url] || null;
    }

    function getF1Class(f1) {
      if (f1 >= 0.8) return 'good';
      if (f1 >= 0.5) return 'warning';
      return 'bad';
    }

    function getF1Color(f1) {
      if (f1 >= 0.8) return '#1fb67e';
      if (f1 >= 0.5) return '#e88888';
      return '#e03d63';
    }

    function getFilteredExamples() {
      return examples.filter(ex => {
        if (filter === 'all') return true;
        if (filter === 'annotated') return annotations[ex.url] !== undefined;
        if (filter === 'unannotated') return annotations[ex.url] === undefined;
        if (filter === 'with-eval') return evalResultsMap[ex.url] !== undefined;
        if (filter === 'low-f1') {
          const evalResult = evalResultsMap[ex.url];
          return evalResult?.metrics?.f1 < 0.5;
        }
        return true;
      });
    }

    function render() {
      const app = document.getElementById('app');
      
      if (examples.length === 0) {
        app.innerHTML = '<div class="no-data"><h2>No examples found</h2><p>Run tokenization first.</p></div>';
        return;
      }

      const filteredExamples = getFilteredExamples();
      const example = filteredExamples[currentIndex] || filteredExamples[0];
      if (!example) {
        app.innerHTML = '<div class="no-data"><h2>No examples match filter</h2></div>';
        return;
      }

      const evalResult = getEvalResultForUrl(example.url);
      const savedAnns = getAnnotationsForUrl(example.url);

      app.innerHTML = \`
        \${renderHeader()}
        <div class="main-content">
          \${renderExamplesList(filteredExamples)}
          \${renderCodeSection(example, evalResult, savedAnns)}
          \${renderSidebar(example, evalResult, savedAnns)}
        </div>
      \`;

      loadCodeBlock(example, evalResult, savedAnns);
      updateTypeButtons();
    }

    function renderHeader() {
      if (!evalReport) {
        return \`
          <div class="header">
            <h1>Annotation Workbench</h1>
            <p class="subtitle">No eval report loaded. Annotation mode only.</p>
          </div>
        \`;
      }

      const agg = evalReport.aggregate;
      return \`
        <div class="header">
          <h1>Annotation Workbench</h1>
          <div class="model-info">
            Model: \${evalReport.model} | \${new Date(evalReport.timestamp).toLocaleString()} | \${agg.successfulExamples}/\${agg.totalExamples} evaluated
          </div>
          <div class="aggregate-stats">
            <div class="stat-card">
              <div class="stat-value \${getF1Class(agg.avgF1)}">\${(agg.avgF1 * 100).toFixed(1)}%</div>
              <div class="stat-label">Avg F1</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">\${(agg.avgPrecision * 100).toFixed(1)}%</div>
              <div class="stat-label">Precision</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">\${(agg.avgRecall * 100).toFixed(1)}%</div>
              <div class="stat-label">Recall</div>
            </div>
            <div class="stat-card">
              <div class="stat-value \${getF1Class(agg.avgTypeAccuracy)}">\${(agg.avgTypeAccuracy * 100).toFixed(1)}%</div>
              <div class="stat-label">Type Acc</div>
            </div>
          </div>
        </div>
      \`;
    }

    function renderExamplesList(filteredExamples) {
      return \`
        <div class="examples-list">
          <div class="examples-header">
            <span>Examples (\${filteredExamples.length})</span>
            <select class="filter-select" onchange="setFilter(this.value)">
              <option value="all" \${filter === 'all' ? 'selected' : ''}>All</option>
              <option value="annotated" \${filter === 'annotated' ? 'selected' : ''}>Annotated</option>
              <option value="unannotated" \${filter === 'unannotated' ? 'selected' : ''}>Unannotated</option>
              <option value="with-eval" \${filter === 'with-eval' ? 'selected' : ''}>With Eval</option>
              <option value="low-f1" \${filter === 'low-f1' ? 'selected' : ''}>Low F1</option>
            </select>
          </div>
          \${filteredExamples.map((ex, i) => {
            const evalResult = evalResultsMap[ex.url];
            const hasAnns = annotations[ex.url] !== undefined;
            const annCount = (annotations[ex.url] || []).length;
            return \`
              <div class="example-item \${i === currentIndex ? 'selected' : ''} \${hasAnns ? 'has-annotations' : ''}" onclick="selectExample(\${i})">
                <div class="example-url">
                  \${ex.url}
                  \${hasAnns ? \`<span class="annotation-badge">\${annCount}</span>\` : ''}
                </div>
                \${evalResult?.metrics ? \`
                  <div class="example-metrics">
                    <span class="example-f1 \${getF1Class(evalResult.metrics.f1)}">F1: \${(evalResult.metrics.f1 * 100).toFixed(0)}%</span>
                    <span>P: \${(evalResult.metrics.precision * 100).toFixed(0)}%</span>
                    <span>R: \${(evalResult.metrics.recall * 100).toFixed(0)}%</span>
                  </div>
                  <div class="f1-bar">
                    <div class="f1-bar-fill" style="width: \${evalResult.metrics.f1 * 100}%; background: \${getF1Color(evalResult.metrics.f1)};"></div>
                  </div>
                \` : evalResult?.error ? \`
                  <div class="example-metrics" style="color: var(--alert-color);">Error</div>
                \` : \`
                  <div class="example-metrics">No eval data</div>
                \`}
              </div>
            \`;
          }).join('')}
        </div>
      \`;
    }

    function renderCodeSection(example, evalResult, savedAnns) {
      const hasComparison = evalResult?.comparison;
      return \`
        <div class="code-section">
          <div class="code-header">
            <div class="code-url">\${example.url}</div>
            \${evalResult?.metrics ? \`
              <div class="code-stats">
                <span>F1: <strong>\${(evalResult.metrics.f1 * 100).toFixed(1)}%</strong></span>
                <span>P: <strong>\${(evalResult.metrics.precision * 100).toFixed(1)}%</strong></span>
                <span>R: <strong>\${(evalResult.metrics.recall * 100).toFixed(1)}%</strong></span>
              </div>
            \` : ''}
          </div>
          <div class="code-block-wrapper">
            <div class="code-block" id="codeBlock">Loading...</div>
          </div>
          \${hasComparison ? \`
            <div class="legend">
              <div class="legend-item"><div class="legend-dot correct"></div>Correct</div>
              <div class="legend-item"><div class="legend-dot type-mismatch"></div>Type Mismatch</div>
              <div class="legend-item"><div class="legend-dot false-positive"></div>False Positive</div>
              <div class="legend-item"><div class="legend-dot false-negative"></div>False Negative</div>
            </div>
          \` : ''}
        </div>
      \`;
    }

    function renderSidebar(example, evalResult, savedAnns) {
      return \`
        <div class="sidebar">
          \${renderLlmResultsPanel(evalResult)}
          \${renderCurrentSelectionPanel()}
          \${renderSavedAnnotationsPanel(savedAnns)}
        </div>
      \`;
    }

    function renderLlmResultsPanel(evalResult) {
      if (!evalResult?.actual || evalResult.actual.length === 0) {
        return \`
          <div class="panel">
            <div class="panel-title">LLM Results</div>
            <div style="color: var(--text-secondary); font-size: 12px;">No LLM results available</div>
          </div>
        \`;
      }

      return \`
        <div class="panel">
          <div class="panel-title">
            <span>LLM Results (\${evalResult.actual.length})</span>
            <button class="btn btn-primary btn-sm" onclick="acceptLlmOutput()">Accept All</button>
          </div>
          <div class="llm-results">
            \${evalResult.actual.map((act, i) => \`
              <div class="llm-item">
                <span class="type-badge \${act.documentation.type}">\${act.documentation.type}</span>
                <span style="font-family: monospace; font-size: 11px;">\${act.ids.map(id => getTokenTextFromId(id)).join(' ')}</span>
                <button class="btn btn-secondary btn-sm" onclick="acceptSingleLlmResult(\${i})" title="Accept this annotation">+</button>
              </div>
            \`).join('')}
          </div>
        </div>
      \`;
    }

    function renderCurrentSelectionPanel() {
      return \`
        <div class="panel current-selection">
          <div class="panel-title">Current Selection</div>
          <div class="selected-tokens" id="selectedTokens">
            \${selectedTokens.length === 0 
              ? '<span style="color: var(--text-secondary); font-size: 11px;">Click tokens to select. Shift+click to add.</span>'
              : selectedTokens.map(id => \`<span class="selected-token">\${getTokenTextFromId(id)}</span>\`).join('')
            }
          </div>
          <div class="type-selector">
            <button class="type-btn function" onclick="setType('function')">func</button>
            <button class="type-btn variable" onclick="setType('variable')">var</button>
            <button class="type-btn object" onclick="setType('object')">obj</button>
          </div>
          <div class="action-buttons">
            <button class="btn btn-primary btn-sm" onclick="saveGroup()" \${selectedTokens.length === 0 ? 'disabled' : ''}>Save Group</button>
            <button class="btn btn-secondary btn-sm" onclick="clearSelection()">Clear</button>
          </div>
        </div>
      \`;
    }

    function renderSavedAnnotationsPanel(savedAnns) {
      const isReviewed = annotations[getFilteredExamples()[currentIndex]?.url] !== undefined;
      
      return \`
        <div class="panel">
          <div class="panel-title">
            <span>Saved Annotations</span>
            \${!isReviewed ? '<span style="color: var(--text-secondary); font-size: 11px;">(not reviewed)</span>' : ''}
          </div>
          <div class="saved-annotations" id="annotationsList">
            \${!isReviewed 
              ? '<div style="color: var(--text-secondary); font-size: 11px;">Not reviewed yet</div>'
              : savedAnns.length === 0 
                ? '<div style="color: var(--text-secondary); font-size: 11px;">No annotations (marked as none needed)</div>'
                : savedAnns.map((ann, i) => \`
                    <div class="annotation-item">
                      <span class="type-badge \${ann.type}">\${ann.type}</span>
                      <span class="annotation-tokens">\${ann.ids.map(id => getTokenTextFromId(id)).join(' ')}</span>
                      <button class="annotation-delete" onclick="deleteAnnotation(\${i})">✕</button>
                    </div>
                  \`).join('')
            }
          </div>
          <div style="margin-top: 8px; display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="markAsNone()">Mark as None Needed</button>
            \${isReviewed ? '<button class="btn btn-danger btn-sm" onclick="clearAllAnnotations()">Clear All</button>' : ''}
          </div>
        </div>
      \`;
    }

    let tokenTextCache = {};

    function getTokenTextFromId(id) {
      if (tokenTextCache[id]) return tokenTextCache[id];
      const el = document.querySelector(\`[data-token-id="\${id}"]\`);
      return el ? el.textContent : id.slice(0, 8);
    }

    async function loadCodeBlock(example, evalResult, savedAnns) {
      const res = await fetch('/api/process-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenizedHtml: example.tokenizedHtml,
          annotations: savedAnns,
          comparison: evalResult?.comparison
        })
      });
      const data = await res.json();
      
      const codeBlock = document.getElementById('codeBlock');
      if (codeBlock) {
        codeBlock.innerHTML = data.html;
        
        tokenTextCache = {};
        codeBlock.querySelectorAll('[data-token-id]').forEach(el => {
          tokenTextCache[el.getAttribute('data-token-id')] = el.textContent;
        });

        selectedTokens.forEach(id => {
          const el = document.querySelector(\`[data-token-id="\${id}"]\`);
          if (el) el.classList.add('selected');
        });
      }
    }

    function selectToken(tokenId, event) {
      if (event.shiftKey) {
        if (!selectedTokens.includes(tokenId)) {
          selectedTokens.push(tokenId);
        }
      } else {
        selectedTokens = [tokenId];
      }
      
      document.querySelectorAll('.token.selected').forEach(el => el.classList.remove('selected'));
      selectedTokens.forEach(id => {
        const el = document.querySelector(\`[data-token-id="\${id}"]\`);
        if (el) el.classList.add('selected');
      });
      
      updateSelectedDisplay();
    }

    function updateSelectedDisplay() {
      const container = document.getElementById('selectedTokens');
      if (!container) return;
      
      if (selectedTokens.length === 0) {
        container.innerHTML = '<span style="color: var(--text-secondary); font-size: 11px;">Click tokens to select. Shift+click to add.</span>';
      } else {
        container.innerHTML = selectedTokens.map(id => \`<span class="selected-token">\${getTokenTextFromId(id)}</span>\`).join('');
      }
    }

    function setType(type) {
      selectedType = type;
      updateTypeButtons();
    }

    function updateTypeButtons() {
      document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.classList.contains(selectedType)) {
          btn.classList.add('active');
        }
      });
    }

    function clearSelection() {
      selectedTokens = [];
      document.querySelectorAll('.token.selected').forEach(el => el.classList.remove('selected'));
      updateSelectedDisplay();
    }

    async function saveGroup() {
      const filteredExamples = getFilteredExamples();
      const url = filteredExamples[currentIndex].url;
      const anns = getAnnotationsForUrl(url);
      
      if (selectedTokens.length > 0) {
        anns.push({
          ids: [...selectedTokens],
          type: selectedType
        });
      }
      
      setAnnotationsForUrl(url, anns);
      await saveAnnotations();
      
      clearSelection();
      render();
      showToast('Group saved!');
    }

    async function deleteAnnotation(index) {
      const filteredExamples = getFilteredExamples();
      const url = filteredExamples[currentIndex].url;
      const anns = getAnnotationsForUrl(url);
      anns.splice(index, 1);
      setAnnotationsForUrl(url, anns);
      await saveAnnotations();
      render();
      showToast('Annotation deleted');
    }

    async function markAsNone() {
      const filteredExamples = getFilteredExamples();
      const url = filteredExamples[currentIndex].url;
      setAnnotationsForUrl(url, []);
      await saveAnnotations();
      render();
      showToast('Marked as none needed');
    }

    async function clearAllAnnotations() {
      const filteredExamples = getFilteredExamples();
      const url = filteredExamples[currentIndex].url;
      delete annotations[url];
      await saveAnnotations();
      render();
      showToast('Annotations cleared');
    }

    async function acceptLlmOutput() {
      const filteredExamples = getFilteredExamples();
      const url = filteredExamples[currentIndex].url;
      const evalResult = evalResultsMap[url];
      
      if (!evalResult?.actual) {
        showToast('No LLM results to accept', true);
        return;
      }

      const converted = evalResult.actual.map(act => ({
        ids: act.ids,
        type: act.documentation.type
      }));

      setAnnotationsForUrl(url, converted);
      await saveAnnotations();
      render();
      showToast(\`Accepted \${converted.length} annotations from LLM!\`);
    }

    async function acceptSingleLlmResult(index) {
      const filteredExamples = getFilteredExamples();
      const url = filteredExamples[currentIndex].url;
      const evalResult = evalResultsMap[url];
      
      if (!evalResult?.actual?.[index]) {
        return;
      }

      const act = evalResult.actual[index];
      const anns = getAnnotationsForUrl(url);
      
      anns.push({
        ids: act.ids,
        type: act.documentation.type
      });

      setAnnotationsForUrl(url, anns);
      await saveAnnotations();
      render();
      showToast('Added annotation from LLM');
    }

    async function saveAnnotations() {
      await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotations)
      });
    }

    function selectExample(index) {
      currentIndex = index;
      selectedTokens = [];
      render();
    }

    function setFilter(value) {
      filter = value;
      currentIndex = 0;
      selectedTokens = [];
      render();
    }

    function showToast(message, isError = false) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.className = 'toast show' + (isError ? ' error' : '');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const filtered = getFilteredExamples();
        if (currentIndex < filtered.length - 1) {
          selectExample(currentIndex + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (currentIndex > 0) {
          selectExample(currentIndex - 1);
        }
      } else if (e.key === 'Enter' && selectedTokens.length > 0) {
        saveGroup();
      } else if (e.key === 'Escape') {
        clearSelection();
      }
    });

    loadData();
  </script>
</body>
</html>`;

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML);
    return;
  }

  if (req.method === 'GET' && req.url === '/api/data') {
    const examples = loadTokenizedExamples();
    const annotationsList = loadAnnotations();
    const evalReport = loadEvalReport();

    const annotationsMap: Record<string, Annotation[]> = {};
    annotationsList.forEach((ann) => {
      annotationsMap[ann.url] = ann.expectedAnnotations || [];
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ examples, annotations: annotationsMap, evalReport }));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/process-html') {
    let body = '';
    req.on('data', (chunk: Buffer) => (body += chunk));
    req.on('end', () => {
      try {
        const { tokenizedHtml, annotations, comparison } = JSON.parse(body);
        const processed = processTokenizedHtml(tokenizedHtml, annotations || [], comparison);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ html: processed }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: (e as Error).message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/annotations') {
    let body = '';
    req.on('data', (chunk: Buffer) => (body += chunk));
    req.on('end', () => {
      try {
        const annotationsMap: Record<string, Annotation[]> = JSON.parse(body);

        const annotationsList: AnnotationEntry[] = Object.entries(annotationsMap).map(([url, expectedAnnotations]) => ({
          url,
          expectedAnnotations,
        }));

        saveAnnotationsToFile(annotationsList);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: (e as Error).message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n  Annotation Workbench running at:`);
  console.log(`  http://localhost:${PORT}\n`);
  console.log(`  Loading examples from: ${TOKENIZED_EXAMPLES_PATH}`);
  console.log(`  Loading annotations from: ${ANNOTATIONS_PATH}`);
  console.log(`  Loading eval report from: ${EVAL_REPORT_PATH}\n`);
});
