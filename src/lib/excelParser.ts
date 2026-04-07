import * as XLSX from 'xlsx';
import { Transaction } from '../types';
import { v4 as uuid } from 'uuid';

interface RawRow {
  Date?: string | number;
  date?: string | number;
  Description?: string;
  description?: string;
  Amount?: number | string;
  amount?: number | string;
  Type?: string;
  type?: string;
  Reference?: string;
  reference?: string;
  Ref?: string;
  ref?: string;
}

function parseDate(value: string | number | undefined): string {
  if (!value) return new Date().toISOString().split('T')[0];
  if (typeof value === 'number') {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(value);
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0];
  return parsed.toISOString().split('T')[0];
}

function parseAmount(value: number | string | undefined): number {
  if (value === undefined || value === '') return 0;
  if (typeof value === 'number') return Math.round(value * 100) / 100;
  const cleaned = value.replace(/[^0-9.\-]/g, '');
  return Math.round(parseFloat(cleaned || '0') * 100) / 100;
}

function inferType(row: RawRow, amount: number): 'deposit' | 'payment' {
  const typeVal = (row.Type || row.type || '').toLowerCase();
  if (typeVal.includes('deposit') || typeVal.includes('credit') || typeVal.includes('dr')) {
    return 'deposit';
  }
  if (typeVal.includes('payment') || typeVal.includes('debit') || typeVal.includes('cr')) {
    return 'payment';
  }
  return amount >= 0 ? 'deposit' : 'payment';
}

export function parseExcelFile(
  buffer: ArrayBuffer,
  source: 'bank' | 'gl'
): Transaction[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: RawRow[] = XLSX.utils.sheet_to_json(sheet);

  return rows.map((row) => {
    const amount = parseAmount(row.Amount || row.amount);
    return {
      id: uuid(),
      date: parseDate(row.Date || row.date),
      description: String(row.Description || row.description || ''),
      amount: Math.abs(amount),
      type: inferType(row, amount),
      reference: String(row.Reference || row.reference || row.Ref || row.ref || ''),
      source,
      createdAt: new Date().toISOString(),
    };
  });
}

export function parseCSVFile(
  text: string,
  source: 'bank' | 'gl'
): Transaction[] {
  // Use XLSX to parse CSV as well for consistency
  const workbook = XLSX.read(text, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: RawRow[] = XLSX.utils.sheet_to_json(sheet);

  return rows.map((row) => {
    const amount = parseAmount(row.Amount || row.amount);
    return {
      id: uuid(),
      date: parseDate(row.Date || row.date),
      description: String(row.Description || row.description || ''),
      amount: Math.abs(amount),
      type: inferType(row, amount),
      reference: String(row.Reference || row.reference || row.Ref || row.ref || ''),
      source,
      createdAt: new Date().toISOString(),
    };
  });
}
