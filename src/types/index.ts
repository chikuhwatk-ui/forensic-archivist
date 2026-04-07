export interface Transaction {
  id: string;
  date: string; // ISO date string
  description: string;
  amount: number;
  type: 'deposit' | 'payment';
  reference: string;
  source: 'bank' | 'gl';
  createdAt: string;
}

export interface MatchResult {
  id: string;
  bankTransactionId: string;
  glTransactionId: string;
  confidence: number; // 0-100
  matchType: 'exact' | 'fuzzy' | 'manual';
  matchedAt: string;
}

export type ReconcilingItemType =
  | 'deposit_in_transit'
  | 'outstanding_payment'
  | 'bank_charge'
  | 'direct_deposit'
  | 'error'
  | 'unclassified';

export interface ReconcilingItem {
  id: string;
  transactionId: string;
  type: ReconcilingItemType;
  description: string;
  amount: number;
  date: string;
  source: 'bank' | 'gl';
  resolvedAt?: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskFlag {
  rule: string;
  description: string;
  severity: RiskLevel;
}

export interface RiskAssessment {
  id: string;
  transactionId: string;
  overallRisk: RiskLevel;
  score: number; // 0-100
  flags: RiskFlag[];
  assessedAt: string;
}

export interface ReconciliationSummary {
  totalBankTransactions: number;
  totalGLTransactions: number;
  matchedCount: number;
  unmatchedBankCount: number;
  unmatchedGLCount: number;
  reconcilingItemsCount: number;
  reconcilingItemsValue: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  matchRate: number; // percentage
}
