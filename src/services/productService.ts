import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_PRODUCTS_API_URL || 'https://back-catherino.onrender.com/api/products'

console.log('Products API URL:', API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para logging
api.interceptors.request.use(
  (config) => {
    console.log('Request:', config.method?.toUpperCase(), config.baseURL + config.url)
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
    return Promise.reject(error)
  }
)

export interface Product {
  id?: string
  code: string
  name: string
  category: string
  size: string
  stock: number
  purchasePrice: number
  suggestedSalePrice: number
  color: string
  brand: string
  description: string
  active?: boolean
  profitMargin?: number
  // Alias para compatibilidad con código existente
  price?: number
}

export const productService = {
  // Obtener todos los productos
  getAllProducts: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('')
    return response.data
  },

  // Obtener un producto por ID
  getProductById: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/${id}`)
    return response.data
  },

  // Crear un nuevo producto
  createProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
    const response = await api.post<Product>('', product)
    return response.data
  },

  // Actualizar un producto existente
  updateProduct: async (id: string, product: Omit<Product, 'id'>): Promise<Product> => {
    const response = await api.put<Product>(`/${id}`, product)
    return response.data
  },

  // Eliminar un producto
  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/${id}`)
  },
}

export default productService
