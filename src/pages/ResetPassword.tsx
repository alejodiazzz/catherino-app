import React, { useState } from 'react'
import { authService } from '../services/api'

interface ResetPasswordProps {
  email: string
  onBack: () => void
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ email, onBack }) => {
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    // Validar longitud mínima
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      await authService.resetPassword(email, token, newPassword)
      setSuccess(true)
      setTimeout(() => {
        onBack()
      }, 2000)
    } catch (err: any) {
      const errorMessage =
        err.response?.data ||
        'Error al restablecer la contraseña. Verifica el código.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden relative bg-gradient-to-br from-[#1a1a1a] to-[#2c2c2c]">
      {/* Background Pattern */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-pattern"></div>

      {/* Geometric Elements */}
      <div className="absolute top-[10%] left-[5%] w-[200px] h-[200px] border-2 border-white/5 rounded-full rotate-[15deg] -z-10"></div>
      <div className="absolute bottom-[15%] right-[10%] w-[150px] h-[150px] border-2 border-white/5 rotate-[30deg] -z-10"></div>
      <div className="absolute top-[30%] right-[20%] w-[100px] h-[100px] border-2 border-white/5 rotate-45 -z-10"></div>

      {/* Content Container */}
      <div className="flex-1 flex items-center justify-center py-[40px] px-5">
        <div className="w-full max-w-[450px] bg-white/10 backdrop-blur-[10px] rounded-[16px] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)] p-[40px] animate-fadeIn">
          {/* Logo */}
          <div className="text-center mb-[30px]">
            <h1 className="text-[36px] font-bold tracking-[1px] font-montserrat">
              Cather<span className="text-[#e74c3c]">ino</span>
            </h1>
          </div>

          {/* Form Title */}
          <h2 className="text-center mb-[20px] text-[24px] text-white font-montserrat font-bold">
            Restablecer Contraseña
          </h2>

          <p className="text-center text-white/70 text-[14px] mb-[30px]">
            Ingresa el código que recibiste en tu correo y tu nueva contraseña.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Token Field */}
            <div className="mb-[25px] relative">
              <label
                htmlFor="token"
                className="block mb-[8px] font-semibold text-[14px] text-white"
              >
                Código de Recuperación
              </label>
              <i className="fas fa-key absolute left-[18px] top-[43px] text-white/70 text-[18px]"></i>
              <input
                type="text"
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full py-[15px] px-[20px] pl-[50px] bg-white/10 border border-white/20 rounded-[8px] text-white text-[16px] transition-all duration-300 placeholder:text-white/50 focus:outline-none focus:bg-white/15 focus:border-[#0074D9] focus:shadow-[0_0_0_3px_rgba(0,116,217,0.2)]"
                placeholder="Ingresa el código"
                required
              />
            </div>

            {/* New Password Field */}
            <div className="mb-[25px] relative">
              <label
                htmlFor="newPassword"
                className="block mb-[8px] font-semibold text-[14px] text-white"
              >
                Nueva Contraseña
              </label>
              <i className="fas fa-lock absolute left-[18px] top-[43px] text-white/70 text-[18px]"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full py-[15px] px-[20px] pl-[50px] bg-white/10 border border-white/20 rounded-[8px] text-white text-[16px] transition-all duration-300 placeholder:text-white/50 focus:outline-none focus:bg-white/15 focus:border-[#0074D9] focus:shadow-[0_0_0_3px_rgba(0,116,217,0.2)]"
                placeholder="Mínimo 6 caracteres"
                required
              />
              <i
                className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'} absolute right-[18px] top-[43px] text-white/70 text-[18px] cursor-pointer transition-colors hover:text-white`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>

            {/* Confirm Password Field */}
            <div className="mb-[25px] relative">
              <label
                htmlFor="confirmPassword"
                className="block mb-[8px] font-semibold text-[14px] text-white"
              >
                Confirmar Contraseña
              </label>
              <i className="fas fa-lock absolute left-[18px] top-[43px] text-white/70 text-[18px]"></i>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full py-[15px] px-[20px] pl-[50px] bg-white/10 border border-white/20 rounded-[8px] text-white text-[16px] transition-all duration-300 placeholder:text-white/50 focus:outline-none focus:bg-white/15 focus:border-[#0074D9] focus:shadow-[0_0_0_3px_rgba(0,116,217,0.2)]"
                placeholder="Repite la contraseña"
                required
              />
              <i
                className={`fas ${showConfirmPassword ? 'fa-eye' : 'fa-eye-slash'} absolute right-[18px] top-[43px] text-white/70 text-[18px] cursor-pointer transition-colors hover:text-white`}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              ></i>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-[20px] p-[12px] bg-red-500/20 border border-red-500/50 rounded-[8px] text-red-200 text-[14px]">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-[20px] p-[12px] bg-green-500/20 border border-green-500/50 rounded-[8px] text-green-200 text-[14px]">
                Contraseña actualizada exitosamente. Redirigiendo al login...
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-[15px] bg-[#e74c3c] text-white border-none rounded-[8px] text-[16px] font-semibold cursor-pointer transition-all duration-300 uppercase tracking-[1px] hover:bg-[#c0392b] hover:-translate-y-[2px] hover:shadow-[0_5px_15px_rgba(231,76,60,0.3)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mb-[15px]"
            >
              {loading ? 'Actualizando...' : 'Restablecer Contraseña'}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={onBack}
              className="w-full py-[15px] bg-white/10 text-white border border-white/20 rounded-[8px] text-[16px] font-semibold cursor-pointer transition-all duration-300 hover:bg-white/15"
            >
              Volver al Login
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-[20px] text-[14px] text-white/70">
        <p>&copy; 2023 Catherino. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}

export default ResetPassword
