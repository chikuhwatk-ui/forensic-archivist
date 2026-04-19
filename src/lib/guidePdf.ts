import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Brand colours matching the rest of the app
const BRAND = [0, 32, 69] as [number, number, number];       // primary navy
const MUTED = [100, 116, 139] as [number, number, number];   // slate-500
const RULE = [226, 232, 240] as [number, number, number];    // slate-200

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 16;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 18;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

// ---------------------------------------------------------------------------
// Low-level rendering helpers (stateful cursor via closure)
// ---------------------------------------------------------------------------

interface PdfCursor {
  doc: jsPDF;
  y: number;
  newPage: () => void;
  ensureSpace: (needed: number) => void;
  moveDown: (amount: number) => void;
  heading: (text: string) => void;
  subheading: (text: string) => void;
  paragraph: (text: string) => void;
  bulletList: (items: string[]) => void;
  labelled: (label: string, body: string) => void;
  divider: () => void;
}

function makeCursor(doc: jsPDF): PdfCursor {
  const state = { y: MARGIN_TOP };

  const newPage = () => {
    doc.addPage();
    state.y = MARGIN_TOP;
  };

  const ensureSpace = (needed: number) => {
    if (state.y + needed > PAGE_H - MARGIN_BOTTOM) newPage();
  };

  const moveDown = (amount: number) => {
    state.y += amount;
  };

  const heading = (text: string) => {
    ensureSpace(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...BRAND);
    doc.text(text, MARGIN_X, state.y);
    state.y += 3;
    doc.setDrawColor(...BRAND);
    doc.setLineWidth(0.8);
    doc.line(MARGIN_X, state.y, MARGIN_X + 24, state.y);
    state.y += 7;
    doc.setLineWidth(0.2);
  };

  const subheading = (text: string) => {
    ensureSpace(9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...BRAND);
    doc.text(text, MARGIN_X, state.y);
    state.y += 6;
  };

  const paragraph = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(text, CONTENT_W) as string[];
    ensureSpace(lines.length * 5 + 2);
    doc.text(lines, MARGIN_X, state.y);
    state.y += lines.length * 5 + 2;
  };

  const bulletList = (items: string[]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    for (const item of items) {
      const lines = doc.splitTextToSize(item, CONTENT_W - 6) as string[];
      ensureSpace(lines.length * 5 + 1);
      doc.text('•', MARGIN_X, state.y);
      doc.text(lines, MARGIN_X + 4, state.y);
      state.y += lines.length * 5 + 1;
    }
    state.y += 1;
  };

  const labelled = (label: string, body: string) => {
    ensureSpace(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), MARGIN_X, state.y);
    state.y += 4;
    paragraph(body);
  };

  const divider = () => {
    ensureSpace(6);
    state.y += 2;
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_X, state.y, PAGE_W - MARGIN_X, state.y);
    state.y += 5;
  };

  return {
    doc,
    get y() { return state.y; },
    set y(v: number) { state.y = v; },
    newPage,
    ensureSpace,
    moveDown,
    heading,
    subheading,
    paragraph,
    bulletList,
    labelled,
    divider,
  } as PdfCursor;
}

function drawCoverBanner(doc: jsPDF, eyebrow: string, title: string, tagline: string) {
  // Top colour band
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, PAGE_W, 44, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(eyebrow.toUpperCase(), MARGIN_X, 16, { charSpace: 1 });

  doc.setFontSize(22);
  doc.text(title, MARGIN_X, 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(tagline, CONTENT_W) as string[];
  doc.text(lines, MARGIN_X, 37);
}

function drawFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('Forensic Archivist', MARGIN_X, PAGE_H - 10);
    doc.text(
      `Page ${i} of ${pageCount}`,
      PAGE_W - MARGIN_X,
      PAGE_H - 10,
      { align: 'right' }
    );
  }
}

// ---------------------------------------------------------------------------
// USER GUIDE
// ---------------------------------------------------------------------------

interface ScreenEntry {
  title: string;
  subtitle: string;
  purpose: string;
  whatYouDo: string[];
  whatToCheck: string;
}

