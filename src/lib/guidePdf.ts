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
  {
    title: 'Sample Data',
    subtitle: 'For demos & practice',
    purpose:
      'Two downloadable ready-made reconciliation scenarios so you can try the full flow without needing production data.',
    whatYouDo: [
      'Pick a set — each set has a matched pair of bank statement and cashbook/GL files.',
      'Click Download .xlsx on both cards in the same set, then upload them on the Data Imports screen.',
      'Run the flow end to end to see every feature trigger at least once.',
    ],
    whatToCheck:
      'Each set exercises the full feature matrix. Set 1 (Zambezi Trading) and Set 2 (Kopje Mining Supplies) use different parties and periods so you can demo twice without repetition.',
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

// ---------------------------------------------------------------------------
// TECH OVERVIEW
// ---------------------------------------------------------------------------

const STACK: Array<{ name: string; role: string; description: string }> = [
  {
    name: 'React + TypeScript + Vite',
    role: 'User interface and build tooling',
    description:
      'The visible app. TypeScript catches whole categories of bugs before the app ships; Vite serves the app instantly during development.',
  },
  {
    name: 'Tailwind CSS',
    role: 'Design system & styling',
    description:
      'Produces the card layouts, colours, and spacing. All styles are compiled into a single small CSS file.',
  },
  {
    name: 'Zustand',
    role: 'In-memory state',
    description:
      'Holds the transactions, matches, and risk results while the app is running. Very small, very fast.',
  },
  {
    name: 'Dexie (IndexedDB)',
    role: 'Local storage',
    description:
      "Persists everything in the browser's own database so data survives refreshes. Never leaves your device.",
  },
  {
    name: 'SheetJS',
    role: 'Excel / CSV parsing',
    description:
      "Reads .xlsx, .xls, and .csv uploads. Handles Excel's serial-date format and flexible column naming.",
  },
  {
    name: 'jsPDF + autoTable',
    role: 'PDF report generation',
    description:
      'Assembles the Audit Vault PDF, including the reconciliation summary and the exception report tables.',
  },
  {
    name: 'Recharts',
    role: 'Charts',
    description:
      'Renders the Dashboard KPIs and the risk distribution graphs.',
  },
  {
    name: 'React Router',
    role: 'Navigation',
    description:
      'Handles the sidebar links and the guided step-by-step journey.',
  },
];

const RECON_CLASSES: Array<{ name: string; when: string; effect: string }> = [
  {
    name: 'Deposit in transit',
    when: 'Deposit recorded in the GL but not yet on the bank statement.',
    effect: 'Bank balance +',
  },
  {
    name: 'Outstanding payment',
    when: 'Payment issued in the GL (typically an uncashed cheque) but not yet hit the bank.',
    effect: 'Bank balance -',
  },
  {
    name: 'Bank charge',
    when: "Fee taken by the bank that the accountant hasn't recorded. Triggered by description keywords like 'service fee' or 'bank fee'.",
    effect: 'GL balance -',
  },
  {
    name: 'Direct deposit',
    when: 'Deposit that hit the bank directly (e.g. interest, wire transfers in) but the GL does not know about yet.',
    effect: 'GL balance +',
  },
  {
    name: 'Error / unclassified',
    when: "Items that don't fit a standard category — flagged for manual review.",
    effect: 'No automatic adjustment',
  },
];

const RISK_RULES: Array<{
  name: string;
  triggers: string;
  rationale: string;
  severity: string;
}> = [
  {
    name: 'Aging',
    triggers: 'Transactions older than a threshold (default: 30 days).',
    rationale:
      'Stale items are a classic indicator of unresolved breaks or timing manipulation.',
    severity: 'Medium, rising to High past double the threshold.',
  },
  {
    name: 'Large amount',
    triggers: 'Amounts at or above a threshold (default: $50,000).',
    rationale:
      'Large items carry higher inherent risk and warrant closer scrutiny.',
    severity: 'Medium, rising to High at 3x the threshold.',
  },
  {
    name: 'Round figure',
    triggers:
      'Suspiciously round amounts — $1,000 multiples at $1k+, or $500 multiples at $10k+.',
    rationale:
      'Round figures often signal estimates, journal adjustments, or unauthorised splits.',
    severity: 'Low.',
  },
  {
    name: 'Duplicate',
    triggers:
      'Same amount appearing more than once within a 7-day window on the same side.',
    rationale:
      'Potential double payments, cloned invoices, or deliberate duplication.',
    severity: 'Medium, rising to High with three or more duplicates.',
  },
  {
    name: 'Year-end',
    triggers: 'Transactions dated in December or January (configurable).',
    rationale:
      'Fiscal cut-off is where the bulk of adjustment-based fraud appears.',
    severity: 'Medium.',
  },
  {
    name: 'Manual journal',
    triggers:
      'Descriptions containing "journal", "adjustment", "manual", or "correction".',
    rationale:
      'Non-system entries are a primary ISA 240 fraud indicator.',
    severity: 'Medium.',
  },
];

export function generateTechOverviewPdf() {
  const doc = new jsPDF();
  drawCoverBanner(
    doc,
    'Technical Overview',
    'How Forensic Archivist works',
    "The tech stack behind the app and the rules each engine follows — written for a reviewer or audit manager, not a developer."
  );

  const c = makeCursor(doc);
  c.y = 56;

  // Stack
  c.heading("What it's built with");
  c.paragraph(
    'Forensic Archivist is a modern browser application — nothing is installed on your machine and nothing is sent to a server. Everything runs locally in the browser tab.'
  );
  autoTable(doc, {
    startY: c.y,
    head: [['Component', 'Role', 'What it does']],
    body: STACK.map((s) => [s.name, s.role, s.description]),
    theme: 'grid',
    headStyles: { fillColor: BRAND, halign: 'left' },
    styles: { fontSize: 9, cellPadding: 2.5, valign: 'top' },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold' },
      1: { cellWidth: 42 },
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });
  c.y = (doc as any).lastAutoTable.finalY + 8;

  // Matching
  c.divider();
  c.heading('How matching works');
  c.paragraph(
    'When you click Match & Analyze Risk, the app compares every bank row to every GL row and scores how likely each pair is to be the same transaction.'
  );
  c.paragraph(
    'Each potential pair gets a confidence score from 0 to 100, built from three factors:'
  );
  c.bulletList([
    'Amount — must match almost exactly (to the cent by default). If the amounts differ, the pair scores zero no matter what else aligns.',
    'Date proximity — closer dates score higher. By default pairs can be up to 3 days apart; beyond that they are disqualified. You can widen this in Settings.',
    'Description similarity — how many words the two descriptions share (Jaccard overlap). Helps distinguish two same-amount, same-day transactions from each other.',
  ]);
  c.paragraph(
    "The engine lists all candidate pairs scoring 50% or higher, sorts them best-first, and picks greedily — once a row is locked into a pair, it can't be re-used. This means one bank row only ever matches one GL row and vice versa."
  );
  c.paragraph(
    'Anything left over becomes a reconciling item that needs classification (see below). You can always manually link two rows yourself on the Matching Workspace; a manual link scores 100%.'
  );

  // Reconciling classification
  c.divider();
  c.heading('How reconciling items are classified');
  c.paragraph(
    'Every unmatched transaction is placed into one of five categories so the final reconciliation is tidy and auditable.'
  );
  autoTable(doc, {
    startY: c.y,
    head: [['Category', 'Triggers when…', 'Balance effect']],
    body: RECON_CLASSES.map((r) => [r.name, r.when, r.effect]),
    theme: 'grid',
    headStyles: { fillColor: BRAND, halign: 'left' },
    styles: { fontSize: 9, cellPadding: 2.5, valign: 'top' },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 36 },
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });
  c.y = (doc as any).lastAutoTable.finalY + 4;
  c.paragraph(
    'Balance math: the app starts from the raw bank balance (deposits minus payments on the bank side) and the raw GL balance, then adjusts each side according to the rules above. If everything is classified correctly, the adjusted balances should match and the final difference is zero.'
  );

  // Risk rules
  c.divider();
  c.heading('The six forensic risk rules');
  c.paragraph(
    'Every transaction — matched or not — is scored against each of these six rules. A rule that fires contributes points to the overall risk score; a transaction that fires multiple rules gets a compound score.'
  );
  autoTable(doc, {
    startY: c.y,
    head: [['Rule', 'Triggers', 'Why it matters', 'Severity']],
    body: RISK_RULES.map((r) => [r.name, r.triggers, r.rationale, r.severity]),
    theme: 'grid',
    headStyles: { fillColor: [186, 26, 26], halign: 'left' },
    styles: { fontSize: 9, cellPadding: 2.5, valign: 'top' },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold' },
      3: { cellWidth: 40 },
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });
  c.y = (doc as any).lastAutoTable.finalY + 6;

  // Scoring
  c.divider();
  c.heading('How the overall risk score is calculated');
  c.paragraph(
    'Each rule that fires contributes points based on severity. The scores add up to a 0-100 overall score, which is then mapped to a risk level.'
  );
  autoTable(doc, {
    startY: c.y,
    head: [['Flag severity', 'Points added']],
    body: [
      ['Low', '+10'],
      ['Medium', '+30'],
      ['High', '+50'],
    ],
    theme: 'grid',
    headStyles: { fillColor: BRAND },
    styles: { fontSize: 9, cellPadding: 2.5 },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });
  c.y = (doc as any).lastAutoTable.finalY + 4;
  autoTable(doc, {
    startY: c.y,
    head: [['Total score', 'Risk level']],
    body: [
      ['0 – 29 points', 'Low'],
      ['30 – 59 points', 'Medium'],
      ['60 – 100 points', 'High'],
    ],
    theme: 'grid',
    headStyles: { fillColor: BRAND },
    styles: { fontSize: 9, cellPadding: 2.5 },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });
  c.y = (doc as any).lastAutoTable.finalY + 4;
  c.paragraph(
    'The score is capped at 100. A transaction with, say, a large-amount flag (30) and a round-figure flag (10) lands at 40 — medium. Adding a duplicate on top (30 more) pushes it to 70 — high. The thresholds themselves are configurable in Settings.'
  );

  // Privacy
  c.divider();
  c.heading('Where your data lives');
  c.paragraph(
    "Everything you upload — bank rows, cashbook rows, match results, risk assessments — is stored in your browser's own local database (IndexedDB). No file is transmitted to any server. No account is needed."
  );
  c.paragraph('That means three things in practice:');
  c.bulletList([
    'Your data is as private as your browser profile.',
    'Switching devices or browsers starts from an empty vault.',
    'Clearing browser storage deletes everything — always export the PDF before you do.',
  ]);

  drawFooter(doc);
  doc.save('forensic-archivist-tech-overview.pdf');
}
