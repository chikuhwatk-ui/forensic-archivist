import { Transaction, ReconcilingItem, ReconcilingItemType } from '../types';
import { v4 as uuid } from 'uuid';

function classifyItem(tx: Transaction): ReconcilingItemType {
  const desc = tx.description.toLowerCase();

  // Bank charges
  if (
    desc.includes('bank charge') ||
    desc.includes('service fee') ||
    desc.includes('bank fee') ||
    desc.includes('interest charge') ||
    desc.includes('maintenance fee')
  ) {
    return 'bank_charge';
  }

  // Direct deposits
  if (
    desc.includes('direct deposit') ||
    desc.includes('eft credit') ||
    desc.includes('auto credit') ||
    desc.includes('wire transfer in')
  ) {
    return 'direct_deposit';
  }

  // Source-based classification for remaining items
  if (tx.source === 'gl') {
    // In GL but not in bank
    if (tx.type === 'deposit') return 'deposit_in_transit';
    if (tx.type === 'payment') return 'outstanding_payment';
  }

  if (tx.source === 'bank') {
    // In bank but not in GL
    if (tx.type === 'deposit') return 'direct_deposit';
    if (tx.type === 'payment') return 'bank_charge';
  }

  return 'unclassified';
}

export function classifyReconcilingItems(
  unmatchedTransactions: Transaction[]
): ReconcilingItem[] {
  return unmatchedTransactions.map((tx) => ({
    id: uuid(),
    transactionId: tx.id,
    type: classifyItem(tx),
    description: tx.description,
    amount: tx.amount,
    date: tx.date,
    source: tx.source,
  }));
}

export function computeAdjustedBalances(
  bankBalance: number,
  glBalance: number,
  items: ReconcilingItem[]
): {
  adjustedBankBalance: number;
  adjustedGLBalance: number;
  difference: number;
} {
  let bankAdj = bankBalance;
  let glAdj = glBalance;

  for (const item of items) {
    switch (item.type) {
      case 'deposit_in_transit':
        bankAdj += item.amount;
        break;
      case 'outstanding_payment':
        bankAdj -= item.amount;
        break;
      case 'bank_charge':
        glAdj -= item.amount;
        break;
      case 'direct_deposit':
        glAdj += item.amount;
        break;
      case 'error':
        // Errors need manual resolution
        break;
    }
  }

  return {
    adjustedBankBalance: Math.round(bankAdj * 100) / 100,
    adjustedGLBalance: Math.round(glAdj * 100) / 100,
    difference: Math.round((bankAdj - glAdj) * 100) / 100,
  };
}
