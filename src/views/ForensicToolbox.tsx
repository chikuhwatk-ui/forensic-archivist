import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Microscope,
  AlertTriangle,
  ShieldCheck,
  Play,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { RiskBadge } from '../components/RiskBadge';
import { DataTable, Column } from '../components/DataTable';
import { TransactionDetailModal } from '../components/TransactionDetailModal';
import { useTransactionStore } from '../stores/transactionStore';
import { useRiskStore } from '../stores/riskStore';
import { useToastStore } from '../stores/toastStore';
import { RiskAssessment, RiskLevel, Transaction } from '../types';

const RULE_LABELS: Record<string, string> = {
  aging: 'Aging (>30 days)',
  large_amount: 'Large/Unusual Amount',
  round_figure: 'Round Figure',
  year_end: 'Year-End Transaction',
  duplicate: 'Duplicate Amount',
  manual_journal: 'Manual Journal',
};

const BAR_COLORS: Record<string, string> = {
  aging: '#f59e0b',
  large_amount: '#dc2626',
  round_figure: '#8b5cf6',
  year_end: '#f97316',
  duplicate: '#ef4444',
  manual_journal: '#6366f1',
};

export function ForensicToolbox() {
  const { bankTransactions, glTransactions, loadAll: loadTx } = useTransactionStore();
  const { assessments, runRiskAnalysis, loading, loadAll: loadRisk } = useRiskStore();
  const addToast = useToastStore((s) => s.addToast);
  const [filterLevel, setFilterLevel] = useState<RiskLevel | 'all'>('all');
  const [selectedAssessment, setSelectedAssessment] = useState<(RiskAssessment & { date: string; desc: string; amount: string }) | null>(null);

  useEffect(() => {
    loadTx();
    loadRisk();
  }, []);

  const totalTx = bankTransactions.length + glTransactions.length;
  const txMap = useMemo(() => {
    const map = new Map<string, Transaction>();
    for (const t of [...bankTransactions, ...glTransactions]) map.set(t.id, t);
    return map;
  }, [bankTransactions, glTransactions]);

  const riskCounts = useMemo(() => {
    let high = 0, medium = 0, low = 0;
    for (const a of assessments) {
      if (a.overallRisk === 'high') high++;
      else if (a.overallRisk === 'medium') medium++;
      else low++;
    }
    return { high, medium, low };
  }, [assessments]);

  // Flag distribution
  const flagCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of assessments) {
      for (const f of a.flags) {
        map[f.rule] = (map[f.rule] || 0) + 1;
      }
    }
    return Object.entries(map)
      .map(([rule, count]) => ({
        rule,
        label: RULE_LABELS[rule] || rule,
        count,
        color: BAR_COLORS[rule] || '#64748b',
      }))
      .sort((a, b) => b.count - a.count);
  }, [assessments]);

  const filtered = useMemo(() => {
    if (filterLevel === 'all') return assessments;
    return assessments.filter((a) => a.overallRisk === filterLevel);
  }, [assessments, filterLevel]);

  const columns: Column<RiskAssessment & { date: string; desc: string; amount: string }>[] = [
    { key: 'date', header: 'Date', sortable: true },
    { key: 'desc', header: 'Description', sortable: true },
    { key: 'amount', header: 'Amount', sortable: true },
    {
      key: 'overallRisk',
      header: 'Risk Level',
      sortable: true,
      render: (row) => <RiskBadge level={row.overallRisk} score={row.score} />,
    },
    {
      key: 'flags',
      header: 'Flags',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.flags.map((f, i) => (
            <span
              key={i}
              className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium"
              title={f.description}
            >
              {RULE_LABELS[f.rule] || f.rule}
            </span>
          ))}
        </div>
      ),
      className: 'max-w-xs',
    },
  ];

  const enrichedData = useMemo(
    () =>
      filtered.map((a) => {
        const tx = txMap.get(a.transactionId);
        return {
          ...a,
          date: tx?.date || '',
          desc: tx?.description || '',
          amount: tx ? `$${tx.amount.toLocaleString()}` : '',
        };
      }),
    [filtered, txMap]
  );

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold font-headline text-primary tracking-tight">
            Forensic Toolbox
          </h1>
          <p className="text-slate-500 mt-1">
            Automated risk detection and scoring — ISA 240 fraud indicators.
          </p>
        </div>
        <button
          onClick={async () => {
            await runRiskAnalysis();
            const a = useRiskStore.getState().assessments;
            const high = a.filter((x) => x.overallRisk === 'high').length;
            const med = a.filter((x) => x.overallRisk === 'medium').length;
            addToast({
              type: high > 0 ? 'warning' : 'success',
              title: 'Risk analysis complete',
              message: `Found ${high} high-risk and ${med} medium-risk items across ${a.length} transactions.`,
            });
          }}
          disabled={loading || totalTx === 0}
          className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="animate-spin">⟳</span>
          ) : (
            <Microscope size={16} />
          )}
          Run Risk Analysis
        </button>
      </header>

      {/* Risk Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard title="High Risk" value={riskCounts.high} icon={AlertTriangle} color="red" />
        <StatCard title="Medium Risk" value={riskCounts.medium} icon={AlertTriangle} color="amber" />
        <StatCard title="Low Risk" value={riskCounts.low} icon={ShieldCheck} color="green" />
      </div>

      {/* Flag Distribution Chart */}
      {flagCounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <h3 className="font-bold text-slate-800 font-headline mb-4">
            Risk Flag Distribution
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={flagCounts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {flagCounts.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Risk Items Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 font-headline">
            Flagged Transactions ({filtered.length})
          </h3>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as RiskLevel | 'all')}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Levels</option>
              <option value="high">High Only</option>
              <option value="medium">Medium Only</option>
              <option value="low">Low Only</option>
            </select>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={enrichedData}
          keyExtractor={(r) => r.id}
          onRowClick={setSelectedAssessment}
          maxHeight="500px"
          emptyMessage="Run risk analysis to see flagged transactions"
        />
      </div>

      {/* Risk Rules Reference */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-50 border border-slate-200 rounded-xl p-6"
      >
        <h3 className="font-bold text-slate-800 font-headline mb-3">
          Forensic Risk Detection Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { rule: 'Aging', desc: 'Items older than 30 days', severity: 'medium' as RiskLevel },
            { rule: 'Large Amount', desc: 'Amounts exceeding $50,000', severity: 'medium' as RiskLevel },
            { rule: 'Round Figures', desc: 'Suspiciously round amounts (e.g., $10,000)', severity: 'low' as RiskLevel },
            { rule: 'Duplicates', desc: 'Repeated amounts within 7-day window', severity: 'high' as RiskLevel },
            { rule: 'Year-End', desc: 'Transactions near fiscal year boundaries', severity: 'medium' as RiskLevel },
            { rule: 'Manual Journal', desc: 'Adjustments, corrections, manual entries', severity: 'medium' as RiskLevel },
          ].map((item) => (
            <div key={item.rule} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100">
              <RiskBadge level={item.severity} />
              <div>
                <p className="text-sm font-semibold text-slate-700">{item.rule}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Transaction Detail Modal */}
      {selectedAssessment && (
        <TransactionDetailModal
          assessment={selectedAssessment}
          transaction={txMap.get(selectedAssessment.transactionId) || null}
          onClose={() => setSelectedAssessment(null)}
        />
      )}
    </div>
  );
}
