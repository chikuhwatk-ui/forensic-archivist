import { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Database,
  ArrowLeftRight,
  Microscope,
  ShieldCheck,
  Flag,
  CloudUpload,
  FileWarning,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { RiskBadge } from '../components/RiskBadge';
import { useTransactionStore } from '../stores/transactionStore';
import { useReconciliationStore } from '../stores/reconciliationStore';
import { useRiskStore } from '../stores/riskStore';

const PIE_COLORS = ['#059669', '#f59e0b', '#dc2626'];

export function Dashboard() {
  const { bankTransactions, glTransactions, loadAll: loadTx } = useTransactionStore();
  const { matches, reconcilingItems, loadAll: loadRecon } = useReconciliationStore();
  const { assessments, loadAll: loadRisk } = useRiskStore();

  useEffect(() => {
    loadTx();
    loadRecon();
    loadRisk();
  }, []);

  const totalTx = bankTransactions.length + glTransactions.length;
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

  const riskPieData = [
    { name: 'Low', value: riskCounts.low },
    { name: 'Medium', value: riskCounts.medium },
    { name: 'High', value: riskCounts.high },
  ];

  // Reconciling items by type for bar chart
  const reconByType = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of reconcilingItems) {
      const label = item.type.replace(/_/g, ' ');
      map[label] = (map[label] || 0) + 1;
    }
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [reconcilingItems]);

  const hasData = totalTx > 0;

  const matchedVsUnmatched = useMemo(() => {
    const unmatchedBank = bankTransactions.length - matches.length;
    const unmatchedGL = glTransactions.length - matches.length;
    return [
      { name: 'Matched', bank: matches.length, gl: matches.length },
      { name: 'Unmatched', bank: Math.max(0, unmatchedBank), gl: Math.max(0, unmatchedGL) },
    ];
  }, [matches, bankTransactions, glTransactions]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold font-headline text-primary tracking-tight">
          Executive Forensic Summary
        </h1>
        <p className="text-slate-500 mt-1">
          Real-time matching velocity and integrity health across ledgers.
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Transactions"
          value={totalTx}
          subtitle={`${bankTransactions.length} bank · ${glTransactions.length} GL`}
          icon={Database}
          color="blue"
        />
        <StatCard
          title="Match Rate"
          value={`${matchRate.toFixed(1)}%`}
          subtitle={`${matches.length} matched pairs`}
          icon={ArrowLeftRight}
          color="green"
        />
        <StatCard
          title="Reconciling Items"
          value={reconcilingItems.length}
          subtitle={`$${reconValue.toLocaleString()} total value`}
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="High-Risk Flags"
          value={riskCounts.high}
          subtitle={`${riskCounts.medium} medium · ${riskCounts.low} low`}
          icon={Flag}
          color="red"
        />
      </div>

      {!hasData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border border-slate-200 rounded-xl p-8"
        >
          <h3 className="font-bold text-slate-800 font-headline text-lg mb-6 text-center">Get Started in 5 Steps</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: 1, label: 'Import Data', desc: 'Upload bank statement & cashbook', icon: CloudUpload, to: '/import', active: true },
              { step: 2, label: 'Match Transactions', desc: 'Auto-match bank with GL', icon: ArrowLeftRight, to: '/matching', active: false },
              { step: 3, label: 'Review Reconciliation', desc: 'Classify reconciling items', icon: CheckCircle2, to: '/matching', active: false },
              { step: 4, label: 'Run Risk Analysis', desc: 'Detect forensic red flags', icon: Microscope, to: '/forensic', active: false },
              { step: 5, label: 'Export Reports', desc: 'Generate audit deliverables', icon: FileWarning, to: '/vault', active: false },
            ].map((item) => (
              <Link
                key={item.step}
                to={item.to}
                className={`relative flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all ${
                  item.active
                    ? 'border-primary bg-blue-50 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 opacity-60'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 ${
                  item.active ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {item.step}
                </div>
                <item.icon size={24} className={item.active ? 'text-primary mb-1' : 'text-slate-400 mb-1'} />
                <p className="text-sm font-bold text-slate-700">{item.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                {item.active && (
                  <div className="mt-2 text-primary flex items-center gap-1 text-xs font-bold">
                    Start here <ChevronRight size={12} />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {hasData && (
        <div className="space-y-6">
        {/* Matched vs Unmatched Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <h3 className="font-bold text-slate-800 font-headline mb-4">
            Matched vs Unmatched Transactions
          </h3>
          {matches.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={matchedVsUnmatched}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="bank" name="Bank" fill="#002045" radius={[6, 6, 0, 0]} />
                <Bar dataKey="gl" name="GL" fill="#059669" radius={[6, 6, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
              Run reconciliation to see matched vs unmatched breakdown
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reconciling Items by Type */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 p-6"
          >
            <h3 className="font-bold text-slate-800 font-headline mb-4">
              Reconciling Items by Type
            </h3>
            {reconByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={reconByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#002045" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Run reconciliation to see data
              </div>
            )}
          </motion.div>

          {/* Risk Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-slate-200 p-6"
          >
            <h3 className="font-bold text-slate-800 font-headline mb-4">
              Risk Distribution
            </h3>
            {assessments.length > 0 ? (
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie
                      data={riskPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {riskPieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <RiskBadge level="high" />
                    <span className="text-sm font-bold">{riskCounts.high}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <RiskBadge level="medium" />
                    <span className="text-sm font-bold">{riskCounts.medium}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <RiskBadge level="low" />
                    <span className="text-sm font-bold">{riskCounts.low}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Run risk analysis to see distribution
              </div>
            )}
          </motion.div>
        </div>
        </div>
      )}

      {/* ISA Compliance Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-4">
        <ShieldCheck size={24} className="text-primary mt-0.5 shrink-0" />
        <div>
          <h4 className="font-bold text-slate-800 text-sm">ISA Compliance</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            This system supports <strong>ISA 315</strong> by identifying high-risk areas within bank
            reconciliations and aligns with <strong>ISA 240</strong> by enhancing the detection of
            potential fraud through automated risk indicators.
          </p>
        </div>
      </div>
    </div>
  );
}
