import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { useAuthStore } from './store/useAuthStore';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NewRequestPage } from './pages/customer/NewRequestPage';
import { RequestDetailPage } from './pages/customer/RequestDetailPage';
import { BookingDetailPage } from './pages/customer/BookingDetailPage';
import { InvoicePage } from './pages/customer/InvoicePage';
import {
  CustomerHomePage,
  CustomerRequestsPage,
  CustomerQuoteInboxPage,
  CustomerQuotesPage,
  CustomerBookingsPage,
  CustomerInvoicesPage,
  CustomerDisputesPage,
  CustomerReviewsPage,
  CustomerProviderPage,
  CustomerNotificationsPage,
  CustomerProfilePage,
  CustomerSettingsPage
} from './pages/customer/CustomerPortalPages';
import { ProviderDashboard } from './pages/provider/ProviderDashboard';
import { JobManagementPage } from './pages/provider/JobManagementPage';
import { AvailabilityPage } from './pages/provider/AvailabilityPage';
import {
  ProviderHomePage,
  ProviderProfilePage,
  ProviderVerificationPage,
  ProviderQuotesPage,
  ProviderBookingsPage,
  ProviderJobPage,
  ProviderInvoicesPage,
  ProviderReviewsPage,
  ProviderNotificationsPage
} from './pages/provider/ProviderPortalPages';
import { OperationsManagementPage } from './pages/operations/OperationsManagementPage';
import { SupportDisputesPage } from './pages/support/SupportDisputesPage';
import { AdminManagementPage } from './pages/admin/AdminManagementPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AdminAnalyticsPage, ProviderAnalyticsPage, CustomerAnalyticsPage } from './pages/AnalyticsDashboardPage';

// Protected Route Guard Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={getDashboardPath(user?.role)} replace />;
  }

  return children;
};

const getDashboardPath = (role) => role === 'SERVICE_PROVIDER'
  ? '/provider/dashboard'
  : role === 'OPERATIONS_MANAGER'
    ? '/operations/dashboard'
    : role === 'SUPPORT_AGENT'
      ? '/support/dashboard'
      : role === 'PLATFORM_ADMIN'
        ? '/admin/dashboard'
        : '/customer/dashboard';

export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

