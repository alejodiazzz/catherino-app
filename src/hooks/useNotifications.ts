import { useState, useEffect } from 'react'
import { Notification } from '../components/NotificationsPanel'
import { productService, Product } from '../services/productService'

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Cargar productos y generar notificaciones
  useEffect(() => {
    loadProductsAndGenerateNotifications()
    
    // Actualizar cada 5 minutos
    const interval = setInterval(() => {
      loadProductsAndGenerateNotifications()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const loadProductsAndGenerateNotifications = async () => {
    try {
      const data = await productService.getAllProducts()
      generateNotifications(data)
    } catch (error) {
      console.error('Error loading products for notifications:', error)
    }
  }

  const generateNotifications = (productList: Product[]) => {
    const newNotifications: Notification[] = []

    // Notificaciones de stock agotado
    const outOfStock = productList.filter((p) => p.stock === 0)
    outOfStock.forEach((product, index) => {
      newNotifications.push({
        id: `out-of-stock-${product.id}-${index}`,
        type: 'inventory',
        title: 'Stock Agotado',
        message: `${product.name} (${product.size}) no tiene unidades disponibles`,
        time: 'Ahora',
        icon: 'fas fa-exclamation-circle',
        iconColor: 'red',
        read: false,
      })
    })

    // Notificaciones de stock crítico (1-5 unidades)
    const criticalStock = productList.filter((p) => p.stock > 0 && p.stock <= 5)
    criticalStock.forEach((product, index) => {
      newNotifications.push({
        id: `critical-stock-${product.id}-${index}`,
        type: 'alert',
        title: 'Stock Crítico',
        message: `${product.name} (${product.size}) tiene solo ${product.stock} unidades`,
        time: 'Hace 2 horas',
        icon: 'fas fa-exclamation-triangle',
        iconColor: 'orange',
        read: false,
      })
    })

    // Notificaciones de stock bajo (6-10 unidades)
    const lowStock = productList.filter((p) => p.stock > 5 && p.stock <= 10)
    lowStock.forEach((product, index) => {
      newNotifications.push({
        id: `low-stock-${product.id}-${index}`,
        type: 'inventory',
        title: 'Stock Bajo',
        message: `${product.name} (${product.size}) ha alcanzado el nivel mínimo (${product.stock} unidades)`,
        time: 'Hace 5 horas',
        icon: 'fas fa-box',
        iconColor: 'orange',
        read: false,
      })
    })

    // Notificación de resumen si hay muchas alertas
    if (newNotifications.length > 10) {
      const summary: Notification = {
        id: 'summary-alert',
        type: 'system',
        title: 'Resumen de Inventario',
        message: `Tienes ${outOfStock.length} productos agotados, ${criticalStock.length} en stock crítico y ${lowStock.length} con stock bajo`,
        time: 'Hace 1 hora',
        icon: 'fas fa-chart-line',
        iconColor: 'blue',
        read: false,
      }
      newNotifications.unshift(summary)
    }

    // Notificación de bienvenida si no hay alertas
    if (newNotifications.length === 0) {
      newNotifications.push({
        id: 'welcome',
        type: 'system',
        title: '¡Todo en orden!',
        message: 'Tu inventario está en buen estado. No hay alertas críticas en este momento.',
        time: 'Hace 10 min',
        icon: 'fas fa-check-circle',
        iconColor: 'green',
        read: false,
      })
    }

    // Limitar a 15 notificaciones
    setNotifications(newNotifications.slice(0, 15))
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    refreshNotifications: loadProductsAndGenerateNotifications,
  }
}
