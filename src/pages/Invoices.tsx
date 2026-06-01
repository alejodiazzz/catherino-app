import React, { useState, useEffect } from 'react'
import { PageLayout, PageHeader } from '../components'
import { billingService, Invoice } from '../services/billingService'

interface InvoicesProps {
  onLogout?: () => void
}

const Invoices: React.FC<InvoicesProps> = ({ onLogout }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ISSUED' | 'CANCELLED'>('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Modal de detalles
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

  // Cargar facturas al montar el componente
  useEffect(() => {
    loadInvoices()
  }, [])

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters()
  }, [invoices, searchQuery, statusFilter, startDate, endDate])

  // Cargar todas las facturas
  const loadInvoices = async () => {
    try {
      setLoading(true)
      const data = await billingService.getAllInvoices()
      
      // Ordenar por fecha más reciente primero
      data.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
      
      setInvoices(data)
    } catch (err: any) {
      console.error('Error al cargar facturas:', err)
      showNotification('Error al cargar las facturas', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal de detalles
  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowDetailsModal(true)
  }

  // Cerrar modal de detalles
  const closeDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedInvoice(null)
  }

  // Aplicar filtros
  const applyFilters = () => {
    let filtered = [...invoices]

    // Filtro por búsqueda (número de factura, cliente, documento)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(query) ||
          invoice.customer.name.toLowerCase().includes(query) ||
          invoice.customer.documentNumber.toLowerCase().includes(query)
      )
    }

    // Filtro por estado
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter)
    }

    // Filtro por rango de fechas
    if (startDate) {
      filtered = filtered.filter(
        (invoice) => new Date(invoice.issueDate) >= new Date(startDate)
      )
    }
    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999)
      filtered = filtered.filter(
        (invoice) => new Date(invoice.issueDate) <= endDateTime
      )
    }

    setFilteredInvoices(filtered)
  }

  // Limpiar filtros
  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('ALL')
    setStartDate('')
    setEndDate('')
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
        title="Historial de Facturas"
        description="Consulta y gestiona todas las facturas generadas en el sistema."
      />

      {/* Filtros y Búsqueda */}
      <section className="bg-white rounded-lg p-[25px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-end">
          {/* Búsqueda */}
          <div>
            <label className="block mb-2 font-semibold text-sm text-[#333]">
              Buscar
            </label>
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[#95a5a6]"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3 pl-12 pr-4 bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#e74c3c]"
                placeholder="Buscar por factura, cliente o documento..."
              />
            </div>
          </div>

          {/* Filtro por Estado */}
          <div>
            <label className="block mb-2 font-semibold text-sm text-[#333]">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ISSUED' | 'CANCELLED')}
              className="w-full py-3 px-4 bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#e74c3c]"
            >
              <option value="ALL">Todas</option>
              <option value="ISSUED">Emitidas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>

          {/* Fecha Inicio */}
          <div>
            <label className="block mb-2 font-semibold text-sm text-[#333]">
              Desde
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full py-3 px-4 bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#e74c3c]"
            />
          </div>

          {/* Fecha Fin */}
          <div>
            <label className="block mb-2 font-semibold text-sm text-[#333]">
              Hasta
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full py-3 px-4 bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#e74c3c]"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="bg-[#95a5a6] text-white border-none py-3 px-4 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#7f8c8d]"
              title="Limpiar filtros"
            >
              <i className="fas fa-eraser"></i>
            </button>
            <button
              onClick={loadInvoices}
              disabled={loading}
              className="bg-[#666] text-white border-none py-3 px-4 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#555] disabled:opacity-50 disabled:cursor-not-allowed"
              title="Recargar"
            >
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            </button>
          </div>
        </div>

        {/* Resumen de resultados */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-[#95a5a6]">
            Mostrando <strong className="text-[#333]">{filteredInvoices.length}</strong> de{' '}
            <strong className="text-[#333]">{invoices.length}</strong> facturas
          </span>
          {(searchQuery || statusFilter !== 'ALL' || startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="text-[#e74c3c] hover:text-[#c0392b] font-semibold transition-colors"
            >
              <i className="fas fa-times mr-1"></i>
              Limpiar filtros
            </button>
          )}
        </div>
      </section>

      {/* Tabla de Facturas */}
      <section className="bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        {loading ? (
          <div className="p-12 text-center">
            <i className="fas fa-spinner fa-spin text-6xl text-[#e74c3c] mb-4"></i>
            <p className="text-[#95a5a6]">Cargando facturas...</p>
          </div>
        ) : filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#dcdcdc]">
                  <th className="text-left py-4 px-4 font-semibold text-[#333]">Factura</th>
                  <th className="text-left py-4 px-4 font-semibold text-[#333]">Fecha</th>
                  <th className="text-left py-4 px-4 font-semibold text-[#333]">Cliente</th>
                  <th className="text-left py-4 px-4 font-semibold text-[#333]">Cajero</th>
                  <th className="text-center py-4 px-4 font-semibold text-[#333]">Items</th>
                  <th className="text-right py-4 px-4 font-semibold text-[#333]">Total</th>
                  <th className="text-right py-4 px-4 font-semibold text-[#333]">Ganancia</th>
                  <th className="text-center py-4 px-4 font-semibold text-[#333]">Estado</th>
                  <th className="text-center py-4 px-4 font-semibold text-[#333]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr 
                    key={invoice.id} 
                    onClick={() => handleViewDetails(invoice)}
                    className="border-b border-[#dcdcdc] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-4">
                      <span className="font-semibold text-[#e74c3c]">{invoice.invoiceNumber}</span>
                    </td>
                    <td className="py-4 px-4 text-[#333]">
                      <div>{new Date(invoice.issueDate).toLocaleDateString('es-ES')}</div>
                      <div className="text-xs text-[#95a5a6]">
                        {new Date(invoice.issueDate).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-[#333]">{invoice.customer.name}</div>
                      <div className="text-xs text-[#95a5a6]">{invoice.customer.documentNumber}</div>
                    </td>
                    <td className="py-4 px-4 text-[#333]">{invoice.cashier}</td>
                    <td className="py-4 px-4 text-center text-[#333]">
                      {invoice.details.reduce((sum, detail) => sum + detail.quantity, 0)}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-[#666]">
                      ${Math.round(invoice.total).toLocaleString('es-ES')}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-[#e74c3c]">
                      ${Math.round(invoice.totalProfit).toLocaleString('es-ES')}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          invoice.status === 'ISSUED'
                            ? 'bg-[#f5f5f5] text-[#666]'
                            : 'bg-[#f8d7da] text-[#721c24]'
                        }`}
                      >
                        {invoice.status === 'ISSUED' ? 'EMITIDA' : 'CANCELADA'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGenerateInvoicePDF(invoice)
                        }}
                        className="bg-[#e74c3c] text-white border-none py-2 px-4 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#c0392b] text-sm"
                        title="Generar PDF"
                      >
                        <i className="fas fa-file-pdf mr-2"></i>
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <i className="fas fa-receipt text-6xl text-[#95a5a6] mb-4"></i>
            <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">No se encontraron facturas</h3>
            <p className="text-[#95a5a6]">
              {searchQuery || statusFilter !== 'ALL' || startDate || endDate
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'No hay facturas registradas en el sistema'}
            </p>
          </div>
        )}
      </section>

      {/* Modal de Detalles de Factura */}
      {showDetailsModal && selectedInvoice && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black/50 z-[3000] flex justify-center items-center p-4"
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
                        ? 'bg-[#f5f5f5] text-[#666]'
                        : 'bg-[#f8d7da] text-[#721c24]'
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
                  <i className="fas fa-user text-[#e74c3c]"></i>
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
                  <i className="fas fa-box text-[#666]"></i>
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
                      : 'bg-[#666] hover:bg-[#555]'
                  }`}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}

export default Invoices
