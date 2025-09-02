import { BrowserRouter as Router, Routes, Route, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import Atomix CSS
import '@shohojdhara/atomix/css';

// Context
import { AuthProvider } from '@/context/AuthContext';

// UI Components
import { NotificationContainer } from '@/components/ui';

// Layout
import Layout from '@/components/layout/Layout';

// Pages
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Customers from '@/pages/Customers';
import Plans from '@/pages/Plans';
import Subscriptions from '@/pages/Subscriptions';
import Billing from '@/pages/Billing';
import Network from '@/pages/Network';
import Monitoring from '@/pages/Monitoring';
import Users from '@/pages/Users';
import RouterManagement from '@/pages/RouterManagement';
import MainRouterDashboard from '@/pages/MainRouterDashboard';
import Settings from '@/pages/Settings';
import Reports from '@/pages/Reports';

// Protected Route Component
import ProtectedRoute from '@/components/common/ProtectedRoute';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="plans" element={<Plans />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="billing" element={<Billing />} />
              <Route path="network" element={<Network />} />
              <Route path="monitoring" element={<Monitoring />} />
              <Route path="routers" element={<RouterManagement />} />
              <Route path="main-router" element={<MainRouterDashboard />} />
              <Route path="settings/system" element={<Settings />} />
              <Route path="reports/usage" element={<Reports />} />
              <Route path="reports/revenue" element={<Reports />} />
              <Route
                path="users"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Users />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </Router>
        <NotificationContainer />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;