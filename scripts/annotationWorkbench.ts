import { createServer, IncomingMessage, ServerResponse } from 'http';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const tokenizationDom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
(global as any).document = tokenizationDom.window.document;
(global as any).window = tokenizationDom.window;
(global as any).HTMLElement = tokenizationDom.window.HTMLElement;
(global as any).Node = tokenizationDom.window.Node;

const { attachIdsToTokens, setupIdToElementMapping } = await import('../src/coreFunctionality/htmlProcessing');
import type { CodeBlock } from '../src/coreFunctionality/htmlProcessing';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CODE_EXAMPLES_PATH = join(__dirname, '..', 'test-data', 'code-examples.json');
const TOKENIZED_EXAMPLES_PATH = join(__dirname, '..', 'test-data', 'tokenized-examples.json');
const ANNOTATIONS_PATH = join(__dirname, '..', 'test-data', 'annotated-examples.json');
const EVAL_REPORT_PATH = join(__dirname, '..', 'test-data', 'eval-report.json');
const PORT = 3459;

interface CodeExample {
  url: string;
  html: string;
}

interface TokenizedExample {
  url: string;
  tokenizedHtml: string;
}

interface Annotation {
  ids: string[];
}

interface AnnotationEntry {
  url: string;
  expectedAnnotations: Annotation[];
}

interface Comparison {
  correctMatches: { id: string }[];
  falsePositives: { id: string }[];
  falseNegatives: { id: string }[];
}

interface ExampleResult {
  url: string;
  tokenizedHtml: string;
  metrics?: {
    precision: number;
    recall: number;
    f1: number;
  };
  expected?: { ids: string[] }[];
  actual?: { ids: string[] }[];
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

function initializeAnnotations(): void {
  const tokenizedExamples = loadTokenizedExamples();
  const existingAnnotations = loadAnnotations();

  const existingUrls = new Set(existingAnnotations.map((a) => a.url));

  let hasNewUrls = false;
  for (const example of tokenizedExamples) {
    if (!existingUrls.has(example.url)) {
      existingAnnotations.push({
        url: example.url,
        expectedAnnotations: [],
      });
      hasNewUrls = true;
    }
  }

  if (hasNewUrls || !existsSync(ANNOTATIONS_PATH)) {
    saveAnnotationsToFile(existingAnnotations);
  }
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

function ensureDataFile(path: string): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(path)) {
    writeFileSync(path, '[]');
  }
}

function readCodeExamples(): CodeExample[] {
  ensureDataFile(CODE_EXAMPLES_PATH);
  return JSON.parse(readFileSync(CODE_EXAMPLES_PATH, 'utf-8'));
}

function writeCodeExamples(examples: CodeExample[]): void {
  ensureDataFile(CODE_EXAMPLES_PATH);
  writeFileSync(CODE_EXAMPLES_PATH, JSON.stringify(examples, null, 2));
}

function saveTokenizedExamples(examples: TokenizedExample[]): void {
  writeFileSync(TOKENIZED_EXAMPLES_PATH, JSON.stringify(examples, null, 2));
}

function tokenizeHtml(html: string): string {
  const container = document.createElement('div');
  container.innerHTML = html;

  const codeBlock: CodeBlock = {
    html: container as unknown as HTMLElement,
    codeBlockId: 'test',
  };

  const idMappings = setupIdToElementMapping();
  attachIdsToTokens(codeBlock, idMappings);

  return container.innerHTML;
}

