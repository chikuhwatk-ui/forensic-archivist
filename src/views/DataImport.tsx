import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { CloudUpload, Plus, Trash2, Database, FileText, ArrowLeftRight } from 'lucide-react';
import { FileUpload } from '../components/FileUpload';
import { DataTable, Column } from '../components/DataTable';
import { NextStepCTA } from '../components/NextStepCTA';
import { useTransactionStore } from '../stores/transactionStore';
import { useToastStore } from '../stores/toastStore';
import { parseExcelFile } from '../lib/excelParser';
import { Transaction } from '../types';

export function DataImport() {
  const { bankTransactions, glTransactions, addTransactions, addManualTransaction, clearBySource } =
    useTransactionStore();
  const addToast = useToastStore((s) => s.addToast);

  const [manualForm, setManualForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'deposit' as 'deposit' | 'payment',
    reference: '',
    source: 'bank' as 'bank' | 'gl',
  });
  const [importing, setImporting] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleFileUpload = useCallback(
    async (file: File, source: 'bank' | 'gl') => {
      setImporting(true);
      try {
        const buffer = await file.arrayBuffer();
        const transactions = parseExcelFile(buffer, source);
        if (transactions.length === 0) {
          addToast({ type: 'warning', title: 'No data found', message: 'The file appears to be empty or has unrecognized columns.' });
        } else {
          await addTransactions(transactions);
          addToast({
            type: 'success',
            title: `${transactions.length} transactions imported`,
            message: `${source === 'bank' ? 'Bank statement' : 'GL/Cashbook'} data loaded successfully.`,
          });
        }
      } catch (err) {
        console.error('Import error:', err);
        addToast({ type: 'error', title: 'Import failed', message: 'Could not parse the file. Check the format and try again.' });
      }
      setImporting(false);
    },
    [addTransactions, addToast]
  );

  const handleManualSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errors: Record<string, string> = {};
      if (!manualForm.description.trim()) errors.description = 'Required';
      if (!manualForm.amount || parseFloat(manualForm.amount) <= 0) errors.amount = 'Must be > 0';
      if (!manualForm.date) errors.date = 'Required';
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
      setFormErrors({});
      await addManualTransaction({
        date: manualForm.date,
        description: manualForm.description,
        amount: Math.abs(parseFloat(manualForm.amount)),
        type: manualForm.type,
        reference: manualForm.reference,
        source: manualForm.source,
      });
      addToast({ type: 'success', title: 'Transaction added', message: `${manualForm.type} of $${Math.abs(parseFloat(manualForm.amount)).toLocaleString()} added to ${manualForm.source.toUpperCase()}.` });
      setManualForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'deposit',
        reference: '',
        source: manualForm.source,
      });
    },
    [manualForm, addManualTransaction, addToast]
  );

  const columns: Column<Transaction>[] = [
    { key: 'date', header: 'Date', sortable: true },
    { key: 'description', header: 'Description', sortable: true },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-semibold">${row.amount.toLocaleString()}</span>
      ),
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
    { key: 'reference', header: 'Reference' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold font-headline text-primary tracking-tight">
          Data Imports
        </h1>
        <p className="text-slate-500 mt-1">
          Import bank statements and cashbook/GL data via Excel upload or manual entry.
        </p>
      </header>

      {/* Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 font-headline flex items-center gap-2">
              <Database size={18} className="text-blue-600" />
              Bank Statement
            </h3>
            {bankTransactions.length > 0 && (
              <button
                onClick={() => clearBySource('bank')}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>
          <FileUpload
            label="Upload Bank Statement"
            onFileSelected={(f) => handleFileUpload(f, 'bank')}
          />
          {bankTransactions.length > 0 && (
            <p className="text-xs text-emerald-600 font-semibold mt-3">
              {bankTransactions.length} transactions loaded
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 font-headline flex items-center gap-2">
              <FileText size={18} className="text-emerald-600" />
              Cashbook / General Ledger
            </h3>
            {glTransactions.length > 0 && (
              <button
                onClick={() => clearBySource('gl')}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>
          <FileUpload
            label="Upload Cashbook / GL Data"
            onFileSelected={(f) => handleFileUpload(f, 'gl')}
          />
          {glTransactions.length > 0 && (
            <p className="text-xs text-emerald-600 font-semibold mt-3">
              {glTransactions.length} transactions loaded
            </p>
          )}
        </motion.div>
      </div>

      {importing && (
        <div className="text-center py-4 text-blue-600 font-semibold text-sm animate-pulse">
          Processing file...
        </div>
      )}

      {/* Manual Entry */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-slate-200 p-6"
      >
        <button
          onClick={() => setShowManual(!showManual)}
          className="flex items-center gap-2 font-bold text-slate-800 font-headline"
        >
          <Plus size={18} className={`transition-transform ${showManual ? 'rotate-45' : ''}`} />
          Manual Entry
        </button>

        {showManual && (
          <form onSubmit={handleManualSubmit} className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Date <span className="text-red-400">*</span></label>
              <input
                type="date"
                value={manualForm.date}
                onChange={(e) => { setManualForm({ ...manualForm, date: e.target.value }); setFormErrors((p) => ({ ...p, date: '' })); }}
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 ${formErrors.date ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
              />
              {formErrors.date && <p className="text-[11px] text-red-500 mt-0.5">{formErrors.date}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Description <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={manualForm.description}
                onChange={(e) => { setManualForm({ ...manualForm, description: e.target.value }); setFormErrors((p) => ({ ...p, description: '' })); }}
                placeholder="Payment to..."
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 ${formErrors.description ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
              />
              {formErrors.description && <p className="text-[11px] text-red-500 mt-0.5">{formErrors.description}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Amount <span className="text-red-400">*</span></label>
              <input
                type="number"
                step="0.01"
                value={manualForm.amount}
                onChange={(e) => { setManualForm({ ...manualForm, amount: e.target.value }); setFormErrors((p) => ({ ...p, amount: '' })); }}
                placeholder="0.00"
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 ${formErrors.amount ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
              />
              {formErrors.amount && <p className="text-[11px] text-red-500 mt-0.5">{formErrors.amount}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Reference</label>
              <input
                type="text"
                value={manualForm.reference}
                onChange={(e) => setManualForm({ ...manualForm, reference: e.target.value })}
                placeholder="CHQ001, EFT..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Type</label>
              <select
                value={manualForm.type}
                onChange={(e) => setManualForm({ ...manualForm, type: e.target.value as 'deposit' | 'payment' })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="deposit">Deposit</option>
                <option value="payment">Payment</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Source</label>
              <select
                value={manualForm.source}
                onChange={(e) => setManualForm({ ...manualForm, source: e.target.value as 'bank' | 'gl' })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="bank">Bank</option>
                <option value="gl">General Ledger</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-primary text-white py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors"
              >
                Add
              </button>
            </div>
          </form>
        )}
      </motion.div>

      {/* Data Tables */}
      {bankTransactions.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-800 font-headline mb-3">
            Bank Transactions ({bankTransactions.length})
          </h3>
          <DataTable
            columns={columns}
            data={bankTransactions}
            keyExtractor={(r) => r.id}
          />
        </div>
      )}

      {glTransactions.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-800 font-headline mb-3">
            GL Transactions ({glTransactions.length})
          </h3>
          <DataTable
            columns={columns}
            data={glTransactions}
            keyExtractor={(r) => r.id}
          />
        </div>
      )}

      {(bankTransactions.length > 0 || glTransactions.length > 0) && (
        <NextStepCTA
          label="Match & analyze risk"
          description={
            bankTransactions.length > 0 && glTransactions.length > 0
              ? 'Both ledgers loaded. Go to Matching Workspace and run matching + forensic risk analysis.'
              : 'Upload the remaining ledger, then continue to Matching Workspace.'
          }
          to="/matching"
          icon={ArrowLeftRight}
          disabled={bankTransactions.length === 0 || glTransactions.length === 0}
          disabledHint={
            bankTransactions.length === 0
              ? 'Upload a bank statement to continue.'
              : 'Upload a cashbook/GL file to continue.'
          }
        />
      )}
    </div>
  );
}
