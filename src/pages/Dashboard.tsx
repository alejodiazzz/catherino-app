import React, { useState, useEffect } from 'react'
import {
  PageLayout,
  SummaryCard,
  ModuleCard,
  KPICard,
  InventoryAlerts,
  ActivityItem,
} from '../components'
import { productService, Product } from '../services/productService'
import { financeService, SoldProductResponse } from '../services/financeService'
import { billingService, Invoice } from '../services/billingService'
import { useNavigate } from 'react-router-dom'

interface DashboardProps {
  onLogout?: () => void
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [soldProducts, setSoldProducts] = useState<SoldProductResponse[]>([])
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSales, setLoadingSales] = useState(true)
  const [loadingInvoices, setLoadingInvoices] = useState(true)

  // Cargar productos al montar el componente
  useEffect(() => {
    loadProducts()
    loadSoldProducts()
    loadRecentInvoices()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productService.getAllProducts()
      setProducts(data)
    } catch (err) {
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSoldProducts = async () => {
    try {
      setLoadingSales(true)
      const data = await financeService.getAllSoldProducts()
      setSoldProducts(data)
    } catch (err) {
      console.error('Error loading sold products:', err)
    } finally {
      setLoadingSales(false)
    }
  }

  const loadRecentInvoices = async () => {
    try {
      setLoadingInvoices(true)
      const data = await billingService.getRecentInvoices()
      setRecentInvoices(data)
    } catch (err) {
      console.error('Error loading recent invoices:', err)
    } finally {
      setLoadingInvoices(false)
    }
  }

  // Generar alertas dinámicas basadas en el stock (igual que en Products)
  const generateInventoryAlerts = () => {
    const alerts: Array<{
      title: string
      time: string
      message: string
      actionText: string
      onAction: () => void
    }> = []

    // Productos con stock crítico (0 unidades)
    const outOfStock = products.filter((p) => p.stock === 0)
    outOfStock.forEach((product) => {
      alerts.push({
        title: 'Stock Agotado',
        time: 'Ahora',
        message: `${product.name} (${product.size}) no tiene unidades disponibles`,
        actionText: 'Ver en inventario',
        onAction: () => navigate('/products'),
      })
    })

    // Productos con stock crítico (1-5 unidades)
    const criticalStock = products.filter((p) => p.stock > 0 && p.stock <= 5)
    criticalStock.forEach((product) => {
      alerts.push({
        title: 'Stock Crítico',
        time: 'Hace 2 horas',
        message: `${product.name} (${product.size}) tiene solo ${product.stock} unidades en stock`,
        actionText: 'Reabastecer ahora',
        onAction: () => navigate('/products'),
      })
    })

    // Productos con stock bajo (6-10 unidades)
    const lowStock = products.filter((p) => p.stock > 5 && p.stock <= 10)
    lowStock.forEach((product) => {
      alerts.push({
        title: 'Stock Bajo',
        time: 'Hace 5 horas',
        message: `${product.name} (${product.size}) ha alcanzado el nivel mínimo de stock (${product.stock} unidades)`,
        actionText: 'Ver detalles',
        onAction: () => navigate('/products'),
      })
    })

    return alerts.slice(0, 6) // Limitar a 6 alertas en el dashboard
  }

  const inventoryAlertsData = generateInventoryAlerts()
  
  // Calcular totales de alertas para mostrar resumen
  const totalOutOfStock = products.filter((p) => p.stock === 0).length
  const totalCriticalStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length
  const totalLowStock = products.filter((p) => p.stock > 5 && p.stock <= 10).length
  const totalAlerts = totalOutOfStock + totalCriticalStock + totalLowStock
  const summaryCards = [
    {
      title: 'Total Productos',
      value: loading ? '...' : products.length.toString(),
      description: 'Productos en inventario',
      icon: 'fas fa-box',
      iconColor: 'red' as const,
    },
    {
      title: 'Ventas Hoy',
      value: '$4,850',
      description: '32 ventas realizadas',
      icon: 'fas fa-shopping-cart',
      iconColor: 'gray' as const,
    },
    {
      title: 'Bajo Stock',
      value: loading ? '...' : products.filter((p) => p.stock <= 10).length.toString(),
      description: 'Productos necesitan reabastecimiento',
      icon: 'fas fa-exclamation-triangle',
      iconColor: 'red' as const,
    },
    {
      title: 'Valor Inventario',
      value: loading
        ? '...'
        : `$${Math.round(
            products.reduce((sum, p) => {
              const purchasePrice = p.purchasePrice || 0
              return sum + Number(purchasePrice) * Number(p.stock)
            }, 0)
          ).toLocaleString('es-ES')}`,
      description: 'Basado en precio de compra',
      icon: 'fas fa-dollar-sign',
      iconColor: 'gray' as const,
    },
  ]

  const modules = [
    {
      title: 'Gestión de Productos',
      description: loading
        ? 'Cargando información...'
        : totalAlerts > 0
        ? `${products.length} productos • ${totalAlerts} alertas activas`
        : `${products.length} productos en inventario`,
      icon: 'fas fa-boxes',
      headerColor: '#e74c3c',
      link: '/products',
    },
    {
      title: 'Ventas',
      description: 'Registra y gestiona las ventas del negocio',
      icon: 'fas fa-shopping-cart',
      headerColor: '#666',
      link: '/sales',
    },
    {
      title: 'Facturas',
      description: 'Genera y administra facturas electrónicas',
      icon: 'fas fa-file-invoice-dollar',
      headerColor: '#95a5a6',
      link: '/invoices',
    },
    {
      title: 'Reportes',
      description: 'Visualiza estadísticas y genera reportes',
      icon: 'fas fa-chart-bar',
      headerColor: '#666',
      link: '/reports',
    },
  ]

  // Generar actividades detalladas basadas en facturas reales (últimas 5)
  const generateActivities = () => {
    const activities: Array<{
      title: string
      time: string
      icon: string
      iconColor: 'gray' | 'red'
    }> = []

    // Tomar solo las últimas 5 facturas
    const lastFiveInvoices = recentInvoices.slice(0, 5)

    lastFiveInvoices.forEach((invoice) => {
      const date = new Date(invoice.issueDate)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      let timeAgo = ''
      if (diffMins < 1) {
        timeAgo = 'Hace un momento'
      } else if (diffMins < 60) {
        timeAgo = `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`
      } else if (diffHours < 24) {
        timeAgo = `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
      } else {
        timeAgo = `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`
      }

      if (invoice.status === 'CANCELLED') {
        // Factura cancelada
        const productNames = invoice.details
          .slice(0, 2)
          .map((d) => `${d.productName} (${d.quantity})`)
          .join(', ')
        const moreProducts = invoice.details.length > 2 ? ` +${invoice.details.length - 2} más` : ''

        activities.push({
          title: `${productNames}${moreProducts} - CANCELADA`,
          time: `${timeAgo} - ${invoice.invoiceNumber} • Cliente: ${invoice.customer.name}`,
          icon: 'fas fa-ban',
          iconColor: 'red',
        })
      } else {
        // Venta exitosa - mostrar resumen de productos primero
        const productNames = invoice.details
          .slice(0, 2)
          .map((d) => `${d.productName} (${d.quantity})`)
          .join(', ')
        const moreProducts = invoice.details.length > 2 ? ` +${invoice.details.length - 2} más` : ''

        activities.push({
          title: `${productNames}${moreProducts} - Ganancia: $${Math.round(invoice.totalProfit).toLocaleString('es-ES')}`,
          time: `${timeAgo} - ${invoice.invoiceNumber} • Total: $${Math.round(invoice.total).toLocaleString('es-ES')}`,
          icon: 'fas fa-shopping-bag',
          iconColor: 'gray',
        })
      }
    })

    return activities
  }

  const activities = generateActivities()

  return (
    <PageLayout onLogout={onLogout}>
      {/* KPIs Section */}
      <section className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-[25px] mb-[30px]">
        {summaryCards.map((card, index) => (
          <SummaryCard key={index} {...card} />
        ))}
      </section>

      {/* Alerts Section */}
      {!loading && inventoryAlertsData.length > 0 && (
        <section className="mb-[30px]">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-[22px] text-[#1a1a1a] font-montserrat font-bold">
              Alertas de Inventario
            </h2>
            {totalAlerts > 6 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#95a5a6]">
                  Mostrando 6 de {totalAlerts} alertas
                </span>
                <button
                  onClick={() => navigate('/products')}
                  className="text-[#e74c3c] font-semibold hover:underline bg-transparent border-none cursor-pointer"
                >
                  Ver todas
                </button>
              </div>
            )}
          </div>
          <InventoryAlerts alerts={inventoryAlertsData} title="" />
          {totalAlerts > 6 && (
            <div className="mt-4 bg-[#f0f8ff] border border-[#e74c3c] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="fas fa-info-circle text-[#e74c3c] text-xl"></i>
                  <div>
                    <p className="text-sm font-semibold text-[#333]">
                      Resumen de Alertas
                    </p>
                    <p className="text-xs text-[#666]">
                      {totalOutOfStock} agotados • {totalCriticalStock} críticos • {totalLowStock} stock bajo
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/products')}
                  className="bg-[#e74c3c] text-white py-2 px-4 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#c0392b] border-none text-sm"
                >
                  <i className="fas fa-boxes mr-2"></i>
                  Ir a Productos
                </button>
              </div>
            </div>
          )}
        </section>
      )}
      {!loading && inventoryAlertsData.length === 0 && (
        <section className="mb-[30px]">
          <h2 className="text-[22px] mb-5 text-[#1a1a1a] font-montserrat font-bold">
            Alertas de Inventario
          </h2>
          <div className="bg-white rounded-lg p-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-center">
            <i className="fas fa-check-circle text-6xl text-[#666] mb-4"></i>
            <p className="text-[#333] text-lg font-semibold mb-2">
              ¡Todo en orden!
            </p>
            <p className="text-[#95a5a6]">
              No hay alertas de inventario en este momento
            </p>
          </div>
        </section>
      )}

      {/* Modules Section */}
      <section className="mb-[30px]">
        <h2 className="text-[22px] mb-5 text-[#1a1a1a] font-montserrat font-bold">
          Módulos del Sistema
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-[25px]">
          {modules.map((module, index) => (
            <ModuleCard key={index} {...module} />
          ))}
        </div>
      </section>

      {/* Financial Summary */}
      <section className="grid grid-cols-[2fr_1fr] gap-[25px] mb-[30px] max-lg:grid-cols-1">
        <div className="bg-white dark:bg-[#2c2c2c] rounded-lg p-[25px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
          <div className="flex justify-between items-start mb-5">
            <div className="flex-1">
              <h3 className="text-lg text-[#1a1a1a] dark:text-white font-montserrat font-bold">
                Productos Más Vendidos
              </h3>
              <p className="text-xs text-[#95a5a6] dark:text-gray-400 mt-1">
                Top 5 productos del último mes
              </p>
            </div>
            <button
              onClick={() => navigate('/sales')}
              className="flex-shrink-0 ml-4 text-sm text-[#e74c3c] font-semibold hover:underline bg-transparent border-none cursor-pointer whitespace-nowrap"
            >
              Ver ventas
            </button>
          </div>
          {loadingSales ? (
            <div className="h-[300px] flex justify-center items-center">
              <i className="fas fa-spinner fa-spin text-4xl text-[#e74c3c]"></i>
            </div>
          ) : soldProducts.length === 0 ? (
            <div className="h-[300px] bg-[#f5f5f5] dark:bg-[#1a1a1a] rounded flex flex-col justify-center items-center text-[#95a5a6] dark:text-gray-400">
              <i className="fas fa-chart-line text-5xl mb-3"></i>
              <p>No hay datos de ventas disponibles</p>
              <p className="text-xs mt-2">Realiza algunas ventas para ver estadísticas</p>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center gap-8">
              {/* Gráfico Circular */}
              <div className="relative w-[200px] h-[200px]">
                <svg viewBox="0 0 200 200" className="transform -rotate-90">
                  {(() => {
                    // Usar datos reales de ventas del Finance Service
                    const topProducts = soldProducts
                      .sort((a, b) => b.totalSold - a.totalSold) // Ordenar por más vendidos
                      .slice(0, 5)

                    if (topProducts.length === 0) {
                      return (
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#f5f5f5"
                          strokeWidth="40"
                        />
                      )
                    }

                    // Usar datos reales de ventas
                    const totalSales = topProducts.reduce((sum, p) => sum + p.totalSold, 0)

                    const colors = ['#e74c3c', '#c0392b', '#95a5a6', '#7f8c8d', '#666']
                    let currentAngle = 0
                    const radius = 80
                    const centerX = 100
                    const centerY = 100

                    return (
                      <>
                        {topProducts.map((product, index) => {
                          const percentage = (product.totalSold / totalSales) * 100
                          const angle = (percentage / 100) * 360
                          const startAngle = currentAngle
                          const endAngle = currentAngle + angle

                          // Convertir ángulos a radianes
                          const startRad = (startAngle * Math.PI) / 180
                          const endRad = (endAngle * Math.PI) / 180

                          // Calcular puntos del arco
                          const x1 = centerX + radius * Math.cos(startRad)
                          const y1 = centerY + radius * Math.sin(startRad)
                          const x2 = centerX + radius * Math.cos(endRad)
                          const y2 = centerY + radius * Math.sin(endRad)

                          const largeArcFlag = angle > 180 ? 1 : 0

                          const pathData = `
                            M ${centerX} ${centerY}
                            L ${x1} ${y1}
                            A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
                            Z
                          `

                          currentAngle += angle

                          return (
                            <path
                              key={product.productId}
                              d={pathData}
                              fill={colors[index]}
                              className="transition-opacity hover:opacity-80 cursor-pointer"
                              onClick={() => navigate('/sales')}
                            />
                          )
                        })}
                        {/* Círculo interior para efecto donut */}
                        <circle cx="100" cy="100" r="50" className="fill-white dark:fill-[#2c2c2c]" />
                      </>
                    )
                  })()}
                </svg>
                {/* Texto central */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-[#333] dark:text-white">Top 5</span>
                  <span className="text-xs text-[#95a5a6] dark:text-gray-400">Más Vendidos</span>
                </div>
              </div>

              {/* Leyenda */}
              <div className="flex-1 space-y-3">
                {(() => {
                  const topProducts = soldProducts
                    .sort((a, b) => b.totalSold - a.totalSold)
                    .slice(0, 5)

                  if (topProducts.length === 0) {
                    return (
                      <div className="text-center text-[#95a5a6] text-sm">
                        <i className="fas fa-info-circle mb-2"></i>
                        <p>No hay datos de ventas disponibles</p>
                      </div>
                    )
                  }

                  const totalSales = topProducts.reduce((sum, p) => sum + p.totalSold, 0)
                  const colors = ['#e74c3c', '#c0392b', '#95a5a6', '#7f8c8d', '#666']

                  return topProducts.map((product, index) => {
                    const percentage = ((product.totalSold / totalSales) * 100).toFixed(1)

                    return (
                      <div
                        key={product.productId}
                        className="flex items-center gap-3 cursor-pointer hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] p-2 rounded transition-colors"
                        onClick={() => navigate('/sales')}
                      >
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colors[index] }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-[#333] dark:text-white truncate">
                              {product.productName}
                            </span>
                            <span className="text-sm font-bold text-[#333] dark:text-white ml-2">
                              {percentage}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-[#95a5a6] dark:text-gray-400">
                              Código: {product.productCode}
                            </span>
                            <span className="text-xs font-semibold text-[#e74c3c]">
                              {product.totalSold} vendidos
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-[#666] dark:text-gray-300">
                              Ingresos: ${Math.round(product.totalRevenue).toLocaleString('es-ES')}
                            </span>
                            <span className="text-xs text-[#e74c3c]">
                              Ganancia: ${Math.round(product.totalProfit).toLocaleString('es-ES')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div
            onClick={() => navigate('/reports')}
            className="cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <KPICard
              title="Valor Total Inventario"
              value={
                loading
                  ? '...'
                  : `$${Math.round(
                      products.reduce((sum, p) => {
                        const purchasePrice = p.purchasePrice || 0
                        return sum + Number(purchasePrice) * Number(p.stock)
                      }, 0)
                    ).toLocaleString('es-ES')}`
              }
              change={`${products.length} productos en stock`}
              changeType="neutral"
            />
          </div>
          <div
            onClick={() => navigate('/products')}
            className="cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <KPICard
              title="Productos con Stock Crítico"
              value={loading ? '...' : (totalCriticalStock + totalOutOfStock).toString()}
              change={
                totalCriticalStock + totalOutOfStock > 0
                  ? 'Requieren atención inmediata'
                  : 'Todo en orden'
              }
              changeType={totalCriticalStock + totalOutOfStock > 0 ? 'negative' : 'positive'}
            />
          </div>
          <div
            onClick={() => navigate('/products')}
            className="cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <KPICard
              title="Producto con Más Stock"
              value={
                loading
                  ? '...'
                  : products.length > 0
                  ? products.reduce((max, p) => (p.stock > max.stock ? p : max), products[0]).name
                  : 'N/A'
              }
              change={
                loading
                  ? '...'
                  : products.length > 0
                  ? `${products.reduce((max, p) => (p.stock > max.stock ? p : max), products[0]).stock} unidades disponibles`
                  : 'Sin productos'
              }
              changeType="neutral"
            />
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="mb-[30px]">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-[22px] text-[#1a1a1a] font-montserrat font-bold">
              Últimas Ventas
            </h2>
            <p className="text-xs text-[#95a5a6] mt-1">
              Resumen de las 5 ventas más recientes
            </p>
          </div>
          <button
            onClick={() => navigate('/invoices')}
            className="text-sm text-[#e74c3c] font-semibold hover:underline bg-transparent border-none cursor-pointer"
          >
            Ver todas las facturas
          </button>
        </div>
        <div className="bg-white rounded-lg p-[25px] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
          {loadingInvoices ? (
            <div className="text-center py-8">
              <i className="fas fa-spinner fa-spin text-3xl text-[#e74c3c] mb-3"></i>
              <p className="text-[#95a5a6]">Cargando ventas recientes...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-shopping-bag text-5xl text-[#95a5a6] mb-3"></i>
              <p className="text-[#333] font-semibold mb-2">No hay ventas registradas</p>
              <p className="text-[#95a5a6] text-sm mb-4">
                Las ventas aparecerán aquí cuando se procesen facturas
              </p>
              <button
                onClick={() => navigate('/sales')}
                className="bg-[#666] text-white py-2 px-6 rounded-md font-semibold hover:bg-[#555] border-none cursor-pointer"
              >
                <i className="fas fa-plus mr-2"></i>
                Realizar primera venta
              </button>
            </div>
          ) : (
            <ul className="list-none">
              {activities.map((activity, index) => (
                <ActivityItem key={index} {...activity} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </PageLayout>
  )
}

export default Dashboard

