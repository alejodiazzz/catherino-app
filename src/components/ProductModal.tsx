import React, { useState, useEffect } from 'react'
import { Product } from '../services/productService'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (product: Omit<Product, 'id'>) => Promise<void>
  product?: Product | null
  mode?: 'create' | 'edit'
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  mode = 'create',
}) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    size: '',
    color: '',
    brand: '',
    description: '',
    purchasePrice: '',
    suggestedSalePrice: '',
    stock: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (product && mode === 'edit') {
      setFormData({
        code: product.code || '',
        name: product.name || '',
        category: product.category || '',
        size: product.size || '',
        color: product.color || '',
        brand: product.brand || '',
        description: product.description || '',
        purchasePrice: (product.purchasePrice !== undefined && product.purchasePrice !== null) ? product.purchasePrice.toString() : '',
        suggestedSalePrice: (product.suggestedSalePrice !== undefined && product.suggestedSalePrice !== null) ? product.suggestedSalePrice.toString() : '',
        stock: (product.stock !== undefined && product.stock !== null) ? product.stock.toString() : '',
      })
    } else {
      setFormData({
        code: '',
        name: '',
        category: '',
        size: '',
        color: '',
        brand: '',
        description: '',
        purchasePrice: '',
        suggestedSalePrice: '',
        stock: '',
      })
    }
    setError('')
  }, [product, mode, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const productData: Omit<Product, 'id'> = {
        code: formData.code,
        name: formData.name,
        category: formData.category,
        size: formData.size,
        color: formData.color,
        brand: formData.brand,
        description: formData.description,
        purchasePrice: parseInt(formData.purchasePrice) || 0,
        suggestedSalePrice: parseInt(formData.suggestedSalePrice) || 0,
        stock: parseInt(formData.stock) || 0,
        active: true,
      }

      await onSave(productData)
      onClose()
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al guardar el producto'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed top-0 left-0 w-full h-full bg-black/50 z-[2000] flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-[90%] max-w-[800px] max-h-[90vh] overflow-y-auto animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#1a1a1a] text-white py-5 px-[25px] flex justify-between items-center rounded-t-lg">
          <h3 className="text-xl font-montserrat font-bold">
            {mode === 'edit' ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="bg-transparent border-none text-white text-2xl cursor-pointer transition-colors hover:text-[#e74c3c] disabled:opacity-50"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-[25px]">
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3 bg-red-500/20 border border-red-500/50 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5 mb-[25px]">
              <div className="mb-5">
                <label htmlFor="code" className="block mb-2 font-semibold text-sm text-[#333]">
                  Código del Producto *
                </label>
                <input
                  type="text"
                  id="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full py-3 px-[15px] bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#0074D9]"
                  placeholder="Ej: CAM-001, PAN-002"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-5">
                <label htmlFor="name" className="block mb-2 font-semibold text-sm text-[#333]">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full py-3 px-[15px] bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#0074D9]"
                  placeholder="Ej: Camiseta Deportiva"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-5">
                <label htmlFor="brand" className="block mb-2 font-semibold text-sm text-[#333]">
                  Marca *
                </label>
                <input
                  type="text"
                  id="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full py-3 px-[15px] bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#0074D9]"
                  placeholder="Ej: Nike, Adidas"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-5">
                <label htmlFor="category" className="block mb-2 font-semibold text-sm text-[#333]">
                  Categoría *
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full py-3 px-[15px] bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#0074D9]"
                  required
                  disabled={loading}
                >
                  <option value="">Selecciona una categoría</option>
                  <option value="Camisetas">Camisetas</option>
                  <option value="Pantalones">Pantalones</option>
                  <option value="Zapatillas">Zapatillas</option>
                  <option value="Chaquetas">Chaquetas</option>
                  <option value="Accesorios">Accesorios</option>
                </select>
              </div>

              <div className="mb-5">
                <label htmlFor="size" className="block mb-2 font-semibold text-sm text-[#333]">
                  Talla *
                </label>
                <input
                  type="text"
                  id="size"
                  value={formData.size}
                  onChange={handleChange}
                  className="w-full py-3 px-[15px] bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#0074D9]"
                  placeholder="Ej: L, 42, Única"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-5">
                <label htmlFor="color" className="block mb-2 font-semibold text-sm text-[#333]">
                  Color *
                </label>
                <input
                  type="text"
                  id="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-full py-3 px-[15px] bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#0074D9]"
                  placeholder="Ej: Negro, Blanco, Azul"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-5">
                <label htmlFor="purchasePrice" className="block mb-2 font-semibold text-sm text-[#333]">
                  Precio de Compra *
                </label>
                <input
                  type="number"
                  id="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  className="w-full py-3 px-[15px] bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#0074D9]"
                  placeholder="0"
                  step="1"
                  min="0"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-5">
                <label htmlFor="suggestedSalePrice" className="block mb-2 font-semibold text-sm text-[#333]">
                  Precio de Venta Sugerido *
                </label>
                <input
                  type="number"
                  id="suggestedSalePrice"
                  value={formData.suggestedSalePrice}
                  onChange={handleChange}
                  className="w-full py-3 px-[15px] bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#0074D9]"
                  placeholder="0"
                  step="1"
                  min="0"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-5">
                <label htmlFor="stock" className="block mb-2 font-semibold text-sm text-[#333]">
                  Stock *
                </label>
                <input
                  type="number"
                  id="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full py-3 px-[15px] bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#0074D9]"
                  placeholder="0"
                  min="0"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-5 col-span-full">
                <label htmlFor="description" className="block mb-2 font-semibold text-sm text-[#333]">
                  Descripción *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full py-3 px-[15px] bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#0074D9] min-h-[100px]"
                  placeholder="Descripción del producto"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex justify-end gap-[15px]">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="bg-[#95a5a6] text-white border-none py-3 px-[25px] rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#7f8c8d] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#3d9970] text-white border-none py-3 px-[25px] rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#2e8b57] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProductModal
