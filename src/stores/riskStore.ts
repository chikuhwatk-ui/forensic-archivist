import { create } from 'zustand';
import { RiskAssessment } from '../types';
import { db } from '../lib/db';
import { assessRisk } from '../engine/riskDetector';
import { useTransactionStore } from './transactionStore';
import { useSettingsStore } from './settingsStore';

interface RiskState {
  assessments: RiskAssessment[];
  loading: boolean;

  runRiskAnalysis: () => Promise<void>;
  loadAll: () => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useRiskStore = create<RiskState>((set) => ({
  assessments: [],
  loading: false,

  runRiskAnalysis: async () => {
    set({ loading: true });

    const { bankTransactions, glTransactions } = useTransactionStore.getState();
    const { settings } = useSettingsStore.getState();
    const allTransactions = [...bankTransactions, ...glTransactions];
    const assessments = assessRisk(allTransactions, {
      agingThresholdDays: settings.agingThresholdDays,
      largeAmountThreshold: settings.largeAmountThreshold,
      yearEndMonths: settings.yearEndMonths,
      duplicateWindowDays: settings.duplicateWindowDays,
    });

    await db.riskAssessments.clear();
    if (assessments.length > 0) await db.riskAssessments.bulkAdd(assessments);

    set({ assessments, loading: false });
  },

  loadAll: async () => {
    const assessments = await db.riskAssessments.toArray();
    set({ assessments });
  },

  clearAll: async () => {
    await db.riskAssessments.clear();
    set({ assessments: [] });
  },
}));
