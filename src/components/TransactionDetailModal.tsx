import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Calendar, DollarSign, Tag, FileText, Hash, Save } from 'lucide-react';
import { RiskBadge } from './RiskBadge';
import { RiskAssessment, Transaction, RiskLevel } from '../types';
import { db } from '../lib/db';
import { useToastStore } from '../stores/toastStore';

const RULE_LABELS: Record<string, string> = {
  aging: 'Aging (>30 days)',
  large_amount: 'Large/Unusual Amount',
  round_figure: 'Round Figure',
  year_end: 'Year-End Transaction',
  duplicate: 'Duplicate Amount',
  manual_journal: 'Manual Journal',
};

const SEVERITY_COLORS: Record<RiskLevel, string> = {
  high: 'border-red-200 bg-red-50',
  medium: 'border-amber-200 bg-amber-50',
  low: 'border-emerald-200 bg-emerald-50',
};

interface Props {
  assessment: RiskAssessment | null;
  transaction: Transaction | null;
  onClose: () => void;
}

export function TransactionDetailModal({ assessment, transaction, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [note, setNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  // Load existing note
  useEffect(() => {
    if (transaction) {
      db.investigationNotes.get(transaction.id).then((existing) => {
        setNote(existing?.note || '');
        setNoteSaved(false);
      });
    }
  }, [transaction]);

  const handleSaveNote = useCallback(async () => {
    if (!transaction) return;
    await db.investigationNotes.put({
      transactionId: transaction.id,
      note,
      updatedAt: new Date().toISOString(),
    });
    setNoteSaved(true);
    addToast({ type: 'success', title: 'Note saved', message: 'Investigation note persisted.' });
    setTimeout(() => setNoteSaved(false), 2000);
  }, [transaction, note, addToast]);

  useEffect(() => {
    if (assessment && transaction) {
      closeRef.current?.focus();
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [assessment, transaction, onClose]);

  if (!assessment || !transaction) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <div>
              <h2 id="modal-title" className="text-lg font-bold font-headline text-slate-800">Transaction Detail</h2>
              <p className="text-xs text-slate-400">Forensic risk assessment</p>
            </div>
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close transaction detail"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors focus:ring-2 focus:ring-primary/40 focus:outline-none"
            >
              <X size={18} className="text-slate-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Risk Score */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Risk</p>
                <div className="mt-1">
                  <RiskBadge level={assessment.overallRisk} score={assessment.score} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Score</p>
                <p className={`text-3xl font-extrabold font-headline mt-1 ${
                  assessment.overallRisk === 'high' ? 'text-red-600' :
                  assessment.overallRisk === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {assessment.score}
                  <span className="text-sm text-slate-400 font-normal">/100</span>
                </p>
              </div>
            </div>

            {/* Transaction Details */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3">Transaction Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <Calendar size={16} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Date</p>
                    <p className="text-sm font-semibold text-slate-700">{transaction.date}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <DollarSign size={16} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Amount</p>
                    <p className="text-sm font-mono font-bold text-slate-700">
                      ${transaction.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <FileText size={16} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Description</p>
                    <p className="text-sm font-semibold text-slate-700">{transaction.description}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <Tag size={16} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Type / Source</p>
                    <p className="text-sm font-semibold text-slate-700 capitalize">
                      {transaction.type} — {transaction.source.toUpperCase()}
                    </p>
                  </div>
                </div>
                {transaction.reference && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg col-span-2">
                    <Hash size={16} className="text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400">Reference</p>
                      <p className="text-sm font-semibold text-slate-700">{transaction.reference}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Risk Flags */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3">
                Risk Flags ({assessment.flags.length})
              </h3>
              {assessment.flags.length === 0 ? (
                <p className="text-sm text-slate-400">No risk flags detected.</p>
              ) : (
                <div className="space-y-3">
                  {assessment.flags.map((flag, i) => (
                    <div
                      key={i}
                      className={`border rounded-lg p-4 ${SEVERITY_COLORS[flag.severity]}`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          size={16}
                          className={`mt-0.5 shrink-0 ${
                            flag.severity === 'high' ? 'text-red-500' :
                            flag.severity === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-slate-700">
                              {RULE_LABELS[flag.rule] || flag.rule}
                            </span>
                            <RiskBadge level={flag.severity} />
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {flag.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Investigation Notes */}
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-700">Investigation Notes</h3>
                  <p className="text-xs text-slate-400">
                    Document your findings for the audit trail.
                  </p>
                </div>
                <button
                  onClick={handleSaveNote}
                  className="text-xs font-bold text-primary bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-primary/40 focus:outline-none"
                >
                  <Save size={12} />
                  {noteSaved ? 'Saved!' : 'Save Note'}
                </button>
              </div>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter investigation notes here..."
                aria-label="Investigation notes"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-vertical"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
