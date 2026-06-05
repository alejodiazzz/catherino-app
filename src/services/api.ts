import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://back-catherino-qlxu.onrender.com/api/auth'

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

export interface AuthRequest {
    email: string
    password: string
}

export interface ResetPasswordRequest {
    email: string
    token: string
    newPassword: string
}

export const authService = {
    login: async (email: string, password: string): Promise<string> => {
        const response = await api.post<string>('/login', { email, password })
        return response.data
    },

    register: async (email: string, password: string): Promise<string> => {
        const response = await api.post<string>('/register', { email, password })
        return response.data
    },

    forgotPassword: async (email: string): Promise<string> => {
        const response = await api.post<string>('/forgot-password', { email })
        return response.data
    },

    resetPassword: async (
        email: string,
        token: string,
        newPassword: string
    ): Promise<string> => {
        const response = await api.post<string>('/reset-password', {
            email,
            token,
            newPassword,
        })
        return response.data
    },
}

export default api
