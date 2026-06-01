// Utilidades para manejo de autenticación

export const authUtils = {
  // Obtener el token de autenticación
  getToken: (): string | null => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
  },

  // Guardar el token
  setToken: (token: string, remember: boolean = false): void => {
    if (remember) {
      localStorage.setItem('authToken', token)
    } else {
      sessionStorage.setItem('authToken', token)
    }
  },

  // Eliminar el token
  removeToken: (): void => {
    localStorage.removeItem('authToken')
    sessionStorage.removeItem('authToken')
  },

  // Verificar si hay sesión activa
  isAuthenticated: (): boolean => {
    return !!authUtils.getToken()
  },

  // Obtener información del usuario (si está en el token)
  getUserInfo: (): { userName: string; userEmail: string } | null => {
    const token = authUtils.getToken()
    if (!token) return null

    try {
      // Si el token es JWT, decodificarlo
      // Por ahora retornamos datos por defecto
      return {
        userName: 'Admin',
        userEmail: 'admin@catherino.com',
      }
    } catch (error) {
      return null
    }
  },
}
