import { ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  Cpu,
  ArrowLeftRight,
  Layers,
  ShieldCheck,
  Clock,
  DollarSign,
  Hash,
  Copy,
  CalendarClock,
  NotebookPen,
  Calculator,
  Database,
  Lock,
  Download,
  LucideIcon,
} from 'lucide-react';
import { generateTechOverviewPdf } from '../lib/guidePdf';
import { useToastStore } from '../stores/toastStore';

export function TechOverview() {
  const addToast = useToastStore((s) => s.addToast);

  const handleDownload = () => {
    generateTechOverviewPdf();
    addToast({
      type: 'success',
      title: 'Tech Overview downloaded',
      message: 'Saved as forensic-archivist-tech-overview.pdf.',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 max-w-4xl"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-[0.2em] font-bold">
            <Cpu size={14} /> How it works
          </div>
          <h1 className="font-headline font-bold text-3xl text-blue-950 mt-1">
            Technical Overview
          </h1>
          <p className="text-slate-600 mt-2">
            The tech stack behind the app and the rules each engine follows —
            written for a reviewer or audit manager, not a developer.
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="bg-primary text-white px-4 py-2.5 rounded-lg font-headline font-bold text-sm flex items-center gap-2 shadow-md shadow-primary/20 shrink-0"
        >
          <Download size={15} />
          Download PDF
        </button>
      </header>

      {/* Stack */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-headline font-bold text-lg text-blue-950 flex items-center gap-2">
          <Layers size={18} className="text-primary" /> What it's built with
        </h2>
        <p className="text-sm text-slate-600 mt-2 mb-5 leading-relaxed">
          Forensic Archivist is a modern browser application — nothing is
          installed on your machine and nothing is sent to a server. Everything
          runs locally in the browser tab.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StackItem
            name="React + TypeScript + Vite"
            role="User interface and build tooling"
            description="The visible app. TypeScript catches whole categories of bugs before the app ships; Vite serves the app instantly during development."
          />
          <StackItem
            name="Tailwind CSS"
            role="Design system & styling"
            description="Produces the card layouts, colours, and spacing. All styles are compiled into a single small CSS file."
          />
          <StackItem
            name="Zustand"
            role="In-memory state"
            description="Holds the transactions, matches, and risk results while the app is running. Very small, very fast."
          />
          <StackItem
            name="Dexie (IndexedDB)"
            role="Local storage"
            description="Persists everything in the browser's own database so data survives refreshes. Never leaves your device."
          />
          <StackItem
            name="SheetJS"
            role="Excel / CSV parsing"
            description="Reads .xlsx, .xls, and .csv uploads. Handles Excel's serial-date format and flexible column naming."
          />
          <StackItem
            name="jsPDF + autoTable"
            role="PDF report generation"
            description="Assembles the Audit Vault PDF, including the reconciliation summary and the exception report tables."
          />
          <StackItem
            name="Recharts"
            role="Charts"
            description="Renders the Dashboard KPIs and the risk distribution graphs."
          />
          <StackItem
            name="React Router"
            role="Navigation"
            description="Handles the sidebar links and the guided step-by-step journey."
          />
        </div>
      </section>

      {/* Matching rules */}
      <RuleBlock
        icon={ArrowLeftRight}
        title="How matching works"
        subtitle="The matching engine"
        lede="When you click Match & Analyze Risk, the app compares every bank row to every GL row and scores how likely each pair is to be the same transaction."
      >
        <p className="text-sm text-slate-700 leading-relaxed">
          Each potential pair gets a <strong>confidence score from 0 to 100</strong>,
          built from three factors:
        </p>
        <ul className="text-sm text-slate-700 space-y-1.5 list-disc pl-5 mt-2">
          <li>
            <strong>Amount</strong> — must match almost exactly (to the cent by
            default). If the amounts differ, the pair scores zero no matter what
            else aligns.
          </li>
          <li>
            <strong>Date proximity</strong> — closer dates score higher. By
            default pairs can be up to 3 days apart; beyond that they're
            disqualified. You can widen this in Settings.
          </li>
          <li>
            <strong>Description similarity</strong> — how many words the two
            descriptions share (Jaccard overlap). Helps distinguish two
            same-amount, same-day transactions from each other.
          </li>
        </ul>
        <p className="text-sm text-slate-700 leading-relaxed mt-3">
          The engine lists all candidate pairs scoring 50% or higher, sorts them
          best-first, and picks greedily — once a row is locked into a pair, it
          can't be re-used. This means one bank row only ever matches one GL
          row and vice versa.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed mt-3">
          Anything left over becomes a <em>reconciling item</em> that needs
          classification (see below). You can always manually link two rows
          yourself on the Matching Workspace; a manual link scores 100%.
        </p>
      </RuleBlock>

      {/* Reconciling classification */}
      <RuleBlock
        icon={Layers}
        title="How reconciling items are classified"
        subtitle="The reconciliation engine"
        lede="Every unmatched transaction is placed into one of five categories so the final reconciliation is tidy and auditable."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          <CatItem
            name="Deposit in transit"
            when="Deposit recorded in the GL but not yet on the bank statement."
            bank="+"
          />
          <CatItem
            name="Outstanding payment"
            when="Payment issued in the GL (typically an uncashed cheque) but not yet hit the bank."
            bank="−"
          />
          <CatItem
            name="Bank charge"
            when="Fee taken by the bank that the accountant hasn't recorded yet. Also triggered by description keywords like 'service fee' or 'bank fee'."
            gl="−"
          />
          <CatItem
            name="Direct deposit"
            when="Deposit that hit the bank directly (e.g. interest, wire transfers in) but the GL doesn't know about yet."
            gl="+"
          />
          <CatItem
            name="Error / unclassified"
            when="Items that don't fit a standard category — flagged for manual review."
          />
        </div>

        <div className="bg-slate-50 rounded-lg p-4 mt-4 flex gap-3">
          <Calculator size={18} className="text-slate-500 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700 leading-relaxed">
            <strong>Balance math:</strong> the app starts from the raw bank
            balance (deposits minus payments on the bank side) and the raw GL
            balance, then adjusts each side according to the rules above. If
            everything is classified correctly, the adjusted balances should
            match and the final difference is zero.
          </div>
        </div>
      </RuleBlock>

      {/* Risk rules */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-11 h-11 rounded-lg bg-red-50 text-red-700 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="font-headline font-bold text-xl text-blue-950 leading-tight">
              The six forensic risk rules
            </h2>
            <p className="text-xs uppercase tracking-widest font-bold text-red-700/70 mt-0.5">
              ISA 240 / ISA 315 aligned
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed mb-5">
          Every transaction — matched or not — is scored against each of these
          six rules. A rule that fires contributes points to the overall risk
          score; a transaction that fires multiple rules gets a compound score.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RiskRuleCard
            icon={Clock}
            name="Aging"
            triggers="Transactions older than a threshold (default: 30 days)."
            rationale="Stale items are a classic indicator of unresolved breaks or timing manipulation."
            severity="Medium, rising to High past double the threshold"
          />
          <RiskRuleCard
            icon={DollarSign}
            name="Large amount"
            triggers="Amounts at or above a threshold (default: $50,000)."
            rationale="Large items carry higher inherent risk and warrant closer scrutiny."
            severity="Medium, rising to High at 3× the threshold"
          />
          <RiskRuleCard
            icon={Hash}
            name="Round figure"
            triggers="Suspiciously round amounts — $1,000 multiples at $1k+, or $500 multiples at $10k+."
            rationale="Round figures often signal estimates, journal adjustments, or unauthorised splits."
            severity="Low"
          />
          <RiskRuleCard
            icon={Copy}
            name="Duplicate"
            triggers="Same amount appearing more than once within a 7-day window on the same side."
            rationale="Potential double payments, cloned invoices, or deliberate duplication."
            severity="Medium, rising to High with three or more duplicates"
          />
          <RiskRuleCard
            icon={CalendarClock}
            name="Year-end"
            triggers="Transactions dated in December or January (configurable)."
            rationale="Fiscal cut-off is where the bulk of adjustment-based fraud appears."
            severity="Medium"
          />
          <RiskRuleCard
            icon={NotebookPen}
            name="Manual journal"
            triggers={`Descriptions containing "journal", "adjustment", "manual", or "correction".`}
            rationale="Non-system entries are a primary ISA 240 fraud indicator."
            severity="Medium"
          />
        </div>
      </section>

      {/* Scoring */}
      <RuleBlock
        icon={Calculator}
        title="How the overall risk score is calculated"
        subtitle="Combining the flags"
        lede="Each rule that fires contributes points based on severity. The scores add up to a 0–100 overall score, which is then mapped to a risk level."
      >
        <div className="grid grid-cols-3 gap-3 mt-3">
          <ScoreBox label="Low flag" value="+10 pts" tone="emerald" />
          <ScoreBox label="Medium flag" value="+30 pts" tone="amber" />
          <ScoreBox label="High flag" value="+50 pts" tone="rose" />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <ScoreBox label="0 – 29 points" value="Low" tone="emerald" bold />
          <ScoreBox label="30 – 59 points" value="Medium" tone="amber" bold />
          <ScoreBox label="60 – 100 points" value="High" tone="rose" bold />
        </div>
        <p className="text-sm text-slate-700 leading-relaxed mt-4">
          The score is capped at 100. A transaction with, say, a large-amount
          flag (30) and a round-figure flag (10) lands at 40 — medium. Adding a
          duplicate on top (30 more) pushes it to 70 — high. The thresholds
          themselves are configurable in Settings.
        </p>
      </RuleBlock>

      {/* Data & privacy */}
      <section className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Lock size={22} />
          </div>
          <div>
            <h2 className="font-headline font-bold text-xl text-blue-950 leading-tight">
              Where your data lives
            </h2>
            <p className="text-xs uppercase tracking-widest font-bold text-emerald-700/70 mt-0.5">
              Private by default
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3 text-sm text-slate-700 leading-relaxed">
          <p>
            Everything you upload — bank rows, cashbook rows, match results,
            risk assessments — is stored in your browser's own local database{' '}
            <span className="font-semibold">(IndexedDB)</span>. No file is
            transmitted to any server. No account is needed.
          </p>
          <p>
            That means three things in practice:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Your data is as private as your browser profile.</li>
            <li>Switching devices or browsers starts from an empty vault.</li>
            <li>Clearing browser storage deletes everything — always export the PDF before you do.</li>
          </ul>
        </div>
      </section>

      <div className="text-xs text-slate-400 text-center">
        Forensic Archivist · Aligned with ISA 240 and ISA 315 risk
        identification and fraud detection standards.
      </div>
    </motion.div>
  );
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

interface RuleBlockProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  lede: string;
  children: ReactNode;
}

function RuleBlock({ icon: Icon, title, subtitle, lede, children }: RuleBlockProps) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-start gap-4 mb-4">
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
      <p className="text-sm text-slate-700 leading-relaxed">{lede}</p>
      <div className="mt-3 space-y-0">{children}</div>
    </section>
  );
}

function StackItem({
  name,
  role,
  description,
}: {
  name: string;
  role: string;
  description: string;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Database size={14} className="text-primary" />
        <span className="font-headline font-bold text-blue-950 text-sm">{name}</span>
      </div>
      <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">
        {role}
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

function CatItem({
  name,
  when,
  bank,
  gl,
}: {
  name: string;
  when: string;
  bank?: '+' | '−';
  gl?: '+' | '−';
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-blue-950 text-sm">{name}</span>
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
          {bank && (
            <span className={bank === '+' ? 'bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded' : 'bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded'}>
              Bank {bank}
            </span>
          )}
          {gl && (
            <span className={gl === '+' ? 'bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded' : 'bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded'}>
              GL {gl}
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed mt-1.5">{when}</p>
    </div>
  );
}

function RiskRuleCard({
  icon: Icon,
  name,
  triggers,
  rationale,
  severity,
}: {
  icon: LucideIcon;
  name: string;
  triggers: string;
  rationale: string;
  severity: string;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-red-700" />
        <span className="font-headline font-bold text-blue-950 text-sm">{name}</span>
      </div>
      <div className="space-y-2 text-xs">
        <div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Triggers</div>
          <p className="text-slate-700 leading-relaxed mt-0.5">{triggers}</p>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Why it matters</div>
          <p className="text-slate-700 leading-relaxed mt-0.5">{rationale}</p>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Severity</div>
          <p className="text-slate-700 leading-relaxed mt-0.5">{severity}</p>
        </div>
      </div>
    </div>
  );
}

function ScoreBox({
  label,
  value,
  tone,
  bold,
}: {
  label: string;
  value: string;
  tone: 'emerald' | 'amber' | 'rose';
  bold?: boolean;
}) {
  const toneClass =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : tone === 'amber'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-rose-50 text-rose-800 border-rose-200';
  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-widest font-bold opacity-70">
        {label}
      </div>
      <div className={bold ? 'text-lg font-headline font-bold mt-0.5' : 'text-sm font-semibold mt-0.5'}>
        {value}
      </div>
    </div>
  );
}
