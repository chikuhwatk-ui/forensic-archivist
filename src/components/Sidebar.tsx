import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  CloudUpload,
  ArrowLeftRight,
  Microscope,
  Archive,
  FileWarning,
  Settings,
  Plus,
  FlaskConical,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { ConfirmDialog } from './ConfirmDialog';
import { useTransactionStore } from '../stores/transactionStore';
import { useReconciliationStore } from '../stores/reconciliationStore';
import { useRiskStore } from '../stores/riskStore';
import { useToastStore } from '../stores/toastStore';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/import', label: 'Data Imports', icon: CloudUpload },
  { to: '/matching', label: 'Matching Workspace', icon: ArrowLeftRight },
  { to: '/forensic', label: 'Forensic Toolbox', icon: Microscope },
  { to: '/exceptions', label: 'Exception Report', icon: FileWarning },
  { to: '/vault', label: 'Audit Vault', icon: Archive },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/sample', label: 'Sample Data', icon: FlaskConical },
];

export function Sidebar() {
  const navigate = useNavigate();
  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const { bankTransactions, glTransactions, clearAll: clearTx } = useTransactionStore();
  const { clearAll: clearRecon } = useReconciliationStore();
  const { clearAll: clearRisk } = useRiskStore();
  const addToast = useToastStore((s) => s.addToast);
  const hasData = bankTransactions.length + glTransactions.length > 0;

  const handleNewReconciliation = async () => {
    await clearTx();
    await clearRecon();
    await clearRisk();
    setShowNewConfirm(false);
    addToast({ type: 'info', title: 'New reconciliation started', message: 'All previous data cleared.' });
    navigate('/import');
  };

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-100 flex flex-col z-50">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <Archive size={18} />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-blue-950 font-headline">
              Forensic Archivist
            </div>
            <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">
              Tendaishe Chitate
            </div>
          </div>
        </div>

        <button
          onClick={() => hasData ? setShowNewConfirm(true) : navigate('/import')}
          className="w-full bg-primary text-white py-3 rounded-xl font-headline font-bold text-sm mb-8 transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus size={16} />
          New Reconciliation
        </button>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 rounded-l-lg',
                  isActive
                    ? 'text-blue-900 font-bold bg-white border-r-4 border-blue-900'
                    : 'text-slate-500 hover:text-blue-800 hover:bg-slate-200/50'
                )
              }
            >
              <item.icon size={20} />
              <span className="text-sm font-sans">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-200">
        <div className="text-[11px] text-slate-400 leading-relaxed">
          Supports <span className="font-bold">ISA 315</span> risk identification &{' '}
          <span className="font-bold">ISA 240</span> fraud detection standards.
        </div>
      </div>

      <ConfirmDialog
        open={showNewConfirm}
        title="Start New Reconciliation?"
        message="This will clear all existing transactions, matches, and risk assessments. Make sure you have exported any reports you need."
        confirmLabel="Clear & Start New"
        variant="danger"
        onConfirm={handleNewReconciliation}
        onCancel={() => setShowNewConfirm(false)}
      />
    </aside>
  );
}
