import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";

import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { RoleLayout } from "./pages/shared/RoleLayout";
import { AccessDenied } from "./pages/shared/AccessDenied";

import { CustomerDashboard } from "./pages/customer/Dashboard";
import { EmployeeDashboard } from "./pages/employee/Dashboard";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { Chat } from "./pages/Chat";

import { Tickets } from "./pages/shared/Tickets";
import { LeadsManagement } from "./pages/shared/Leads";

import { UsersManagement } from "./pages/admin/Users";

function AppRoutes() {
  const { user, loading } = useAuth();
  
  if (loading) return null;

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/access-denied" element={<AccessDenied />} />
      
      {/* Root redirect based on role */}
      <Route path="/" element={
        !user ? <Navigate to="/login" /> : <Navigate to="/dashboard" />
      } />

      {/* Role-based Dashboard routing */}
      <Route path="/dashboard" element={
        !user ? <Navigate to="/login" /> :
        user.role === 'customer' ? (
          <RoleLayout allowedRoles={['customer']}>
            <CustomerDashboard />
          </RoleLayout>
        ) : user.role === 'employee' ? (
          <RoleLayout allowedRoles={['employee']}>
            <EmployeeDashboard />
          </RoleLayout>
        ) : (
          <RoleLayout allowedRoles={['admin']}>
            <AdminDashboard />
          </RoleLayout>
        )
      } />

      {/* Shared Chat page (isolated inside by role) */}
      <Route path="/chat" element={
        <RoleLayout allowedRoles={['customer', 'employee', 'admin']}>
          <Chat />
        </RoleLayout>
      } />

      <Route path="/tickets" element={
        <RoleLayout allowedRoles={['customer', 'employee', 'admin']}>
          <Tickets />
        </RoleLayout>
      } />
      <Route path="/conversations" element={
        <RoleLayout allowedRoles={['customer', 'admin']}>
          <div className="p-4">Conversations Placeholder</div>
        </RoleLayout>
      } />
      <Route path="/kb" element={
        <RoleLayout allowedRoles={['employee']}>
          <div className="p-4">Knowledge Base Placeholder</div>
        </RoleLayout>
      } />
      <Route path="/users" element={
        <RoleLayout allowedRoles={['admin']}>
          <UsersManagement />
        </RoleLayout>
      } />
      <Route path="/leads" element={
        <RoleLayout allowedRoles={['admin', 'employee']}>
          <LeadsManagement />
        </RoleLayout>
      } />
      <Route path="/profile" element={
        <RoleLayout allowedRoles={['customer', 'employee', 'admin']}>
          <div className="p-4">Profile Placeholder</div>
        </RoleLayout>
      } />
      <Route path="/workspace" element={
        <RoleLayout allowedRoles={['employee']}>
          <div className="p-4">Support Workspace Placeholder</div>
        </RoleLayout>
      } />

      {/* 404 Route */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center">
          <h1 className="text-4xl font-bold">404 - Not Found</h1>
        </div>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

