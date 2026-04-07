import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, RotateCcw, Save, Sliders, FileText, ArrowLeftRight } from 'lucide-react';
import { useSettingsStore, AppSettings } from '../stores/settingsStore';
import { useToastStore } from '../stores/toastStore';

function SettingsSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 p-6"
    >
      <h3 className="font-bold text-slate-800 font-headline mb-5 flex items-center gap-2">
        <Icon size={18} className="text-blue-600" />
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
    </motion.div>
  );
}

function Field({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 block">{label}</label>
      <p className="text-xs text-slate-400 mb-2">{description}</p>
      {children}
    </div>
  );
}

export function Settings() {
  const { settings, updateSettings, resetDefaults } = useSettingsStore();
  const addToast = useToastStore((s) => s.addToast);
  const [draft, setDraft] = useState<AppSettings>({ ...settings });
  const [saved, setSaved] = useState(false);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings),
    [draft, settings]
  );

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSave = () => {
    updateSettings(draft);
    setSaved(true);
    addToast({ type: 'success', title: 'Settings saved', message: 'Your configuration has been applied.' });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetDefaults();
    const defaults: AppSettings = {
      agingThresholdDays: 30,
      largeAmountThreshold: 50000,
      yearEndMonths: [11, 0],
      duplicateWindowDays: 7,
      dateTolerance: 3,
      amountTolerance: 0.01,
      descriptionWeight: 0.3,
      minimumConfidence: 50,
      organizationName: '',
      auditorName: '',
      reportTitle: 'Forensic Bank Reconciliation Report',
    };
    setDraft(defaults);
    addToast({ type: 'info', title: 'Settings reset', message: 'All values restored to defaults.' });
  };

  const inputClass =
    'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40';

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold font-headline text-primary tracking-tight">
            Settings
          </h1>
          <p className="text-slate-500 mt-1">
            Configure risk thresholds, matching tolerances, and report preferences.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleReset}
            className="border border-slate-300 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw size={14} />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Save size={14} />
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </header>

      {/* Risk Detection Thresholds */}
      <SettingsSection title="Risk Detection Thresholds" icon={Sliders}>
        <Field label="Aging Threshold (days)" description="Transactions older than this are flagged">
          <input
            type="number"
            value={draft.agingThresholdDays}
            onChange={(e) => setDraft({ ...draft, agingThresholdDays: Number(e.target.value) })}
            className={inputClass}
            min={1}
          />
        </Field>
        <Field label="Large Amount Threshold ($)" description="Amounts above this trigger a flag">
          <input
            type="number"
            value={draft.largeAmountThreshold}
            onChange={(e) => setDraft({ ...draft, largeAmountThreshold: Number(e.target.value) })}
            className={inputClass}
            min={0}
            step={1000}
          />
        </Field>
        <Field label="Duplicate Window (days)" description="Window for detecting duplicate amounts">
          <input
            type="number"
            value={draft.duplicateWindowDays}
            onChange={(e) => setDraft({ ...draft, duplicateWindowDays: Number(e.target.value) })}
            className={inputClass}
            min={1}
          />
        </Field>
        <Field label="Year-End Months" description="Months considered near fiscal year-end (0=Jan, 11=Dec)">
          <input
            type="text"
            value={draft.yearEndMonths.join(', ')}
            onChange={(e) => {
              const months = e.target.value
                .split(',')
                .map((s) => parseInt(s.trim()))
                .filter((n) => !isNaN(n) && n >= 0 && n <= 11);
              setDraft({ ...draft, yearEndMonths: months });
            }}
            placeholder="11, 0"
            className={inputClass}
          />
        </Field>
      </SettingsSection>

      {/* Matching Tolerances */}
      <SettingsSection title="Matching Tolerances" icon={ArrowLeftRight}>
        <Field label="Date Tolerance (days)" description="Max days apart for bank/GL date matching">
          <input
            type="number"
            value={draft.dateTolerance}
            onChange={(e) => setDraft({ ...draft, dateTolerance: Number(e.target.value) })}
            className={inputClass}
            min={0}
          />
        </Field>
        <Field label="Amount Tolerance ($)" description="Max amount difference for matching">
          <input
            type="number"
            value={draft.amountTolerance}
            onChange={(e) => setDraft({ ...draft, amountTolerance: Number(e.target.value) })}
            className={inputClass}
            min={0}
            step={0.01}
          />
        </Field>
        <Field label="Description Weight" description="0-1 weight given to description similarity in matching">
          <input
            type="number"
            value={draft.descriptionWeight}
            onChange={(e) => setDraft({ ...draft, descriptionWeight: Number(e.target.value) })}
            className={inputClass}
            min={0}
            max={1}
            step={0.05}
          />
        </Field>
        <Field label="Minimum Confidence (%)" description="Matches below this are discarded">
          <input
            type="number"
            value={draft.minimumConfidence}
            onChange={(e) => setDraft({ ...draft, minimumConfidence: Number(e.target.value) })}
            className={inputClass}
            min={0}
            max={100}
          />
        </Field>
      </SettingsSection>

      {/* Report Settings */}
      <SettingsSection title="Report Preferences" icon={FileText}>
        <Field label="Organization Name" description="Appears on exported PDF reports">
          <input
            type="text"
            value={draft.organizationName}
            onChange={(e) => setDraft({ ...draft, organizationName: e.target.value })}
            placeholder="e.g., Audit Firm LLP"
            className={inputClass}
          />
        </Field>
        <Field label="Auditor Name" description="Preparer name on reports">
          <input
            type="text"
            value={draft.auditorName}
            onChange={(e) => setDraft({ ...draft, auditorName: e.target.value })}
            placeholder="e.g., J. Smith, Senior Auditor"
            className={inputClass}
          />
        </Field>
        <Field label="Report Title" description="Main title on exported PDF">
          <input
            type="text"
            value={draft.reportTitle}
            onChange={(e) => setDraft({ ...draft, reportTitle: e.target.value })}
            className={inputClass}
          />
        </Field>
      </SettingsSection>
    </div>
  );
}
