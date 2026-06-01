import React from 'react'
import { Product } from '../services/productService'

interface ProductDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    product: Product | null
    onEdit: (product: Product) => void
    onDelete: (id: string) => void
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
    isOpen,
    onClose,
    product,
    onEdit,
    onDelete,
}) => {
    if (!isOpen || !product) return null

    const handleEdit = () => {
        onEdit(product)
        onClose()
    }

    const handleDelete = () => {
        if (product.id) {
            if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
                onDelete(product.id)
                onClose()
            }
        }
    }

    const getStockStatus = () => {
        const stock = product.stock || 0
        if (stock === 0) return { text: 'Agotado', color: 'text-[#e74c3c]' }
        if (stock < 10) return { text: 'Stock Bajo', color: 'text-[#f39c12]' }
        return { text: 'Stock Normal', color: 'text-[#3d9970]' }
    }

    const stockStatus = getStockStatus()

    return (
        <div
            className="fixed top-0 left-0 w-full h-full bg-black/50 z-[2000] flex justify-center items-center"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg w-[90%] max-w-[700px] max-h-[90vh] overflow-y-auto animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2c2c2c] text-white py-5 px-[25px] flex justify-between items-center rounded-t-lg">
                    <div>
                        <h3 className="text-xl font-montserrat font-bold mb-1">Detalles del Producto</h3>
                        <p className="text-sm text-white/70">ID: {product.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-transparent border-none text-white text-2xl cursor-pointer transition-colors hover:text-[#e74c3c]"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-[30px]">
                    {/* Product Info Grid */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        {/* Código */}
                        <div>
                            <label className="block text-sm font-semibold text-[#95a5a6] mb-2">
                                Código del Producto
                            </label>
                            <p className="text-lg font-bold text-[#0074D9] font-mono">{product.code || 'Sin código'}</p>
                        </div>

                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-semibold text-[#95a5a6] mb-2">
                                Nombre del Producto
                            </label>
                            <p className="text-lg font-bold text-[#1a1a1a]">{product.name || 'Sin nombre'}</p>
                        </div>

                        {/* Marca */}
                        <div>
                            <label className="block text-sm font-semibold text-[#95a5a6] mb-2">Marca</label>
                            <p className="text-base text-[#333]">{product.brand || 'Sin marca'}</p>
                        </div>

                        {/* Categoría */}
                        <div>
                            <label className="block text-sm font-semibold text-[#95a5a6] mb-2">Categoría</label>
                            <span className="inline-block py-2 px-4 rounded-[20px] text-sm font-semibold bg-[#0074D9] text-white">
                                {product.category || 'Sin categoría'}
                            </span>
                        </div>

                        {/* Talla */}
                        <div>
                            <label className="block text-sm font-semibold text-[#95a5a6] mb-2">Talla</label>
                            <p className="text-base text-[#333]">{product.size || 'Sin talla'}</p>
                        </div>

                        {/* Color */}
                        <div>
                            <label className="block text-sm font-semibold text-[#95a5a6] mb-2">Color</label>
                            <p className="text-base text-[#333]">{product.color || 'Sin color'}</p>
                        </div>

                        {/* Precio de Compra */}
                        <div>
                            <label className="block text-sm font-semibold text-[#95a5a6] mb-2">Precio de Compra</label>
                            <p className="text-xl font-bold text-[#e74c3c] font-mono">
                                ${Math.round(product.purchasePrice || 0).toLocaleString('es-ES')}
                            </p>
                        </div>

                        {/* Precio de Venta */}
                        <div>
                            <label className="block text-sm font-semibold text-[#95a5a6] mb-2">Precio de Venta</label>
                            <p className="text-xl font-bold text-[#3d9970] font-mono">
                                ${Math.round(product.suggestedSalePrice || 0).toLocaleString('es-ES')}
                            </p>
                        </div>

                        {/* Margen de Ganancia */}
                        <div>
                            <label className="block text-sm font-semibold text-[#95a5a6] mb-2">Margen de Ganancia</label>
                            <p className="text-xl font-bold text-[#0074D9] font-mono">
                                {product.profitMargin ? `${product.profitMargin.toFixed(2)}%` : '0%'}
                            </p>
                        </div>

                        {/* Stock */}
                        <div>
                            <label className="block text-sm font-semibold text-[#95a5a6] mb-2">Stock</label>
                            <div className="flex items-center gap-2">
                                <p className="text-2xl font-bold text-[#333] font-mono">{product.stock || 0}</p>
                                <span className={`text-sm font-semibold ${stockStatus.color}`}>
                                    {stockStatus.text}
                                </span>
                            </div>
                        </div>

                        {/* Descripción */}
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-[#95a5a6] mb-2">
                                Descripción
                            </label>
                            <p className="text-base text-[#333] bg-[#f5f5f5] p-4 rounded-lg leading-relaxed">
                                {product.description || 'Sin descripción'}
                            </p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#dcdcdc] my-6"></div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleEdit}
                            className="flex-1 bg-[#0074D9] text-white border-none py-3 px-6 rounded-lg font-semibold cursor-pointer transition-all hover:bg-[#0056a3] flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-edit"></i>
                            Editar Producto
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex-1 bg-[#e74c3c] text-white border-none py-3 px-6 rounded-lg font-semibold cursor-pointer transition-all hover:bg-[#c0392b] flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-trash"></i>
                            Eliminar Producto
                        </button>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="w-full mt-4 bg-[#95a5a6] text-white border-none py-3 px-6 rounded-lg font-semibold cursor-pointer transition-all hover:bg-[#7f8c8d]"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProductDetailsModal
