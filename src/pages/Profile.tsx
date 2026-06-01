import React, { useState, useEffect } from 'react'
import { PageLayout } from '../components'
import { authService } from '../services/authService'
import { getEmailFromToken, getTokenFromStorage } from '../utils/jwtUtils'

interface ProfileProps {
  onLogout?: () => void
}

const Profile: React.FC<ProfileProps> = ({ onLogout }) => {
  // Estados para el formulario de cambio de contraseña
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Estados para crear nuevo usuario
  const [activeTab, setActiveTab] = useState<'password' | 'newUser'>('password')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserConfirmPassword, setNewUserConfirmPassword] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)
  const [newUserPasswordError, setNewUserPasswordError] = useState('')
  const [newUserConfirmError, setNewUserConfirmError] = useState('')

  // Obtener email del token al cargar el componente
  useEffect(() => {
    const token = getTokenFromStorage()
    const userEmail = getEmailFromToken(token)
    
    if (userEmail) {
      setEmail(userEmail)
    }
  }, [])

  // Estados para mostrar/ocultar contraseñas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Estados para validación en tiempo real
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')

  // Sistema de notificaciones
  const [notification, setNotification] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'warning'
  }>({ show: false, message: '', type: 'success' })

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ show: true, message, type })
  }

  const closeNotification = () => {
    setNotification({ show: false, message: '', type: 'success' })
  }

  // Validar nueva contraseña
  const validateNewPassword = (password: string) => {
    if (!password) {
      setNewPasswordError('')
      return true
    }

    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Mínimo 8 caracteres')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Al menos una mayúscula')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Al menos una minúscula')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Al menos un número')
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Al menos un carácter especial')
    }

    if (errors.length > 0) {
      setNewPasswordError(errors.join(', '))
      return false
    }

    setNewPasswordError('')
    return true
  }

  // Validar confirmación de contraseña
  const validateConfirmPassword = (confirm: string) => {
    if (!confirm) {
      setConfirmPasswordError('')
      return true
    }

    if (confirm !== newPassword) {
      setConfirmPasswordError('Las contraseñas no coinciden')
      return false
    }

    setConfirmPasswordError('')
    return true
  }

  // Verificar si el formulario es válido
  const isFormValid = () => {
    return (
      email.trim() !== '' &&
      currentPassword.trim() !== '' &&
      newPassword.trim() !== '' &&
      confirmPassword.trim() !== '' &&
      !newPasswordError &&
      !confirmPasswordError &&
      newPassword === confirmPassword
    )
  }

  // Validar contraseña de nuevo usuario
  const validateNewUserPassword = (password: string) => {
    if (!password) {
      setNewUserPasswordError('')
      return true
    }

    const errors: string[] = []

    if (password.length < 6) {
      errors.push('Mínimo 6 caracteres')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Al menos una mayúscula')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Al menos una minúscula')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Al menos un número')
    }

    if (errors.length > 0) {
      setNewUserPasswordError(errors.join(', '))
      return false
    }

    setNewUserPasswordError('')
    return true
  }

  // Validar confirmación de contraseña de nuevo usuario
  const validateNewUserConfirm = (confirm: string) => {
    if (!confirm) {
      setNewUserConfirmError('')
      return true
    }

    if (confirm !== newUserPassword) {
      setNewUserConfirmError('Las contraseñas no coinciden')
      return false
    }

    setNewUserConfirmError('')
    return true
  }

  // Manejar creación de nuevo usuario
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUserEmail)) {
      showNotification('Por favor, ingresa un email válido', 'error')
      return
    }

    // Validar contraseñas
    const isPasswordValid = validateNewUserPassword(newUserPassword)
    const isConfirmValid = validateNewUserConfirm(newUserConfirmPassword)

    if (!isPasswordValid || !isConfirmValid) {
      showNotification('Por favor, corrige los errores en el formulario', 'error')
      return
    }

    try {
      setCreatingUser(true)

      const request = {
        email: newUserEmail.trim(),
        password: newUserPassword.trim(),
      }

      const response = await authService.register(request)
      
      showNotification(response.message || 'Usuario creado exitosamente', 'success')
      
      // Limpiar formulario
      setNewUserEmail('')
      setNewUserPassword('')
      setNewUserConfirmPassword('')
      setNewUserPasswordError('')
      setNewUserConfirmError('')
    } catch (err: any) {
      console.error('Error al crear usuario:', err)

      let errorMessage = 'Error al crear el usuario'

      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message
        }
      } else if (err.message) {
        errorMessage = err.message
      }

      showNotification(errorMessage, 'error')
    } finally {
      setCreatingUser(false)
    }
  }

  // Manejar cambio de contraseña
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar email
    if (!email.trim()) {
      showNotification('No se pudo obtener tu email. Por favor, inicia sesión nuevamente.', 'error')
      return
    }

    // Validar todos los campos
    const isNewPasswordValid = validateNewPassword(newPassword)
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword)

    if (!isNewPasswordValid || !isConfirmPasswordValid) {
      showNotification('Por favor, corrige los errores en el formulario', 'error')
      return
    }

    if (!currentPassword.trim()) {
      showNotification('La contraseña actual es requerida', 'error')
      return
    }

    try {
      setLoading(true)

      const request = {
        email: email.trim(),
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      }

      const response = await authService.changePassword(request)
      
      showNotification(response.message || 'Contraseña cambiada exitosamente', 'success')

      // Limpiar formulario (excepto email)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setNewPasswordError('')
      setConfirmPasswordError('')
    } catch (err: any) {
      console.error('Error al cambiar contraseña:', err)

      let errorMessage = 'Error al cambiar la contraseña'

      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message
        }
      } else if (err.message) {
        errorMessage = err.message
      }

      showNotification(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout onLogout={onLogout}>
      {/* Título Centrado */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-montserrat font-bold text-[#1a1a1a] mb-2">
          Mi Perfil
        </h1>
        <p className="text-[#666]">
          Administra tu información personal y configuración de cuenta
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Información del Usuario */}
        <div className="bg-white/10 backdrop-blur-[10px] rounded-[16px] border border-white/20 p-6 mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#e74c3c]/20 rounded-full flex items-center justify-center border-2 border-[#e74c3c]/30">
              <i className="fas fa-user text-[#e74c3c] text-2xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-montserrat font-bold text-[#1a1a1a] mb-1">
                {email || 'Cargando...'}
              </h2>
              <p className="text-[#666] text-sm">
                Cuenta activa
              </p>
            </div>
          </div>
        </div>

        {/* Pestañas */}
        <div className="bg-white/10 backdrop-blur-[10px] rounded-[16px] border border-white/20 mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <div className="flex border-b border-white/20">
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-4 px-6 font-semibold text-sm transition-all ${
                activeTab === 'password'
                  ? 'text-[#e74c3c] border-b-2 border-[#e74c3c] bg-white/5'
                  : 'text-[#666] hover:text-[#1a1a1a] hover:bg-white/5'
              }`}
            >
              <i className="fas fa-key mr-2"></i>
              Cambiar Contraseña
            </button>
            <button
              onClick={() => setActiveTab('newUser')}
              className={`flex-1 py-4 px-6 font-semibold text-sm transition-all ${
                activeTab === 'newUser'
                  ? 'text-[#e74c3c] border-b-2 border-[#e74c3c] bg-white/5'
                  : 'text-[#666] hover:text-[#1a1a1a] hover:bg-white/5'
              }`}
            >
              <i className="fas fa-user-plus mr-2"></i>
              Crear Usuario
            </button>
          </div>
        </div>

        {/* Sección de Cambio de Contraseña */}
        {activeTab === 'password' && (
          <section className="bg-white/10 backdrop-blur-[10px] rounded-[16px] border border-white/20 p-[30px] shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <h2 className="text-2xl text-[#1a1a1a] font-montserrat font-bold mb-2">
              Cambiar Contraseña
            </h2>
            <p className="text-sm text-[#666] mb-8">
              Actualiza tu contraseña para mantener tu cuenta segura
            </p>

          <form onSubmit={handleChangePassword} className="space-y-5">

            {/* Contraseña Actual */}
            <div>
              <label className="block mb-2 font-semibold text-sm text-[#1a1a1a]">
                Contraseña Actual <span className="text-[#e74c3c]">*</span>
              </label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-[#666]"></i>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full py-3 pl-12 pr-12 bg-white/10 border border-white/20 rounded-[8px] text-[#1a1a1a] text-sm transition-all placeholder:text-[#95a5a6] focus:outline-none focus:bg-white/15 focus:bg-white/15 focus:border-[#e74c3c] focus:shadow-[0_0_0_3px_rgba(231,76,60,0.2)] focus:shadow-[0_0_0_3px_rgba(231,76,60,0.2)]"
                  placeholder="Ingresa tu contraseña actual"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#1a1a1a] transition-colors bg-transparent border-none cursor-pointer"
                >
                  <i className={`fas ${showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* Nueva Contraseña */}
            <div>
              <label className="block mb-2 font-semibold text-sm text-[#1a1a1a]">
                Nueva Contraseña <span className="text-[#e74c3c]">*</span>
              </label>
              <div className="relative">
                <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-[#666]"></i>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    validateNewPassword(e.target.value)
                    if (confirmPassword) {
                      validateConfirmPassword(confirmPassword)
                    }
                  }}
                  onBlur={(e) => validateNewPassword(e.target.value)}
                  className={`w-full py-3 pl-12 pr-12 bg-[#f5f5f5] border rounded-md text-sm transition-colors focus:outline-none ${
                    newPasswordError
                      ? 'border-[#e74c3c] focus:border-[#e74c3c]'
                      : 'border-[#dcdcdc] focus:bg-white/15 focus:border-[#e74c3c] focus:shadow-[0_0_0_3px_rgba(231,76,60,0.2)]'
                  }`}
                  placeholder="Ingresa tu nueva contraseña"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#1a1a1a] transition-colors"
                >
                  <i className={`fas ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {newPasswordError ? (
                <p className="text-xs text-[#e74c3c] mt-1 flex items-center gap-1">
                  <i className="fas fa-exclamation-circle"></i>
                  {newPasswordError}
                </p>
              ) : (
                <p className="text-xs text-[#666] mt-1">
                  Mínimo 8 caracteres con mayúsculas, minúsculas, números y símbolos
                </p>
              )}
            </div>

            {/* Confirmar Nueva Contraseña */}
            <div>
              <label className="block mb-2 font-semibold text-sm text-[#1a1a1a]">
                Confirmar Nueva Contraseña <span className="text-[#e74c3c]">*</span>
              </label>
              <div className="relative">
                <i className="fas fa-check-circle absolute left-4 top-1/2 -translate-y-1/2 text-[#666]"></i>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    validateConfirmPassword(e.target.value)
                  }}
                  onBlur={(e) => validateConfirmPassword(e.target.value)}
                  className={`w-full py-3 pl-12 pr-12 bg-[#f5f5f5] border rounded-md text-sm transition-colors focus:outline-none ${
                    confirmPasswordError
                      ? 'border-[#e74c3c] focus:border-[#e74c3c]'
                      : 'border-[#dcdcdc] focus:bg-white/15 focus:border-[#e74c3c] focus:shadow-[0_0_0_3px_rgba(231,76,60,0.2)]'
                  }`}
                  placeholder="Confirma tu nueva contraseña"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#1a1a1a] transition-colors"
                >
                  <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {confirmPasswordError && (
                <p className="text-xs text-[#e74c3c] mt-1 flex items-center gap-1">
                  <i className="fas fa-exclamation-circle"></i>
                  {confirmPasswordError}
                </p>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={() => {
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                  setNewPasswordError('')
                  setConfirmPasswordError('')
                }}
                disabled={loading}
                className="bg-white/20 text-[#1a1a1a] border-none py-3 px-8 rounded-md font-semibold cursor-pointer transition-colors hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-eraser mr-2"></i>
                Limpiar
              </button>
              <button
                type="submit"
                disabled={!isFormValid() || loading}
                className="flex-1 bg-[#e74c3c] text-[#1a1a1a] border-none py-3 px-8 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#c0392b] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Cambiando Contraseña...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle"></i>
                    Cambiar Contraseña
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
        )}

        {/* Sección de Crear Usuario */}
        {activeTab === 'newUser' && (
          <section className="bg-white rounded-lg p-[30px] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl text-[#1a1a1a] font-montserrat font-bold mb-2">
              Crear Nuevo Usuario
            </h2>
            <p className="text-sm text-[#666] mb-8">
              Registra un nuevo usuario en el sistema
            </p>

            <form onSubmit={handleCreateUser} className="space-y-5">
              {/* Email del Nuevo Usuario */}
              <div>
                <label className="block mb-2 font-semibold text-sm text-[#1a1a1a]">
                  Email <span className="text-[#e74c3c]">*</span>
                </label>
                <div className="relative">
                  <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-[#666]"></i>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full py-3 pl-12 pr-4 bg-white/10 border border-white/20 rounded-[8px] text-sm transition-colors focus:outline-none focus:bg-white/15 focus:border-[#e74c3c] focus:shadow-[0_0_0_3px_rgba(231,76,60,0.2)]"
                    placeholder="usuario@ejemplo.com"
                    disabled={creatingUser}
                    required
                  />
                </div>
              </div>

              {/* Contraseña del Nuevo Usuario */}
              <div>
                <label className="block mb-2 font-semibold text-sm text-[#1a1a1a]">
                  Contraseña <span className="text-[#e74c3c]">*</span>
                </label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-[#666]"></i>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => {
                      setNewUserPassword(e.target.value)
                      validateNewUserPassword(e.target.value)
                      if (newUserConfirmPassword) {
                        validateNewUserConfirm(newUserConfirmPassword)
                      }
                    }}
                    onBlur={(e) => validateNewUserPassword(e.target.value)}
                    className={`w-full py-3 pl-12 pr-4 bg-[#f5f5f5] border rounded-md text-sm transition-colors focus:outline-none ${
                      newUserPasswordError
                        ? 'border-[#e74c3c] focus:border-[#e74c3c]'
                        : 'border-[#dcdcdc] focus:bg-white/15 focus:border-[#e74c3c] focus:shadow-[0_0_0_3px_rgba(231,76,60,0.2)]'
                    }`}
                    placeholder="Mínimo 6 caracteres"
                    disabled={creatingUser}
                    required
                  />
                </div>
                {newUserPasswordError ? (
                  <p className="text-xs text-[#e74c3c] mt-1 flex items-center gap-1">
                    <i className="fas fa-exclamation-circle"></i>
                    {newUserPasswordError}
                  </p>
                ) : (
                  <p className="text-xs text-[#666] mt-1">
                    Mínimo 6 caracteres con mayúsculas, minúsculas y números
                  </p>
                )}
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label className="block mb-2 font-semibold text-sm text-[#1a1a1a]">
                  Confirmar Contraseña <span className="text-[#e74c3c]">*</span>
                </label>
                <div className="relative">
                  <i className="fas fa-check-circle absolute left-4 top-1/2 -translate-y-1/2 text-[#666]"></i>
                  <input
                    type="password"
                    value={newUserConfirmPassword}
                    onChange={(e) => {
                      setNewUserConfirmPassword(e.target.value)
                      validateNewUserConfirm(e.target.value)
                    }}
                    onBlur={(e) => validateNewUserConfirm(e.target.value)}
                    className={`w-full py-3 pl-12 pr-4 bg-[#f5f5f5] border rounded-md text-sm transition-colors focus:outline-none ${
                      newUserConfirmError
                        ? 'border-[#e74c3c] focus:border-[#e74c3c]'
                        : 'border-[#dcdcdc] focus:bg-white/15 focus:border-[#e74c3c] focus:shadow-[0_0_0_3px_rgba(231,76,60,0.2)]'
                    }`}
                    placeholder="Confirma la contraseña"
                    disabled={creatingUser}
                    required
                  />
                </div>
                {newUserConfirmError && (
                  <p className="text-xs text-[#e74c3c] mt-1 flex items-center gap-1">
                    <i className="fas fa-exclamation-circle"></i>
                    {newUserConfirmError}
                  </p>
                )}
              </div>

              {/* Información de Requisitos */}
              <div className="bg-white/5 border border-[#e74c3c] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <i className="fas fa-info-circle text-[#e74c3c] text-lg mt-0.5"></i>
                  <div className="text-sm">
                    <p className="font-semibold text-[#1a1a1a] mb-2">Requisitos de contraseña:</p>
                    <ul className="text-xs text-[#666] space-y-1">
                      <li>• Mínimo 6 caracteres</li>
                      <li>• Al menos una letra mayúscula</li>
                      <li>• Al menos una letra minúscula</li>
                      <li>• Al menos un número</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setNewUserEmail('')
                    setNewUserPassword('')
                    setNewUserConfirmPassword('')
                    setNewUserPasswordError('')
                    setNewUserConfirmError('')
                  }}
                  disabled={creatingUser}
                  className="bg-white/20 text-[#1a1a1a] border-none py-3 px-8 rounded-md font-semibold cursor-pointer transition-colors hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-eraser mr-2"></i>
                  Limpiar
                </button>
                <button
                  type="submit"
                  disabled={creatingUser || !newUserEmail || !newUserPassword || !newUserConfirmPassword || !!newUserPasswordError || !!newUserConfirmError}
                  className="flex-1 bg-[#e74c3c] text-white border-none py-3 px-8 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#c0392b] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creatingUser ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Creando Usuario...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus"></i>
                      Crear Usuario
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>

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
                        : 'fa-check-circle text-[#666]'
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
                      : 'Éxito'}
                  </h4>
                  <p className="text-[#1a1a1a] whitespace-pre-line">{notification.message}</p>
                </div>
                <button
                  onClick={closeNotification}
                  className="flex-shrink-0 text-[#666] hover:text-[#1a1a1a] text-2xl transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={closeNotification}
                  className={`px-6 py-2 rounded-md font-semibold text-[#1a1a1a] transition-colors ${
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

export default Profile



