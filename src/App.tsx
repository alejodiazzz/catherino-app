import React, { useState, useEffect } from 'react'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import AppRoutes from './routes'
import { authUtils } from './utils/auth'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  const [resetEmail, setResetEmail] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar sesión al cargar la aplicación
  useEffect(() => {
    const checkAuth = () => {
      const hasToken = authUtils.isAuthenticated()
      setIsAuthenticated(hasToken)
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  // Mostrar loading mientras verifica la sesión
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2c2c2c]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-6xl text-white mb-4"></i>
          <p className="text-white text-lg">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent
          isAuthenticated={isAuthenticated}
          setIsAuthenticated={setIsAuthenticated}
          resetEmail={resetEmail}
          setResetEmail={setResetEmail}
        />
      </BrowserRouter>
    </ThemeProvider>
  )
}

interface AppContentProps {
  isAuthenticated: boolean
  setIsAuthenticated: (value: boolean) => void
  resetEmail: string
  setResetEmail: (value: string) => void
}

const AppContent: React.FC<AppContentProps> = ({
  isAuthenticated,
  setIsAuthenticated,
  resetEmail,
  setResetEmail,
}) => {
  const navigate = useNavigate()

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    navigate('/dashboard')
  }

  const handleLogout = () => {
    console.log('App handleLogout called')
    authUtils.removeToken()
    setIsAuthenticated(false)
    navigate('/login')
  }

  const handleForgotPassword = () => {
    navigate('/forgot-password')
  }

  const handleResetSuccess = (email: string) => {
    setResetEmail(email)
    navigate('/reset-password')
  }

  const handleBackToLogin = () => {
    navigate('/login')
  }

  return (
    <AppRoutes
      isAuthenticated={isAuthenticated}
      resetEmail={resetEmail}
      onLoginSuccess={handleLoginSuccess}
      onLogout={handleLogout}
      onForgotPassword={handleForgotPassword}
      onResetSuccess={handleResetSuccess}
      onBackToLogin={handleBackToLogin}
    />
  )
}

export default App