const SCREENS: ScreenEntry[] = [
  {
    title: 'Dashboard',
    subtitle: 'Your landing view',
    purpose:
      'An executive summary of the current reconciliation engagement — match rate, open reconciling items, high-risk count, and charts.',
    whatYouDo: [
      'Glance at the KPI cards to see whether work is in progress or complete.',
      'Before any data is loaded, this page shows a "Get Started in 4 Steps" card — use it as a launcher.',
      'Once data is loaded, the charts light up automatically — no action needed.',
    ],
    whatToCheck:
      "Use this screen at the start and end of a session. Nothing is edited here — it's read-only.",
  },
  {
    title: 'Data Imports',
    subtitle: 'Step 1 · Upload your source data',
    purpose:
      'Load the two ledgers you want to reconcile: the bank statement and the cashbook/GL.',
    whatYouDo: [
      'Upload an .xlsx, .xls, or .csv file for the bank statement.',
      "Upload the matching period's cashbook/GL file.",
      'Required columns: Date, Description, Amount, Type (deposit or payment), Reference. Extra columns are ignored.',
      'You can also add rows manually via the "Manual Entry" accordion.',
      'Each uploaded row is tagged as either bank or GL and stored locally in your browser.',
    ],
    whatToCheck:
      "Once both files show a green 'N transactions loaded' marker, the 'Match & analyze risk' button at the bottom of the page lights up. Click it to move on.",
  },
  {
    title: 'Matching Workspace',
    subtitle: 'Step 2 · The main action screen',
    purpose:
      'Runs the automatic matcher against your two ledgers and applies the full forensic risk ruleset in one pass.',
    whatYouDo: [
      'Click the "Match & Analyze Risk" button. It runs two engines together: the transaction matcher and the forensic risk scorer.',
      'Review matched pairs in the "Matched Items" table. Each pair shows a confidence score (0-100%).',
      'Read the "Reconciliation Balance Statement" — it shows the bank and GL balances before and after reconciling-item adjustments, plus the remaining difference.',
      'For items that did not auto-match, use the "Manual Matching" section: click one row on the bank side, one row on the GL side, then "Link Selected".',
    ],
    whatToCheck:
      'A match rate above 70% is typical for clean data. If the difference at the bottom is non-zero, investigate the unmatched items — they may need manual matching or will become reconciling items.',
  },
  {
    title: 'Exception Report',
    subtitle: "Step 3 · Focus on what's flagged",
    purpose:
      'Lists every transaction that the forensic engine flagged as high or medium risk, with the specific rule(s) that triggered the flag.',
    whatYouDo: [
      'Filter by risk level (High only, Medium only, or both).',
      'Search by description, reference, or date to drill into a specific transaction.',
      'Review the "Investigation Required" column — it spells out why each item was flagged (e.g. "Amount exceeds threshold", "Possible manual journal adjustment").',
      'Export a focused PDF of just the exceptions via the red "Export Exception Report" button.',
    ],
    whatToCheck:
      'This screen is the heart of the audit: anything a reviewer will challenge will be here. Document your findings before exporting.',
  },
  {
    title: 'Audit Vault',
    subtitle: 'Step 4 · Produce the deliverable',
    purpose:
      'Compiles the full reconciliation summary and exception report into a single signed-ready PDF.',
    whatYouDo: [
      'Verify the summary KPI cards (matched count, reconciling items, exception count).',
      'Click "Export PDF Report" to download the complete audit pack — it includes the summary, all reconciling items with classifications, and the high/medium-risk exception section.',
      '"Clear All Data" resets everything. Use it at the end of an engagement; a confirmation dialog protects against accidents.',
    ],
    whatToCheck:
      'The PDF is self-contained — you can hand it off to a reviewer or partner without any other files. Double-check the period covered before sending.',
  },
  {
    title: 'Forensic Toolbox',
    subtitle: 'Optional deep-dive',
    purpose:
      'A dedicated view of the forensic risk engine output. The analysis already ran during Match & Analyze Risk — this page is for inspecting results or re-running after tweaking thresholds.',
    whatYouDo: [
      'Filter flagged transactions by risk level.',
      'Review the flag distribution chart to see which rule types are driving the risk picture.',
      'If you change thresholds in Settings, click "Re-run Risk Analysis" here to refresh scores without re-matching.',
    ],
    whatToCheck:
      "Most users won't need this screen in a standard engagement — it's for when you want to sanity-check the ruleset or tune it.",
  },
  {
    title: 'Settings',
    subtitle: 'Tune the engines',
    purpose:
      'All tolerances and thresholds used by the matcher and risk engine are exposed here, with sensible ISA-compliant defaults.',
    whatYouDo: [
      'Adjust matching tolerances: date window (default +/- 3 days), amount tolerance (default $0.01), description weight.',
      'Adjust risk thresholds: aging days (default >30), large-amount threshold (default $50,000), year-end months, duplicate window.',
      'Click "Save Settings" to persist. Unsaved changes are warned before navigation.',
      '"Reset to Defaults" restores factory settings.',
    ],
    whatToCheck:
      'Default thresholds follow ISA 240 / ISA 315 guidance for mid-size engagements. Tighten or loosen based on the materiality of the audit.',
  },
];

export function generateUserGuidePdf() {
  const doc = new jsPDF();
  drawCoverBanner(
    doc,
    'User Guide',
    'How to use Forensic Archivist',
    'A screen-by-screen walkthrough of the full reconciliation journey — designed so an auditor can pick up the tool cold and know exactly what each view is for.'
  );

  const c = makeCursor(doc);
  c.y = 56;

  // Journey at a glance
  c.heading('The journey, at a glance');
  autoTable(doc, {
    startY: c.y,
    head: [['Step', 'Screen', 'What happens']],
    body: [
      ['1', 'Import', 'Upload bank statement & cashbook/GL files.'],
      ['2', 'Match', 'Run matching and forensic risk analysis.'],
      ['3', 'Review', 'Inspect high and medium-risk exceptions.'],
      ['4', 'Export', 'Download the audit-ready PDF.'],
    ],
    theme: 'grid',
    headStyles: { fillColor: BRAND, halign: 'left' },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 14, halign: 'center' } },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });
  c.y = (doc as any).lastAutoTable.finalY + 6;

  c.paragraph(
    'The progress strip at the top of each workflow screen shows where you are and which steps still need work. A green checkmark means the step has met its prerequisites.'
  );

  // Per-screen sections
  for (const s of SCREENS) {
    c.divider();
    c.heading(s.title);
    c.subheading(s.subtitle);
    c.labelled('Purpose', s.purpose);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    c.ensureSpace(6);
    doc.text('WHAT YOU DO HERE', MARGIN_X, c.y);
    c.y += 4;
    c.bulletList(s.whatYouDo);
    c.labelled('What to check', s.whatToCheck);
  }

  // Tips
  c.divider();
  c.heading('Tips for a clean run');
  c.bulletList([
    'Always reconcile the same period on both ledgers — mismatched periods inflate the reconciling-item count.',
    'If your match rate looks low, widen the date tolerance in Settings before hand-matching everything manually.',
    'Use "New Reconciliation" in the sidebar to wipe everything and start a fresh engagement — it clears all imported data, matches, and risk results.',
    'Everything is stored locally in your browser. Clearing browser data or switching devices will reset the vault.',
  ]);

  drawFooter(doc);
  doc.save('forensic-archivist-user-guide.pdf');
}
