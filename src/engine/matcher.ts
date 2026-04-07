import { Transaction, MatchResult } from '../types';
import { v4 as uuid } from 'uuid';

const DAY_MS = 86_400_000;

interface MatchConfig {
  dateTolerance: number; // days
  amountTolerance: number; // absolute currency units
  descriptionWeight: number; // 0-1
}

const DEFAULT_CONFIG: MatchConfig = {
  dateTolerance: 3,
  amountTolerance: 0.01,
  descriptionWeight: 0.3,
};

function dateProximity(a: string, b: string, toleranceDays: number): number {
  const diff = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  const maxDiff = toleranceDays * DAY_MS;
  if (diff > maxDiff) return 0;
  return 1 - diff / maxDiff;
}

function amountMatch(a: number, b: number, tolerance: number): number {
  const diff = Math.abs(a - b);
  if (diff > tolerance) return 0;
  return diff === 0 ? 1 : 0.9;
}

function descriptionSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : overlap / union;
}

function computeConfidence(
  bank: Transaction,
  gl: Transaction,
  config: MatchConfig
): number {
  const amtScore = amountMatch(bank.amount, gl.amount, config.amountTolerance);
  if (amtScore === 0) return 0;

  const dateScore = dateProximity(bank.date, gl.date, config.dateTolerance);
  if (dateScore === 0) return 0;

  const descScore = descriptionSimilarity(bank.description, gl.description);

  const raw =
    amtScore * 0.5 +
    dateScore * (0.5 - config.descriptionWeight) +
    descScore * config.descriptionWeight;

  return Math.round(raw * 100);
}

export function matchTransactions(
  bankTransactions: Transaction[],
  glTransactions: Transaction[],
  config: Partial<MatchConfig> = {}
): { matches: MatchResult[]; unmatchedBank: Transaction[]; unmatchedGL: Transaction[] } {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const matches: MatchResult[] = [];
  const usedBank = new Set<string>();
  const usedGL = new Set<string>();

  // Build scored pairs
  const pairs: { bank: Transaction; gl: Transaction; confidence: number }[] = [];
  for (const bank of bankTransactions) {
    for (const gl of glTransactions) {
      if (bank.type !== gl.type) continue;
      const confidence = computeConfidence(bank, gl, cfg);
      if (confidence >= 50) {
        pairs.push({ bank, gl, confidence });
      }
    }
  }

  // Greedy: pick highest confidence first
  pairs.sort((a, b) => b.confidence - a.confidence);

  for (const pair of pairs) {
    if (usedBank.has(pair.bank.id) || usedGL.has(pair.gl.id)) continue;
    usedBank.add(pair.bank.id);
    usedGL.add(pair.gl.id);
    matches.push({
      id: uuid(),
      bankTransactionId: pair.bank.id,
      glTransactionId: pair.gl.id,
      confidence: pair.confidence,
      matchType: pair.confidence === 100 ? 'exact' : 'fuzzy',
      matchedAt: new Date().toISOString(),
    });
  }

  const unmatchedBank = bankTransactions.filter((t) => !usedBank.has(t.id));
  const unmatchedGL = glTransactions.filter((t) => !usedGL.has(t.id));

  return { matches, unmatchedBank, unmatchedGL };
}

export function manualMatch(bankTx: Transaction, glTx: Transaction): MatchResult {
  return {
    id: uuid(),
    bankTransactionId: bankTx.id,
    glTransactionId: glTx.id,
    confidence: 100,
    matchType: 'manual',
    matchedAt: new Date().toISOString(),
  };
}
