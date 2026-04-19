/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ToastContainer } from './components/ToastContainer';
import { JourneyStepper, WORKFLOW_ROUTES } from './components/JourneyStepper';
import { Dashboard } from './views/Dashboard';
import { DataImport } from './views/DataImport';
import { MatchingWorkspace } from './views/MatchingWorkspace';
import { ForensicToolbox } from './views/ForensicToolbox';
import { ExceptionReport } from './views/ExceptionReport';
import { AuditVault } from './views/AuditVault';
import { Settings } from './views/Settings';
import { SampleData } from './views/SampleData';

function MaybeStepper() {
  const location = useLocation();
  if (!WORKFLOW_ROUTES.includes(location.pathname)) return null;
  return <JourneyStepper />;
}

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50">
        <a href="#main-content" className="skip-to-content">Skip to main content</a>
        <Sidebar />
        <TopBar />
        <main id="main-content" className="ml-64 pt-16 p-8" role="main">
          <MaybeStepper />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/import" element={<DataImport />} />
            <Route path="/matching" element={<MatchingWorkspace />} />
            <Route path="/forensic" element={<ForensicToolbox />} />
            <Route path="/exceptions" element={<ExceptionReport />} />
            <Route path="/vault" element={<AuditVault />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/sample" element={<SampleData />} />
          </Routes>
        </main>
        <ToastContainer />
      </div>
    </HashRouter>
  );
}
