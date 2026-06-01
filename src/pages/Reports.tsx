import React, { useState, useEffect } from 'react'
import { PageLayout, PageHeader } from '../components'
import { financeService, SoldProductResponse, ProfitResponse, TimeRangeComparison } from '../services/financeService'
import { billingService, Invoice } from '../services/billingService'
import { useTheme } from '../contexts/ThemeContext'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ReportsProps {
  onLogout?: () => void
}

const Reports: React.FC<ReportsProps> = ({ onLogout }) => {
  const { isDarkMode } = useTheme()
  
  // Estado de pestaña activa
  const [activeTab, setActiveTab] = useState<'daily' | 'general'>('daily')

  // Estados para fechas
  const [dailyDate, setDailyDate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Estados para datos diarios
  const [dailySoldProducts, setDailySoldProducts] = useState<SoldProductResponse[]>([])
  const [dailyProfitData, setDailyProfitData] = useState<ProfitResponse | null>(null)

  // Estados para datos generales
  const [soldProducts, setSoldProducts] = useState<SoldProductResponse[]>([])
  const [profitData, setProfitData] = useState<ProfitResponse | null>(null)
  const [comparisonData, setComparisonData] = useState<TimeRangeComparison[]>([])
  
  // Estados para comparación personalizada de períodos
  const [comparison1Start, setComparison1Start] = useState('')
  const [comparison1End, setComparison1End] = useState('')
  const [comparison2Start, setComparison2Start] = useState('')
  const [comparison2End, setComparison2End] = useState('')
  const [loadingComparison, setLoadingComparison] = useState(false)

  // Estados para popups
  const [showInvoicesPopup, setShowInvoicesPopup] = useState(false)
  const [showProductsPopup, setShowProductsPopup] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  
  // Modal de detalles de factura
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Sistema de notificaciones
  const [notification, setNotification] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'warning'
  }>({ show: false, message: '', type: 'success' })

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ show: true, message, type })
  }

  const closeNotification = () => {
    setNotification({ show: false, message: '', type: 'success' })
  }

  // Función para obtener fecha local en formato YYYY-MM-DD
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Inicializar fechas
  useEffect(() => {
    const today = new Date()
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
    
    // Fecha de hoy para informe diario (usando hora local de Colombia)
    setDailyDate(getLocalDateString(today))
    
    // Último mes para reportes generales
    setEndDate(getLocalDateString(today))
    setStartDate(getLocalDateString(lastMonth))
    
    // Marcar como inicializado
    setInitialized(true)
  }, [])

  // Cargar informe diario automáticamente cuando se inicializa
  useEffect(() => {
    if (initialized && dailyDate && activeTab === 'daily') {
      loadDailyData(false)
    }
  }, [initialized, activeTab])

  // Cargar reportes generales automáticamente cuando se inicializa
  useEffect(() => {
    if (initialized && startDate && endDate && activeTab === 'general') {
      loadGeneralData(false)
    }
  }, [initialized, activeTab])

  // Convertir fecha a formato ISO 8601 usando hora local
  const toISODateTime = (dateStr: string, isEndDate: boolean = false): string => {
    // Crear fecha en hora local (no UTC)
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    
    if (isEndDate) {
      date.setHours(23, 59, 59, 999)
    } else {
      date.setHours(0, 0, 0, 0)
    }
    
    // Formatear manualmente para evitar conversión a UTC
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    const ss = String(date.getSeconds()).padStart(2, '0')
    
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`
  }

  // Cargar informe diario
  const loadDailyData = async (showNotif: boolean = true) => {
    if (!dailyDate) {
      if (showNotif) showNotification('Por favor, selecciona una fecha', 'warning')
      return
    }

    try {
      setLoading(true)

      const startDateTime = toISODateTime(dailyDate, false)
      const endDateTime = toISODateTime(dailyDate, true)

      // Usar compareSalesByTimeRanges para obtener totalRevenue
      const [comparison] = await financeService.compareSalesByTimeRanges([
        {
          startDate: startDateTime,
          endDate: endDateTime,
          label: 'Informe del Día'
        }
      ])

      // Convertir TimeRangeComparison a ProfitResponse
      const dailyData: ProfitResponse = {
        startDate: comparison.startDate,
        endDate: comparison.endDate,
        totalProfit: comparison.totalProfit,
        totalInvoices: comparison.totalSales,
        totalProductsSold: comparison.totalProductsSold
      }

      // Guardar también los ingresos totales
      setDailySoldProducts([{
        productId: 'daily-revenue',
        productName: 'Total Ingresos',
        productCode: '',
        totalSold: 0,
        totalRevenue: comparison.totalRevenue,
        totalProfit: comparison.totalProfit
      }])
      
      setDailyProfitData(dailyData)

      if (showNotif) showNotification('Informe diario cargado exitosamente', 'success')
    } catch (err: any) {
      console.error('Error al cargar informe diario:', err)
      if (showNotif) showNotification(err.response?.data?.message || 'Error al cargar el informe diario', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Cargar reportes generales
  const loadGeneralData = async (showNotif: boolean = true) => {
    if (!startDate || !endDate) {
      if (showNotif) showNotification('Por favor, selecciona un rango de fechas', 'warning')
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      if (showNotif) showNotification('La fecha de inicio debe ser anterior a la fecha de fin', 'error')
      return
    }

    try {
      setLoading(true)

      const startDateTime = toISODateTime(startDate, false)
      const endDateTime = toISODateTime(endDate, true)

      // Cargar datos en paralelo
      const [productsData, profits] = await Promise.all([
        financeService.getAllSoldProducts(),
        financeService.getProfitsByTimeRange({
          startDate: startDateTime,
          endDate: endDateTime,
          label: 'Período Actual'
        })
      ])

      setSoldProducts(productsData)
      setProfitData(profits)

      // Calcular período anterior para comparación
      const startDateObj = new Date(startDate)
      const endDateObj = new Date(endDate)
      const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24))
      
      const prevEndDate = new Date(startDateObj)
      prevEndDate.setDate(prevEndDate.getDate() - 1)
      const prevStartDate = new Date(prevEndDate)
      prevStartDate.setDate(prevStartDate.getDate() - daysDiff)

      // Comparar con período anterior
      const comparison = await financeService.compareSalesByTimeRanges([
        {
          startDate: toISODateTime(prevStartDate.toISOString().split('T')[0], false),
          endDate: toISODateTime(prevEndDate.toISOString().split('T')[0], true),
          label: 'Período Anterior'
        },
        {
          startDate: startDateTime,
          endDate: endDateTime,
          label: 'Período Actual'
        }
      ])

      setComparisonData(comparison)

      if (showNotif) showNotification('Reportes generales cargados exitosamente', 'success')
    } catch (err: any) {
      console.error('Error al cargar reportes generales:', err)
      if (showNotif) showNotification(err.response?.data?.message || 'Error al cargar los reportes', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Calcular métricas para informe diario
  const calculateDailyMetrics = () => {
    if (!dailyProfitData || dailySoldProducts.length === 0) return null

    // Obtener los ingresos del producto temporal que guardamos
    const totalRevenue = dailySoldProducts[0]?.totalRevenue || 0
    const totalProfit = dailyProfitData.totalProfit
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    return {
      totalRevenue,
      totalProfit,
      profitMargin
    }
  }

  // Calcular métricas para reportes generales
  const calculateGeneralMetrics = () => {
    if (!profitData || soldProducts.length === 0) return null

    const totalRevenue = soldProducts.reduce((sum, p) => sum + p.totalRevenue, 0)
    const totalProfit = soldProducts.reduce((sum, p) => sum + p.totalProfit, 0)
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    // Top 10 productos por ventas
    const topByRevenue = [...soldProducts]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)

    // Top 10 productos por ganancia
    const topByProfit = [...soldProducts]
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 10)

    // Top 10 productos por cantidad
    const topByQuantity = [...soldProducts]
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10)

    // Calcular crecimiento
    let growth = 0
    if (comparisonData.length === 2) {
      const prev = comparisonData[0].totalRevenue
      const current = comparisonData[1].totalRevenue
      growth = prev > 0 ? ((current - prev) / prev) * 100 : 0
    }

    return {
      totalRevenue,
      totalProfit,
      profitMargin,
      topByRevenue,
      topByProfit,
      topByQuantity,
      growth
    }
  }

  const dailyMetrics = calculateDailyMetrics()
  const generalMetrics = calculateGeneralMetrics()

  // Cargar facturas cuando se abre el popup
  const loadInvoices = async () => {
    setLoadingInvoices(true)
    try {
      const start = activeTab === 'daily' ? dailyDate : startDate
      const end = activeTab === 'daily' ? dailyDate : endDate
      
      const invoicesData = await billingService.getInvoicesByDateRange(start, end)
      setInvoices(invoicesData)
    } catch (err: any) {
      console.error('Error al cargar facturas:', err)
      showNotification('Error al cargar las facturas', 'error')
    } finally {
      setLoadingInvoices(false)
    }
  }

  // Procesar productos vendidos desde las facturas
  const getProductsFromInvoices = (): SoldProductResponse[] => {
    if (invoices.length === 0) return []

    // Agrupar productos por ID
    const productsMap = new Map<string, {
      productId: string
      productName: string
      productCode: string
      totalSold: number
      totalRevenue: number
      totalProfit: number
    }>()

    // Solo considerar facturas emitidas (no canceladas)
    const issuedInvoices = invoices.filter(inv => inv.status === 'ISSUED')

    issuedInvoices.forEach(invoice => {
      invoice.details.forEach(detail => {
        const existing = productsMap.get(detail.productId)
        
        if (existing) {
          existing.totalSold += detail.quantity
          existing.totalRevenue += detail.subtotal
          existing.totalProfit += detail.profit
        } else {
          productsMap.set(detail.productId, {
            productId: detail.productId,
            productName: detail.productName,
            productCode: detail.productCode,
            totalSold: detail.quantity,
            totalRevenue: detail.subtotal,
            totalProfit: detail.profit
          })
        }
      })
    })

    return Array.from(productsMap.values())
  }

  // Cargar facturas cuando se abre el popup de facturas
  useEffect(() => {
    if (showInvoicesPopup) {
      loadInvoices()
    }
  }, [showInvoicesPopup])

  // Cargar facturas cuando se abre el popup de productos (para obtener los productos)
  useEffect(() => {
    if (showProductsPopup && invoices.length === 0) {
      loadInvoices()
    }
  }, [showProductsPopup])

  // Abrir modal de detalles de factura
  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowDetailsModal(true)
  }

  // Cerrar modal de detalles
  const closeDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedInvoice(null)
  }

  // Cargar comparación personalizada de períodos
  const loadCustomComparison = async () => {
    if (!comparison1Start || !comparison1End || !comparison2Start || !comparison2End) {
      showNotification('Por favor, completa todas las fechas de comparación', 'warning')
      return
    }

    if (new Date(comparison1Start) > new Date(comparison1End)) {
      showNotification('La fecha de inicio del Período 1 debe ser anterior a su fecha de fin', 'error')
      return
    }

    if (new Date(comparison2Start) > new Date(comparison2End)) {
      showNotification('La fecha de inicio del Período 2 debe ser anterior a su fecha de fin', 'error')
      return
    }

    try {
      setLoadingComparison(true)

      const comparison = await financeService.compareSalesByTimeRanges([
        {
          startDate: toISODateTime(comparison1Start, false),
          endDate: toISODateTime(comparison1End, true),
          label: 'Período 1'
        },
        {
          startDate: toISODateTime(comparison2Start, false),
          endDate: toISODateTime(comparison2End, true),
          label: 'Período 2'
        }
      ])

      setComparisonData(comparison)
    } catch (err: any) {
      console.error('Error al cargar comparación:', err)
      showNotification(err.response?.data?.message || 'Error al cargar la comparación', 'error')
    } finally {
      setLoadingComparison(false)
    }
  }

  // Generar PDF de una factura
  const handleGenerateInvoicePDF = (invoice: Invoice) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      showNotification('Por favor, permite las ventanas emergentes para generar el PDF', 'warning')
      return
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Factura ${invoice.invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            color: #333;
          }
          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .totals {
            text-align: right;
            margin-top: 20px;
          }
          .totals div {
            margin: 5px 0;
          }
          .total-final {
            font-size: 18px;
            font-weight: bold;
            color: #666;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #333;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          .status {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 5px;
            font-weight: bold;
            font-size: 12px;
          }
          .status-issued {
            background-color: #f5f5f5;
            color: #666;
          }
          .status-cancelled {
            background-color: #f8d7da;
            color: #721c24;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FACTURA DE VENTA</h1>
          <p>Catherino - Sistema de Gestión</p>
        </div>

        <div class="invoice-info">
          <div>
            <div class="section-title">Factura N°:</div>
            <div>${invoice.invoiceNumber}</div>
          </div>
          <div>
            <div class="section-title">Fecha:</div>
            <div>${new Date(invoice.issueDate).toLocaleString('es-ES')}</div>
          </div>
          <div>
            <div class="section-title">Estado:</div>
            <div>
              <span class="status ${invoice.status === 'ISSUED' ? 'status-issued' : 'status-cancelled'}">
                ${invoice.status === 'ISSUED' ? 'EMITIDA' : 'CANCELADA'}
              </span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Cajero:</div>
          <div>${invoice.cashier}</div>
        </div>

        <div class="section">
          <div class="section-title">Cliente:</div>
          <div><strong>Nombre:</strong> ${invoice.customer.name}</div>
          <div><strong>Documento:</strong> ${invoice.customer.documentNumber}</div>
          ${invoice.customer.email ? `<div><strong>Email:</strong> ${invoice.customer.email}</div>` : ''}
          ${invoice.customer.phone ? `<div><strong>Teléfono:</strong> ${invoice.customer.phone}</div>` : ''}
        </div>

        <div class="section">
          <div class="section-title">Detalle de Productos:</div>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Código</th>
                <th style="text-align: center;">Cantidad</th>
                <th style="text-align: right;">Precio Unit.</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.details.map((detail) => `
                <tr>
                  <td>${detail.productName}</td>
                  <td>${detail.productCode}</td>
                  <td style="text-align: center;">${detail.quantity}</td>
                  <td style="text-align: right;">${Math.round(detail.unitPrice).toLocaleString('es-ES')}</td>
                  <td style="text-align: right;">${Math.round(detail.subtotal).toLocaleString('es-ES')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="totals">
          <div><strong>Subtotal:</strong> ${Math.round(invoice.subtotal).toLocaleString('es-ES')}</div>
          <div><strong>Impuesto (${(invoice.taxRate * 100).toFixed(0)}%):</strong> ${Math.round(invoice.tax).toLocaleString('es-ES')}</div>
          <div class="total-final"><strong>TOTAL:</strong> ${Math.round(invoice.total).toLocaleString('es-ES')}</div>
          <div style="margin-top: 10px;"><strong>Ganancia:</strong> <span style="color: #e74c3c;">${Math.round(invoice.totalProfit).toLocaleString('es-ES')}</span></div>
        </div>

        <div class="footer">
          <p>Gracias por su compra</p>
          <p>Este documento es una representación impresa de la factura electrónica</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  return (
    <PageLayout onLogout={onLogout}>
      <PageHeader
        title="Reportes Financieros"
        description="Análisis detallado de ventas, ganancias y rendimiento del negocio."
      />

      {/* Pestañas */}
      <div className="bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.05)] mb-6">
        <div className="flex border-b border-[#dcdcdc]">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-4 px-6 font-semibold text-base transition-colors ${
              activeTab === 'daily'
                ? 'text-[#1a1a1a] border-b-2 border-[#1a1a1a] bg-[#f5f5f5]'
                : 'text-[#666] hover:text-[#333] hover:bg-[#f5f5f5]'
            }`}
          >
            <i className="fas fa-calendar-day mr-2"></i>
            Informe Diario
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-4 px-6 font-semibold text-base transition-colors ${
              activeTab === 'general'
                ? 'text-[#1a1a1a] border-b-2 border-[#1a1a1a] bg-[#f5f5f5]'
                : 'text-[#666] hover:text-[#333] hover:bg-[#f5f5f5]'
            }`}
          >
            <i className="fas fa-chart-line mr-2"></i>
            Reportes Generales
          </button>
        </div>
      </div>

      {/* Contenido de Informe Diario */}
      {activeTab === 'daily' && (
        <>
          {/* Filtros para Informe Diario */}
          <section className="bg-white rounded-lg p-[25px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] mb-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
              {/* Fecha */}
              <div>
                <label className="block mb-2 font-semibold text-sm text-[#333]">
                  Fecha del Informe
                </label>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={(e) => setDailyDate(e.target.value)}
                  className="w-full py-3 px-4 bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#1a1a1a]"
                />
              </div>

              {/* Botón Generar */}
              <button
                onClick={() => loadDailyData(true)}
                disabled={loading}
                className="bg-[#1a1a1a] text-white border-none py-3 px-6 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Cargando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sync-alt"></i>
                    Actualizar
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Dashboard Diario */}
          {dailyMetrics && dailyProfitData && (
            <div className="space-y-6">
              {/* Métricas del Día */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-[#95a5a6]/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-dollar-sign text-[#95a5a6] text-lg"></i>
                    </div>
                  </div>
                  <h3 className="text-sm text-[#95a5a6] mb-1">Ingresos del Día</h3>
                  <p className="text-2xl font-bold text-[#1a1a1a]">
                    ${Math.round(dailyMetrics.totalRevenue).toLocaleString('es-ES')}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-[#e74c3c]/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-hand-holding-usd text-[#e74c3c] text-lg"></i>
                    </div>
                    <span className="text-sm font-semibold text-[#e74c3c]">
                      {dailyMetrics.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                  <h3 className="text-sm text-[#95a5a6] mb-1">Ganancias del Día</h3>
                  <p className="text-2xl font-bold text-[#1a1a1a]">
                    ${Math.round(dailyMetrics.totalProfit).toLocaleString('es-ES')}
                  </p>
                </div>

                <div 
                  className="bg-white rounded-lg p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                  onClick={() => setShowInvoicesPopup(true)}
                  title="Click para ver el listado de facturas"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-[#1a1a1a]/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-file-invoice text-[#1a1a1a] text-lg"></i>
                    </div>
                    <i className="fas fa-external-link-alt text-[#95a5a6] text-sm"></i>
                  </div>
                  <h3 className="text-sm text-[#95a5a6] mb-1">Facturas del Día</h3>
                  <p className="text-2xl font-bold text-[#1a1a1a]">
                    {dailyProfitData.totalInvoices.toLocaleString('es-ES')}
                  </p>
                </div>

                <div 
                  className="bg-white rounded-lg p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                  onClick={() => setShowProductsPopup(true)}
                  title="Click para ver el listado de productos"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-[#95a5a6]/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-box-open text-[#95a5a6] text-lg"></i>
                    </div>
                    <i className="fas fa-external-link-alt text-[#95a5a6] text-sm"></i>
                  </div>
                  <h3 className="text-sm text-[#95a5a6] mb-1">Productos Vendidos</h3>
                  <p className="text-2xl font-bold text-[#1a1a1a]">
                    {dailyProfitData.totalProductsSold.toLocaleString('es-ES')}
                  </p>
                </div>
              </div>

              {/* Resumen del Día */}
              <div className="bg-white rounded-lg p-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-4">
                  <i className="fas fa-info-circle text-[#1a1a1a] mr-2"></i>
                  Resumen del Día
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-[#f5f5f5] rounded-lg border-l-4 border-[#1a1a1a]">
                    <p className="text-sm text-[#666] mb-2">Promedio por Factura</p>
                    <p className="text-2xl font-bold text-[#1a1a1a]">
                      ${dailyProfitData.totalInvoices > 0 
                        ? Math.round(dailyMetrics.totalRevenue / dailyProfitData.totalInvoices).toLocaleString('es-ES')
                        : '0'}
                    </p>
                  </div>
                  <div className="p-4 bg-[#f5f5f5] rounded-lg border-l-4 border-[#95a5a6]">
                    <p className="text-sm text-[#666] mb-2">Ganancia por Factura</p>
                    <p className="text-2xl font-bold text-[#666]">
                      ${dailyProfitData.totalInvoices > 0 
                        ? Math.round(dailyProfitData.totalProfit / dailyProfitData.totalInvoices).toLocaleString('es-ES')
                        : '0'}
                    </p>
                  </div>
                  <div className="p-4 bg-[#f5f5f5] rounded-lg border-l-4 border-[#1a1a1a]">
                    <p className="text-sm text-[#666] mb-2">Productos por Factura</p>
                    <p className="text-2xl font-bold text-[#1a1a1a]">
                      {dailyProfitData.totalInvoices > 0 
                        ? (dailyProfitData.totalProductsSold / dailyProfitData.totalInvoices).toFixed(1)
                        : '0'}
                    </p>
                  </div>
                  <div className="p-4 bg-[#f5f5f5] rounded-lg border-l-4 border-[#95a5a6]">
                    <p className="text-sm text-[#666] mb-2">Margen de Ganancia</p>
                    <p className="text-2xl font-bold text-[#666]">
                      {dailyMetrics.profitMargin.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje cuando no hay datos diarios */}
          {!loading && !dailyProfitData && (
            <div className="bg-white rounded-lg p-12 shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-center">
              <i className="fas fa-calendar-day text-6xl text-[#95a5a6] mb-4"></i>
              <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">No hay datos para esta fecha</h3>
              <p className="text-[#95a5a6]">
                Selecciona una fecha y haz clic en "Actualizar" para ver el informe diario
              </p>
            </div>
          )}
        </>
      )}

      {/* Contenido de Reportes Generales */}
      {activeTab === 'general' && (
        <>
          {/* Filtros para Reportes Generales */}
          <section className="bg-white rounded-lg p-[25px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] mb-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
              {/* Fecha Inicio */}
              <div>
                <label className="block mb-2 font-semibold text-sm text-[#333]">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full py-3 px-4 bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#1a1a1a]"
                />
              </div>

              {/* Fecha Fin */}
              <div>
                <label className="block mb-2 font-semibold text-sm text-[#333]">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full py-3 px-4 bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#1a1a1a]"
                />
              </div>

              {/* Botón Generar */}
              <button
                onClick={() => loadGeneralData(true)}
                disabled={loading}
                className="bg-[#1a1a1a] text-white border-none py-3 px-6 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Cargando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-chart-line"></i>
                    Generar
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Dashboard de Reportes Generales */}
          {generalMetrics && profitData && (
            <div className="space-y-6">
              {/* Métricas Principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Ingresos */}
                <div className="bg-white rounded-lg p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-[#95a5a6]/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-dollar-sign text-[#95a5a6] text-lg"></i>
                    </div>
                    <span className={`text-sm font-semibold ${generalMetrics.growth >= 0 ? 'text-[#666]' : 'text-[#e74c3c]'}`}>
                      {generalMetrics.growth >= 0 ? '+' : ''}{generalMetrics.growth.toFixed(1)}%
                    </span>
                  </div>
                  <h3 className="text-sm text-[#95a5a6] mb-1">Ingresos Totales</h3>
                  <p className="text-2xl font-bold text-[#1a1a1a]">
                    ${Math.round(generalMetrics.totalRevenue).toLocaleString('es-ES')}
                  </p>
                </div>

                {/* Total Ganancias */}
                <div className="bg-white rounded-lg p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-[#e74c3c]/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-hand-holding-usd text-[#e74c3c] text-lg"></i>
                    </div>
                    <span className="text-sm font-semibold text-[#e74c3c]">
                      {generalMetrics.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                  <h3 className="text-sm text-[#95a5a6] mb-1">Ganancias Totales</h3>
                  <p className="text-2xl font-bold text-[#1a1a1a]">
                    ${Math.round(generalMetrics.totalProfit).toLocaleString('es-ES')}
                  </p>
                </div>

                {/* Total Facturas */}
                <div 
                  className="bg-white rounded-lg p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                  onClick={() => setShowInvoicesPopup(true)}
                  title="Click para ver el listado de facturas"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-[#1a1a1a]/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-file-invoice text-[#1a1a1a] text-lg"></i>
                    </div>
                    <i className="fas fa-external-link-alt text-[#95a5a6] text-sm"></i>
                  </div>
                  <h3 className="text-sm text-[#95a5a6] mb-1">Total Facturas</h3>
                  <p className="text-2xl font-bold text-[#1a1a1a]">
                    {profitData.totalInvoices.toLocaleString('es-ES')}
                  </p>
                </div>

                {/* Productos Vendidos */}
                <div 
                  className="bg-white rounded-lg p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                  onClick={() => setShowProductsPopup(true)}
                  title="Click para ver el listado de productos"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-[#95a5a6]/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-box-open text-[#95a5a6] text-lg"></i>
                    </div>
                    <i className="fas fa-external-link-alt text-[#95a5a6] text-sm"></i>
                  </div>
                  <h3 className="text-sm text-[#95a5a6] mb-1">Productos Vendidos</h3>
                  <p className="text-2xl font-bold text-[#1a1a1a]">
                    {profitData.totalProductsSold.toLocaleString('es-ES')}
                  </p>
                </div>
              </div>

              {/* Gráficas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top 10 Productos por Ingresos */}
                <div className="bg-white rounded-lg p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                  <h3 className="text-base font-bold text-[#1a1a1a] mb-3">Top 10 Productos por Ingresos</h3>
                  <div className="h-[250px]">
                    <Bar
                      data={{
                        labels: generalMetrics.topByRevenue.map((p) => p.productName),
                        datasets: [
                          {
                            label: 'Ingresos',
                            data: generalMetrics.topByRevenue.map((p) => p.totalRevenue),
                            backgroundColor: '#95a5a6',
                            borderColor: '#7f8c8d',
                            borderWidth: 2,
                          },
                        ],
                      }}
                      options={{
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context) => `Ingresos: $${Math.round(context.parsed.x || 0).toLocaleString('es-ES')}`
                            },
                          },
                        },
                        scales: {
                          x: { 
                            beginAtZero: true,
                            ticks: { color: isDarkMode ? '#e5e7eb' : '#666' },
                            grid: { color: isDarkMode ? '#374151' : '#e5e7eb' }
                          },
                          y: {
                            ticks: { color: isDarkMode ? '#e5e7eb' : '#666' },
                            grid: { color: isDarkMode ? '#374151' : '#e5e7eb' }
                          }
                        },
                      }}
                    />
                  </div>
                </div>

                {/* Top 10 Productos por Ganancia */}
                <div className="bg-white rounded-lg p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                  <h3 className="text-base font-bold text-[#1a1a1a] mb-3">Top 10 Productos por Ganancia</h3>
                  <div className="h-[250px]">
                    <Bar
                      data={{
                        labels: generalMetrics.topByProfit.map((p) => p.productName),
                        datasets: [
                          {
                            label: 'Ganancia',
                            data: generalMetrics.topByProfit.map((p) => p.totalProfit),
                            backgroundColor: '#e74c3c',
                            borderColor: '#c0392b',
                            borderWidth: 2,
                          },
                        ],
                      }}
                      options={{
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context) => `Ganancia: $${Math.round(context.parsed.x || 0).toLocaleString('es-ES')}`
                            },
                          },
                        },
                        scales: {
                          x: { 
                            beginAtZero: true,
                            ticks: { color: isDarkMode ? '#e5e7eb' : '#666' },
                            grid: { color: isDarkMode ? '#374151' : '#e5e7eb' }
                          },
                          y: {
                            ticks: { color: isDarkMode ? '#e5e7eb' : '#666' },
                            grid: { color: isDarkMode ? '#374151' : '#e5e7eb' }
                          }
                        },
                      }}
                    />
                  </div>
                </div>

                {/* Top 10 Productos por Cantidad */}
                <div className="bg-white dark:bg-[#2c2c2c] rounded-lg p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                  <h3 className="text-base font-bold text-[#1a1a1a] dark:text-white mb-3">Top 10 Productos Más Vendidos</h3>
                  <div className="h-[250px]">
                    <Bar
                      data={{
                        labels: generalMetrics.topByQuantity.map((p) => p.productName),
                        datasets: [
                          {
                            label: 'Cantidad',
                            data: generalMetrics.topByQuantity.map((p) => p.totalSold),
                            backgroundColor: isDarkMode ? '#e5e7eb' : '#1a1a1a',
                            borderColor: isDarkMode ? '#9ca3af' : '#333',
                            borderWidth: 2,
                          },
                        ],
                      }}
                      options={{
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context) => `Cantidad: ${(context.parsed.x || 0).toLocaleString('es-ES')}`
                            },
                          },
                        },
                        scales: {
                          x: { 
                            beginAtZero: true,
                            ticks: { color: isDarkMode ? '#e5e7eb' : '#666' },
                            grid: { color: isDarkMode ? '#374151' : '#e5e7eb' }
                          },
                          y: {
                            ticks: { color: isDarkMode ? '#e5e7eb' : '#666' },
                            grid: { color: isDarkMode ? '#374151' : '#e5e7eb' }
                          }
                        },
                      }}
                    />
                  </div>
                </div>

                {/* Distribución de Ganancias */}
                <div className="bg-white rounded-lg p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                  <h3 className="text-base font-bold text-[#1a1a1a] mb-3">
                    <i className="fas fa-chart-pie text-[#1a1a1a] mr-2"></i>
                    Distribución de Ganancias
                  </h3>
                  <div className="h-[250px]">
                    <Doughnut
                      data={{
                        labels: generalMetrics.topByProfit.slice(0, 5).map((p) => p.productName),
                        datasets: [
                          {
                            label: 'Ganancia',
                            data: generalMetrics.topByProfit.slice(0, 5).map((p) => p.totalProfit),
                            backgroundColor: ['#e74c3c', '#c0392b', '#95a5a6', '#7f8c8d', '#666'],
                            borderColor: '#fff',
                            borderWidth: 2,
                          },
                        ],
                      }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                boxWidth: 12,
                                padding: 8,
                                font: { size: 11 }
                              }
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => `${context.label}: $${Math.round(context.parsed).toLocaleString('es-ES')}`
                              },
                            },
                          },
                        }}
                    />
                  </div>
                  <div className="mt-4 p-3 bg-[#f5f5f5] rounded-lg border-l-4 border-[#1a1a1a]">
                    <p className="text-xs text-[#666]">
                      <strong>Top 5 productos</strong> que generan más ganancias en el período seleccionado
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabla de Todos los Productos */}
              <div className="bg-white rounded-lg p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <h3 className="text-base font-bold text-[#1a1a1a] mb-3">
                  <i className="fas fa-list text-[#1a1a1a] mr-2"></i>
                  Todos los Productos Vendidos
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-[#dcdcdc]">
                        <th className="text-left py-3 px-4 font-semibold text-[#333]">Código</th>
                        <th className="text-left py-3 px-4 font-semibold text-[#333]">Producto</th>
                        <th className="text-center py-3 px-4 font-semibold text-[#333]">Cantidad</th>
                        <th className="text-right py-3 px-4 font-semibold text-[#333]">Ingresos</th>
                        <th className="text-right py-3 px-4 font-semibold text-[#333]">Ganancia</th>
                        <th className="text-center py-3 px-4 font-semibold text-[#333]">Margen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soldProducts.map((product, index) => {
                        const margin = product.totalRevenue > 0 ? (product.totalProfit / product.totalRevenue) * 100 : 0
                        return (
                          <tr key={index} className="border-b border-[#dcdcdc] hover:bg-[#f5f5f5]">
                            <td className="py-3 px-4 text-[#666]">{product.productCode}</td>
                            <td className="py-3 px-4 font-semibold text-[#333]">{product.productName}</td>
                            <td className="py-3 px-4 text-center text-[#e74c3c] font-bold">
                              {product.totalSold.toLocaleString('es-ES')}
                            </td>
                            <td className="py-3 px-4 text-right text-[#666] font-bold">
                              ${Math.round(product.totalRevenue).toLocaleString('es-ES')}
                            </td>
                            <td className="py-3 px-4 text-right text-[#e74c3c] font-bold">
                              ${Math.round(product.totalProfit).toLocaleString('es-ES')}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                margin >= 30 ? 'bg-[#1a1a1a] text-white' :
                                margin >= 15 ? 'bg-[#666] text-white' :
                                'bg-[#e74c3c] text-white'
                              }`}>
                                {margin.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Separador */}
              <div className="my-8 border-t-2 border-[#dcdcdc]"></div>

              {/* Comparación de Períodos */}
              {comparisonData.length === 2 && (
                <div className="bg-white rounded-lg p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                  <h3 className="text-base font-bold text-[#1a1a1a] mb-3">
                    <i className="fas fa-chart-pie text-[#1a1a1a] mr-2"></i>
                    Comparación de Períodos
                  </h3>
                  
                  {/* Selectores de Períodos */}
                  <div className="mb-4 p-3 bg-[#f5f5f5] rounded-lg">
                    <div className="grid grid-cols-1 gap-3">
                      {/* Período 1 */}
                      <div className="border-b border-[#dcdcdc] pb-3">
                        <label className="block mb-2 font-semibold text-xs text-[#95a5a6]">
                          Período 1
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={comparison1Start}
                            onChange={(e) => setComparison1Start(e.target.value)}
                            className="w-full py-2 px-3 bg-white border border-[#dcdcdc] rounded-md text-xs transition-colors focus:outline-none focus:border-[#1a1a1a]"
                            placeholder="Inicio"
                          />
                          <input
                            type="date"
                            value={comparison1End}
                            onChange={(e) => setComparison1End(e.target.value)}
                            className="w-full py-2 px-3 bg-white border border-[#dcdcdc] rounded-md text-xs transition-colors focus:outline-none focus:border-[#1a1a1a]"
                            placeholder="Fin"
                          />
                        </div>
                      </div>
                      
                      {/* Período 2 */}
                      <div>
                        <label className="block mb-2 font-semibold text-xs text-[#95a5a6]">
                          Período 2
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={comparison2Start}
                            onChange={(e) => setComparison2Start(e.target.value)}
                            className="w-full py-2 px-3 bg-white border border-[#dcdcdc] rounded-md text-xs transition-colors focus:outline-none focus:border-[#1a1a1a]"
                            placeholder="Inicio"
                          />
                          <input
                            type="date"
                            value={comparison2End}
                            onChange={(e) => setComparison2End(e.target.value)}
                            className="w-full py-2 px-3 bg-white border border-[#dcdcdc] rounded-md text-xs transition-colors focus:outline-none focus:border-[#1a1a1a]"
                            placeholder="Fin"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Botón Comparar */}
                    <button
                      onClick={loadCustomComparison}
                      disabled={loadingComparison}
                      className="w-full mt-3 bg-[#1a1a1a] text-white border-none py-2 px-4 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-2"
                    >
                      {loadingComparison ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Comparando...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-sync-alt"></i>
                          Comparar Períodos
                        </>
                      )}
                    </button>
                  </div>

                  {/* Gráfico */}
                  <div className="h-[300px]">
                    <Doughnut
                      data={{
                        labels: comparisonData.map((d) => d.label),
                        datasets: [
                          {
                            label: 'Ingresos',
                            data: comparisonData.map((d) => d.totalRevenue),
                            backgroundColor: ['#95a5a6', '#e74c3c'],
                            borderColor: '#fff',
                            borderWidth: 2,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              boxWidth: 12,
                              padding: 8,
                              font: { size: 11 }
                            }
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) => `${context.label}: $${Math.round(context.parsed).toLocaleString('es-ES')}`
                            },
                          },
                        },
                      }}
                    />
                  </div>

                  {/* Estadísticas de Comparación */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {comparisonData.map((period, index) => (
                      <div key={index} className="p-3 bg-[#f5f5f5] rounded-lg border-l-4 border-[#1a1a1a]">
                        <p className="text-xs text-[#95a5a6] mb-1">{period.label}</p>
                        <p className="text-sm font-bold text-[#1a1a1a]">
                          ${Math.round(period.totalRevenue).toLocaleString('es-ES')}
                        </p>
                        <p className="text-xs text-[#666] mt-1">
                          {period.totalSales} facturas
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mensaje cuando no hay datos generales */}
          {!loading && !profitData && (
            <div className="bg-white rounded-lg p-12 shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-center">
              <i className="fas fa-chart-line text-6xl text-[#95a5a6] mb-4"></i>
              <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">No hay datos para mostrar</h3>
              <p className="text-[#95a5a6]">
                Selecciona un rango de fechas y haz clic en "Generar" para ver los reportes
              </p>
            </div>
          )}
        </>
      )}

      {/* Sistema de Notificaciones */}
      {notification.show && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black/30 z-[3000] flex justify-center items-start pt-20"
          onClick={closeNotification}
        >
          <div
            className={`bg-white rounded-lg shadow-2xl w-[90%] max-w-[500px] animate-fadeIn ${
              notification.type === 'error'
                ? 'border-l-4 border-[#e74c3c]'
                : notification.type === 'warning'
                ? 'border-l-4 border-[#e74c3c]'
                : 'border-l-4 border-[#666]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    notification.type === 'error'
                      ? 'bg-[#e74c3c]/10'
                      : notification.type === 'warning'
                      ? 'bg-[#e74c3c]/10'
                      : 'bg-[#666]/10'
                  }`}
                >
                  <i
                    className={`fas ${
                      notification.type === 'error'
                        ? 'fa-exclamation-circle text-[#e74c3c]'
                        : notification.type === 'warning'
                        ? 'fa-exclamation-triangle text-[#e74c3c]'
                        : 'fa-check-circle text-[#666]'
                    } text-2xl`}
                  ></i>
                </div>
                <div className="flex-1">
                  <h4
                    className={`font-bold text-lg mb-2 ${
                      notification.type === 'error'
                        ? 'text-[#e74c3c]'
                        : notification.type === 'warning'
                        ? 'text-[#e74c3c]'
                        : 'text-[#666]'
                    }`}
                  >
                    {notification.type === 'error'
                      ? 'Error'
                      : notification.type === 'warning'
                      ? 'Advertencia'
                      : 'Éxito'}
                  </h4>
                  <p className="text-[#333] whitespace-pre-line">{notification.message}</p>
                </div>
                <button
                  onClick={closeNotification}
                  className="flex-shrink-0 text-[#95a5a6] hover:text-[#333] text-2xl transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={closeNotification}
                  className={`px-6 py-2 rounded-md font-semibold text-white transition-colors ${
                    notification.type === 'error'
                      ? 'bg-[#e74c3c] hover:bg-[#c0392b]'
                      : notification.type === 'warning'
                      ? 'bg-[#e74c3c] hover:bg-[#c0392b]'
                      : 'bg-[#1a1a1a] hover:bg-[#333]'
                  }`}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup de Facturas */}
      {showInvoicesPopup && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black/30 z-[3000] flex justify-center items-center p-4"
          onClick={() => setShowInvoicesPopup(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#dcdcdc] flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1a1a1a]">
                <i className="fas fa-file-invoice text-[#1a1a1a] mr-2"></i>
                Listado de Facturas
              </h3>
              <button
                onClick={() => setShowInvoicesPopup(false)}
                className="text-[#95a5a6] hover:text-[#333] text-2xl transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {loadingInvoices ? (
                <div className="text-center py-12">
                  <i className="fas fa-spinner fa-spin text-6xl text-[#1a1a1a] mb-4"></i>
                  <p className="text-[#666]">Cargando facturas...</p>
                </div>
              ) : invoices.length > 0 ? (
                <>
                  <div className="mb-4 p-4 bg-[#f5f5f5] rounded-lg border-l-4 border-[#1a1a1a]">
                    <p className="text-sm text-[#666]">
                      <strong>Período:</strong> {activeTab === 'daily' ? dailyDate : `${startDate} - ${endDate}`}
                    </p>
                    <p className="text-sm text-[#666]">
                      <strong>Total de facturas:</strong> {invoices.length.toLocaleString('es-ES')}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-[#dcdcdc]">
                          <th className="text-left py-3 px-4 font-semibold text-[#333]">Número</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#333]">Fecha</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#333]">Cliente</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#333]">Cajero</th>
                          <th className="text-right py-3 px-4 font-semibold text-[#333]">Subtotal</th>
                          <th className="text-right py-3 px-4 font-semibold text-[#333]">IVA</th>
                          <th className="text-right py-3 px-4 font-semibold text-[#333]">Total</th>
                          <th className="text-center py-3 px-4 font-semibold text-[#333]">Estado</th>
                          <th className="text-center py-3 px-4 font-semibold text-[#333]">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((invoice, index) => (
                          <tr 
                            key={index} 
                            onClick={() => handleViewDetails(invoice)}
                            className="border-b border-[#dcdcdc] hover:bg-[#f5f5f5] cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-4 font-mono text-sm text-[#1a1a1a] font-semibold">{invoice.invoiceNumber}</td>
                            <td className="py-3 px-4 text-sm text-[#666]">
                              {new Date(invoice.issueDate).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-3 px-4 text-sm text-[#333]">{invoice.customer.name}</td>
                            <td className="py-3 px-4 text-sm text-[#666]">{invoice.cashier}</td>
                            <td className="py-3 px-4 text-right font-semibold text-[#333]">
                              ${Math.round(invoice.subtotal).toLocaleString('es-ES')}
                            </td>
                            <td className="py-3 px-4 text-right text-[#666]">
                              ${Math.round(invoice.tax).toLocaleString('es-ES')}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-[#666]">
                              ${Math.round(invoice.total).toLocaleString('es-ES')}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                invoice.status === 'ISSUED' 
                                  ? 'bg-[#1a1a1a] text-white' 
                                  : 'bg-[#e74c3c] text-white'
                              }`}>
                                {invoice.status === 'ISSUED' ? 'Emitida' : 'Cancelada'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleGenerateInvoicePDF(invoice)
                                }}
                                className="bg-[#e74c3c] text-white border-none py-2 px-3 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#c0392b] text-xs"
                                title="Generar PDF"
                              >
                                <i className="fas fa-file-pdf mr-1"></i>
                                PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <i className="fas fa-inbox text-6xl text-[#95a5a6] mb-4"></i>
                  <p className="text-[#666] mb-4">
                    No hay facturas para el período seleccionado
                  </p>
                  <p className="text-sm text-[#95a5a6]">
                    Período: {activeTab === 'daily' ? dailyDate : `${startDate} - ${endDate}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Popup de Productos */}
      {showProductsPopup && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black/30 z-[3000] flex justify-center items-center p-4"
          onClick={() => setShowProductsPopup(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#dcdcdc] flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1a1a1a]">
                <i className="fas fa-box-open text-[#95a5a6] mr-2"></i>
                Listado de Productos Vendidos
              </h3>
              <button
                onClick={() => setShowProductsPopup(false)}
                className="text-[#95a5a6] hover:text-[#333] text-2xl transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {loadingInvoices ? (
                <div className="text-center py-12">
                  <i className="fas fa-spinner fa-spin text-6xl text-[#1a1a1a] mb-4"></i>
                  <p className="text-[#666]">Cargando productos...</p>
                </div>
              ) : (() => {
                const products = activeTab === 'general' ? soldProducts : getProductsFromInvoices()
                return products.length > 0 ? (
                  <>
                    <div className="mb-4 p-4 bg-[#f5f5f5] rounded-lg border-l-4 border-[#1a1a1a]">
                      <p className="text-sm text-[#666]">
                        <strong>Período:</strong> {activeTab === 'daily' ? dailyDate : `${startDate} - ${endDate}`}
                      </p>
                      <p className="text-sm text-[#666]">
                        <strong>Total de productos diferentes:</strong> {products.length.toLocaleString('es-ES')}
                      </p>
                      <p className="text-sm text-[#666]">
                        <strong>Unidades vendidas:</strong> {products.reduce((sum, p) => sum + p.totalSold, 0).toLocaleString('es-ES')}
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-[#dcdcdc]">
                            <th className="text-left py-3 px-4 font-semibold text-[#333]">Código</th>
                            <th className="text-left py-3 px-4 font-semibold text-[#333]">Producto</th>
                            <th className="text-center py-3 px-4 font-semibold text-[#333]">Cantidad</th>
                            <th className="text-right py-3 px-4 font-semibold text-[#333]">Ingresos</th>
                            <th className="text-right py-3 px-4 font-semibold text-[#333]">Ganancia</th>
                            <th className="text-center py-3 px-4 font-semibold text-[#333]">Margen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product, index) => {
                            const margin = product.totalRevenue > 0 ? (product.totalProfit / product.totalRevenue) * 100 : 0
                            return (
                              <tr key={index} className="border-b border-[#dcdcdc] hover:bg-[#f5f5f5]">
                                <td className="py-3 px-4 text-[#666]">{product.productCode}</td>
                                <td className="py-3 px-4 font-semibold text-[#333]">{product.productName}</td>
                                <td className="py-3 px-4 text-center text-[#e74c3c] font-bold">
                                  {product.totalSold.toLocaleString('es-ES')}
                                </td>
                                <td className="py-3 px-4 text-right text-[#666] font-bold">
                                  ${Math.round(product.totalRevenue).toLocaleString('es-ES')}
                                </td>
                                <td className="py-3 px-4 text-right text-[#e74c3c] font-bold">
                                  ${Math.round(product.totalProfit).toLocaleString('es-ES')}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    margin >= 30 ? 'bg-[#666] text-white' :
                                    margin >= 15 ? 'bg-[#95a5a6] text-white' :
                                    'bg-[#c0392b] text-white'
                                  }`}>
                                    {margin.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <i className="fas fa-inbox text-6xl text-[#95a5a6] mb-4"></i>
                    <p className="text-[#666] mb-4">
                      No hay productos vendidos para el período seleccionado
                    </p>
                    <p className="text-sm text-[#95a5a6]">
                      Período: {activeTab === 'daily' ? dailyDate : `${startDate} - ${endDate}`}
                    </p>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles de Factura */}
      {showDetailsModal && selectedInvoice && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black/50 z-[3500] flex justify-center items-center p-4"
          onClick={closeDetailsModal}
        >
          <div
            className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-[#e74c3c] to-[#c0392b] text-white py-6 px-8 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-montserrat font-bold mb-1">
                  Factura {selectedInvoice.invoiceNumber}
                </h2>
                <p className="text-white/80 text-sm">
                  {new Date(selectedInvoice.issueDate).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <button
                onClick={closeDetailsModal}
                className="bg-white/20 hover:bg-white/30 border-none text-white text-2xl w-10 h-10 rounded-full cursor-pointer transition-colors flex items-center justify-center"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-8">
              {/* Estado y Cajero */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-[#f5f5f5] rounded-lg p-4">
                  <p className="text-sm text-[#95a5a6] mb-1">Estado</p>
                  <span
                    className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                      selectedInvoice.status === 'ISSUED'
                        ? 'bg-[#1a1a1a] text-white'
                        : 'bg-[#e74c3c] text-white'
                    }`}
                  >
                    {selectedInvoice.status === 'ISSUED' ? 'EMITIDA' : 'CANCELADA'}
                  </span>
                </div>
                <div className="bg-[#f5f5f5] rounded-lg p-4">
                  <p className="text-sm text-[#95a5a6] mb-1">Cajero</p>
                  <p className="text-lg font-bold text-[#1a1a1a]">{selectedInvoice.cashier}</p>
                </div>
              </div>

              {/* Información del Cliente */}
              <div className="bg-[#f5f5f5] rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-4 flex items-center gap-2">
                  <i className="fas fa-user text-[#1a1a1a]"></i>
                  Información del Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[#95a5a6] mb-1">Nombre</p>
                    <p className="font-semibold text-[#333]">{selectedInvoice.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#95a5a6] mb-1">Documento</p>
                    <p className="font-semibold text-[#333]">{selectedInvoice.customer.documentNumber}</p>
                  </div>
                  {selectedInvoice.customer.email && (
                    <div>
                      <p className="text-sm text-[#95a5a6] mb-1">Email</p>
                      <p className="font-semibold text-[#333]">{selectedInvoice.customer.email}</p>
                    </div>
                  )}
                  {selectedInvoice.customer.phone && (
                    <div>
                      <p className="text-sm text-[#95a5a6] mb-1">Teléfono</p>
                      <p className="font-semibold text-[#333]">{selectedInvoice.customer.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalle de Productos */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-4 flex items-center gap-2">
                  <i className="fas fa-box text-[#1a1a1a]"></i>
                  Detalle de Productos
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-[#dcdcdc]">
                        <th className="text-left py-3 px-4 font-semibold text-[#333]">Producto</th>
                        <th className="text-left py-3 px-4 font-semibold text-[#333]">Código</th>
                        <th className="text-center py-3 px-4 font-semibold text-[#333]">Cantidad</th>
                        <th className="text-right py-3 px-4 font-semibold text-[#333]">Precio Unit.</th>
                        <th className="text-right py-3 px-4 font-semibold text-[#333]">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.details.map((detail, index) => (
                        <tr key={index} className="border-b border-[#dcdcdc]">
                          <td className="py-3 px-4 font-semibold text-[#333]">{detail.productName}</td>
                          <td className="py-3 px-4 text-[#95a5a6]">{detail.productCode}</td>
                          <td className="py-3 px-4 text-center text-[#333]">{detail.quantity}</td>
                          <td className="py-3 px-4 text-right text-[#333]">
                            ${Math.round(detail.unitPrice).toLocaleString('es-ES')}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[#666]">
                            ${Math.round(detail.subtotal).toLocaleString('es-ES')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totales */}
              <div className="bg-[#f5f5f5] rounded-lg p-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[#333]">
                    <span className="font-semibold">Subtotal:</span>
                    <span className="font-bold">${Math.round(selectedInvoice.subtotal).toLocaleString('es-ES')}</span>
                  </div>
                  <div className="flex justify-between text-[#333]">
                    <span className="font-semibold">Impuesto ({(selectedInvoice.taxRate * 100).toFixed(0)}%):</span>
                    <span className="font-bold">${Math.round(selectedInvoice.tax).toLocaleString('es-ES')}</span>
                  </div>
                  <div className="border-t-2 border-[#dcdcdc] pt-3 flex justify-between text-xl">
                    <span className="font-bold text-[#1a1a1a]">Total:</span>
                    <span className="font-bold text-[#666]">
                      ${Math.round(selectedInvoice.total).toLocaleString('es-ES')}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-[#e74c3c]">Ganancia:</span>
                    <span className="font-bold text-[#e74c3c]">
                      ${Math.round(selectedInvoice.totalProfit).toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleGenerateInvoicePDF(selectedInvoice)}
                  className="flex-1 bg-[#e74c3c] text-white border-none py-3 px-6 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#c0392b] flex items-center justify-center gap-2"
                >
                  <i className="fas fa-file-pdf"></i>
                  Generar PDF
                </button>
                <button
                  onClick={closeDetailsModal}
                  className="flex-1 bg-[#95a5a6] text-white border-none py-3 px-6 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#7f8c8d] flex items-center justify-center gap-2"
                >
                  <i className="fas fa-times"></i>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}

export default Reports
