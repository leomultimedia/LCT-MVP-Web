import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from './contexts/AuthContext';

// Layout components
import DashboardLayout from './components/layouts/DashboardLayout';

// Authentication pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard pages
import Dashboard from './pages/dashboard/Dashboard';

// Module pages
import SalesFunnel from './pages/sales/SalesFunnel';
import LeadManagement from './pages/sales/LeadManagement';
import Campaigns from './pages/sales/Campaigns';

import Finance from './pages/finance/Finance';
import Invoices from './pages/finance/Invoices';
import Expenses from './pages/finance/Expenses';
import Reports from './pages/finance/Reports';

import Tickets from './pages/itsm/Tickets';
import KnowledgeBase from './pages/itsm/KnowledgeBase';
import SLAManagement from './pages/itsm/SLAManagement';

import SocialMedia from './pages/social/SocialMedia';
import ContentCalendar from './pages/social/ContentCalendar';
import SocialAnalytics from './pages/social/SocialAnalytics';

// Settings and user pages
import Settings from './pages/settings/Settings';
import UserProfile from './pages/settings/UserProfile';

// Error pages
import NotFound from './pages/errors/NotFound';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</Box>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Dashboard and module routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        
        {/* Sales Module */}
        <Route path="sales">
          <Route index element={<SalesFunnel />} />
          <Route path="leads" element={<LeadManagement />} />
          <Route path="campaigns" element={<Campaigns />} />
        </Route>
        
        {/* Finance Module */}
        <Route path="finance">
          <Route index element={<Finance />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        
        {/* ITSM Module */}
        <Route path="itsm">
          <Route index element={<Tickets />} />
          <Route path="knowledge" element={<KnowledgeBase />} />
          <Route path="sla" element={<SLAManagement />} />
        </Route>
        
        {/* Social Media Module */}
        <Route path="social">
          <Route index element={<SocialMedia />} />
          <Route path="calendar" element={<ContentCalendar />} />
          <Route path="analytics" element={<SocialAnalytics />} />
        </Route>
        
        {/* Settings */}
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>
      
      {/* 404 and fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
