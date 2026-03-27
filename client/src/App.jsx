import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppShell from './components/layout/AppShell';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';

// Voter Pages
import VoterDashboard from './pages/voter/VoterDashboard';
import ElectionVotePage from './pages/voter/ElectionVotePage';
import VoteReceiptPage from './pages/voter/VoteReceiptPage';
import VoteHistoryPage from './pages/voter/VoteHistoryPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateElectionPage from './pages/admin/CreateElectionPage';
import ManageElectionsPage from './pages/admin/ManageElectionsPage';
import ElectionDetailPage from './pages/admin/ElectionDetailPage';
import VoterManagementPage from './pages/admin/VoterManagementPage';
import ResultsPage from './pages/admin/ResultsPage';

// Auditor Pages
import AuditorDashboard from './pages/auditor/AuditorDashboard';
import AuditLogPage from './pages/auditor/AuditLogPage';

// Extracted outside App so React doesn't recreate on every render
const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'auditor') return <Navigate to="/auditor" replace />;
    if (userRole === 'voter') return <Navigate to="/voter" replace />;
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RedirectBasedOnRole = () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  
  if (!token) return <Navigate to="/login" replace />;
  if (userRole === 'admin') return <Navigate to="/admin" replace />;
  if (userRole === 'auditor') return <Navigate to="/auditor" replace />;
  return <Navigate to="/voter" replace />;
};

const AuthShell = () => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <AppShell />;
};

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<RedirectBasedOnRole />} />
          <Route path="/login" element={<LoginPage />} />

          <Route element={<AuthShell />}>
            {/* Voter Routes */}
            <Route path="/voter" element={<PrivateRoute allowedRoles={['voter']}><VoterDashboard /></PrivateRoute>} />
            <Route path="/voter/election/:id" element={<PrivateRoute allowedRoles={['voter']}><ElectionVotePage /></PrivateRoute>} />
            <Route path="/voter/receipt" element={<PrivateRoute allowedRoles={['voter']}><VoteReceiptPage /></PrivateRoute>} />
            <Route path="/voter/history" element={<PrivateRoute allowedRoles={['voter']}><VoteHistoryPage /></PrivateRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/create" element={<PrivateRoute allowedRoles={['admin']}><CreateElectionPage /></PrivateRoute>} />
            <Route path="/admin/manage" element={<PrivateRoute allowedRoles={['admin']}><ManageElectionsPage /></PrivateRoute>} />
            <Route path="/admin/election/:id" element={<PrivateRoute allowedRoles={['admin']}><ElectionDetailPage /></PrivateRoute>} />
            <Route path="/admin/voters" element={<PrivateRoute allowedRoles={['admin']}><VoterManagementPage /></PrivateRoute>} />
            <Route path="/admin/results/:id" element={<PrivateRoute allowedRoles={['admin']}><ResultsPage /></PrivateRoute>} />

            {/* Auditor Routes */}
            <Route path="/auditor" element={<PrivateRoute allowedRoles={['admin', 'auditor']}><AuditorDashboard /></PrivateRoute>} />
            <Route path="/auditor/logs" element={<PrivateRoute allowedRoles={['admin', 'auditor']}><AuditLogPage /></PrivateRoute>} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
