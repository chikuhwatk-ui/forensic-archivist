import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppSettings {
  // Risk thresholds
  agingThresholdDays: number;
  largeAmountThreshold: number;
  yearEndMonths: number[];
  duplicateWindowDays: number;

  // Matching tolerances
  dateTolerance: number;
  amountTolerance: number;
  descriptionWeight: number;
  minimumConfidence: number;

  // Report
  organizationName: string;
  auditorName: string;
  reportTitle: string;
}

interface SettingsState {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetDefaults: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
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

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: { ...DEFAULT_SETTINGS },

      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),

      resetDefaults: () =>
        set({ settings: { ...DEFAULT_SETTINGS } }),
    }),
    {
      name: 'forensic-archivist-settings',
    }
  )
);
