# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Forensic Archivist is a Forensic Bank Reconciliation Analytics Tool. It imports bank statements and cashbook/GL data, automatically matches transactions, classifies reconciling items, applies forensic risk detection rules (ISA 240 / ISA 315 compliance), and generates audit reports.

## Commands

- **Dev server:** `npm run dev` (runs on port 3000)
- **Build:** `npm run build`
- **Type-check (lint):** `npm run lint` (runs `tsc --noEmit`)
- **Clean:** `npm run clean`

## Architecture

### Routing & Layout
- `src/App.tsx` — shell layout with Sidebar, TopBar, and React Router routes
- 5 views: Dashboard (`/`), DataImport (`/import`), MatchingWorkspace (`/matching`), ForensicToolbox (`/forensic`), AuditVault (`/vault`)

### Core Engine (`src/engine/`)
- **matcher.ts** — greedy matching algorithm: scores bank vs GL transactions on amount (exact), date proximity (configurable tolerance), and description similarity (Jaccard). Confidence >= 50% = match.
- **reconciler.ts** — classifies unmatched transactions into: deposit_in_transit, outstanding_payment, bank_charge, direct_deposit, error, unclassified. Computes adjusted bank/GL balances.
- **riskDetector.ts** — forensic risk scoring with 6 rules: aging (>30 days), large amounts (>$50K), round figures, duplicates within 7-day window, year-end transactions, manual journal adjustments. Produces a 0-100 risk score → low/medium/high.

### State Management (`src/stores/`)
- Zustand stores: `transactionStore`, `reconciliationStore`, `riskStore`
- All stores persist to IndexedDB via Dexie (`src/lib/db.ts`)

### Libraries (`src/lib/`)
- **db.ts** — Dexie database with 4 tables: transactions, matches, reconcilingItems, riskAssessments
- **excelParser.ts** — SheetJS (xlsx) parser for .xlsx/.xls/.csv import. Handles Excel serial dates, flexible column name matching.
- **pdfReport.ts** — jsPDF + jspdf-autotable for PDF export (reconciliation summary + exception report)
- **cn.ts** — clsx + tailwind-merge utility

### Styling
- Tailwind CSS v4 via `@tailwindcss/vite`. Theme tokens in `src/index.css`.
- Fonts: Inter (body), Manrope (headlines). Icons: lucide-react.
- Charts: recharts. Animations: motion (Framer Motion).

### Types (`src/types/index.ts`)
- Core types: Transaction, MatchResult, ReconcilingItem, RiskAssessment, ReconciliationSummary

## Environment

- Path alias: `@` maps to project root
