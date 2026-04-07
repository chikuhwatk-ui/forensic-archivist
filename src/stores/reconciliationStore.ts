import { create } from 'zustand';
import { MatchResult, ReconcilingItem, ReconciliationSummary } from '../types';
import { db } from '../lib/db';
import { matchTransactions, manualMatch } from '../engine/matcher';
import { classifyReconcilingItems } from '../engine/reconciler';
import { useTransactionStore } from './transactionStore';
import { useSettingsStore } from './settingsStore';

interface ReconciliationState {
  matches: MatchResult[];
  reconcilingItems: ReconcilingItem[];
  summary: ReconciliationSummary | null;
  loading: boolean;

  runReconciliation: () => Promise<void>;
  addManualMatch: (bankTxId: string, glTxId: string) => Promise<void>;
  loadAll: () => Promise<void>;
  clearAll: () => Promise<void>;
}

function buildSummary(
  bankCount: number,
  glCount: number,
  matches: MatchResult[],
  unmatchedBankCount: number,
  unmatchedGLCount: number,
  reconcilingItems: ReconcilingItem[],
  highRisk: number,
  medRisk: number,
  lowRisk: number
): ReconciliationSummary {
  const total = bankCount + glCount;
  return {
    totalBankTransactions: bankCount,
    totalGLTransactions: glCount,
    matchedCount: matches.length,
    unmatchedBankCount,
    unmatchedGLCount,
    reconcilingItemsCount: reconcilingItems.length,
    reconcilingItemsValue: reconcilingItems.reduce((s, i) => s + i.amount, 0),
    highRiskCount: highRisk,
    mediumRiskCount: medRisk,
    lowRiskCount: lowRisk,
    matchRate: total > 0 ? (matches.length * 2 / total) * 100 : 0,
  };
}

export const useReconciliationStore = create<ReconciliationState>((set) => ({
  matches: [],
  reconcilingItems: [],
  summary: null,
  loading: false,

  runReconciliation: async () => {
    set({ loading: true });

    const { bankTransactions, glTransactions } = useTransactionStore.getState();
    const { settings } = useSettingsStore.getState();
    const { matches, unmatchedBank, unmatchedGL } = matchTransactions(
      bankTransactions,
      glTransactions,
      {
        dateTolerance: settings.dateTolerance,
        amountTolerance: settings.amountTolerance,
        descriptionWeight: settings.descriptionWeight,
      }
    );

    const allUnmatched = [...unmatchedBank, ...unmatchedGL];
    const reconcilingItems = classifyReconcilingItems(allUnmatched);

    // Persist
    await db.matches.clear();
    await db.reconcilingItems.clear();
    if (matches.length > 0) await db.matches.bulkAdd(matches);
    if (reconcilingItems.length > 0) await db.reconcilingItems.bulkAdd(reconcilingItems);

    const summary = buildSummary(
      bankTransactions.length,
      glTransactions.length,
      matches,
      unmatchedBank.length,
      unmatchedGL.length,
      reconcilingItems,
      0, 0, 0
    );

    set({ matches, reconcilingItems, summary, loading: false });
  },

  addManualMatch: async (bankTxId, glTxId) => {
    const { bankTransactions, glTransactions } = useTransactionStore.getState();
    const bankTx = bankTransactions.find((t) => t.id === bankTxId);
    const glTx = glTransactions.find((t) => t.id === glTxId);
    if (!bankTx || !glTx) return;

    const match = manualMatch(bankTx, glTx);
    await db.matches.add(match);

    // Remove from reconciling items
    await db.reconcilingItems.where('transactionId').anyOf([bankTxId, glTxId]).delete();

    // Reload
    const matches = await db.matches.toArray();
    const reconcilingItems = await db.reconcilingItems.toArray();
    set({ matches, reconcilingItems });
  },

  loadAll: async () => {
    const matches = await db.matches.toArray();
    const reconcilingItems = await db.reconcilingItems.toArray();
    set({ matches, reconcilingItems });
  },

  clearAll: async () => {
    await db.matches.clear();
    await db.reconcilingItems.clear();
    set({ matches: [], reconcilingItems: [], summary: null });
  },
}));
