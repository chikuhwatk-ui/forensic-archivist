import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeftRight, Play, CheckCircle2, XCircle, Link2, Scale, CloudUpload, FileWarning } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { NextStepCTA } from '../components/NextStepCTA';
import { useTransactionStore } from '../stores/transactionStore';
import { useReconciliationStore } from '../stores/reconciliationStore';
import { useRiskStore } from '../stores/riskStore';
import { computeAdjustedBalances } from '../engine/reconciler';
import { Transaction, MatchResult } from '../types';
import { StatCard } from '../components/StatCard';
import { useToastStore } from '../stores/toastStore';

export function MatchingWorkspace() {
  const { bankTransactions, glTransactions, loadAll: loadTx } = useTransactionStore();
  const { matches, reconcilingItems, runReconciliation, addManualMatch, loading, loadAll: loadRecon } =
    useReconciliationStore();
  const { runRiskAnalysis } = useRiskStore();
  const addToast = useToastStore((s) => s.addToast);

  const [selectedBank, setSelectedBank] = useState<Transaction | null>(null);
  const [selectedGL, setSelectedGL] = useState<Transaction | null>(null);

  useEffect(() => {
    loadTx();
    loadRecon();
  }, []);

  const matchedBankIds = useMemo(() => new Set(matches.map((m) => m.bankTransactionId)), [matches]);
  const matchedGLIds = useMemo(() => new Set(matches.map((m) => m.glTransactionId)), [matches]);

  const unmatchedBank = useMemo(
    () => bankTransactions.filter((t) => !matchedBankIds.has(t.id)),
    [bankTransactions, matchedBankIds]
  );
  const unmatchedGL = useMemo(
    () => glTransactions.filter((t) => !matchedGLIds.has(t.id)),
    [glTransactions, matchedGLIds]
  );

  const handleRunReconciliation = async () => {
    await runReconciliation();
    await runRiskAnalysis();
    const totalTxNow = bankTransactions.length + glTransactions.length;
    addToast({
      type: 'success',
      title: 'Reconciliation complete',
      message: `Processed ${totalTxNow} transactions. Next: review flagged items in Exception Report.`,
    });
  };

  const handleManualMatch = async () => {
    if (!selectedBank || !selectedGL) return;
    await addManualMatch(selectedBank.id, selectedGL.id);
    addToast({ type: 'success', title: 'Manual match created', message: `Linked "${selectedBank.description}" with "${selectedGL.description}".` });
    setSelectedBank(null);
    setSelectedGL(null);
  };

  const totalTx = bankTransactions.length + glTransactions.length;
  const matchRate = totalTx > 0 ? ((matches.length * 2) / totalTx) * 100 : 0;

  const txColumns: Column<Transaction>[] = [
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
      header: 'Type',
      render: (row) => (
        <span
          className={
            row.type === 'deposit'
              ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-bold'
              : 'text-red-700 bg-red-50 px-2 py-0.5 rounded-full text-xs font-bold'
          }
        >
          {row.type}
        </span>
      ),
    },
    { key: 'reference', header: 'Ref' },
  ];

  const matchColumns: Column<MatchResult & { bankDesc: string; glDesc: string; amount: string }>[] = [
    { key: 'bankDesc', header: 'Bank Transaction' },
    { key: 'glDesc', header: 'GL Transaction' },
    { key: 'amount', header: 'Amount' },
    {
      key: 'confidence',
      header: 'Confidence',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                row.confidence >= 90 ? 'bg-emerald-500' : row.confidence >= 70 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${row.confidence}%` }}
            />
          </div>
          <span className="text-xs font-bold">{row.confidence}%</span>
        </div>
      ),
    },
    {
      key: 'matchType',
      header: 'Type',
      render: (row) => (
        <span className="text-xs font-bold uppercase text-slate-500">{row.matchType}</span>
      ),
    },
  ];

  const txMap = useMemo(() => {
    const map = new Map<string, Transaction>();
    for (const t of [...bankTransactions, ...glTransactions]) map.set(t.id, t);
    return map;
  }, [bankTransactions, glTransactions]);

  const enrichedMatches = useMemo(
    () =>
      matches.map((m) => {
        const bankTx = txMap.get(m.bankTransactionId);
        const glTx = txMap.get(m.glTransactionId);
        return {
          ...m,
          bankDesc: bankTx ? `${bankTx.date} — ${bankTx.description}` : m.bankTransactionId,
          glDesc: glTx ? `${glTx.date} — ${glTx.description}` : m.glTransactionId,
          amount: bankTx ? `$${bankTx.amount.toLocaleString()}` : '',
        };
      }),
    [matches, txMap]
  );

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold font-headline text-primary tracking-tight">
            Matching Workspace
          </h1>
          <p className="text-slate-500 mt-1 max-w-xl">
            Match bank transactions against cashbook entries and score each transaction for
            forensic risk in one pass.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <button
            onClick={handleRunReconciliation}
            disabled={loading || totalTx === 0}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <Play size={16} />
            )}
            Match & Analyze Risk
          </button>
          <span className="text-[11px] text-slate-400">
            Runs matching and forensic risk rules together
          </span>
        </div>
      </header>

      {totalTx === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <CloudUpload size={22} />
          </div>
          <div className="flex-1">
            <h3 className="font-headline font-bold text-blue-950 text-lg">
              No transactions loaded
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Upload a bank statement and cashbook/GL file before running matching.
            </p>
          </div>
          <Link
            to="/import"
            className="bg-primary text-white px-4 py-2 rounded-lg font-headline font-bold text-sm flex items-center gap-2 shadow-md shadow-primary/20 shrink-0"
          >
            Go to Data Imports
          </Link>
        </div>
      )}

      {totalTx > 0 && matches.length === 0 && !loading && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Play size={18} />
          </div>
          <div className="flex-1">
            <h3 className="font-headline font-bold text-blue-950">
              Ready to run — {totalTx} transactions loaded
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Nothing has been matched yet. Click <span className="font-semibold text-primary">Match &amp; Analyze Risk</span>{' '}
              above to run the greedy matching algorithm and apply all six forensic risk rules.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard title="Matched" value={matches.length} icon={CheckCircle2} color="green" />
        <StatCard title="Unmatched Bank" value={unmatchedBank.length} icon={XCircle} color="red" />
        <StatCard title="Unmatched GL" value={unmatchedGL.length} icon={XCircle} color="amber" />
        <StatCard
          title="Match Rate"
          value={`${matchRate.toFixed(1)}%`}
          icon={ArrowLeftRight}
          color="blue"
        />
      </div>

      {/* Matched Items */}
      {matches.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <h3 className="font-bold text-slate-800 font-headline">
            Matched Items ({matches.length})
          </h3>
          <DataTable
            columns={matchColumns}
            data={enrichedMatches}
            keyExtractor={(r) => r.id}
            maxHeight="300px"
          />
        </motion.div>
      )}

      {/* Reconciliation Balance Statement */}
      {reconcilingItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-blue-200 p-6"
        >
          <h3 className="font-bold text-slate-800 font-headline mb-4 flex items-center gap-2">
            <Scale size={18} className="text-blue-600" />
            Reconciliation Balance Statement
          </h3>
          {(() => {
            const bankBalance = bankTransactions.reduce(
              (s, t) => s + (t.type === 'deposit' ? t.amount : -t.amount),
              0
            );
            const glBalance = glTransactions.reduce(
              (s, t) => s + (t.type === 'deposit' ? t.amount : -t.amount),
              0
            );
            const { adjustedBankBalance, adjustedGLBalance, difference } =
              computeAdjustedBalances(bankBalance, glBalance, reconcilingItems);

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Bank Balance</p>
                  <p className="text-lg font-mono font-bold text-blue-900 mt-1">
                    ${bankBalance.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-500 mt-2">Adjusted:</p>
                  <p className="text-lg font-mono font-bold text-blue-900">
                    ${adjustedBankBalance.toLocaleString()}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">GL Balance</p>
                  <p className="text-lg font-mono font-bold text-emerald-900 mt-1">
                    ${glBalance.toLocaleString()}
                  </p>
                  <p className="text-xs text-emerald-500 mt-2">Adjusted:</p>
                  <p className="text-lg font-mono font-bold text-emerald-900">
                    ${adjustedGLBalance.toLocaleString()}
                  </p>
                </div>
                <div className={`rounded-lg p-4 ${difference === 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${difference === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    Difference
                  </p>
                  <p className={`text-2xl font-mono font-bold mt-1 ${difference === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    ${difference.toLocaleString()}
                  </p>
                  <p className={`text-xs mt-2 font-semibold ${difference === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {difference === 0 ? 'Reconciled' : 'Unreconciled — investigate'}
                  </p>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* Manual Matching */}
      {(unmatchedBank.length > 0 || unmatchedGL.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 font-headline">Manual Matching</h3>
            {selectedBank && selectedGL && (
              <button
                onClick={handleManualMatch}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-emerald-700"
              >
                <Link2 size={14} />
                Link Selected
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Select one bank transaction and one GL transaction, then click "Link Selected" to manually match them.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-600 mb-2">
                Unmatched Bank ({unmatchedBank.length})
                {selectedBank && (
                  <span className="ml-2 text-blue-600">Selected: {selectedBank.description}</span>
                )}
              </h4>
              <DataTable
                columns={txColumns}
                data={unmatchedBank}
                keyExtractor={(r) => r.id}
                onRowClick={setSelectedBank}
                selectedKey={selectedBank?.id}
                maxHeight="250px"
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-600 mb-2">
                Unmatched GL ({unmatchedGL.length})
                {selectedGL && (
                  <span className="ml-2 text-emerald-600">Selected: {selectedGL.description}</span>
                )}
              </h4>
              <DataTable
                columns={txColumns}
                data={unmatchedGL}
                keyExtractor={(r) => r.id}
                onRowClick={setSelectedGL}
                selectedKey={selectedGL?.id}
                maxHeight="250px"
              />
            </div>
          </div>
        </div>
      )}

      {matches.length > 0 && (
        <NextStepCTA
          label="Review flagged items"
          description="Open the Exception Report to review transactions flagged by the forensic risk rules."
          to="/exceptions"
          icon={FileWarning}
        />
      )}
    </div>
  );
}
