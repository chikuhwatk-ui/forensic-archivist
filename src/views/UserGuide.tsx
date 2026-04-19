import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BookOpen,
  LayoutDashboard,
  CloudUpload,
  ArrowLeftRight,
  Microscope,
  FileWarning,
  Archive,
  Settings as SettingsIcon,
  FlaskConical,
  LucideIcon,
} from 'lucide-react';

export function UserGuide() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 max-w-4xl"
    >
      <header>
        <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-[0.2em] font-bold">
          <BookOpen size={14} /> User Guide
        </div>
        <h1 className="font-headline font-bold text-3xl text-blue-950 mt-1">
          How to use Forensic Archivist
        </h1>
        <p className="text-slate-600 mt-2">
          A screen-by-screen walkthrough of the full reconciliation journey —
          designed so an auditor can pick up the tool cold and know exactly what
          each view is for.
        </p>
      </header>

      {/* Workflow at a glance */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-headline font-bold text-lg text-blue-950 mb-4">
          The journey, at a glance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { step: 1, label: 'Import',  hint: 'Upload bank & GL',      icon: CloudUpload },
            { step: 2, label: 'Match',   hint: 'Run matching & risk',   icon: ArrowLeftRight },
            { step: 3, label: 'Review',  hint: 'Inspect exceptions',    icon: FileWarning },
            { step: 4, label: 'Export',  hint: 'Download audit PDF',    icon: Archive },
          ].map((s) => (
            <div
              key={s.step}
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50"
            >
              <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
                {s.step}
              </div>
              <div>
                <div className="font-headline font-bold text-blue-950 text-sm">{s.label}</div>
                <div className="text-[11px] text-slate-500">{s.hint}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-600 mt-4 leading-relaxed">
          The progress strip at the top of each workflow screen shows where you
          are and which steps still need work. A green checkmark means the step
          has met its prerequisites.
        </p>
      </section>

      <ScreenCard
        icon={LayoutDashboard}
        title="Dashboard"
        subtitle="Your landing view"
        purpose="An executive summary of the current reconciliation engagement — match rate, open reconciling items, high-risk count, and charts."
        whatYouDo={[
          'Glance at the KPI cards to see whether work is in progress or complete.',
          'Before any data is loaded, this page shows a "Get Started in 4 Steps" card — use it as a launcher.',
          'Once data is loaded, the charts light up automatically — no action needed.',
        ]}
        whatToCheck="Use this screen at the start and end of a session. Nothing is edited here — it's read-only."
      />

      <ScreenCard
        icon={CloudUpload}
        title="Data Imports"
        subtitle="Step 1 · Upload your source data"
        purpose="Load the two ledgers you want to reconcile: the bank statement and the cashbook/GL."
        whatYouDo={[
          'Upload an .xlsx, .xls, or .csv file for the bank statement.',
          'Upload the matching period\'s cashbook/GL file.',
          'Required columns: Date, Description, Amount, Type (deposit or payment), Reference. Extra columns are ignored.',
          'You can also add rows manually via the "Manual Entry" accordion.',
          'Each uploaded row is tagged as either bank or GL and stored locally in your browser.',
        ]}
        whatToCheck="Once both files show a green 'N transactions loaded' marker, the 'Match & analyze risk' button at the bottom of the page lights up. Click it to move on."
      />

      <ScreenCard
        icon={ArrowLeftRight}
        title="Matching Workspace"
        subtitle="Step 2 · The main action screen"
        purpose="Runs the automatic matcher against your two ledgers and applies the full forensic risk ruleset in one pass."
        whatYouDo={[
          'Click the "Match & Analyze Risk" button. It runs two engines together: the transaction matcher and the forensic risk scorer.',
          'Review matched pairs in the "Matched Items" table. Each pair shows a confidence score (0–100%).',
          'Read the "Reconciliation Balance Statement" — it shows the bank and GL balances before and after reconciling-item adjustments, plus the remaining difference.',
          'For items that didn\'t auto-match, use the "Manual Matching" section: click one row on the bank side, one row on the GL side, then "Link Selected".',
        ]}
        whatToCheck="A match rate above 70% is typical for clean data. If the difference at the bottom is non-zero, investigate the unmatched items — they may need manual matching or will become reconciling items."
      />

      <ScreenCard
        icon={FileWarning}
        title="Exception Report"
        subtitle="Step 3 · Focus on what's flagged"
        purpose="Lists every transaction that the forensic engine flagged as high or medium risk, with the specific rule(s) that triggered the flag."
        whatYouDo={[
          'Filter by risk level (High only, Medium only, or both).',
          'Search by description, reference, or date to drill into a specific transaction.',
          'Review the "Investigation Required" column — it spells out why each item was flagged (e.g. "Amount exceeds threshold", "Possible manual journal adjustment").',
          'Export a focused PDF of just the exceptions via the red "Export Exception Report" button.',
        ]}
        whatToCheck="This screen is the heart of the audit: anything a reviewer will challenge will be here. Document your findings before exporting."
      />

      <ScreenCard
        icon={Archive}
        title="Audit Vault"
        subtitle="Step 4 · Produce the deliverable"
        purpose="Compiles the full reconciliation summary and exception report into a single signed-ready PDF."
        whatYouDo={[
          'Verify the summary KPI cards (matched count, reconciling items, exception count).',
          'Click "Export PDF Report" to download the complete audit pack — it includes the summary, all reconciling items with classifications, and the high/medium-risk exception section.',
          '"Clear All Data" resets everything. Use it at the end of an engagement; a confirmation dialog protects against accidents.',
        ]}
        whatToCheck="The PDF is self-contained — you can hand it off to a reviewer or partner without any other files. Double-check the period covered before sending."
      />

      <ScreenCard
        icon={Microscope}
        title="Forensic Toolbox"
        subtitle="Optional deep-dive"
        purpose="A dedicated view of the forensic risk engine output. The analysis already ran during Match & Analyze Risk — this page is for inspecting results or re-running after tweaking thresholds."
        whatYouDo={[
          'Filter flagged transactions by risk level.',
          'Review the flag distribution chart to see which rule types are driving the risk picture.',
          'If you change thresholds in Settings, click "Re-run Risk Analysis" here to refresh scores without re-matching.',
        ]}
        whatToCheck="Most users won't need this screen in a standard engagement — it's for when you want to sanity-check the ruleset or tune it."
      />

      <ScreenCard
        icon={SettingsIcon}
        title="Settings"
        subtitle="Tune the engines"
        purpose="All tolerances and thresholds used by the matcher and risk engine are exposed here, with sensible ISA-compliant defaults."
        whatYouDo={[
          'Adjust matching tolerances: date window (default ±3 days), amount tolerance (default $0.01), description weight.',
          'Adjust risk thresholds: aging days (default >30), large-amount threshold (default $50,000), year-end months, duplicate window.',
          'Click "Save Settings" to persist. Unsaved changes are warned before navigation.',
          '"Reset to Defaults" restores factory settings.',
        ]}
        whatToCheck="Default thresholds follow ISA 240 / ISA 315 guidance for mid-size engagements. Tighten or loosen based on the materiality of the audit."
      />

      <ScreenCard
        icon={FlaskConical}
        title="Sample Data"
        subtitle="For demos & practice"
        purpose="Two downloadable ready-made reconciliation scenarios so you can try the full flow without needing production data."
        whatYouDo={[
          'Pick a set — each set has a matched pair of bank statement and cashbook/GL files.',
          'Click Download .xlsx on both cards in the same set, then upload them on the Data Imports screen.',
          'Run the flow end to end to see every feature trigger at least once.',
        ]}
        whatToCheck="Each set exercises the full feature matrix. Set 1 (Zambezi Trading) and Set 2 (Kopje Mining Supplies) use different parties and periods so you can demo twice without repetition."
      />

      {/* Tips */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <h2 className="font-headline font-bold text-lg text-blue-950 mb-3">
          Tips for a clean run
        </h2>
        <ul className="space-y-2 text-sm text-slate-700 leading-relaxed list-disc pl-5">
          <li>Always reconcile the <em>same period</em> on both ledgers — mismatched periods inflate the reconciling-item count.</li>
          <li>If your match rate looks low, widen the date tolerance in Settings before hand-matching everything manually.</li>
          <li>Use "New Reconciliation" in the sidebar to wipe everything and start a fresh engagement — it clears all imported data, matches, and risk results.</li>
          <li>Everything is stored locally in your browser. Clearing browser data or switching devices will reset the vault.</li>
        </ul>
      </section>

      <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-4">
        <div>
          <div className="font-headline font-bold text-blue-950">Ready to begin?</div>
          <div className="text-xs text-slate-500">Jump straight into importing your ledgers.</div>
        </div>
        <Link
          to="/import"
          className="bg-primary text-white px-4 py-2 rounded-lg font-headline font-bold text-sm shadow-md shadow-primary/20"
        >
          Go to Data Imports →
        </Link>
      </div>
    </motion.div>
  );
}

interface ScreenCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  purpose: string;
  whatYouDo: string[];
  whatToCheck: string;
}

function ScreenCard({
  icon: Icon,
  title,
  subtitle,
  purpose,
  whatYouDo,
  whatToCheck,
}: ScreenCardProps) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-start gap-4 p-5 border-b border-slate-100">
        <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon size={22} />
        </div>
        <div>
          <h2 className="font-headline font-bold text-xl text-blue-950 leading-tight">
            {title}
          </h2>
          <p className="text-xs uppercase tracking-widest font-bold text-primary/70 mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <LabelledBlock label="Purpose">
          <p className="text-sm text-slate-700 leading-relaxed">{purpose}</p>
        </LabelledBlock>
        <LabelledBlock label="What you do here">
          <ul className="text-sm text-slate-700 leading-relaxed space-y-1.5 list-disc pl-5">
            {whatYouDo.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </LabelledBlock>
        <LabelledBlock label="What to check">
          <p className="text-sm text-slate-700 leading-relaxed">{whatToCheck}</p>
        </LabelledBlock>
      </div>
    </section>
  );
}

function LabelledBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}
