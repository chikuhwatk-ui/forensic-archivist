import { ReactNode, useMemo } from 'react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import {
  FlaskConical,
  Download,
  Landmark,
  BookOpen,
  Info,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { useToastStore } from '../stores/toastStore';

interface SampleRow {
  Date: string;
  Description: string;
  Amount: number;
  Type: 'deposit' | 'payment';
  Reference: string;
}

const BANK_ROWS: SampleRow[] = [
  { Date: '2026-01-15', Description: 'Opening Balance Journal Adjustment',              Amount: 12500.00, Type: 'deposit', Reference: 'JE-2025-YE-001' },
  { Date: '2026-02-03', Description: 'Electricity Payment ZESA February',                Amount:   845.20, Type: 'payment', Reference: 'CHQ-10432' },
  { Date: '2026-03-02', Description: 'Customer Receipt INV-4452 Mazoe Gardens',          Amount:  8750.00, Type: 'deposit', Reference: 'DEP-0302A' },
  { Date: '2026-03-03', Description: 'POS Purchase Office Depot Stationery',             Amount:   267.85, Type: 'payment', Reference: 'POS-030314' },
  { Date: '2026-03-04', Description: 'EFT Credit Harare Wholesalers Ltd',                Amount: 15320.75, Type: 'deposit', Reference: 'EFT-HW-0304' },
  { Date: '2026-03-05', Description: 'Bank Charge Monthly Account Fee',                  Amount:    45.00, Type: 'payment', Reference: 'BC-MAR-01' },
  { Date: '2026-03-06', Description: 'Salaries EFT Batch March Payroll',                 Amount: 32450.00, Type: 'payment', Reference: 'PAY-MAR-01' },
  { Date: '2026-03-09', Description: 'Customer Deposit Mawere Enterprises',              Amount:  4200.00, Type: 'deposit', Reference: 'DEP-0309' },
  { Date: '2026-03-10', Description: 'Rent Payment Chiremba Properties',                 Amount:  3800.00, Type: 'payment', Reference: 'CHQ-10440' },
  { Date: '2026-03-11', Description: 'Interest Credit',                                  Amount:   127.44, Type: 'deposit', Reference: 'INT-MAR' },
  { Date: '2026-03-12', Description: 'Supplier Payment Delta Beverages',                 Amount:  6785.30, Type: 'payment', Reference: 'CHQ-10441' },
  { Date: '2026-03-13', Description: 'Cash Sales Deposit Week 10',                       Amount:  9150.00, Type: 'deposit', Reference: 'DEP-CS-10' },
  { Date: '2026-03-16', Description: 'Insurance Premium Old Mutual',                     Amount:  1250.00, Type: 'payment', Reference: 'DO-OM-03' },
  { Date: '2026-03-17', Description: 'EFT Credit Mashonaland Holdings',                  Amount: 27800.00, Type: 'deposit', Reference: 'EFT-MH-0317' },
  { Date: '2026-03-18', Description: 'POS Fuel Puma Energy Borrowdale',                  Amount:   380.50, Type: 'payment', Reference: 'POS-031801' },
  { Date: '2026-03-19', Description: 'Supplier Payment Innscor Africa',                  Amount: 12400.00, Type: 'payment', Reference: 'CHQ-10443' },
  { Date: '2026-03-20', Description: 'Returned Cheque CHQ-10438 Reversal',               Amount:  2100.00, Type: 'payment', Reference: 'RTN-10438' },
  { Date: '2026-03-23', Description: 'Wire Transfer In UK Export Client',                Amount: 55000.00, Type: 'deposit', Reference: 'WT-UK-0323' },
  { Date: '2026-03-24', Description: 'Supplier Payment Econet Wireless',                 Amount:   890.00, Type: 'payment', Reference: 'DO-ECO-03' },
  { Date: '2026-03-25', Description: 'Cash Deposit Branch Remittance',                   Amount:  6540.00, Type: 'deposit', Reference: 'DEP-BR-25' },
  { Date: '2026-03-26', Description: 'Service Fee FX Transaction Charge',                Amount:    78.50, Type: 'payment', Reference: 'BC-FX-0326' },
  { Date: '2026-03-27', Description: 'EFT Out Zimplow Media Agency',                     Amount:  4500.00, Type: 'payment', Reference: 'EFT-MKT-0327' },
  { Date: '2026-03-30', Description: 'Supplier Payment Makoni Packaging',                Amount:  1800.00, Type: 'payment', Reference: 'CHQ-10446' },
  { Date: '2026-03-30', Description: 'Supplier Payment Makoni Packaging',                Amount:  1800.00, Type: 'payment', Reference: 'CHQ-10447' },
  { Date: '2026-03-31', Description: 'Bank Service Fee Month End',                       Amount:    35.00, Type: 'payment', Reference: 'BC-EOM-25' },
];

