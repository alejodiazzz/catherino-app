import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'
import Dashboard from '../pages/Dashboard'
import Products from '../pages/Products'
import Sales from '../pages/Sales'
import Profile from '../pages/Profile'
import Reports from '../pages/Reports'
import Invoices from '../pages/Invoices'

interface AppRoutesProps {
  isAuthenticated: boolean
  resetEmail: string
  onLoginSuccess: () => void
  onLogout: () => void
  onForgotPassword: () => void
  onResetSuccess: (email: string) => void
  onBackToLogin: () => void
}

const AppRoutes: React.FC<AppRoutesProps> = ({
  isAuthenticated,
  resetEmail,
  onLoginSuccess,
  onLogout,
  onForgotPassword,
  onResetSuccess,
  onBackToLogin,
}) => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          !isAuthenticated ? (
            <Login onForgotPassword={onForgotPassword} onLoginSuccess={onLoginSuccess} />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route
        path="/forgot-password"
        element={<ForgotPassword onBack={onBackToLogin} onSuccess={onResetSuccess} />}
      />
      <Route
        path="/reset-password"
        element={<ResetPassword email={resetEmail} onBack={onBackToLogin} />}
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <Dashboard onLogout={onLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/products"
        element={
          isAuthenticated ? (
            <Products onLogout={onLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/sales"
        element={
          isAuthenticated ? (
            <Sales onLogout={onLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/profile"
        element={
          isAuthenticated ? (
            <Profile onLogout={onLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/reports"
        element={
          isAuthenticated ? (
            <Reports onLogout={onLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/invoices"
        element={
          isAuthenticated ? (
            <Invoices onLogout={onLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Default Route */}
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      
      {/* 404 Route */}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default AppRoutes
