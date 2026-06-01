import React, { useState } from 'react'
import { authService } from '../services/api'

interface LoginProps {
  onForgotPassword: () => void
  onLoginSuccess: () => void
}

const Login: React.FC<LoginProps> = ({ onForgotPassword, onLoginSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = await authService.login(email, password)

      // Guardar token usando authUtils
      const { authUtils } = await import('../utils/auth')
      authUtils.setToken(token, rememberMe)

      // Redirigir al dashboard
      onLoginSuccess()
    } catch (err: any) {
      const errorMessage =
        err.response?.data || 'Error al iniciar sesión. Intenta nuevamente.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden relative bg-gradient-to-br from-[#1a1a1a] to-[#2c2c2c]">
      {/* Background Pattern */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-pattern"></div>

      {/* Geometric Elements */}
      <div className="absolute top-[10%] left-[5%] w-[200px] h-[200px] border-2 border-white/5 rounded-full rotate-[15deg] -z-10"></div>
      <div className="absolute bottom-[15%] right-[10%] w-[150px] h-[150px] border-2 border-white/5 rotate-[30deg] -z-10"></div>
      <div className="absolute top-[30%] right-[20%] w-[100px] h-[100px] border-2 border-white/5 rotate-45 -z-10"></div>

      {/* Login Container */}
      <div className="flex-1 flex items-center justify-center py-[40px] px-5">
        <div className="w-full max-w-[450px] bg-white/10 backdrop-blur-[10px] rounded-[16px] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)] p-[40px] animate-fadeIn">
          {/* Logo */}
       <div className="text-center mb-[30px]">
          <h1 className="text-[36px] font-bold tracking-[1px] font-montserrat">
          <span className="text-white">Cather</span><span className="text-[#e74c3c]">ino</span>
        </h1>
        </div>

          {/* Form Title */}
          <h2 className="text-center mb-[30px] text-[24px] text-white font-montserrat font-bold">
            Iniciar Sesión
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-[25px] relative">
              <label
                htmlFor="email"
                className="block mb-[8px] font-semibold text-[14px] text-white"
              >
                Usuario
              </label>
              <i className="fas fa-user absolute left-[18px] top-[43px] text-white/70 text-[18px]"></i>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-[15px] px-[20px] pl-[50px] bg-white/10 border border-white/20 rounded-[8px] text-white text-[16px] transition-all duration-300 placeholder:text-white/50 focus:outline-none focus:bg-white/15 focus:border-[#0074D9] focus:shadow-[0_0_0_3px_rgba(0,116,217,0.2)]"
                placeholder="Ingresa tu usuario"
                required
              />
            </div>

            {/* Password Field */}
            <div className="mb-[25px] relative">
              <label
                htmlFor="password"
                className="block mb-[8px] font-semibold text-[14px] text-white"
              >
                Contraseña
              </label>
              <i className="fas fa-lock absolute left-[18px] top-[43px] text-white/70 text-[18px]"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-[15px] px-[20px] pl-[50px] bg-white/10 border border-white/20 rounded-[8px] text-white text-[16px] transition-all duration-300 placeholder:text-white/50 focus:outline-none focus:bg-white/15 focus:border-[#0074D9] focus:shadow-[0_0_0_3px_rgba(0,116,217,0.2)]"
                placeholder="Ingresa tu contraseña"
                required
              />
              <i
                className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'} absolute right-[18px] top-[43px] text-white/70 text-[18px] cursor-pointer transition-colors hover:text-white`}
                onClick={togglePasswordVisibility}
              ></i>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-[20px] p-[12px] bg-red-500/20 border border-red-500/50 rounded-[8px] text-red-200 text-[14px]">
                {error}
              </div>
            )}

            {/* Form Options */}
            <div className="flex justify-between items-center mb-[30px]">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-[18px] h-[18px] mr-[8px] cursor-pointer"
                />
                <label htmlFor="remember" className="text-white text-[14px] cursor-pointer">
                  Recordar sesión
                </label>
              </div>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-white text-[14px] no-underline transition-colors hover:text-[#0074D9] bg-transparent border-none cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-[15px] bg-[#e74c3c] text-white border-none rounded-[8px] text-[16px] font-semibold cursor-pointer transition-all duration-300 uppercase tracking-[1px] hover:bg-[#c0392b] hover:-translate-y-[2px] hover:shadow-[0_5px_15px_rgba(231,76,60,0.3)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-[20px] text-[14px] text-white/70">
        <p>&copy; 2025 Catherino. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}

export default Login
