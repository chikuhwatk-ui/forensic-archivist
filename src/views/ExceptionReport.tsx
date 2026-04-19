import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  Download,
  ShieldCheck,
  Filter,
  Search,
  FileWarning,
  Archive,
  ArrowLeftRight,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { NextStepCTA } from '../components/NextStepCTA';
import { RiskBadge } from '../components/RiskBadge';
import { StatCard } from '../components/StatCard';
import { useTransactionStore } from '../stores/transactionStore';
import { useRiskStore } from '../stores/riskStore';
import { useReconciliationStore } from '../stores/reconciliationStore';
import { generateReconciliationReport } from '../lib/pdfReport';
import { RiskAssessment } from '../types';

const RULE_LABELS: Record<string, string> = {
  aging: 'Aging (>30 days)',
  large_amount: 'Large/Unusual Amount',
  round_figure: 'Round Figure',
  year_end: 'Year-End Transaction',
  duplicate: 'Duplicate Amount',
  manual_journal: 'Manual Journal',
};

type EnrichedAssessment = RiskAssessment & {
  date: string;
  desc: string;
  amount: number;
  amountDisplay: string;
  reference: string;
  source: string;
  type: string;
};

export function ExceptionReport() {
  const { bankTransactions, glTransactions, loadAll: loadTx } = useTransactionStore();
  const { assessments, loadAll: loadRisk } = useRiskStore();
  const { matches, reconcilingItems, loadAll: loadRecon } = useReconciliationStore();
  const [searchParams] = useSearchParams();
  const [filterLevel, setFilterLevel] = useState<'high' | 'medium' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  useEffect(() => {
    loadTx();
    loadRisk();
    loadRecon();
  }, []);

  const allTransactions = useMemo(
    () => [...bankTransactions, ...glTransactions],
    [bankTransactions, glTransactions]
  );
  const txMap = useMemo(() => new Map(allTransactions.map((t) => [t.id, t])), [allTransactions]);

  // Only high and medium risk items for exception report
  const exceptionItems = useMemo(() => {
    let items = assessments.filter((a) => a.overallRisk === 'high' || a.overallRisk === 'medium');
    if (filterLevel !== 'all') {
      items = items.filter((a) => a.overallRisk === filterLevel);
    }
    return items;
  }, [assessments, filterLevel]);

  const enriched: EnrichedAssessment[] = useMemo(
    () =>
      exceptionItems
        .map((a) => {
          const tx = txMap.get(a.transactionId);
          return {
            ...a,
            date: tx?.date || '',
            desc: tx?.description || '',
            amount: tx?.amount || 0,
            amountDisplay: tx ? `$${tx.amount.toLocaleString()}` : '',
            reference: tx?.reference || '',
            source: tx?.source?.toUpperCase() || '',
            type: tx?.type || '',
          };
        })
        .filter((item) => {
          if (!searchTerm) return true;
          const term = searchTerm.toLowerCase();
          return (
            item.desc.toLowerCase().includes(term) ||
            item.reference.toLowerCase().includes(term) ||
            item.date.includes(term)
          );
        }),
    [exceptionItems, txMap, searchTerm]
  );

  const highCount = assessments.filter((a) => a.overallRisk === 'high').length;
  const medCount = assessments.filter((a) => a.overallRisk === 'medium').length;
  const totalExceptionValue = enriched.reduce((s, i) => s + i.amount, 0);

  const handleExportPDF = () => {
    const reconValue = reconcilingItems.reduce((s, i) => s + i.amount, 0);
    const totalTx = allTransactions.length;
    const matchRate = totalTx > 0 ? ((matches.length * 2) / totalTx) * 100 : 0;
    const summary = {
      totalBankTransactions: bankTransactions.length,
      totalGLTransactions: glTransactions.length,
      matchedCount: matches.length,
      unmatchedBankCount: bankTransactions.length - matches.length,
      unmatchedGLCount: glTransactions.length - matches.length,
      reconcilingItemsCount: reconcilingItems.length,
      reconcilingItemsValue: reconValue,
      highRiskCount: highCount,
      mediumRiskCount: medCount,
      lowRiskCount: assessments.filter((a) => a.overallRisk === 'low').length,
      matchRate,
    };
    generateReconciliationReport(summary, reconcilingItems, assessments, allTransactions);
  };

  const columns: Column<EnrichedAssessment>[] = [
    { key: 'date', header: 'Date', sortable: true },
    { key: 'desc', header: 'Description', sortable: true },
    {
      key: 'amountDisplay',
      header: 'Amount',
      sortable: true,
      render: (row) => <span className="font-mono font-semibold">{row.amountDisplay}</span>,
    },
    { key: 'reference', header: 'Reference' },
    { key: 'source', header: 'Source', render: (row) => <span className="text-xs font-bold">{row.source}</span> },
    {
      key: 'overallRisk',
      header: 'Risk',
      sortable: true,
      render: (row) => <RiskBadge level={row.overallRisk} score={row.score} />,
    },
    {
      key: 'flags',
      header: 'Investigation Required',
      render: (row) => (
        <div className="text-xs text-slate-600 space-y-1">
          {row.flags.map((f, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <AlertTriangle size={12} className={f.severity === 'high' ? 'text-red-500 mt-0.5' : 'text-amber-500 mt-0.5'} />
              <span>{f.description}</span>
            </div>
          ))}
        </div>
      ),
      className: 'max-w-lg',
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold font-headline text-red-800 tracking-tight">
            Exception Report
          </h1>
          <p className="text-slate-500 mt-1">
            High-risk reconciling items requiring investigation per ISA 240.
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={enriched.length === 0}
          className="bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          Export Exception Report
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard
          title="High Risk Items"
          value={highCount}
          subtitle="Requires immediate review"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Medium Risk Items"
          value={medCount}
          subtitle="Requires investigation"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Total Exception Value"
          value={`$${totalExceptionValue.toLocaleString()}`}
          subtitle={`${enriched.length} items`}
          icon={FileWarning}
          color="red"
        />
        <StatCard
          title="Exception Rate"
          value={
            allTransactions.length > 0
              ? `${(((highCount + medCount) / allTransactions.length) * 100).toFixed(1)}%`
              : '0%'
          }
          subtitle="Of all transactions"
          icon={ShieldCheck}
          color="slate"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by description, reference, date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as 'high' | 'medium' | 'all')}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
          >
            <option value="all">High & Medium</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
          </select>
        </div>
      </div>

      {/* Exception Items Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-red-100 p-6"
      >
        <h3 className="font-bold text-red-800 font-headline mb-1 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-500" />
          Items Needing Investigation ({enriched.length})
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Each item below has been automatically flagged by the forensic risk detection engine. Review all flags and document investigation findings.
        </p>
        {enriched.length > 0 ? (
          <DataTable
            columns={columns}
            data={enriched}
            keyExtractor={(r) => r.id}
            maxHeight="600px"
          />
        ) : assessments.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle size={48} className="mx-auto text-amber-400 mb-3" />
            <h4 className="font-bold text-blue-950 font-headline text-lg">No risk analysis run yet</h4>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Exception Report reads from the forensic risk engine. Run matching &amp; risk
              analysis first to see flagged transactions here.
            </p>
            <Link
              to="/matching"
              className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-headline font-bold text-sm shadow-md shadow-primary/20 mt-4"
            >
              <ArrowLeftRight size={15} /> Go to Matching Workspace
            </Link>
          </div>
        ) : (
          <div className="text-center py-12">
            <ShieldCheck size={48} className="mx-auto text-emerald-400 mb-3" />
            <h4 className="font-bold text-emerald-700 font-headline text-lg">No Exception Items</h4>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              No high or medium-risk items were found. All transactions passed the forensic
              risk checks.
            </p>
          </div>
        )}
      </motion.div>

      {/* ISA Note */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4">
        <ShieldCheck size={24} className="text-red-700 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-bold text-red-800 text-sm">Audit Standards — ISA 240 & ISA 315</h4>
          <p className="text-xs text-red-700/70 mt-1 leading-relaxed">
            This exception report supports <strong>ISA 315</strong> by identifying high-risk areas within bank
            reconciliations and aligns with <strong>ISA 240</strong> by enhancing the detection of potential fraud
            through automated risk indicators. All flagged items should be reviewed, investigated, and documented
            by the audit team before finalizing the reconciliation engagement.
          </p>
        </div>
      </div>

      {assessments.length > 0 && (
        <NextStepCTA
          label="Export audit report"
          description="Review is complete. Open Audit Vault to generate the signed PDF deliverable."
          to="/vault"
          icon={Archive}
        />
      )}
    </div>
  );
}