const GL_ROWS: SampleRow[] = [
  { Date: '2026-02-03', Description: 'Electricity Expense ZESA Feb',                     Amount:   845.20, Type: 'payment', Reference: 'GL-EXP-2039' },
  { Date: '2026-03-02', Description: 'Sales Invoice INV-4452 Mazoe Gardens',             Amount:  8750.00, Type: 'deposit', Reference: 'GL-REV-3301' },
  { Date: '2026-03-03', Description: 'Stationery Expense Office Depot',                  Amount:   267.85, Type: 'payment', Reference: 'GL-EXP-3302' },
  { Date: '2026-03-04', Description: 'Sales Receipt Harare Wholesalers Ltd',             Amount: 15320.75, Type: 'deposit', Reference: 'GL-REV-3303' },
  { Date: '2026-03-06', Description: 'March Payroll Salaries',                           Amount: 32450.00, Type: 'payment', Reference: 'GL-PAY-3304' },
  { Date: '2026-03-09', Description: 'Receipt Mawere Enterprises',                       Amount:  4200.00, Type: 'deposit', Reference: 'GL-REV-3305' },
  { Date: '2026-03-10', Description: 'Rent Expense Chiremba Properties March',           Amount:  3800.00, Type: 'payment', Reference: 'GL-EXP-3306' },
  { Date: '2026-03-12', Description: 'Accounts Payable Delta Beverages INV-D8827',       Amount:  6785.30, Type: 'payment', Reference: 'GL-AP-3307' },
  { Date: '2026-03-13', Description: 'Cash Sales Deposit Wk10',                          Amount:  9150.00, Type: 'deposit', Reference: 'GL-REV-3308' },
  { Date: '2026-03-15', Description: 'Journal Entry Depreciation March',                 Amount:  4200.00, Type: 'payment', Reference: 'JE-DEP-MAR-2026' },
  { Date: '2026-03-16', Description: 'Insurance Expense Old Mutual Premium',             Amount:  1250.00, Type: 'payment', Reference: 'GL-EXP-3310' },
  { Date: '2026-03-17', Description: 'Receipt Mashonaland Holdings INV-4471',            Amount: 27800.00, Type: 'deposit', Reference: 'GL-REV-3311' },
  { Date: '2026-03-18', Description: 'Motor Vehicle Fuel Puma Borrowdale',               Amount:   380.50, Type: 'payment', Reference: 'GL-EXP-3312' },
  { Date: '2026-03-19', Description: 'Accounts Payable Innscor Africa Ltd',              Amount: 12400.00, Type: 'payment', Reference: 'GL-AP-3313' },
  { Date: '2026-03-21', Description: "Director's Loan Repayment A Chitate",              Amount:150000.00, Type: 'payment', Reference: 'DL-REP-001' },
  { Date: '2026-03-23', Description: 'Export Receipt UK Client Contract 2026-Q1',        Amount: 55000.00, Type: 'deposit', Reference: 'GL-REV-3315' },
  { Date: '2026-03-24', Description: 'Telephone Expense Econet Wireless',                Amount:   890.00, Type: 'payment', Reference: 'GL-EXP-3316' },
  { Date: '2026-03-25', Description: 'Branch Remittance Harare Wk12',                    Amount:  6540.00, Type: 'deposit', Reference: 'GL-REV-3317' },
  { Date: '2026-03-27', Description: 'Marketing Expense Zimplow Media',                  Amount:  4500.00, Type: 'payment', Reference: 'GL-EXP-3319' },
  { Date: '2026-03-28', Description: 'Manual Adjustment Inventory Write-Off',            Amount: 15750.00, Type: 'payment', Reference: 'JE-2026-MAR-12' },
  { Date: '2026-03-29', Description: 'Cash Sales Wk13 Deposit in Transit',               Amount:  7320.00, Type: 'deposit', Reference: 'GL-REV-3321' },
  { Date: '2026-03-30', Description: 'Supplier Makoni Packaging INV-A',                  Amount:  1800.00, Type: 'payment', Reference: 'CHQ-10446' },
  { Date: '2026-03-30', Description: 'Supplier Makoni Packaging INV-B',                  Amount:  1800.00, Type: 'payment', Reference: 'CHQ-10447' },
  { Date: '2026-03-31', Description: 'Cheque Issued Audit Fees KPMG',                    Amount:  8500.00, Type: 'payment', Reference: 'CHQ-10449' },
  { Date: '2026-03-31', Description: 'Cheque Issued Supplier Makoni',                    Amount:  2450.00, Type: 'payment', Reference: 'CHQ-10448' },
];

