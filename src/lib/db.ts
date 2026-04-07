import Dexie, { type EntityTable } from 'dexie';
import { Transaction, MatchResult, ReconcilingItem, RiskAssessment } from '../types';

export interface InvestigationNote {
  transactionId: string;
  note: string;
  updatedAt: string;
}

const db = new Dexie('ForensicArchivistDB') as Dexie & {
  transactions: EntityTable<Transaction, 'id'>;
  matches: EntityTable<MatchResult, 'id'>;
  reconcilingItems: EntityTable<ReconcilingItem, 'id'>;
  riskAssessments: EntityTable<RiskAssessment, 'id'>;
  investigationNotes: EntityTable<InvestigationNote, 'transactionId'>;
};

db.version(1).stores({
  transactions: 'id, date, source, type, amount, reference',
  matches: 'id, bankTransactionId, glTransactionId',
  reconcilingItems: 'id, transactionId, type, source',
  riskAssessments: 'id, transactionId, overallRisk, score',
});

db.version(2).stores({
  transactions: 'id, date, source, type, amount, reference',
  matches: 'id, bankTransactionId, glTransactionId',
  reconcilingItems: 'id, transactionId, type, source',
  riskAssessments: 'id, transactionId, overallRisk, score',
  investigationNotes: 'transactionId',
});

export { db };
