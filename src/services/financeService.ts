import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_FINANCE_API_URL || 'http://localhost:8083/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interfaces según la nueva documentación del backend
export interface TimeRangeRequest {
  startDate: string // formato: ISO 8601 (yyyy-MM-ddTHH:mm:ss)
  endDate: string // formato: ISO 8601 (yyyy-MM-ddTHH:mm:ss)
  label?: string // Etiqueta opcional para identificar el rango
}

export interface SoldProductResponse {
  productId: string
  productName: string
  productCode: string
  totalSold: number
  totalRevenue: number
  totalProfit: number
}

export interface ProfitResponse {
  startDate: string
  endDate: string
  totalProfit: number
  totalInvoices: number
  totalProductsSold: number
}

export interface TimeRangeComparison {
  startDate: string
  endDate: string
  label: string
  totalSales: number
  totalRevenue: number
  totalProfit: number
  totalProductsSold: number
}

export const financeService = {
  // Get All Sold Products
  getAllSoldProducts: async (): Promise<SoldProductResponse[]> => {
    const response = await api.get<SoldProductResponse[]>('/finance/sold-products')
    return response.data
  },

  // Get Sold Products by Product ID
  getSoldProductsByProductId: async (productId: string): Promise<SoldProductResponse> => {
    const response = await api.get<SoldProductResponse>(`/finance/sold-products/${productId}`)
    return response.data
  },

  // Get Total Products Sold
  getTotalProductsSold: async (): Promise<{ totalProductsSold: number }> => {
    const response = await api.get<{ totalProductsSold: number }>('/finance/total-products-sold')
    return response.data
  },

  // Get Profits by Time Range
  getProfitsByTimeRange: async (request: TimeRangeRequest): Promise<ProfitResponse> => {
    const response = await api.post<ProfitResponse>('/finance/profits', request)
    return response.data
  },

  // Compare Sales by Time Ranges
  compareSalesByTimeRanges: async (requests: TimeRangeRequest[]): Promise<TimeRangeComparison[]> => {
    const response = await api.post<TimeRangeComparison[]>('/finance/compare/sales', requests)
    return response.data
  },
}

export default financeService
