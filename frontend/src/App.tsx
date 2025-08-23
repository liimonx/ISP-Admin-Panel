import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Import Atomix CSS
import '@shohojdhara/atomix/css';

// Context
import { AuthProvider } from '@/context/AuthContext';

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
        <Router>
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
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#212121',
              color: '#FFFFFF',
              border: '1px solid #7AFFD7',
            },
            success: {
              iconTheme: {
                primary: '#4DFF9F',
                secondary: '#000000',
              },
            },
            error: {
              iconTheme: {
                primary: '#DD6061',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
