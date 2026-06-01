import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import { authUtils } from '../utils/auth'
import { getEmailFromToken, getTokenFromStorage } from '../utils/jwtUtils'
import { useNotifications } from '../hooks/useNotifications'

interface PageLayoutProps {
  children: React.ReactNode
  userName?: string
  userImage?: string | null
  notificationCount?: number
  onLogout?: () => void
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  userName,
  userImage = null,
  notificationCount,
  onLogout,
}) => {
  const navigate = useNavigate()
  const [userEmail, setUserEmail] = useState<string>('Admin')
  
  // Hook de notificaciones
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications()

  // Obtener email del token al cargar
  useEffect(() => {
    const token = getTokenFromStorage()
    const email = getEmailFromToken(token)
    
    if (email) {
      setUserEmail(email)
    }
  }, [])

  const handleLogout = () => {
    console.log('PageLayout handleLogout called')
    if (onLogout) {
      onLogout()
    } else {
      // Limpiar tokens usando authUtils
      authUtils.removeToken()
      console.log('Tokens removed, navigating to login')
      // Redirigir al login
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-gradient-to-br dark:from-[#1a1a1a] dark:to-[#2c2c2c] relative transition-colors duration-300">
      {/* Background Pattern */}
      <div className="fixed top-0 left-0 w-full h-full -z-[2] bg-pattern-light dark:bg-pattern"></div>

      {/* Geometric Elements */}
      <div className="fixed top-[10%] left-[5%] w-[200px] h-[200px] border-2 border-black/[0.02] dark:border-white/5 rounded-full rotate-[15deg] -z-[1]"></div>
      <div className="fixed bottom-[15%] right-[10%] w-[150px] h-[150px] border-2 border-black/[0.02] dark:border-white/5 rotate-[30deg] -z-[1]"></div>
      <div className="fixed top-[30%] right-[20%] w-[100px] h-[100px] border-2 border-black/[0.02] dark:border-white/5 rotate-45 -z-[1]"></div>

      <Navbar
        userName={userName || userEmail}
        userImage={userImage}
        notificationCount={notificationCount || unreadCount}
        notifications={notifications}
        onMarkNotificationAsRead={markAsRead}
        onMarkAllNotificationsAsRead={markAllAsRead}
        onClearAllNotifications={clearAll}
        onLogout={handleLogout}
      />

      <main className="py-[30px]">
        <div className="max-w-[1400px] mx-auto px-5">{children}</div>
      </main>

      <Footer />
    </div>
  )
}

export default PageLayout
