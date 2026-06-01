import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8081/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface ChangePasswordRequest {
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface MessageResponse {
  message: string
}

export interface ErrorResponse {
  error: string
}

export const authService = {
  // Cambiar contraseña
  changePassword: async (request: ChangePasswordRequest): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>('/auth/change-password', request)
    return response.data
  },

  // Registrar nuevo usuario
  register: async (request: RegisterRequest): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>('/auth/register', request)
    return response.data
  },
}

export default authService
