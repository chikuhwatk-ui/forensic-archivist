import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, MatchResult, ReconcilingItem, RiskAssessment, ReconciliationSummary } from '../types';

export function generateReconciliationReport(
  summary: ReconciliationSummary,
  reconcilingItems: ReconcilingItem[],
  riskAssessments: RiskAssessment[],
  transactions: Transaction[]
) {
  const doc = new jsPDF();
  const txMap = new Map(transactions.map((t) => [t.id, t]));

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Forensic Bank Reconciliation Report', 14, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
  doc.text(
    'This system supports ISA 315 by identifying high-risk areas within bank reconciliations and aligns with ISA 240 by enhancing the detection of potential fraud through automated risk indicators.',
    14, 36, { maxWidth: 180 }
  );

  // Summary table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Reconciliation Summary', 14, 52);

  autoTable(doc, {
    startY: 56,
    head: [['Metric', 'Value']],
    body: [
      ['Total Bank Transactions', String(summary.totalBankTransactions)],
      ['Total GL Transactions', String(summary.totalGLTransactions)],
      ['Matched Items', String(summary.matchedCount)],
      ['Match Rate', `${summary.matchRate.toFixed(1)}%`],
      ['Unmatched Bank Items', String(summary.unmatchedBankCount)],
      ['Unmatched GL Items', String(summary.unmatchedGLCount)],
      ['Reconciling Items', String(summary.reconcilingItemsCount)],
      ['Reconciling Items Value', `$${summary.reconcilingItemsValue.toLocaleString()}`],
      ['High Risk Items', String(summary.highRiskCount)],
      ['Medium Risk Items', String(summary.mediumRiskCount)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [0, 32, 69] },
  });

  // Reconciling items
  const y1 = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(14);
  doc.text('Reconciling Items', 14, y1);

  autoTable(doc, {
    startY: y1 + 4,
    head: [['Date', 'Description', 'Amount', 'Type', 'Source']],
    body: reconcilingItems.map((item) => [
      item.date,
      item.description,
      `$${item.amount.toLocaleString()}`,
      item.type.replace(/_/g, ' '),
      item.source.toUpperCase(),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [0, 32, 69] },
  });

  // High-risk items (exception report)
  doc.addPage();
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Exception Report — High-Risk Items', 14, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Items requiring investigation per ISA 240 fraud detection standards.', 14, 30);

  const highRisk = riskAssessments.filter((r) => r.overallRisk === 'high' || r.overallRisk === 'medium');
  autoTable(doc, {
    startY: 36,
    head: [['Date', 'Description', 'Amount', 'Risk', 'Score', 'Flags']],
    body: highRisk.map((r) => {
      const tx = txMap.get(r.transactionId);
      return [
        tx?.date || '',
        tx?.description || '',
        tx ? `$${tx.amount.toLocaleString()}` : '',
        r.overallRisk.toUpperCase(),
        String(r.score),
        r.flags.map((f) => f.description).join('; '),
      ];
    }),
    theme: 'grid',
    headStyles: { fillColor: [186, 26, 26] },
    columnStyles: { 5: { cellWidth: 60 } },
  });

  doc.save('forensic-reconciliation-report.pdf');
}
