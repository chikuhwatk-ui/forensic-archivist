import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Archive,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { RiskBadge } from '../components/RiskBadge';
import { StatCard } from '../components/StatCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useTransactionStore } from '../stores/transactionStore';
import { useReconciliationStore } from '../stores/reconciliationStore';
import { useRiskStore } from '../stores/riskStore';
import { useToastStore } from '../stores/toastStore';
import { generateReconciliationReport } from '../lib/pdfReport';
import { ReconcilingItem, RiskAssessment, Transaction } from '../types';

export function AuditVault() {
  const { bankTransactions, glTransactions, loadAll: loadTx, clearAll: clearTx } = useTransactionStore();
  const { matches, reconcilingItems, loadAll: loadRecon, clearAll: clearRecon } = useReconciliationStore();
  const { assessments, loadAll: loadRisk, clearAll: clearRisk } = useRiskStore();
  const addToast = useToastStore((s) => s.addToast);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    loadTx();
    loadRecon();
    loadRisk();
  }, []);

  const allTransactions = useMemo(
    () => [...bankTransactions, ...glTransactions],
    [bankTransactions, glTransactions]
  );
  const txMap = useMemo(() => new Map(allTransactions.map((t) => [t.id, t])), [allTransactions]);
  const totalTx = allTransactions.length;
  const matchRate = totalTx > 0 ? ((matches.length * 2) / totalTx) * 100 : 0;
  const reconValue = reconcilingItems.reduce((s, i) => s + i.amount, 0);

  const riskCounts = useMemo(() => {
    let high = 0, medium = 0, low = 0;
    for (const a of assessments) {
      if (a.overallRisk === 'high') high++;
      else if (a.overallRisk === 'medium') medium++;
      else low++;
    }
    return { high, medium, low };
  }, [assessments]);

  const highRiskAssessments = useMemo(
    () => assessments.filter((a) => a.overallRisk === 'high' || a.overallRisk === 'medium'),
    [assessments]
  );

  const handleExportPDF = () => {
    const summary = {
      totalBankTransactions: bankTransactions.length,
      totalGLTransactions: glTransactions.length,
      matchedCount: matches.length,
      unmatchedBankCount: bankTransactions.length - matches.length,
      unmatchedGLCount: glTransactions.length - matches.length,
      reconcilingItemsCount: reconcilingItems.length,
      reconcilingItemsValue: reconValue,
      highRiskCount: riskCounts.high,
      mediumRiskCount: riskCounts.medium,
      lowRiskCount: riskCounts.low,
      matchRate,
    };
    generateReconciliationReport(summary, reconcilingItems, assessments, allTransactions);
    addToast({ type: 'success', title: 'Report exported', message: 'PDF downloaded to your device.' });
  };

  const handleClearAll = async () => {
    await clearTx();
    await clearRecon();
    await clearRisk();
    setShowClearConfirm(false);
    addToast({ type: 'info', title: 'Data cleared', message: 'All transactions, matches, and assessments removed.' });
  };

  const reconColumns: Column<ReconcilingItem>[] = [
    { key: 'date', header: 'Date', sortable: true },
    { key: 'description', header: 'Description', sortable: true },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (row) => <span className="font-mono font-semibold">${row.amount.toLocaleString()}</span>,
    },
    {
      key: 'type',
      header: 'Classification',
      render: (row) => (
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium capitalize">
          {row.type.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (row) => (
        <span className="text-xs font-bold uppercase">{row.source}</span>
      ),
    },
  ];

  const exceptionColumns: Column<RiskAssessment & { date: string; desc: string; amount: string }>[] = [
    { key: 'date', header: 'Date', sortable: true },
    { key: 'desc', header: 'Description', sortable: true },
    { key: 'amount', header: 'Amount', sortable: true },
    {
      key: 'overallRisk',
      header: 'Risk',
      render: (row) => <RiskBadge level={row.overallRisk} score={row.score} />,
    },
    {
      key: 'flags',
      header: 'Investigation Notes',
      render: (row) => (
        <div className="text-xs text-slate-600 space-y-0.5">
          {row.flags.map((f, i) => (
            <div key={i}>• {f.description}</div>
          ))}
        </div>
      ),
      className: 'max-w-md',
    },
  ];

  const enrichedExceptions = useMemo(
    () =>
      highRiskAssessments.map((a) => {
        const tx = txMap.get(a.transactionId);
        return {
          ...a,
          date: tx?.date || '',
          desc: tx?.description || '',
          amount: tx ? `$${tx.amount.toLocaleString()}` : '',
        };
      }),
    [highRiskAssessments, txMap]
  );

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold font-headline text-primary tracking-tight">
            Audit Vault
          </h1>
          <p className="text-slate-500 mt-1">
            Reconciliation reports, exception reports, and audit outputs.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="border border-red-300 text-red-600 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Clear All Data
          </button>
          <button
            onClick={handleExportPDF}
            disabled={totalTx === 0}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            Export PDF Report
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Matched"
          value={matches.length}
          subtitle={`${matchRate.toFixed(1)}% match rate`}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Reconciling Items"
          value={reconcilingItems.length}
          subtitle={`$${reconValue.toLocaleString()} total`}
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Exception Items"
          value={highRiskAssessments.length}
          subtitle="Requires investigation"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Total Processed"
          value={totalTx}
          subtitle={`${bankTransactions.length} bank · ${glTransactions.length} GL`}
          icon={Archive}
          color="blue"
        />
      </div>

      {/* Reconciliation Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 p-6"
      >
        <h3 className="font-bold text-slate-800 font-headline mb-1 flex items-center gap-2">
          <FileText size={18} className="text-blue-600" />
          Reconciliation Summary
        </h3>
        <p className="text-xs text-slate-400 mb-4">Classification of all reconciling items</p>

        {reconcilingItems.length > 0 ? (
          <DataTable
            columns={reconColumns}
            data={reconcilingItems}
            keyExtractor={(r) => r.id}
            maxHeight="350px"
          />
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm">
            No reconciling items — run reconciliation first.
          </div>
        )}
      </motion.div>

      {/* Exception Report */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-red-100 p-6"
      >
        <h3 className="font-bold text-red-800 font-headline mb-1 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-500" />
          Exception Report — Items Needing Investigation
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          High and medium-risk items flagged per ISA 240 fraud detection standards
        </p>

        {enrichedExceptions.length > 0 ? (
          <DataTable
            columns={exceptionColumns}
            data={enrichedExceptions}
            keyExtractor={(r) => r.id}
            maxHeight="400px"
          />
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm">
            No exception items — run risk analysis first.
          </div>
        )}
      </motion.div>

      {/* ISA note */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-4">
        <ShieldCheck size={24} className="text-primary mt-0.5 shrink-0" />
        <div>
          <h4 className="font-bold text-slate-800 text-sm">Audit Standards Compliance</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            This system supports <strong>ISA 315</strong> by identifying high-risk areas within bank
            reconciliations and aligns with <strong>ISA 240</strong> by enhancing the detection of
            potential fraud through automated risk indicators. All flagged items should be reviewed
            by the audit team before finalizing the reconciliation.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={showClearConfirm}
        title="Clear All Data?"
        message="This will permanently delete all imported transactions, matches, reconciling items, and risk assessments. This action cannot be undone."
        confirmLabel="Delete Everything"
        variant="danger"
        onConfirm={handleClearAll}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}