function downloadXlsx(rows: SampleRow[], sheetName: string, fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 48 },
    { wch: 12 },
    { wch: 10 },
    { wch: 20 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const columns: Column<SampleRow>[] = [
  { key: 'Date', header: 'Date', className: 'w-28' },
  { key: 'Description', header: 'Description' },
  {
    key: 'Amount',
    header: 'Amount',
    className: 'text-right w-32 tabular-nums',
    render: (r) =>
      r.Amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
  },
  {
    key: 'Type',
    header: 'Type',
    className: 'w-24',
    render: (r) => (
      <span
        className={
          r.Type === 'deposit'
            ? 'text-emerald-700 font-semibold capitalize'
            : 'text-rose-700 font-semibold capitalize'
        }
      >
        {r.Type}
      </span>
    ),
  },
  { key: 'Reference', header: 'Reference', className: 'w-36 font-mono text-xs' },
];

export function SampleData() {
  const addToast = useToastStore((s) => s.addToast);

  const bankTotals = useMemo(() => {
    const deposits = BANK_ROWS.filter((r) => r.Type === 'deposit').reduce((s, r) => s + r.Amount, 0);
    const payments = BANK_ROWS.filter((r) => r.Type === 'payment').reduce((s, r) => s + r.Amount, 0);
    return { deposits, payments, net: deposits - payments };
  }, []);

  const glTotals = useMemo(() => {
    const deposits = GL_ROWS.filter((r) => r.Type === 'deposit').reduce((s, r) => s + r.Amount, 0);
    const payments = GL_ROWS.filter((r) => r.Type === 'payment').reduce((s, r) => s + r.Amount, 0);
    return { deposits, payments, net: deposits - payments };
  }, []);

  const handleDownloadBank = () => {
    downloadXlsx(BANK_ROWS, 'Bank Statement', 'Bank_Statement_March2026.xlsx');
    addToast({
      type: 'success',
      title: 'Bank statement downloaded',
      message: `${BANK_ROWS.length} transactions saved to Bank_Statement_March2026.xlsx`,
    });
  };

  const handleDownloadGL = () => {
    downloadXlsx(GL_ROWS, 'Cashbook', 'Cashbook_GL_March2026.xlsx');
    addToast({
      type: 'success',
      title: 'Cashbook downloaded',
      message: `${GL_ROWS.length} transactions saved to Cashbook_GL_March2026.xlsx`,
    });
  };

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <header className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-[0.2em] font-bold">
            <FlaskConical size={14} /> Demo Toolkit
          </div>
          <h1 className="font-headline font-bold text-3xl text-blue-950 mt-1">
            Sample Data
          </h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            Download a matched pair of realistic statements for{' '}
            <span className="font-semibold">Zambezi Trading (Pvt) Ltd</span>, period
            ending 31 March 2026. Import both files via{' '}
            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
              /import
            </span>{' '}
            to exercise matching, reconciliation, and forensic risk detection.
          </p>
        </div>
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 flex gap-3">
        <Info size={18} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900 leading-relaxed">
          <div className="font-semibold mb-1">Demo-only dataset</div>
          This dataset is designed to trigger every downstream feature: exact and fuzzy
          matches, deposits in transit, outstanding payments, bank charges, direct
          deposits, plus aging, large-amount, round-figure, duplicate, year-end, and
          manual-journal risk flags. All names and references are fictional.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DatasetCard
          title="Bank Statement"
          subtitle="First Capital Bank — Gold Business Account"
          icon={<Landmark size={20} />}
          accent="bg-blue-900 text-white"
          rowCount={BANK_ROWS.length}
          deposits={fmt(bankTotals.deposits)}
          payments={fmt(bankTotals.payments)}
          rows={BANK_ROWS}
          fileName="Bank_Statement_March2026.xlsx"
          onDownload={handleDownloadBank}
        />
        <DatasetCard
          title="Cashbook / General Ledger"
          subtitle="Zambezi Trading (Pvt) Ltd — Cash & Bank Ledger"
          icon={<BookOpen size={20} />}
          accent="bg-emerald-800 text-white"
          rowCount={GL_ROWS.length}
          deposits={fmt(glTotals.deposits)}
          payments={fmt(glTotals.payments)}
          rows={GL_ROWS}
          fileName="Cashbook_GL_March2026.xlsx"
          onDownload={handleDownloadGL}
        />
      </div>
    </motion.div>
  );
}