function AppShell() {
  const location = useLocation();
  const publicPaths = ['/', '/services', '/providers', '/login', '/register'];
  const isInternalPage = !publicPaths.includes(location.pathname);

  return (
    <div className={`min-h-screen text-slate-900 flex flex-col justify-between selection:bg-sky-400 selection:text-slate-950 bg-transparent ${isInternalPage ? 'internal-shell' : ''}`}>
        <div>
          <Navbar />
          <main className="animate-in fade-in duration-300">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
              <Route path="/services" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
              <Route path="/providers" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
              <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'SERVICE_PROVIDER', 'OPERATIONS_MANAGER', 'SUPPORT_AGENT', 'PLATFORM_ADMIN']}>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Customer Routes */}
              <Route
                path="/customer/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'PLATFORM_ADMIN']}>
                    <CustomerHomePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/customer/requests" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'PLATFORM_ADMIN']}><CustomerRequestsPage /></ProtectedRoute>} />
              <Route path="/customer/requests/new" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'PLATFORM_ADMIN']}><NewRequestPage /></ProtectedRoute>} />
              <Route path="/customer/requests/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'PLATFORM_ADMIN']}><RequestDetailPage /></ProtectedRoute>} />
              <Route path="/customer/quotes" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'PLATFORM_ADMIN']}><CustomerQuoteInboxPage /></ProtectedRoute>} />
              <Route path="/customer/quotes/:requestId" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'PLATFORM_ADMIN']}><CustomerQuotesPage /></ProtectedRoute>} />
              <Route path="/customer/providers/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'PLATFORM_ADMIN']}><CustomerProviderPage /></ProtectedRoute>} />
              <Route path="/customer/bookings" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'PLATFORM_ADMIN']}><CustomerBookingsPage /></ProtectedRoute>} />
              <Route path="/customer/invoices" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'PLATFORM_ADMIN']}><CustomerInvoicesPage /></ProtectedRoute>} />
              <Route path="/customer/disputes" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'PLATFORM_ADMIN']}><CustomerDisputesPage /></ProtectedRoute>} />
              <Route path="/customer/reviews" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'PLATFORM_ADMIN']}><CustomerReviewsPage /></ProtectedRoute>} />
              <Route path="/customer/notifications" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'PLATFORM_ADMIN']}><CustomerNotificationsPage /></ProtectedRoute>} />
              <Route path="/customer/profile" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'PLATFORM_ADMIN']}><CustomerProfilePage /></ProtectedRoute>} />
              <Route path="/customer/settings" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'PLATFORM_ADMIN']}><CustomerSettingsPage /></ProtectedRoute>} />
              <Route path="/customer/analytics" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerAnalyticsPage /></ProtectedRoute>} />
              <Route
                path="/customer/request/new"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'PLATFORM_ADMIN']}>
                    <NewRequestPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/request/:id"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'PLATFORM_ADMIN', 'SERVICE_PROVIDER']}>
                    <RequestDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/bookings/:id"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'PLATFORM_ADMIN', 'SERVICE_PROVIDER']}>
                    <BookingDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/invoices/:id"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'SERVICE_PROVIDER', 'PLATFORM_ADMIN']}>
                    <InvoicePage />
                  </ProtectedRoute>
                }
              />

              {/* Provider Routes */}
              <Route
                path="/provider/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['SERVICE_PROVIDER', 'PLATFORM_ADMIN']}>
                    <ProviderHomePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/provider/profile" element={<ProtectedRoute allowedRoles={['SERVICE_PROVIDER', 'PLATFORM_ADMIN']}><ProviderProfilePage /></ProtectedRoute>} />
              <Route path="/provider/verification" element={<ProtectedRoute allowedRoles={['SERVICE_PROVIDER', 'PLATFORM_ADMIN']}><ProviderVerificationPage /></ProtectedRoute>} />
              <Route path="/provider/requests" element={<ProtectedRoute allowedRoles={['SERVICE_PROVIDER', 'PLATFORM_ADMIN']}><ProviderDashboard /></ProtectedRoute>} />
              <Route path="/provider/quotes" element={<ProtectedRoute allowedRoles={['SERVICE_PROVIDER', 'PLATFORM_ADMIN']}><ProviderQuotesPage /></ProtectedRoute>} />
              <Route path="/provider/bookings" element={<ProtectedRoute allowedRoles={['SERVICE_PROVIDER', 'PLATFORM_ADMIN']}><ProviderBookingsPage /></ProtectedRoute>} />
              <Route path="/provider/jobs/:id" element={<ProtectedRoute allowedRoles={['SERVICE_PROVIDER', 'PLATFORM_ADMIN']}><ProviderJobPage /></ProtectedRoute>} />
              <Route path="/provider/invoices" element={<ProtectedRoute allowedRoles={['SERVICE_PROVIDER', 'PLATFORM_ADMIN']}><ProviderInvoicesPage /></ProtectedRoute>} />
              <Route path="/provider/reviews" element={<ProtectedRoute allowedRoles={['SERVICE_PROVIDER', 'PLATFORM_ADMIN']}><ProviderReviewsPage /></ProtectedRoute>} />
              <Route path="/provider/notifications" element={<ProtectedRoute allowedRoles={['SERVICE_PROVIDER', 'PLATFORM_ADMIN']}><ProviderNotificationsPage /></ProtectedRoute>} />
              <Route path="/provider/analytics" element={<ProtectedRoute allowedRoles={['SERVICE_PROVIDER']}><ProviderAnalyticsPage /></ProtectedRoute>} />
              <Route path="/provider/skills" element={<ProtectedRoute allowedRoles={['SERVICE_PROVIDER', 'PLATFORM_ADMIN']}><ProviderProfilePage /></ProtectedRoute>} />
              <Route path="/provider/service-areas" element={<ProtectedRoute allowedRoles={['SERVICE_PROVIDER', 'PLATFORM_ADMIN']}><ProviderProfilePage /></ProtectedRoute>} />
              <Route path="/provider/settings" element={<ProtectedRoute allowedRoles={['SERVICE_PROVIDER', 'PLATFORM_ADMIN']}><ProviderProfilePage /></ProtectedRoute>} />
              <Route
                path="/provider/jobs"
                element={
                  <ProtectedRoute allowedRoles={['SERVICE_PROVIDER', 'PLATFORM_ADMIN']}>
                    <JobManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/provider/availability"
                element={
                  <ProtectedRoute allowedRoles={['SERVICE_PROVIDER', 'PLATFORM_ADMIN']}>
                    <AvailabilityPage />
                  </ProtectedRoute>
                }
              />

              {/* Operations Manager Routes */}
              <Route
                path="/operations/*"
                element={
                  <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER', 'PLATFORM_ADMIN']}>
                    <OperationsManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ops/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER', 'PLATFORM_ADMIN']}>
                    <OperationsManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* Support Agent Routes */}
              <Route
                path="/support/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'OPERATIONS_MANAGER', 'PLATFORM_ADMIN']}>
                    <SupportDisputesPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/support/tickets" element={<ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'OPERATIONS_MANAGER', 'PLATFORM_ADMIN']}><SupportDisputesPage /></ProtectedRoute>} />
              <Route path="/support/disputes" element={<ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'OPERATIONS_MANAGER', 'PLATFORM_ADMIN']}><SupportDisputesPage /></ProtectedRoute>} />
              <Route path="/support/refunds" element={<ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'OPERATIONS_MANAGER', 'PLATFORM_ADMIN']}><SupportDisputesPage /></ProtectedRoute>} />

              {/* Platform Admin Routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
                    <AdminManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}><AdminAnalyticsPage /></ProtectedRoute>} />
              <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}><NotificationsPage /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}><AdminManagementPage /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950/40 py-6 text-center text-xs text-slate-500">
          <p>© 2026 CareConnect AI Marketplace. Production MERN Architecture.</p>
        </footer>
      </div>
  );
}
