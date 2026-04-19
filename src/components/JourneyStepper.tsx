import { Link, useLocation } from 'react-router-dom';
import { Check, CloudUpload, ArrowLeftRight, FileWarning, Archive } from 'lucide-react';
import { cn } from '../lib/cn';
import { useTransactionStore } from '../stores/transactionStore';
import { useReconciliationStore } from '../stores/reconciliationStore';

type StepStatus = 'done' | 'current' | 'pending';

interface Step {
  index: number;
  label: string;
  hint: string;
  to: string;
  icon: typeof CloudUpload;
}

const STEPS: Step[] = [
  { index: 1, label: 'Import',  hint: 'Upload bank & GL',       to: '/import',     icon: CloudUpload },
  { index: 2, label: 'Match',   hint: 'Auto-match & risk',      to: '/matching',   icon: ArrowLeftRight },
  { index: 3, label: 'Review',  hint: 'Inspect exceptions',     to: '/exceptions', icon: FileWarning },
  { index: 4, label: 'Export',  hint: 'Download audit report',  to: '/vault',      icon: Archive },
];

export const WORKFLOW_ROUTES = STEPS.map((s) => s.to);

export function JourneyStepper() {
  const location = useLocation();
  const { bankTransactions, glTransactions } = useTransactionStore();
  const { matches } = useReconciliationStore();

  const importDone = bankTransactions.length > 0 && glTransactions.length > 0;
  const matchDone = matches.length > 0;

  const stepDone: Record<number, boolean> = {
    1: importDone,
    2: matchDone,
    3: matchDone,
    4: matchDone,
  };

  const statusOf = (step: Step): StepStatus => {
    if (location.pathname === step.to) return 'current';
    return stepDone[step.index] ? 'done' : 'pending';
  };

  return (
    <nav
      aria-label="Reconciliation workflow"
      className="mb-6 bg-white border border-slate-200 rounded-xl px-4 py-3"
    >
      <ol className="flex items-center gap-0 overflow-x-auto">
        {STEPS.map((step, i) => {
          const status = statusOf(step);
          const isLast = i === STEPS.length - 1;
          const nextDone = !isLast && stepDone[step.index];

          return (
            <li key={step.to} className="flex items-center flex-1 min-w-0">
              <Link
                to={step.to}
                className={cn(
                  'group flex items-center gap-3 min-w-0 px-2 py-1.5 rounded-lg transition-colors',
                  status === 'current'
                    ? 'bg-primary/5'
                    : 'hover:bg-slate-50'
                )}
                aria-current={status === 'current' ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                    status === 'done' && 'bg-emerald-600 text-white',
                    status === 'current' && 'bg-primary text-white ring-4 ring-primary/15',
                    status === 'pending' && 'bg-slate-100 text-slate-400 border border-slate-200'
                  )}
                  aria-hidden="true"
                >
                  {status === 'done' ? <Check size={14} strokeWidth={3} /> : step.index}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block text-sm font-headline font-bold leading-tight truncate',
                      status === 'current' && 'text-primary',
                      status === 'done' && 'text-slate-800',
                      status === 'pending' && 'text-slate-400'
                    )}
                  >
                    {step.label}
                  </span>
                  <span
                    className={cn(
                      'block text-[10px] uppercase tracking-wider font-semibold truncate',
                      status === 'current' && 'text-primary/70',
                      status === 'done' && 'text-slate-500',
                      status === 'pending' && 'text-slate-400'
                    )}
                  >
                    Step {step.index} · {step.hint}
                  </span>
                </span>
              </Link>

              {!isLast && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex-1 h-0.5 mx-2 rounded-full transition-colors',
                    nextDone ? 'bg-emerald-500' : 'bg-slate-200'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
