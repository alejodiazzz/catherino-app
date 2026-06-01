// Utilidad para decodificar JWT sin necesidad de librerías externas
export interface JWTPayload {
  sub: string // email del usuario
  exp: number // timestamp de expiración
  iat: number // timestamp de emisión
  [key: string]: any // otros campos que pueda tener el token
}

export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    // El JWT tiene 3 partes separadas por puntos: header.payload.signature
    const parts = token.split('.')
    
    if (parts.length !== 3) {
      console.error('Token JWT inválido: no tiene 3 partes')
      return null
    }

    // Decodificar la parte del payload (segunda parte)
    const payload = parts[1]
    
    // Reemplazar caracteres específicos de base64url con base64 estándar
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    
    // Decodificar de base64
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )

    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error al decodificar JWT:', error)
    return null
  }
}

export const getEmailFromToken = (token: string | null): string | null => {
  if (!token) return null
  
  const payload = decodeJWT(token)
  return payload?.sub || null
}

export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true
  
  const payload = decodeJWT(token)
  if (!payload || !payload.exp) return true
  
  // Verificar si el token ha expirado
  const currentTime = Math.floor(Date.now() / 1000)
  return payload.exp < currentTime
}

export const getTokenFromStorage = (): string | null => {
  // Intentar obtener el token de localStorage o sessionStorage
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
}
