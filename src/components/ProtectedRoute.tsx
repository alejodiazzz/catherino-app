import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { authUtils } from '../utils/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  isAuthenticated: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, isAuthenticated }) => {
  const location = useLocation()

  // Verificar autenticación en cada renderizado
  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      console.log('No hay sesión activa, redirigiendo al login...')
    }
  }, [location])

  if (!isAuthenticated || !authUtils.isAuthenticated()) {
    // Redirigir al login y guardar la ubicación actual
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