interface DatasetCardProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  accent: string;
  rowCount: number;
  deposits: string;
  payments: string;
  rows: SampleRow[];
  fileName: string;
  onDownload: () => void;
}

function DatasetCard({
  title,
  subtitle,
  icon,
  accent,
  rowCount,
  deposits,
  payments,
  rows,
  fileName,
  onDownload,
}: DatasetCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
              {icon}
            </div>
            <div>
              <h2 className="font-headline font-bold text-lg text-blue-950 leading-tight">
                {title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onDownload}
            className="bg-primary text-white px-4 py-2 rounded-lg font-headline font-bold text-sm transition-transform active:scale-95 flex items-center gap-2 shadow-md shadow-primary/20 shrink-0"
          >
            <Download size={15} />
            Download .xlsx
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <Stat label="Rows" value={String(rowCount)} />
          <Stat label="Deposits" value={deposits} tone="emerald" />
          <Stat label="Payments" value={payments} tone="rose" />
        </div>

        <div className="mt-3 text-[11px] text-slate-500 font-mono truncate">
          {fileName}
        </div>
      </div>

      <div className="p-3">
        <DataTable
          columns={columns}
          data={rows}
          keyExtractor={(r) => `${r.Date}-${r.Reference}-${r.Description}`}
          maxHeight="420px"
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'emerald' | 'rose';
}) {
  const toneClass =
    tone === 'emerald'
      ? 'text-emerald-700'
      : tone === 'rose'
      ? 'text-rose-700'
      : 'text-blue-950';
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
        {label}
      </div>
      <div className={`text-sm font-semibold tabular-nums ${toneClass} mt-0.5`}>
        {value}
      </div>
    </div>
  );
}