function processTokenizedHtml(tokenizedHtml: string, annotations: Annotation[] = [], comparison?: Comparison): string {
  const dom = new JSDOM(`<div id="root">${tokenizedHtml}</div>`);
  const document = dom.window.document;
  const root = document.getElementById('root')!;

  const annotatedIds = new Set<string>();
  annotations.forEach((ann) => {
    ann.ids.forEach((id) => annotatedIds.add(id));
  });

  const correctIds = comparison ? new Set(comparison.correctMatches.map((m) => m.id)) : new Set();
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

    if (annotatedIds.has(tokenId)) {
      element.classList.add('annotated');
    }

    if (comparison) {
      if (correctIds.has(tokenId)) {
        element.classList.add('eval-correct');
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
      --border-color: rgba(27, 23, 48, 0.12);
      --input-bg: #ffffff;
      --code-bg: #f6f8ff;
      --primary-color: #5f6be1;
      --success-color: #1fb67e;
      --warning-color: #d08850;
      --alert-color: #e03d63;
      --invite-color: #5bb3d8;
      --font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --font-mono: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font-family); background: var(--bg-primary); color: var(--text-primary); font-size: 13px; }

    .layout {
      display: grid;
      grid-template-columns: 240px 1fr 280px;
      height: 100vh;
    }
    .layout > * { border-right: 1px solid var(--border-color); }
    .layout > *:last-child { border-right: none; }

    .examples-panel { overflow: hidden; display: flex; flex-direction: column; }
    .examples-header { padding: 12px; border-bottom: 1px solid var(--border-color); }
    .examples-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .examples-title-row h2 { font-size: 13px; font-weight: 600; margin: 0; }
    .add-btn { width: 24px; height: 24px; border: none; border-radius: 4px; background: var(--primary-color); color: white; font-size: 16px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .add-btn:hover { background: #4f5bd1; }
    .progress { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
    .progress strong { color: var(--success-color); }
    .filter-select {
      width: 100%; padding: 6px 8px; font-size: 12px;
      border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--input-bg); color: var(--text-primary);
    }
    .add-form { display: flex; flex-direction: column; gap: 6px; }
    .add-form input, .add-form textarea { padding: 6px 8px; font-size: 11px; border: 1px solid var(--border-color); border-radius: 4px; }
    .add-form textarea { font-family: var(--font-mono); height: 50px; resize: none; }
    .examples-list { flex: 1; overflow-y: auto; }
    .example-item { padding: 10px 12px; border-bottom: 1px solid var(--border-color); cursor: pointer; }
    .example-item:hover { background: rgba(95, 107, 225, 0.04); }
    .example-item.active { background: rgba(95, 107, 225, 0.08); border-left: 3px solid var(--primary-color); padding-left: 9px; }
    .example-url { font-size: 11px; color: var(--primary-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
    .example-status { display: flex; align-items: center; gap: 6px; font-size: 11px; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; }
    .status-dot.reviewed { background: var(--success-color); }
    .status-dot.pending { background: var(--text-secondary); opacity: 0.4; }
    .f1-score { font-weight: 600; }
    .f1-score.good { color: var(--success-color); }
    .f1-score.mid { color: var(--warning-color); }
    .f1-score.bad { color: var(--alert-color); }
    .ann-count { color: var(--text-secondary); }

    .code-panel { display: flex; flex-direction: column; overflow: hidden; }
    .code-header { padding: 10px 16px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
    .code-url { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
    .code-metrics { display: flex; gap: 12px; font-size: 12px; margin-left: 16px; }
    .code-metrics span { color: var(--text-secondary); }
    .code-metrics strong { color: var(--text-primary); }
    .code-area { flex: 1; overflow: auto; padding: 16px; background: var(--code-bg); }
    .code-block { font-family: var(--font-mono); font-size: 13px; line-height: 1.5; white-space: pre-wrap; user-select: none; }
    .code-block .token { cursor: pointer; padding: 1px 2px; border-radius: 2px; }
    .code-block .token:hover { background: rgba(95, 107, 225, 0.15); }
    .code-block .token.selected { background: rgba(31, 182, 126, 0.25); outline: 2px solid var(--success-color); }
    .code-block .token.annotated { text-decoration: underline; text-decoration-color: var(--primary-color); text-underline-offset: 2px; }
    .code-block .token.eval-correct { outline: 2px solid var(--success-color); }
    .code-block .token.eval-false-positive { outline: 2px solid var(--alert-color); }
    .code-block .token.eval-false-negative { outline: 2px dashed var(--warning-color); }
    .code-legend { padding: 8px 16px; border-top: 1px solid var(--border-color); display: flex; gap: 16px; font-size: 11px; color: var(--text-secondary); }
    .legend-item { display: flex; align-items: center; gap: 4px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 2px; }

    .aggregate-summary {
      padding: 10px 12px;
      background: var(--code-bg);
      border-bottom: 1px solid var(--border-color);
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .aggregate-item {
      display: flex;
      flex-direction: column;
    }
    .aggregate-label {
      font-size: 9px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .aggregate-value {
      font-size: 13px;
      font-weight: 600;
    }
    .value-success { color: var(--success-color); }
    .value-warning { color: var(--warning-color); }
    .value-alert { color: var(--alert-color); }

    .sidebar { overflow-y: auto; display: flex; flex-direction: column; }
    .tabs { display: flex; border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
    .tab { flex: 1; padding: 10px; font-size: 12px; font-weight: 500; text-align: center; cursor: pointer; border-bottom: 2px solid transparent; color: var(--text-secondary); }
    .tab:hover { color: var(--text-primary); }
    .tab.active { color: var(--primary-color); border-bottom-color: var(--primary-color); }
    .tab-content { display: none; padding: 12px; flex: 1; overflow-y: auto; }
    .tab-content.active { display: block; }

    .section { margin-bottom: 16px; }
    .section:last-child { margin-bottom: 0; }
    .section-title { font-size: 10px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }

    .selection-tokens { display: flex; flex-wrap: wrap; gap: 4px; min-height: 28px; padding: 8px; background: var(--code-bg); border-radius: 6px; margin-bottom: 10px; }
    .selection-token { background: var(--success-color); color: white; padding: 2px 6px; border-radius: 3px; font-family: var(--font-mono); font-size: 11px; }
    .selection-empty { color: var(--text-secondary); font-size: 11px; }

    .btn { padding: 6px 10px; font-size: 11px; font-weight: 500; border: none; border-radius: 4px; cursor: pointer; }
    .btn-primary { background: var(--primary-color); color: white; }
    .btn-primary:hover { background: #4f5bd1; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: var(--code-bg); color: var(--text-primary); }
    .btn-secondary:hover { background: var(--border-color); }
    .btn-row { display: flex; gap: 6px; }
    .btn-row .btn { flex: 1; }

    .annotations-list { display: flex; flex-direction: column; gap: 4px; }
    .annotation-item { display: flex; align-items: center; gap: 6px; padding: 6px 8px; background: var(--code-bg); border-radius: 4px; }
    .annotation-text { flex: 1; font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .annotation-delete { background: none; border: none; color: var(--alert-color); cursor: pointer; font-size: 14px; padding: 2px 4px; opacity: 0.6; }
    .annotation-delete:hover { opacity: 1; }
    .empty-state { color: var(--text-secondary); font-size: 11px; padding: 12px; text-align: center; background: var(--code-bg); border-radius: 6px; }

    .llm-list { display: flex; flex-direction: column; gap: 4px; }
    .llm-item { display: flex; align-items: center; gap: 6px; padding: 6px 8px; background: var(--code-bg); border-radius: 4px; }
    .llm-text { flex: 1; font-family: var(--font-mono); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .llm-accept { background: var(--success-color); color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 500; cursor: pointer; }
    .llm-accept:hover { background: #1a9d6d; }

    .diff-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 10px; }
    .diff-item { padding: 6px; background: var(--code-bg); border-radius: 4px; text-align: center; }
    .diff-num { font-size: 16px; font-weight: 600; }
    .diff-label { font-size: 9px; color: var(--text-secondary); }

    .toast { position: fixed; bottom: 16px; right: 16px; padding: 10px 16px; background: var(--success-color); color: white; border-radius: 6px; font-size: 12px; font-weight: 500; display: none; z-index: 1000; }
    .toast.error { background: var(--alert-color); }
    .toast.show { display: block; }
  </style>
</head>
<body>
  <div class="layout">
    <div class="examples-panel" id="examplesPanel"></div>
    <div class="code-panel" id="codePanel"></div>
    <div class="sidebar" id="sidebar"></div>
  </div>
  <div class="toast" id="toast"></div>

  <script>
    let examples = [];
    let annotations = {};
    let evalReport = null;
    let evalResultsMap = {};
    let currentIndex = 0;
    let selectedTokens = [];
    let filter = 'all';
    let activeTab = 'annotate';

    async function loadData() {
      const res = await fetch('/api/data');
      const data = await res.json();
      examples = data.examples;
      annotations = data.annotations;
      evalReport = data.evalReport;
      if (evalReport) {
        evalReport.results.forEach(r => { evalResultsMap[r.url] = r; });
      }
      render();
    }

    function getFiltered() {
      return examples.filter(ex => {
        if (filter === 'all') return true;
        if (filter === 'reviewed') return annotations[ex.url] !== undefined;
        if (filter === 'pending') return annotations[ex.url] === undefined;
        if (filter === 'low-f1') return evalResultsMap[ex.url]?.metrics?.f1 < 0.5;
        return true;
      });
    }

    function getF1Class(f1) {
      if (f1 >= 0.8) return 'good';
      if (f1 >= 0.5) return 'mid';
      return 'bad';
    }

    function render() {
      renderExamples();
      renderCode();
      renderSidebar();
    }

    let addOpen = false;

    function renderExamples() {
      const filtered = getFiltered();
      const reviewed = Object.keys(annotations).length;
      const agg = evalReport?.aggregate;

      let summaryHtml = '';
      if (agg) {
        const f1Class = agg.avgF1 >= 0.8 ? 'value-success' : agg.avgF1 >= 0.5 ? 'value-warning' : 'value-alert';
        summaryHtml = \`
          <div class="aggregate-summary">
            <div class="aggregate-item">
              <span class="aggregate-label">Avg F1</span>
              <span class="aggregate-value \${f1Class}">\${(agg.avgF1 * 100).toFixed(1)}%</span>
            </div>
            <div class="aggregate-item">
              <span class="aggregate-label">Success</span>
              <span class="aggregate-value">\${agg.successfulExamples}/\${agg.totalExamples}</span>
            </div>
            <div class="aggregate-item">
              <span class="aggregate-label">Avg Precision</span>
              <span class="aggregate-value">\${(agg.avgPrecision * 100).toFixed(1)}%</span>
            </div>
            <div class="aggregate-item">
              <span class="aggregate-label">Avg Recall</span>
              <span class="aggregate-value">\${(agg.avgRecall * 100).toFixed(1)}%</span>
            </div>
          </div>
        \`;
      }

      document.getElementById('examplesPanel').innerHTML = \`
        <div class="examples-header">
          <div class="examples-title-row">
            <h2>Examples</h2>
            <button class="add-btn" onclick="toggleAdd()" title="Add example">\${addOpen ? '×' : '+'}</button>
          </div>
          <div class="progress"><strong>\${reviewed}</strong> / \${examples.length} reviewed</div>
          \${addOpen ? \`
            <div class="add-form">
              <input type="url" id="addUrl" placeholder="URL">
              <textarea id="addHtml" placeholder="<code>...</code>"></textarea>
              <button class="btn btn-primary" onclick="submitAdd()">Add</button>
            </div>
          \` : \`
            <select class="filter-select" onchange="setFilter(this.value)">
              <option value="all" \${filter === 'all' ? 'selected' : ''}>All examples</option>
              <option value="reviewed" \${filter === 'reviewed' ? 'selected' : ''}>Reviewed</option>
              <option value="pending" \${filter === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="low-f1" \${filter === 'low-f1' ? 'selected' : ''}>Low F1 (<50%)</option>
            </select>
          \`}
        </div>
        \${summaryHtml}
        <div class="examples-list">
          \${filtered.map((ex, i) => {
            const isReviewed = annotations[ex.url] !== undefined;
            const annCount = (annotations[ex.url] || []).length;
            const evalResult = evalResultsMap[ex.url];
            const f1 = evalResult?.metrics?.f1;
            return \`
              <div class="example-item \${i === currentIndex ? 'active' : ''}" onclick="selectExample(\${i})">
                <div class="example-url">\${ex.url}</div>
                <div class="example-status">
                  <span class="status-dot \${isReviewed ? 'reviewed' : 'pending'}"></span>
                  \${f1 !== undefined ? \`<span class="f1-score \${getF1Class(f1)}">\${(f1 * 100).toFixed(0)}%</span>\` : ''}
                  \${annCount > 0 ? \`<span class="ann-count">\${annCount} annotations</span>\` : ''}
                </div>
              </div>
            \`;
          }).join('')}
        </div>
      \`;
    }

    function renderCode() {
      const filtered = getFiltered();
      const ex = filtered[currentIndex];
      if (!ex) {
        document.getElementById('codePanel').innerHTML = '<div class="empty-state">No examples match filter</div>';
        return;
      }
      const evalResult = evalResultsMap[ex.url];
      const hasComparison = evalResult?.comparison;
      document.getElementById('codePanel').innerHTML = \`
        <div class="code-header">
          <div class="code-url">\${ex.url}</div>
          <div class="code-metrics">
            \${evalResult?.metrics ? \`
              <span>F1 <strong>\${(evalResult.metrics.f1 * 100).toFixed(0)}%</strong></span>
              <span>P <strong>\${(evalResult.metrics.precision * 100).toFixed(0)}%</strong></span>
              <span>R <strong>\${(evalResult.metrics.recall * 100).toFixed(0)}%</strong></span>
            \` : ''}
          </div>
        </div>
        <div class="code-area">
          <div class="code-block" id="codeBlock">Loading...</div>
        </div>
        \${hasComparison ? \`
          <div class="code-legend">
            <div class="legend-item"><div class="legend-dot" style="background: var(--success-color)"></div>LLM correct</div>
            <div class="legend-item"><div class="legend-dot" style="background: var(--alert-color)"></div>LLM extra (you didn't annotate)</div>
            <div class="legend-item"><div class="legend-dot" style="border: 2px dashed var(--warning-color)"></div>LLM missed (you annotated)</div>
          </div>
        \` : ''}
      \`;
      loadCodeBlock();
    }

    async function loadCodeBlock() {
      const filtered = getFiltered();
      const ex = filtered[currentIndex];
      if (!ex) return;
      const savedAnns = annotations[ex.url] || [];
      const evalResult = evalResultsMap[ex.url];
      const res = await fetch('/api/process-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenizedHtml: ex.tokenizedHtml, annotations: savedAnns, comparison: evalResult?.comparison })
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

    function renderSidebar() {
      const filtered = getFiltered();
      const ex = filtered[currentIndex];
      if (!ex) return;
      const savedAnns = annotations[ex.url] || [];
      const evalResult = evalResultsMap[ex.url];
      const hasEval = evalResult?.actual?.length > 0;

      document.getElementById('sidebar').innerHTML = \`
        <div class="tabs">
          <div class="tab \${activeTab === 'annotate' ? 'active' : ''}" onclick="setTab('annotate')">Annotate</div>
          <div class="tab \${activeTab === 'compare' ? 'active' : ''}" onclick="setTab('compare')">Compare</div>
        </div>
        <div class="tab-content \${activeTab === 'annotate' ? 'active' : ''}" id="annotateTab">
          \${renderAnnotateTab(savedAnns)}
        </div>
        <div class="tab-content \${activeTab === 'compare' ? 'active' : ''}" id="compareTab">
          \${renderCompareTab(evalResult)}
        </div>
      \`;
    }

    function renderAnnotateTab(savedAnns) {
      return \`
        <div class="section">
          <div class="section-title">Selection</div>
          <div class="selection-tokens">
            \${selectedTokens.length === 0
              ? '<span class="selection-empty">Click tokens in code to select</span>'
              : selectedTokens.map(id => \`<span class="selection-token">\${getTokenText(id)}</span>\`).join('')}
          </div>
          <div class="btn-row">
            <button class="btn btn-primary" onclick="addAnnotation()" \${selectedTokens.length === 0 ? 'disabled' : ''}>Add</button>
            <button class="btn btn-secondary" onclick="clearSelection()">Clear</button>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Annotations</div>
          \${savedAnns.length === 0
            ? '<div class="empty-state">No annotations yet</div>'
            : \`<div class="annotations-list">
                \${savedAnns.map((ann, i) => \`
                  <div class="annotation-item">
                    <span class="annotation-text">\${ann.ids.map(id => getTokenText(id)).join(' ')}</span>
                    <button class="annotation-delete" onclick="deleteAnnotation(\${i})">×</button>
                  </div>
                \`).join('')}
              </div>\`}
        </div>
      \`;
    }

    function renderCompareTab(evalResult) {
      if (!evalResult?.actual || evalResult.actual.length === 0) {
        return '<div class="empty-state">Run evaluation first to see LLM output</div>';
      }
      const comp = evalResult.comparison || {};
      const correctIds = new Set((comp.correctMatches || []).map(m => m.id));
      const missedAnns = comp.falseNegatives || [];
      return \`
        <div class="section">
          <div class="section-title">LLM Output</div>
          <button class="btn btn-primary" style="width: 100%; margin-bottom: 8px;" onclick="acceptAllLlm()">Accept All</button>
          <div class="llm-list">
            \${evalResult.actual.map((act, i) => {
              const isCorrect = act.ids.some(id => correctIds.has(id));
              return \`
                <div class="llm-item">
                  <span class="llm-text">\${act.ids.map(id => getTokenText(id)).join(' ')}</span>
                  \${isCorrect ? '<span style="color: var(--success-color)">✓</span>' : \`<button class="llm-accept" onclick="acceptLlm(\${i})">+</button>\`}
                </div>
              \`;
            }).join('')}
          </div>
        </div>
        \${missedAnns.length > 0 ? \`
          <div class="section">
            <div class="section-title">LLM Missed (your annotations)</div>
            <div class="llm-list">
              \${missedAnns.map(m => \`
                <div class="llm-item">
                  <span class="llm-text">\${getTokenText(m.id)}</span>
                  <button class="llm-accept" style="background: var(--alert-color)" onclick="removeMissedAnnotation('\${m.id}')">-</button>
                </div>
              \`).join('')}
            </div>
          </div>
        \` : ''}
        <div class="section">
          <div class="section-title">Summary</div>
          <div class="diff-summary">
            <div class="diff-item"><div class="diff-num" style="color: var(--success-color)">\${comp.correctMatches?.length || 0}</div><div class="diff-label">Correct</div></div>
            <div class="diff-item"><div class="diff-num" style="color: var(--alert-color)">\${comp.falsePositives?.length || 0}</div><div class="diff-label">Extra</div></div>
            <div class="diff-item"><div class="diff-num" style="color: var(--warning-color)">\${missedAnns.length}</div><div class="diff-label">Missed</div></div>
          </div>
        </div>
      \`;
    }


    let tokenTextCache = {};
    function getTokenText(id) {
      if (tokenTextCache[id]) return tokenTextCache[id];
      const el = document.querySelector(\`[data-token-id="\${id}"]\`);
      return el ? el.textContent : id.slice(0, 6);
    }

    function selectToken(tokenId, event) {
      event.preventDefault();
      if (event.shiftKey) {
        if (!selectedTokens.includes(tokenId)) selectedTokens.push(tokenId);
      } else {
        selectedTokens = [tokenId];
      }
      document.querySelectorAll('.token.selected').forEach(el => el.classList.remove('selected'));
      selectedTokens.forEach(id => {
        const el = document.querySelector(\`[data-token-id="\${id}"]\`);
        if (el) el.classList.add('selected');
      });
      renderSidebar();
    }

    function clearSelection() {
      selectedTokens = [];
      document.querySelectorAll('.token.selected').forEach(el => el.classList.remove('selected'));
      renderSidebar();
    }

    function setTab(tab) {
      activeTab = tab;
      renderSidebar();
    }

    function selectExample(i) {
      currentIndex = i;
      selectedTokens = [];
      render();
    }

    function setFilter(val) {
      filter = val;
      currentIndex = 0;
      selectedTokens = [];
      render();
    }

    async function addAnnotation() {
      if (selectedTokens.length === 0) return;
      const filtered = getFiltered();
      const url = filtered[currentIndex].url;
      const anns = annotations[url] || [];
      anns.push({ ids: [...selectedTokens] });
      annotations[url] = anns;
      await saveAnnotations();
      clearSelection();
      render();
      showToast('Annotation added');
    }

    async function deleteAnnotation(i) {
      const filtered = getFiltered();
      const url = filtered[currentIndex].url;
      const anns = annotations[url] || [];
      anns.splice(i, 1);
      annotations[url] = anns;
      await saveAnnotations();
      render();
      showToast('Deleted');
    }

    async function acceptAllLlm() {
      const filtered = getFiltered();
      const url = filtered[currentIndex].url;
      const evalResult = evalResultsMap[url];
      if (!evalResult?.actual) return;
      annotations[url] = evalResult.actual.map(act => ({ ids: act.ids }));
      await saveAnnotations();
      render();
      showToast('Accepted all');
    }

    async function acceptLlm(i) {
      const filtered = getFiltered();
      const url = filtered[currentIndex].url;
      const evalResult = evalResultsMap[url];
      if (!evalResult?.actual?.[i]) return;
      const act = evalResult.actual[i];
      const anns = annotations[url] || [];
      anns.push({ ids: act.ids });
      annotations[url] = anns;
      await saveAnnotations();
      render();
      showToast('Added');
    }

    async function removeMissedAnnotation(tokenId) {
      const filtered = getFiltered();
      const url = filtered[currentIndex].url;
      const anns = annotations[url] || [];
      const idx = anns.findIndex(a => a.ids.includes(tokenId));
      if (idx >= 0) {
        anns.splice(idx, 1);
        annotations[url] = anns;
        await saveAnnotations();
        render();
        showToast('Removed');
      }
    }

    async function saveAnnotations() {
      await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotations)
      });
    }

    function toggleAdd() {
      addOpen = !addOpen;
      renderExamples();
    }

    async function submitAdd() {
      const urlEl = document.getElementById('addUrl');
      const htmlEl = document.getElementById('addHtml');
      const url = urlEl.value.trim();
      const html = htmlEl.value.trim();
      if (!url || !html) { showToast('Fill in both fields', true); return; }
      try {
        const res = await fetch('/api/add-example', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, html })
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.error, true); return; }
        examples.push(data.tokenizedExample);
        addOpen = false;
        render();
        showToast('Added');
      } catch (e) {
        showToast('Failed', true);
      }
    }

    function showToast(msg, err = false) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.className = 'toast show' + (err ? ' error' : '');
      setTimeout(() => t.classList.remove('show'), 2500);
    }

    document.addEventListener('keydown', (e) => {
      const filtered = getFiltered();
      if (e.key === 'ArrowDown' && currentIndex < filtered.length - 1) { selectExample(currentIndex + 1); }
      else if (e.key === 'ArrowUp' && currentIndex > 0) { selectExample(currentIndex - 1); }
      else if (e.key === 'Enter' && selectedTokens.length > 0) { addAnnotation(); }
      else if (e.key === 'Escape') { clearSelection(); }
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

  if (req.method === 'POST' && req.url === '/api/add-example') {
    let body = '';
    req.on('data', (chunk: Buffer) => (body += chunk));
    req.on('end', () => {
      try {
        const { url, html } = JSON.parse(body);

        if (!url || !html) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'URL and HTML are required' }));
          return;
        }

        const codeExamples = readCodeExamples();
        if (codeExamples.some((ex) => ex.url === url)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'This URL already exists' }));
          return;
        }

        codeExamples.push({ url, html });
        writeCodeExamples(codeExamples);

        const tokenizedHtml = tokenizeHtml(html);
        const tokenizedExamples = loadTokenizedExamples();
        tokenizedExamples.push({ url, tokenizedHtml });
        saveTokenizedExamples(tokenizedExamples);

        const annotations = loadAnnotations();
        if (!annotations.some((a) => a.url === url)) {
          annotations.push({ url, expectedAnnotations: [] });
          saveAnnotationsToFile(annotations);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, tokenizedExample: { url, tokenizedHtml } }));
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

initializeAnnotations();

server.listen(PORT, () => {
  console.log(`\n  Annotation Workbench running at:`);
  console.log(`  http://localhost:${PORT}\n`);
  console.log(`  Loading examples from: ${TOKENIZED_EXAMPLES_PATH}`);
  console.log(`  Loading annotations from: ${ANNOTATIONS_PATH}`);
  console.log(`  Loading eval report from: ${EVAL_REPORT_PATH}\n`);
});
