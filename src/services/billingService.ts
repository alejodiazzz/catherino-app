import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_BILLING_API_URL || 'https://back-catherino-billing-service.onrender.com/api'

console.log('Billing API URL:', API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para logging
api.interceptors.request.use(
  (config) => {
    const url = `${config.baseURL || ''}${config.url || ''}`
    console.log('Request:', config.method?.toUpperCase(), url)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.data)
    return response
  },
  (error) => {
    console.error('Response Error:', error.response?.status, error.message)
    
    // Si es un error 400, intentar obtener más detalles
    if (error.response?.status === 400) {
      console.error('Bad Request Details:', {
        data: error.response.data,
        headers: error.response.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      })
    }
    
    return Promise.reject(error)
  }
)

// Interfaces según la documentación del backend
export interface Customer {
  documentNumber: string
  name: string
  email?: string
  phone?: string
  address?: string
}

export interface ProductPricing {
  productId: string
  code: string
  name: string
  purchasePrice: number
  suggestedSalePrice: number
  currentStock: number
  profitMargin: number
}

export interface SaleItem {
  productId: string
  quantity: number
  salePrice: number
}

export interface SaleRequest {
  customer?: Customer
  items: SaleItem[]
  cashier: string
  taxRate: number
}

export interface InvoiceDetail {
  productId: string
  productName: string
  productCode: string
  quantity: number
  unitPrice: number
  suggestedPrice: number
  purchasePrice: number
  subtotal: number
  profit: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  issueDate: string
  customer: Customer
  details: InvoiceDetail[]
  subtotal: number
  taxRate: number
  tax: number
  total: number
  totalProfit: number
  status: string
  cashier: string
}

export const billingService = {
  // Obtener información de precios de un producto
  getProductPricing: async (code: string): Promise<ProductPricing> => {
    const response = await api.get<ProductPricing>(`/pos/products/${code}/pricing`)
    return response.data
  },

  // Buscar producto por código
  getProductByCode: async (code: string): Promise<any> => {
    const response = await api.get(`/pos/products/${code}`)
    return response.data
  },

  // Buscar productos por nombre
  searchProductsByName: async (name: string): Promise<any[]> => {
    const response = await api.get(`/pos/products/search/${name}`)
    return response.data
  },

  // Procesar venta
  processSale: async (saleRequest: SaleRequest): Promise<Invoice> => {
    const response = await api.post<Invoice>('/pos/sale', saleRequest)
    return response.data
  },

  // Obtener factura por ID
  getInvoiceById: async (id: string): Promise<Invoice> => {
    const response = await api.get<Invoice>(`/pos/invoices/${id}`)
    return response.data
  },

  // Cancelar factura
  cancelInvoice: async (id: string): Promise<Invoice> => {
    const response = await api.put<Invoice>(`/pos/invoices/${id}/cancel`)
    return response.data
  },

  // Obtener facturas recientes
  getRecentInvoices: async (): Promise<Invoice[]> => {
    const response = await api.get<Invoice[]>('/pos/invoices/recent')
    return response.data
  },

  // Obtener todas las facturas
  getAllInvoices: async (): Promise<Invoice[]> => {
    const response = await api.get<Invoice[]>('/invoices')
    return response.data
  },

  // Obtener factura por número
  getInvoiceByNumber: async (invoiceNumber: string): Promise<Invoice> => {
    const response = await api.get<Invoice>(`/invoices/number/${invoiceNumber}`)
    return response.data
  },

  // Obtener facturas por cliente
  getInvoicesByCustomer: async (documentNumber: string): Promise<Invoice[]> => {
    const response = await api.get<Invoice[]>(`/invoices/customer/${documentNumber}`)
    return response.data
  },

  // Obtener facturas por rango de fechas
  getInvoicesByDateRange: async (startDate: string, endDate: string): Promise<Invoice[]> => {
    const response = await api.get<Invoice[]>('/invoices/date-range', {
      params: { startDate, endDate },
    })
    return response.data
  },

  // Obtener facturas por estado
  getInvoicesByStatus: async (status: string): Promise<Invoice[]> => {
    const response = await api.get<Invoice[]>(`/invoices/status/${status}`)
    return response.data
  },
}

export default billingService
