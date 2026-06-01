import React, { useState, useEffect } from 'react'
import { PageLayout, PageHeader } from '../components'
import { billingService } from '../services/billingService'
import { productService, Product } from '../services/productService'

interface SalesProps {
  onLogout?: () => void
}

interface CartItem {
  productId: string
  productCode: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
  stock: number
  purchasePrice: number
  profitMargin: number
}

const Sales: React.FC<SalesProps> = ({ onLogout }) => {
  // Inicializar carrito desde localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('salesCart')
      return savedCart ? JSON.parse(savedCart) : []
    } catch (error) {
      console.error('Error loading cart from localStorage:', error)
      return []
    }
  })
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  // Referencia al input de búsqueda
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Datos del cliente (con persistencia)
  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem('salesCustomerName') || ''
  })
  const [customerDocument, setCustomerDocument] = useState(() => {
    return localStorage.getItem('salesCustomerDocument') || ''
  })
  const [customerEmail, setCustomerEmail] = useState(() => {
    return localStorage.getItem('salesCustomerEmail') || ''
  })
  const [customerPhone, setCustomerPhone] = useState(() => {
    return localStorage.getItem('salesCustomerPhone') || ''
  })
  
  // Errores de validación
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  
  // Tasa de impuesto (por defecto 0%, con persistencia)
  const [taxRate, setTaxRate] = useState(() => {
    return localStorage.getItem('salesTaxRate') || '0'
  })

  // Modal de precio
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [customPrice, setCustomPrice] = useState('')

  // Modal de confirmación de venta
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [lastInvoice, setLastInvoice] = useState<any>(null)

  // Sistema de notificaciones
  const [notification, setNotification] = useState<{
    show: boolean
    message: string
    type: 'error' | 'warning' | 'info'
  }>({ show: false, message: '', type: 'info' })

  const showNotification = (message: string, type: 'error' | 'warning' | 'info' = 'info') => {
    setNotification({ show: true, message, type })
  }

  const closeNotification = () => {
    setNotification({ show: false, message: '', type: 'info' })
  }

  // Guardar carrito en localStorage cada vez que cambie
  useEffect(() => {
    try {
      localStorage.setItem('salesCart', JSON.stringify(cart))
    } catch (error) {
      console.error('Error saving cart to localStorage:', error)
    }
  }, [cart])

  // Guardar datos del cliente en localStorage
  useEffect(() => {
    localStorage.setItem('salesCustomerName', customerName)
  }, [customerName])

  useEffect(() => {
    localStorage.setItem('salesCustomerDocument', customerDocument)
  }, [customerDocument])

  useEffect(() => {
    localStorage.setItem('salesCustomerEmail', customerEmail)
  }, [customerEmail])

  useEffect(() => {
    localStorage.setItem('salesCustomerPhone', customerPhone)
  }, [customerPhone])

  useEffect(() => {
    localStorage.setItem('salesTaxRate', taxRate)
  }, [taxRate])

  // Limpiar formulario y localStorage
  const clearForm = () => {
    setCart([])
    setCustomerName('')
    setCustomerDocument('')
    setCustomerEmail('')
    setCustomerPhone('')
    setEmailError('')
    setPhoneError('')
    // El localStorage se limpiará automáticamente por los useEffect
  }

  // Helper para obtener el precio de un producto
  const getProductPrice = (product: Product): number => {
    return product.suggestedSalePrice || product.price || 0
  }

  // Validar email en tiempo real
  const validateEmail = (email: string) => {
    if (!email.trim()) {
      setEmailError('')
      return true
    }
    // Validación más estricta para coincidir con el backend
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email.trim())) {
      setEmailError('Email inválido (ej: usuario@dominio.com)')
      return false
    }
    setEmailError('')
    return true
  }

  // Validar teléfono en tiempo real
  const validatePhone = (phone: string) => {
    if (!phone.trim()) {
      setPhoneError('')
      return true
    }
    // El backend requiere 10-15 dígitos, opcionalmente con + al inicio
    const phoneRegex = /^[+]?[0-9]{10,15}$/
    if (!phoneRegex.test(phone.trim())) {
      setPhoneError('Mínimo 10 dígitos, máximo 15')
      return false
    }
    setPhoneError('')
    return true
  }

  // Verificar si el formulario es válido
  const isFormValid = () => {
    if (cart.length === 0) return false
    if (customerEmail.trim() && emailError) return false
    if (customerPhone.trim() && phoneError) return false
    return true
  }

  // Buscar productos por código o nombre
  const handleSearch = async (value: string) => {
    setSearchQuery(value)
    
    if (value.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    try {
      setLoading(true)
      const allProducts = await productService.getAllProducts()
      
      // Filtrar productos por código o nombre
      const filtered = allProducts.filter((product) => {
        const matchesCode = product.code?.toLowerCase().includes(value.toLowerCase())
        const matchesName = product.name.toLowerCase().includes(value.toLowerCase())
        return matchesCode || matchesName
      })

      setSearchResults(filtered)
      setShowResults(true)
      
      // Mantener el foco en el input después de mostrar resultados
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 0)
    } catch (err) {
      console.error('Error searching products:', err)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  // Agregar producto al carrito desde búsqueda
  const handleSelectProduct = (product: Product) => {
    // Mostrar modal para seleccionar precio
    setSelectedProduct(product)
    const suggestedPrice = getProductPrice(product)
    setCustomPrice(suggestedPrice.toString())
    setShowPriceModal(true)
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
  }

  // Confirmar y agregar al carrito con el precio seleccionado
  const handleConfirmPrice = () => {
    if (!selectedProduct) return

    const price = parseFloat(customPrice) || 0
    
    if (price <= 0) {
      showNotification('El precio debe ser mayor a 0', 'warning')
      return
    }

    addToCart({
      productId: selectedProduct.id || '',
      productCode: selectedProduct.code || selectedProduct.id || '',
      productName: selectedProduct.name,
      quantity: 1,
      unitPrice: price,
      subtotal: price,
      stock: selectedProduct.stock,
      purchasePrice: selectedProduct.purchasePrice || 0,
      profitMargin: selectedProduct.profitMargin || 0,
    })

    // Cerrar modal y limpiar
    setShowPriceModal(false)
    setSelectedProduct(null)
    setCustomPrice('')
  }

  // Buscar y agregar directamente con Enter
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchResults.length === 1) {
      handleSelectProduct(searchResults[0])
    } else if (searchResults.length > 1) {
      // Si hay múltiples resultados, mantener la lista abierta
      setShowResults(true)
    }
  }

  // Agregar producto al carrito
  const addToCart = (item: CartItem) => {
    const existingIndex = cart.findIndex((i) => i.productId === item.productId)

    if (existingIndex >= 0) {
      const newCart = [...cart]
      const newQuantity = newCart[existingIndex].quantity + 1

      if (newQuantity > item.stock) {
        showNotification(`Stock insuficiente. Solo hay ${item.stock} unidades disponibles`, 'warning')
        return
      }

      newCart[existingIndex].quantity = newQuantity
      newCart[existingIndex].subtotal = newCart[existingIndex].unitPrice * newQuantity
      setCart(newCart)
    } else {
      if (item.stock === 0) {
        showNotification('Producto sin stock disponible', 'warning')
        return
      }
      setCart([...cart, item])
    }
  }

  // Actualizar cantidad
  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return

    const newCart = [...cart]
    if (newQuantity > newCart[index].stock) {
      showNotification(`Stock insuficiente. Solo hay ${newCart[index].stock} unidades disponibles`, 'warning')
      return
    }

    newCart[index].quantity = newQuantity
    newCart[index].subtotal = newCart[index].unitPrice * newQuantity
    setCart(newCart)
  }

  // Eliminar del carrito
  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  // Calcular totales
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const taxRateDecimal = parseFloat(taxRate) / 100 || 0
  const estimatedTax = subtotal * taxRateDecimal
  const estimatedTotal = subtotal + estimatedTax

  // Procesar venta
  const handleProcessSale = async () => {
    try {
      setProcessing(true)

      // Validar que todos los items tengan datos válidos
      for (const item of cart) {
        if (!item.productId || item.productId.trim() === '') {
          showNotification('Error: Producto sin ID válido', 'error')
          setProcessing(false)
          return
        }
        if (item.quantity <= 0) {
          showNotification('Error: Cantidad debe ser mayor a 0', 'error')
          setProcessing(false)
          return
        }
        if (item.unitPrice <= 0) {
          showNotification('Error: Precio debe ser mayor a 0', 'error')
          setProcessing(false)
          return
        }
      }

      // Preparar datos del cliente - solo campos con valores válidos
      const emailTrimmed = customerEmail?.trim()
      const phoneTrimmed = customerPhone?.trim()
      const nameTrimmed = customerName?.trim()
      const documentTrimmed = customerDocument?.trim()
      
      // Crear objeto de cliente solo si hay datos
      let customerData: any = undefined
      
      // Si hay algún dato del cliente, crear el objeto
      if (nameTrimmed || documentTrimmed || emailTrimmed || phoneTrimmed) {
        customerData = {
          documentNumber: documentTrimmed || 'NULL',
          name: nameTrimmed || 'Cliente General',
        }
        
        // Solo agregar email y phone si tienen valor válido
        if (emailTrimmed) {
          customerData.email = emailTrimmed
        }
        if (phoneTrimmed) {
          customerData.phone = phoneTrimmed
        }
      }

      // Asegurar que taxRate sea un número válido
      const finalTaxRate = isNaN(taxRateDecimal) ? 0 : taxRateDecimal
      
      const saleRequest = {
        customer: customerData,
        items: cart.map((item) => ({
          productId: item.productId.trim(),
          quantity: parseInt(item.quantity.toString()),
          salePrice: parseFloat(item.unitPrice.toString()),
        })),
        cashier: 'Admin',
        taxRate: finalTaxRate
      }

      console.log('=== SALE REQUEST DEBUG ===')
      console.log('Customer Data:', JSON.stringify(customerData, null, 2))
      console.log('Items:', JSON.stringify(saleRequest.items, null, 2))
      console.log('Tax Rate:', taxRateDecimal)
      console.log('Full Request:', JSON.stringify(saleRequest, null, 2))
      console.log('=========================')

      const invoice = await billingService.processSale(saleRequest)

      // Guardar factura y mostrar modal de éxito
      setLastInvoice(invoice)
      setShowSuccessModal(true)

      // Limpiar formulario
      clearForm()
    } catch (err: any) {
      console.error('=== ERROR DEBUG ===')
      console.error('Error completo:', err)
      console.error('Response status:', err.response?.status)
      console.error('Response data:', err.response?.data)
      console.error('Response headers:', err.response?.headers)
      console.error('Request data:', err.config?.data)
      console.error('==================')
      
      // Extraer mensaje de error del backend
      let errorMessage = 'Error al procesar la venta'
      
      if (err.response?.data) {
        const data = err.response.data
        
        // Intentar extraer el mensaje de diferentes formas
        if (typeof data === 'string') {
          errorMessage = data
        } else if (data.message) {
          errorMessage = data.message
        } else if (data.error) {
          errorMessage = `${data.error}${data.path ? ` (${data.path})` : ''}`
        } else {
          // Si no hay mensaje específico, mostrar el objeto completo
          errorMessage = `Error ${err.response.status}: ${JSON.stringify(data)}`
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      // Agregar sugerencias basadas en el tipo de error
      if (err.response?.status === 400) {
        errorMessage += '\n\nPosibles causas:\n'
        errorMessage += '• El producto no existe en el sistema\n'
        errorMessage += '• No hay stock suficiente\n'
        errorMessage += '• El precio es inválido\n'
        errorMessage += '• Hay un problema con los datos del cliente\n\n'
        errorMessage += 'Por favor, verifica que el producto exista en el inventario y tenga stock disponible.'
      }
      
      showNotification(errorMessage, 'error')
    } finally {
      setProcessing(false)
    }
  }

  // Cancelar venta
  const handleCancelSale = () => {
    if (cart.length > 0 && !window.confirm('¿Deseas cancelar la venta actual?')) {
      return
    }
    clearForm()
  }

  // Generar PDF de la factura
  const handleGeneratePDF = () => {
    if (!lastInvoice) return

    // Crear contenido HTML para el PDF
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
        <title>Factura ${lastInvoice.invoiceNumber}</title>
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
            <div>${lastInvoice.invoiceNumber}</div>
          </div>
          <div>
            <div class="section-title">Fecha:</div>
            <div>${new Date(lastInvoice.issueDate).toLocaleString('es-ES')}</div>
          </div>
          <div>
            <div class="section-title">Cajero:</div>
            <div>${lastInvoice.cashier}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Cliente:</div>
          <div><strong>Nombre:</strong> ${lastInvoice.customer.name}</div>
          <div><strong>Documento:</strong> ${lastInvoice.customer.documentNumber}</div>
          ${lastInvoice.customer.email ? `<div><strong>Email:</strong> ${lastInvoice.customer.email}</div>` : ''}
          ${lastInvoice.customer.phone ? `<div><strong>Teléfono:</strong> ${lastInvoice.customer.phone}</div>` : ''}
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
              ${lastInvoice.details.map((detail: any) => `
                <tr>
                  <td>${detail.productName}</td>
                  <td>${detail.productCode}</td>
                  <td style="text-align: center;">${detail.quantity}</td>
                  <td style="text-align: right;">$${Math.round(detail.unitPrice).toLocaleString('es-ES')}</td>
                  <td style="text-align: right;">$${Math.round(detail.subtotal).toLocaleString('es-ES')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="totals">
          <div><strong>Subtotal:</strong> $${Math.round(lastInvoice.subtotal).toLocaleString('es-ES')}</div>
          <div><strong>Impuesto (${(lastInvoice.taxRate * 100).toFixed(0)}%):</strong> $${Math.round(lastInvoice.tax).toLocaleString('es-ES')}</div>
          <div class="total-final"><strong>TOTAL:</strong> $${Math.round(lastInvoice.total).toLocaleString('es-ES')}</div>
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
        title="Punto de Venta"
        description="Registra ventas, busca productos y genera facturas."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-[25px]">
        {/* Panel Principal - Búsqueda y Carrito */}
        <div className="space-y-[25px]">
          {/* Búsqueda de Productos */}
          <section className="bg-white rounded-lg p-[25px] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <h2 className="text-xl text-[#1a1a1a] font-montserrat font-bold mb-5">
              Buscar Productos
            </h2>

            {/* Búsqueda Unificada */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <label className="block mb-2 font-semibold text-sm text-[#333]">
                Buscar por Código o Nombre
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                    className="w-full py-3 px-4 pr-10 bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#e74c3c]"
                    placeholder="Escanea código o busca por nombre..."
                    disabled={loading}
                    autoComplete="off"
                  />
                  {loading && (
                    <i className="fas fa-spinner fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-[#e74c3c]"></i>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || !searchQuery.trim()}
                  className="bg-[#e74c3c] text-white border-none py-3 px-6 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#c0392b] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-search"></i>
                </button>
              </div>

              {/* Resultados de búsqueda */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-[#dcdcdc] rounded-md shadow-lg max-h-[400px] overflow-y-auto">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      onMouseDown={(e) => {
                        e.preventDefault() // Previene que el input pierda el foco
                        handleSelectProduct(product)
                      }}
                      className="p-3 hover:bg-[#f5f5f5] cursor-pointer border-b border-[#dcdcdc] last:border-b-0 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-[#333]">{product.name}</div>
                          <div className="text-sm text-[#95a5a6] mt-1">
                            {product.code && <span>Código: {product.code} | </span>}
                            <span>Marca: {product.brand} | </span>
                            <span>Talla: {product.size}</span>
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <div className="font-bold text-[#666]">
                            ${Math.round(getProductPrice(product)).toLocaleString('es-ES')}
                          </div>
                          <div className={`text-xs ${product.stock > 10 ? 'text-[#666]' : product.stock > 0 ? 'text-[#e74c3c]' : 'text-[#e74c3c]'}`}>
                            Stock: {product.stock}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sin resultados */}
              {showResults && searchQuery.length >= 2 && searchResults.length === 0 && !loading && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-[#dcdcdc] rounded-md shadow-lg p-4 text-center text-[#95a5a6]">
                  <i className="fas fa-search text-3xl mb-2"></i>
                  <p>No se encontraron productos</p>
                </div>
              )}
            </form>

            {/* Cerrar resultados al hacer clic fuera */}
            {showResults && (
              <div
                className="fixed inset-0 z-[5]"
                onMouseDown={(e) => {
                  e.preventDefault()
                  setShowResults(false)
                }}
              ></div>
            )}
          </section>

          {/* Carrito de Compras */}
          <section className="bg-white rounded-lg p-[25px] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <h2 className="text-xl text-[#1a1a1a] font-montserrat font-bold mb-5">
              Carrito de Compras
              {cart.length > 0 && (
                <span className="text-sm text-[#95a5a6] ml-2">({cart.length} productos)</span>
              )}
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-10">
                <i className="fas fa-shopping-cart text-6xl text-[#95a5a6] mb-4"></i>
                <p className="text-[#95a5a6]">El carrito está vacío</p>
                <p className="text-sm text-[#95a5a6] mt-2">
                  Busca productos para agregarlos al carrito
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="bg-[#f5f5f5] py-3 px-[15px] text-left font-semibold text-[#333] border-b-2 border-[#dcdcdc]">
                        Producto
                      </th>
                      <th className="bg-[#f5f5f5] py-3 px-[15px] text-center font-semibold text-[#333] border-b-2 border-[#dcdcdc]">
                        Precio
                      </th>
                      <th className="bg-[#f5f5f5] py-3 px-[15px] text-center font-semibold text-[#333] border-b-2 border-[#dcdcdc]">
                        Cantidad
                      </th>
                      <th className="bg-[#f5f5f5] py-3 px-[15px] text-center font-semibold text-[#333] border-b-2 border-[#dcdcdc]">
                        Subtotal
                      </th>
                      <th className="bg-[#f5f5f5] py-3 px-[15px] text-center font-semibold text-[#333] border-b-2 border-[#dcdcdc]">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, index) => (
                      <tr key={index} className="hover:bg-[#f5f5f5]">
                        <td className="py-[15px] px-[15px] border-b border-[#dcdcdc]">
                          <div className="font-semibold">{item.productName}</div>
                          <div className="text-xs text-[#95a5a6]">
                            {item.productCode && <span>Código: {item.productCode} | </span>}
                            Stock disponible: {item.stock}
                          </div>
                        </td>
                        <td className="py-[15px] px-[15px] border-b border-[#dcdcdc] text-center">
                          ${Math.round(item.unitPrice).toLocaleString('es-ES')}
                        </td>
                        <td className="py-[15px] px-[15px] border-b border-[#dcdcdc]">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="w-8 h-8 bg-[#95a5a6] text-white rounded-md hover:bg-[#7f8c8d] transition-colors"
                            >
                              <i className="fas fa-minus text-xs"></i>
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(index, parseInt(e.target.value) || 1)
                              }
                              className="w-16 text-center py-1 px-2 border border-[#dcdcdc] rounded-md"
                              min="1"
                              max={item.stock}
                            />
                            <button
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="w-8 h-8 bg-[#666] text-white rounded-md hover:bg-[#555] transition-colors"
                            >
                              <i className="fas fa-plus text-xs"></i>
                            </button>
                          </div>
                        </td>
                        <td className="py-[15px] px-[15px] border-b border-[#dcdcdc] text-center font-semibold">
                          ${Math.round(item.subtotal).toLocaleString('es-ES')}
                        </td>
                        <td className="py-[15px] px-[15px] border-b border-[#dcdcdc] text-center">
                          <button
                            onClick={() => removeFromCart(index)}
                            className="w-8 h-8 bg-[#e74c3c] text-white rounded-full hover:bg-[#c0392b] transition-colors"
                            title="Eliminar"
                          >
                            <i className="fas fa-trash text-xs"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Panel Lateral - Resumen y Pago */}
        <div className="space-y-[25px]">
          {/* Información del Cliente */}
          <section className="bg-white rounded-lg p-[25px] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-4">Información del Cliente</h3>

            <div className="space-y-3">
              <div>
                <label className="block mb-1 font-semibold text-sm text-[#333]">
                  Nombre (Opcional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full py-2 px-3 bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm focus:outline-none focus:border-[#e74c3c]"
                  placeholder="Nombre del cliente"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-sm text-[#333]">
                  Documento (Opcional)
                </label>
                <input
                  type="text"
                  value={customerDocument}
                  onChange={(e) => setCustomerDocument(e.target.value)}
                  className="w-full py-2 px-3 bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm focus:outline-none focus:border-[#e74c3c]"
                  placeholder="Cédula o NIT"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-sm text-[#333]">
                  Email (Opcional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => {
                    setCustomerEmail(e.target.value)
                    validateEmail(e.target.value)
                  }}
                  onBlur={(e) => validateEmail(e.target.value)}
                  className={`w-full py-2 px-3 bg-[#f5f5f5] border rounded-md text-sm focus:outline-none ${
                    emailError 
                      ? 'border-[#e74c3c] focus:border-[#e74c3c]' 
                      : 'border-[#dcdcdc] focus:border-[#e74c3c]'
                  }`}
                  placeholder="correo@ejemplo.com"
                />
                {emailError ? (
                  <p className="text-xs text-[#e74c3c] mt-1 flex items-center gap-1">
                    <i className="fas fa-exclamation-circle"></i>
                    {emailError}
                  </p>
                ) : (
                  <p className="text-xs text-[#95a5a6] mt-1">
                    Ejemplos: usuario@dominio.com, correo@empresa.co
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-semibold text-sm text-[#333]">
                  Teléfono (Opcional)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value)
                    validatePhone(e.target.value)
                  }}
                  onBlur={(e) => validatePhone(e.target.value)}
                  className={`w-full py-2 px-3 bg-[#f5f5f5] border rounded-md text-sm focus:outline-none ${
                    phoneError 
                      ? 'border-[#e74c3c] focus:border-[#e74c3c]' 
                      : 'border-[#dcdcdc] focus:border-[#e74c3c]'
                  }`}
                  placeholder="3001234567"
                />
                {phoneError ? (
                  <p className="text-xs text-[#e74c3c] mt-1 flex items-center gap-1">
                    <i className="fas fa-exclamation-circle"></i>
                    {phoneError}
                  </p>
                ) : (
                  <p className="text-xs text-[#95a5a6] mt-1">
                    10-15 dígitos, sin espacios (ej: 3001234567)
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Resumen de Pago */}
          <section className="bg-white rounded-lg p-[25px] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-4">Resumen de Pago</h3>

            {/* Campo de Tasa de Impuesto */}
            <div className="mb-4">
              <label className="block mb-2 font-semibold text-sm text-[#333]">
                Tasa de Impuesto (%)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="flex-1 py-2 px-3 bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm focus:outline-none focus:border-[#e74c3c]"
                  placeholder="19"
                  min="0"
                  max="100"
                  step="0.01"
                />
                <button
                  onClick={() => setTaxRate('19')}
                  className="px-3 py-2 bg-[#e74c3c] text-white rounded-md text-xs hover:bg-[#c0392b] transition-colors"
                  title="IVA Colombia 19%"
                >
                  19%
                </button>
                <button
                  onClick={() => setTaxRate('0')}
                  className="px-3 py-2 bg-[#95a5a6] text-white rounded-md text-xs hover:bg-[#7f8c8d] transition-colors"
                  title="Sin impuesto"
                >
                  0%
                </button>
              </div>
              <p className="text-xs text-[#95a5a6] mt-1">
                Ejemplos: 19% (Colombia), 16% (México), 0% (sin impuesto)
              </p>
            </div>

            <div className="space-y-3 border-t border-[#dcdcdc] pt-3">
              <div className="flex justify-between text-[#333]">
                <span>Subtotal:</span>
                <span className="font-semibold">
                  ${Math.round(subtotal).toLocaleString('es-ES')}
                </span>
              </div>
              <div className="flex justify-between text-[#333]">
                <span>Impuesto ({taxRate}%):</span>
                <span className="font-semibold">
                  ${Math.round(estimatedTax).toLocaleString('es-ES')}
                </span>
              </div>
              <div className="border-t-2 border-[#dcdcdc] pt-3 flex justify-between text-xl font-bold text-[#1a1a1a]">
                <span>Total Estimado:</span>
                <span className="text-[#666]">
                  ${Math.round(estimatedTotal).toLocaleString('es-ES')}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                onClick={handleProcessSale}
                disabled={!isFormValid() || processing}
                className="w-full bg-[#666] text-white border-none py-3 px-6 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#555] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                title={!isFormValid() ? 'Corrige los errores del formulario' : 'Procesar venta'}
              >
                {processing ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Procesando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle"></i>
                    Procesar Venta
                  </>
                )}
              </button>

              <button
                onClick={handleCancelSale}
                disabled={processing}
                className="w-full bg-[#e74c3c] text-white border-none py-3 px-6 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#c0392b] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <i className="fas fa-times-circle"></i>
                Cancelar Venta
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Modal de Selección de Precio */}
      {showPriceModal && selectedProduct && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black/50 z-[2000] flex justify-center items-center"
          onClick={() => setShowPriceModal(false)}
        >
          <div
            className="bg-white rounded-lg w-[90%] max-w-[500px] animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#1a1a1a] text-white py-5 px-[25px] flex justify-between items-center rounded-t-lg">
              <h3 className="text-xl font-montserrat font-bold">Seleccionar Precio de Venta</h3>
              <button
                onClick={() => setShowPriceModal(false)}
                className="bg-transparent border-none text-white text-2xl cursor-pointer transition-colors hover:text-[#e74c3c]"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-[25px]">
              {/* Información del Producto */}
              <div className="mb-5 p-4 bg-[#f5f5f5] rounded-lg">
                <h4 className="font-bold text-[#1a1a1a] mb-2">{selectedProduct.name}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[#95a5a6]">Código:</span>
                    <span className="ml-2 font-semibold">{selectedProduct.code || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#95a5a6]">Stock:</span>
                    <span className="ml-2 font-semibold">{selectedProduct.stock}</span>
                  </div>
                  <div>
                    <span className="text-[#95a5a6]">Precio Compra:</span>
                    <span className="ml-2 font-semibold text-[#e74c3c]">
                      ${Math.round(selectedProduct.purchasePrice || 0).toLocaleString('es-ES')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#95a5a6]">Precio Sugerido:</span>
                    <span className="ml-2 font-semibold text-[#666]">
                      ${Math.round(getProductPrice(selectedProduct)).toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Campo de Precio */}
              <div className="mb-5">
                <label className="block mb-2 font-semibold text-sm text-[#333]">
                  Precio de Venta *
                </label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full py-3 px-4 bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-lg font-bold transition-colors focus:outline-none focus:border-[#e74c3c]"
                  placeholder="0"
                  min="0"
                  step="1"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirmPrice()
                    }
                  }}
                />
                <p className="text-xs text-[#95a5a6] mt-2">
                  Puedes modificar el precio sugerido según sea necesario
                </p>
              </div>

              {/* Botones de Precio Rápido */}
              <div className="mb-5">
                <label className="block mb-2 font-semibold text-sm text-[#333]">
                  Precios Rápidos:
                </label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setCustomPrice((selectedProduct.purchasePrice || 0).toString())}
                    className="px-3 py-2 bg-[#e74c3c] text-white rounded-md text-sm hover:bg-[#c0392b] transition-colors"
                  >
                    Precio Compra
                  </button>
                  <button
                    onClick={() => setCustomPrice(getProductPrice(selectedProduct).toString())}
                    className="px-3 py-2 bg-[#666] text-white rounded-md text-sm hover:bg-[#555] transition-colors"
                  >
                    Precio Sugerido
                  </button>
                  {selectedProduct.purchasePrice && (
                    <>
                      <button
                        onClick={() => setCustomPrice(Math.round(selectedProduct.purchasePrice! * 1.2).toString())}
                        className="px-3 py-2 bg-[#e74c3c] text-white rounded-md text-sm hover:bg-[#c0392b] transition-colors"
                      >
                        +20%
                      </button>
                      <button
                        onClick={() => setCustomPrice(Math.round(selectedProduct.purchasePrice! * 1.5).toString())}
                        className="px-3 py-2 bg-[#e74c3c] text-white rounded-md text-sm hover:bg-[#c0392b] transition-colors"
                      >
                        +50%
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Cálculo de Ganancia */}
              {customPrice && parseFloat(customPrice) > 0 && selectedProduct.purchasePrice && (
                <div className="mb-5 p-3 bg-[#f5f5f5] border border-[#95a5a6] rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-[#333]">Ganancia estimada:</span>
                    <span className="text-lg font-bold text-[#666]">
                      ${Math.round(parseFloat(customPrice) - selectedProduct.purchasePrice).toLocaleString('es-ES')}
                      <span className="text-sm ml-2">
                        ({(((parseFloat(customPrice) - selectedProduct.purchasePrice) / selectedProduct.purchasePrice) * 100).toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPriceModal(false)}
                  className="flex-1 bg-[#95a5a6] text-white border-none py-3 px-6 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#7f8c8d]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmPrice}
                  className="flex-1 bg-[#666] text-white border-none py-3 px-6 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#555]"
                >
                  Agregar al Carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito de Venta */}
      {showSuccessModal && lastInvoice && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black/50 z-[2001] flex justify-center items-center"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="bg-white rounded-lg w-[90%] max-w-[600px] animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#666] text-white py-5 px-[25px] flex justify-between items-center rounded-t-lg">
              <div className="flex items-center gap-3">
                <i className="fas fa-check-circle text-3xl"></i>
                <h3 className="text-xl font-montserrat font-bold">¡Venta Procesada Exitosamente!</h3>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="bg-transparent border-none text-white text-2xl cursor-pointer transition-colors hover:text-[#e74c3c]"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-[25px]">
              {/* Información de la Factura */}
              <div className="mb-5 p-4 bg-[#f5f5f5] border border-[#95a5a6] rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-[#95a5a6] mb-1">Número de Factura</div>
                    <div className="text-lg font-bold text-[#1a1a1a]">{lastInvoice.invoiceNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#95a5a6] mb-1">Fecha</div>
                    <div className="text-lg font-bold text-[#1a1a1a]">
                      {new Date(lastInvoice.issueDate).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[#95a5a6] mb-1">Cliente</div>
                    <div className="text-lg font-bold text-[#1a1a1a]">{lastInvoice.customer.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#95a5a6] mb-1">Cajero</div>
                    <div className="text-lg font-bold text-[#1a1a1a]">{lastInvoice.cashier}</div>
                  </div>
                </div>
              </div>

              {/* Totales */}
              <div className="mb-5 space-y-3">
                <div className="flex justify-between text-[#333]">
                  <span className="font-semibold">Subtotal:</span>
                  <span className="font-bold">${Math.round(lastInvoice.subtotal).toLocaleString('es-ES')}</span>
                </div>
                <div className="flex justify-between text-[#333]">
                  <span className="font-semibold">Impuesto ({(lastInvoice.taxRate * 100).toFixed(0)}%):</span>
                  <span className="font-bold">${Math.round(lastInvoice.tax).toLocaleString('es-ES')}</span>
                </div>
                <div className="border-t-2 border-[#dcdcdc] pt-3 flex justify-between text-2xl font-bold text-[#1a1a1a]">
                  <span>Total:</span>
                  <span className="text-[#666]">${Math.round(lastInvoice.total).toLocaleString('es-ES')}</span>
                </div>
                <div className="flex justify-between text-[#e74c3c] text-lg">
                  <span className="font-semibold">Ganancia:</span>
                  <span className="font-bold">${Math.round(lastInvoice.totalProfit).toLocaleString('es-ES')}</span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-3">
                <button
                  onClick={handleGeneratePDF}
                  className="flex-1 bg-[#e74c3c] text-white border-none py-3 px-6 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#c0392b] flex items-center justify-center gap-2"
                >
                  <i className="fas fa-file-pdf"></i>
                  Generar PDF
                </button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 bg-[#666] text-white border-none py-3 px-6 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#555] flex items-center justify-center gap-2"
                >
                  <i className="fas fa-check"></i>
                  Continuar
                </button>
              </div>

              <p className="text-xs text-[#95a5a6] text-center mt-4">
                Puedes generar el PDF ahora o continuar con otra venta
              </p>
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
                        : 'fa-info-circle text-[#666]'
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
                      : 'Información'}
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

export default Sales
