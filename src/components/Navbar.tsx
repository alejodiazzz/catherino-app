import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import NotificationsPanel, { Notification } from './NotificationsPanel'
import { useTheme } from '../contexts/ThemeContext'

interface NavbarProps {
  userName?: string
  userImage?: string | null
  notificationCount?: number
  notifications?: Notification[]
  onMarkNotificationAsRead?: (id: string) => void
  onMarkAllNotificationsAsRead?: () => void
  onClearAllNotifications?: () => void
  onLogout?: () => void
}

const Navbar: React.FC<NavbarProps> = ({
  userName = 'Admin',
  userImage = null,
  notificationCount = 0,
  notifications = [],
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearAllNotifications,
  onLogout,
}) => {
  // Icono por defecto si no hay imagen
  const defaultUserIcon = (
    <div className="w-10 h-10 rounded-full bg-[#e74c3c] flex items-center justify-center text-white font-bold text-lg border-2 border-white/20">
      {userName.charAt(0).toUpperCase()}
    </div>
  )
  const location = useLocation()
  const navigate = useNavigate()
  const { isDarkMode, toggleTheme } = useTheme()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => {
    return location.pathname === path
  }

  // Cerrar el menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    console.log('Logout clicked')
    if (onLogout) {
      console.log('Calling onLogout prop')
      onLogout()
    } else {
      console.log('Using default logout')
      // Limpiar tokens
      localStorage.removeItem('authToken')
      sessionStorage.removeItem('authToken')
      // Redirigir al login
      navigate('/login')
    }
    setIsUserMenuOpen(false)
  }

  const handleProfile = () => {
    navigate('/profile')
    setIsUserMenuOpen(false)
  }

  return (
    <header className="bg-gradient-to-br from-[#1a1a1a] to-[#2c2c2c] text-white py-[15px] sticky top-0 z-[1000] shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
      <div className="max-w-[1400px] mx-auto px-5 flex justify-between items-center">
        <Link
          to="/dashboard"
          className="text-[28px] font-bold tracking-[1px] font-montserrat no-underline text-white hover:text-white"
        >
          Cather<span className="text-[#e74c3c]">ino</span>
        </Link>
        <nav>
          <ul className="flex list-none">
            <li className="ml-[30px]">
              <Link
                to="/dashboard"
                className={`no-underline font-semibold transition-colors hover:text-[#e74c3c] ${
                  isActive('/dashboard') ? 'text-[#e74c3c]' : 'text-white'
                }`}
              >
                Inicio
              </Link>
            </li>
            <li className="ml-[30px]">
              <Link
                to="/products"
                className={`no-underline font-semibold transition-colors hover:text-[#e74c3c] ${
                  isActive('/products') ? 'text-[#e74c3c]' : 'text-white'
                }`}
              >
                Productos
              </Link>
            </li>
            <li className="ml-[30px]">
              <Link
                to="/sales"
                className={`no-underline font-semibold transition-colors hover:text-[#e74c3c] ${
                  isActive('/sales') ? 'text-[#e74c3c]' : 'text-white'
                }`}
              >
                Ventas
              </Link>
            </li>
            <li className="ml-[30px]">
              <Link
                to="/reports"
                className={`no-underline font-semibold transition-colors hover:text-[#e74c3c] ${
                  isActive('/reports') ? 'text-[#e74c3c]' : 'text-white'
                }`}
              >
                Reportes
              </Link>
            </li>
            <li className="ml-[30px]">
              <Link
                to="/invoices"
                className={`no-underline font-semibold transition-colors hover:text-[#e74c3c] ${
                  isActive('/invoices') ? 'text-[#e74c3c]' : 'text-white'
                }`}
              >
                Facturas
              </Link>
            </li>
          </ul>
        </nav>
        <div className="flex items-center gap-5">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative cursor-pointer hover:text-[#e74c3c] transition-colors bg-transparent border-none text-white"
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? (
              <i className="fas fa-sun text-lg"></i>
            ) : (
              <i className="fas fa-moon text-lg"></i>
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative cursor-pointer hover:text-[#e74c3c] transition-colors bg-transparent border-none text-white"
            >
              <i className="fas fa-bell text-lg"></i>
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#e74c3c] text-white rounded-full w-5 h-5 flex justify-center items-center text-xs font-bold animate-pulse">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {/* Notifications Panel */}
            <NotificationsPanel
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              notifications={notifications}
              onMarkAsRead={(id) => {
                onMarkNotificationAsRead?.(id)
              }}
              onMarkAllAsRead={() => {
                onMarkAllNotificationsAsRead?.()
              }}
              onClearAll={() => {
                onClearAllNotifications?.()
                setIsNotificationsOpen(false)
              }}
            />
          </div>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity"
            >
              {userImage ? (
                <img
                  src={userImage}
                  alt="Usuario"
                  className="w-10 h-10 rounded-full border-2 border-white/20"
                  onError={(e) => {
                    // Si la imagen falla al cargar, mostrar el icono por defecto
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                defaultUserIcon
              )}
              <i
                className={`fas fa-chevron-down text-white text-sm transition-transform ${
                  isUserMenuOpen ? 'rotate-180' : ''
                }`}
              ></i>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-[200px] bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] overflow-hidden animate-fadeIn">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-[#dcdcdc] bg-[#f5f5f5]">
                  <p className="text-sm font-semibold text-[#333] truncate">{userName}</p>
                  <p className="text-xs text-[#95a5a6]">Administrador</p>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={handleProfile}
                    className="w-full px-4 py-2 text-left text-[#333] hover:bg-[#f5f5f5] transition-colors flex items-center gap-3 border-none bg-transparent cursor-pointer"
                  >
                    <i className="fas fa-user text-[#e74c3c]"></i>
                    <span className="text-sm font-medium">Mi Perfil</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-[#e74c3c] hover:bg-red-50 transition-colors flex items-center gap-3 border-none bg-transparent cursor-pointer"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    <span className="text-sm font-medium">Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
