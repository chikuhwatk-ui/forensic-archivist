import { Transaction, RiskAssessment, RiskFlag, RiskLevel } from '../types';
import { v4 as uuid } from 'uuid';

interface RiskConfig {
  agingThresholdDays: number;
  largeAmountThreshold: number;
  yearEndMonths: number[]; // 0-indexed (11 = December)
  duplicateWindowDays: number;
}

const DEFAULT_RISK_CONFIG: RiskConfig = {
  agingThresholdDays: 30,
  largeAmountThreshold: 50000,
  yearEndMonths: [11, 0], // December and January
  duplicateWindowDays: 7,
};

function isRoundFigure(amount: number): boolean {
  if (amount >= 10000 && amount % 1000 === 0) return true;
  if (amount >= 1000 && amount % 500 === 0) return true;
  return false;
}

function isOlderThan(dateStr: string, days: number): boolean {
  const txDate = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return txDate < cutoff;
}

function isYearEnd(dateStr: string, months: number[]): boolean {
  const month = new Date(dateStr).getMonth();
  return months.includes(month);
}

function detectAgingRisk(tx: Transaction, config: RiskConfig): RiskFlag | null {
  if (isOlderThan(tx.date, config.agingThresholdDays)) {
    const days = Math.floor(
      (Date.now() - new Date(tx.date).getTime()) / 86_400_000
    );
    return {
      rule: 'aging',
      description: `Transaction is ${days} days old (threshold: ${config.agingThresholdDays} days)`,
      severity: days > config.agingThresholdDays * 2 ? 'high' : 'medium',
    };
  }
  return null;
}

function detectLargeAmount(tx: Transaction, config: RiskConfig): RiskFlag | null {
  if (Math.abs(tx.amount) >= config.largeAmountThreshold) {
    return {
      rule: 'large_amount',
      description: `Amount $${Math.abs(tx.amount).toLocaleString()} exceeds threshold of $${config.largeAmountThreshold.toLocaleString()}`,
      severity: Math.abs(tx.amount) >= config.largeAmountThreshold * 3 ? 'high' : 'medium',
    };
  }
  return null;
}

function detectRoundFigure(tx: Transaction): RiskFlag | null {
  if (isRoundFigure(Math.abs(tx.amount))) {
    return {
      rule: 'round_figure',
      description: `Round figure amount: $${Math.abs(tx.amount).toLocaleString()}`,
      severity: 'low',
    };
  }
  return null;
}

function detectYearEnd(tx: Transaction, config: RiskConfig): RiskFlag | null {
  if (isYearEnd(tx.date, config.yearEndMonths)) {
    return {
      rule: 'year_end',
      description: `Transaction near fiscal year-end boundary`,
      severity: 'medium',
    };
  }
  return null;
}

function detectDuplicates(
  tx: Transaction,
  allTransactions: Transaction[],
  config: RiskConfig
): RiskFlag | null {
  const txDate = new Date(tx.date).getTime();
  const windowMs = config.duplicateWindowDays * 86_400_000;

  const duplicates = allTransactions.filter(
    (other) =>
      other.id !== tx.id &&
      other.amount === tx.amount &&
      other.source === tx.source &&
      Math.abs(new Date(other.date).getTime() - txDate) <= windowMs
  );

  if (duplicates.length > 0) {
    return {
      rule: 'duplicate',
      description: `${duplicates.length} duplicate amount(s) of $${Math.abs(tx.amount).toLocaleString()} within ${config.duplicateWindowDays} days`,
      severity: duplicates.length >= 3 ? 'high' : 'medium',
    };
  }
  return null;
}

function detectManualJournal(tx: Transaction): RiskFlag | null {
  const desc = tx.description.toLowerCase();
  if (
    desc.includes('journal') ||
    desc.includes('adjustment') ||
    desc.includes('manual') ||
    desc.includes('correction')
  ) {
    return {
      rule: 'manual_journal',
      description: `Possible manual journal adjustment: "${tx.description}"`,
      severity: 'medium',
    };
  }
  return null;
}

function computeOverallRisk(flags: RiskFlag[]): { level: RiskLevel; score: number } {
  if (flags.length === 0) return { level: 'low', score: 0 };

  const weights: Record<RiskLevel, number> = { low: 10, medium: 30, high: 50 };
  let score = 0;
  for (const flag of flags) {
    score += weights[flag.severity];
  }
  score = Math.min(score, 100);

  let level: RiskLevel = 'low';
  if (score >= 60) level = 'high';
  else if (score >= 30) level = 'medium';

  return { level, score };
}

export function assessRisk(
  transactions: Transaction[],
  config: Partial<RiskConfig> = {}
): RiskAssessment[] {
  const cfg = { ...DEFAULT_RISK_CONFIG, ...config };

  return transactions.map((tx) => {
    const flags: RiskFlag[] = [];

    const aging = detectAgingRisk(tx, cfg);
    if (aging) flags.push(aging);

    const large = detectLargeAmount(tx, cfg);
    if (large) flags.push(large);

    const round = detectRoundFigure(tx);
    if (round) flags.push(round);

    const yearEnd = detectYearEnd(tx, cfg);
    if (yearEnd) flags.push(yearEnd);

    const duplicate = detectDuplicates(tx, transactions, cfg);
    if (duplicate) flags.push(duplicate);

    const manual = detectManualJournal(tx);
    if (manual) flags.push(manual);

    const { level, score } = computeOverallRisk(flags);

    return {
      id: uuid(),
      transactionId: tx.id,
      overallRisk: level,
      score,
      flags,
      assessedAt: new Date().toISOString(),
    };
  });
}
