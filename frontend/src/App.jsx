import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Purchases from './pages/Purchases';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, isAdmin } = useAuth();

    if (!user) return <Navigate to="/login" />;
    if (adminOnly && !isAdmin) return <Navigate to="/" />;

    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
                <ProtectedRoute>
                    <DashboardLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="billing" element={<Billing />} />
                <Route path="orders" element={<Orders />} />
                <Route path="products" element={<Products />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="customers" element={<Customers />} />
                <Route path="suppliers" element={
                    <ProtectedRoute adminOnly>
                        <Suppliers />
                    </ProtectedRoute>
                } />
                <Route path="purchases" element={
                    <ProtectedRoute adminOnly>
                        <Purchases />
                    </ProtectedRoute>
                } />
                <Route path="expenses" element={
                    <ProtectedRoute adminOnly>
                        <Expenses />
                    </ProtectedRoute>
                } />
                <Route path="analytics" element={
                    <ProtectedRoute adminOnly>
                        <Analytics />
                    </ProtectedRoute>
                } />
                <Route path="reports" element={
                    <ProtectedRoute adminOnly>
                        <Reports />
                    </ProtectedRoute>
                } />
                <Route path="settings" element={
                    <ProtectedRoute adminOnly>
                        <Settings />
                    </ProtectedRoute>
                } />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <ToastProvider>
                    <BrowserRouter>
                        <AppRoutes />
                    </BrowserRouter>
                </ToastProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
