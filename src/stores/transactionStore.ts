import { create } from 'zustand';
import { Transaction } from '../types';
import { db } from '../lib/db';
import { v4 as uuid } from 'uuid';

interface TransactionState {
  bankTransactions: Transaction[];
  glTransactions: Transaction[];
  loading: boolean;

  loadAll: () => Promise<void>;
  addTransactions: (txs: Transaction[]) => Promise<void>;
  addManualTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  clearAll: () => Promise<void>;
  clearBySource: (source: 'bank' | 'gl') => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  bankTransactions: [],
  glTransactions: [],
  loading: false,

  loadAll: async () => {
    set({ loading: true });
    const all = await db.transactions.toArray();
    set({
      bankTransactions: all.filter((t) => t.source === 'bank'),
      glTransactions: all.filter((t) => t.source === 'gl'),
      loading: false,
    });
  },

  addTransactions: async (txs) => {
    await db.transactions.bulkAdd(txs);
    const all = await db.transactions.toArray();
    set({
      bankTransactions: all.filter((t) => t.source === 'bank'),
      glTransactions: all.filter((t) => t.source === 'gl'),
    });
  },

  addManualTransaction: async (tx) => {
    const full: Transaction = {
      ...tx,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    await db.transactions.add(full);
    const all = await db.transactions.toArray();
    set({
      bankTransactions: all.filter((t) => t.source === 'bank'),
      glTransactions: all.filter((t) => t.source === 'gl'),
    });
  },

  clearAll: async () => {
    await db.transactions.clear();
    set({ bankTransactions: [], glTransactions: [] });
  },

  clearBySource: async (source) => {
    await db.transactions.where('source').equals(source).delete();
    const all = await db.transactions.toArray();
    set({
      bankTransactions: all.filter((t) => t.source === 'bank'),
      glTransactions: all.filter((t) => t.source === 'gl'),
    });
  },
}));
