import React, { useEffect, useRef } from 'react'

export interface Notification {
  id: string
  type: 'inventory' | 'system' | 'alert'
  title: string
  message: string
  time: string
  icon: string
  iconColor: string
  read: boolean
  actionText?: string
  onAction?: () => void
}

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onClearAll: () => void
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}) => {
  const panelRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-[calc(100%+10px)] w-[400px] max-w-[90vw] bg-white dark:bg-[#2c2c2c] rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden animate-fadeIn z-[2000]"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#e74c3c] to-[#c0392b] text-white p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold">Notificaciones</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-[#e74c3c] transition-colors bg-transparent border-none cursor-pointer text-xl"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <p className="text-sm text-white/80">
          {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
        </p>
      </div>

      {/* Actions */}
      {notifications.length > 0 && (
        <div className="flex gap-2 p-3 bg-[#f5f5f5] dark:bg-[#1a1a1a] border-b border-[#dcdcdc] dark:border-gray-700">
          <button
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex-1 text-xs bg-white dark:bg-[#2c2c2c] border border-[#dcdcdc] dark:border-gray-700 text-[#333] dark:text-white py-2 px-3 rounded font-semibold cursor-pointer transition-colors hover:bg-[#e74c3c] hover:text-white hover:border-[#e74c3c] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-[#2c2c2c] disabled:hover:text-[#333] dark:disabled:hover:text-white disabled:hover:border-[#dcdcdc] dark:disabled:hover:border-gray-700"
          >
            <i className="fas fa-check-double mr-1"></i>
            Marcar todas
          </button>
          <button
            onClick={onClearAll}
            className="flex-1 text-xs bg-white dark:bg-[#2c2c2c] border border-[#dcdcdc] dark:border-gray-700 text-[#e74c3c] py-2 px-3 rounded font-semibold cursor-pointer transition-colors hover:bg-[#e74c3c] hover:text-white hover:border-[#e74c3c]"
          >
            <i className="fas fa-trash mr-1"></i>
            Limpiar todo
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-h-[500px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-12 px-4">
            <i className="fas fa-bell-slash text-5xl text-[#95a5a6] dark:text-gray-500 mb-3"></i>
            <p className="text-[#95a5a6] dark:text-gray-400 text-sm">No tienes notificaciones</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-[#dcdcdc] dark:border-gray-700 transition-colors hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] cursor-pointer ${
                !notification.read ? 'bg-[#f0f8ff] dark:bg-[#1a1a1a]' : ''
              }`}
              onClick={() => {
                if (!notification.read) {
                  onMarkAsRead(notification.id)
                }
              }}
            >
              <div className="flex gap-3">
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.iconColor === 'red'
                      ? 'bg-[#e74c3c]/10'
                      : notification.iconColor === 'orange'
                      ? 'bg-[#e74c3c]/10'
                      : notification.iconColor === 'blue'
                      ? 'bg-[#666]/10'
                      : 'bg-[#666]/10'
                  }`}
                >
                  <i
                    className={`${notification.icon} ${
                      notification.iconColor === 'red'
                        ? 'text-[#e74c3c]'
                        : notification.iconColor === 'orange'
                        ? 'text-[#e74c3c]'
                        : notification.iconColor === 'blue'
                        ? 'text-[#666]'
                        : 'text-[#666]'
                    }`}
                  ></i>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-sm text-[#333] dark:text-white">{notification.title}</h4>
                    {!notification.read && (
                      <span className="flex-shrink-0 w-2 h-2 bg-[#e74c3c] rounded-full ml-2"></span>
                    )}
                  </div>
                  <p className="text-xs text-[#666] dark:text-gray-300 mb-2 line-clamp-2">{notification.message}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#95a5a6] dark:text-gray-400">
                      <i className="far fa-clock mr-1"></i>
                      {notification.time}
                    </span>
                    {notification.actionText && notification.onAction && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          notification.onAction?.()
                          onClose()
                        }}
                        className="text-xs text-[#e74c3c] font-semibold hover:underline bg-transparent border-none cursor-pointer"
                      >
                        {notification.actionText}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 bg-[#f5f5f5] dark:bg-[#1a1a1a] border-t border-[#dcdcdc] dark:border-gray-700 text-center">
          <button
            onClick={onClose}
            className="text-sm text-[#e74c3c] font-semibold hover:underline bg-transparent border-none cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationsPanel
