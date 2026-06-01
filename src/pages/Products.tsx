import React, { useState, useEffect } from 'react'
import { PageLayout, PageHeader, SummaryCard, InventoryAlerts, ProductModal } from '../components'
import ProductDetailsModal from '../components/ProductDetailsModal'
import { productService, Product } from '../services/productService'

interface ProductsProps {
  onLogout?: () => void
}

const Products: React.FC<ProductsProps> = ({ onLogout }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  // Search and filters
  const [searchName, setSearchName] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterSize, setFilterSize] = useState('')
  const [filterColor, setFilterColor] = useState('')

  // Sorting
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'category'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Load products on mount
  useEffect(() => {
    loadProducts()
  }, [])

  // Apply filters and sorting whenever products, filters, or sorting change
  useEffect(() => {
    applyFilters()
  }, [products, searchName, filterCategory, filterBrand, filterSize, filterColor, sortBy, sortOrder])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await productService.getAllProducts()
      setProducts(data)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al cargar los productos'
      setError(errorMessage)
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...products]

    // Filtrar por nombre
    if (searchName.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchName.toLowerCase())
      )
    }

    // Filtrar por categoría
    if (filterCategory) {
      filtered = filtered.filter((product) => product.category === filterCategory)
    }

    // Filtrar por marca
    if (filterBrand) {
      filtered = filtered.filter((product) => product.brand === filterBrand)
    }

    // Filtrar por talla
    if (filterSize) {
      filtered = filtered.filter((product) => product.size === filterSize)
    }

    // Filtrar por color
    if (filterColor) {
      filtered = filtered.filter((product) =>
        product.color.toLowerCase().includes(filterColor.toLowerCase())
      )
    }

    // Aplicar ordenación
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'price':
          const priceA = a.suggestedSalePrice || a.price || 0
          const priceB = b.suggestedSalePrice || b.price || 0
          comparison = priceA - priceB
          break
        case 'stock':
          comparison = a.stock - b.stock
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredProducts(filtered)
  }

  const exportToCSV = () => {
    const dataToExport = displayProducts.length > 0 ? displayProducts : products

    // Crear encabezados
    const headers = ['Código', 'Nombre', 'Marca', 'Categoría', 'Talla', 'Color', 'Stock', 'Precio', 'Descripción']

    // Crear filas
    const rows = dataToExport.map((product) => [
      product.code,
      product.name,
      product.brand,
      product.category,
      product.size,
      product.color,
      product.stock.toString(),
      Math.round(getProductPrice(product)).toString(),
      product.description.replace(/,/g, ';'), // Reemplazar comas en descripción
    ])

    // Combinar encabezados y filas
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `productos_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRefresh = async () => {
    await loadProducts()
    // Mostrar notificación de éxito
    const notification = document.createElement('div')
    notification.className = 'fixed top-20 right-5 bg-[#666] text-white px-6 py-3 rounded-lg shadow-lg z-[2000] animate-fadeIn'
    notification.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Productos actualizados'
    document.body.appendChild(notification)

    setTimeout(() => {
      notification.remove()
    }, 3000)
  }

  const clearFilters = () => {
    setSearchName('')
    setFilterCategory('')
    setFilterBrand('')
    setFilterSize('')
    setFilterColor('')
  }

  const handleSaveProduct = async (productData: Omit<Product, 'id'>) => {
    if (modalMode === 'edit' && selectedProduct?.id) {
      await productService.updateProduct(selectedProduct.id, productData as Product)
    } else {
      await productService.createProduct(productData as Product)
    }
    await loadProducts()
    setSelectedProduct(null)
  }

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsDetailsModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleEditFromDetails = (product: Product) => {
    setSelectedProduct(product)
    setModalMode('edit')
    setIsDetailsModalOpen(false)
    setIsModalOpen(true)
  }

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await productService.deleteProduct(id)
        await loadProducts()
        alert('Producto eliminado exitosamente')
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Error al eliminar el producto'
        alert(errorMessage)
      }
    }
  }

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  // Helper para obtener el precio de un producto
  const getProductPrice = (product: Product): number => {
    return product.suggestedSalePrice || product.price || 0
  }

  // Obtener valores únicos para los filtros
  const uniqueCategories = Array.from(new Set(products.map((p) => p.category)))
  const uniqueBrands = Array.from(new Set(products.map((p) => p.brand)))
  const uniqueSizes = Array.from(new Set(products.map((p) => p.size)))

  // Calcular estadísticas en tiempo real
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0)
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock < 10).length
  const outOfStockCount = products.filter((p) => p.stock === 0).length
  const totalInventoryValue = products.reduce((sum, p) => {
    const purchasePrice = p.purchasePrice || 0
    const productValue = Number(purchasePrice) * Number(p.stock)
    return sum + productValue
  }, 0)

  const summaryCards = [
    {
      title: 'Total Productos',
      value: products.length.toString(),
      description: `${totalUnits.toLocaleString()} unidades en inventario`,
      icon: 'fas fa-boxes',
      iconColor: 'red' as const,
    },
    {
      title: 'Categorías',
      value: uniqueCategories.length.toString(),
      description: `${uniqueBrands.length} marcas disponibles`,
      icon: 'fas fa-tags',
      iconColor: 'gray' as const,
    },
    {
      title: 'Stock Bajo',
      value: (lowStockCount + outOfStockCount).toString(),
      description: `${outOfStockCount} agotados, ${lowStockCount} críticos`,
      icon: 'fas fa-exclamation-triangle',
      iconColor: 'red' as const,
    },
    {
      title: 'Valor Inventario',
      value: `$${Math.round(totalInventoryValue).toLocaleString('es-ES')}`,
      description: 'Basado en precio de compra',
      icon: 'fas fa-dollar-sign',
      iconColor: 'gray' as const,
    },
  ]

  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return 'bg-[#e74c3c]'
    if (stock < 10) return 'bg-[#e74c3c]'
    return 'bg-[#666]'
  }

  const displayProducts = filteredProducts.length > 0 || searchName || filterCategory || filterBrand || filterSize || filterColor
    ? filteredProducts
    : products

  // Generar alertas dinámicas basadas en el stock
  const generateInventoryAlerts = () => {
    const alerts: Array<{
      title: string
      time: string
      message: string
      actionText: string
      onAction: () => void
    }> = []

    // Productos con stock crítico (0 unidades)
    const outOfStock = products.filter((p) => p.stock === 0)
    outOfStock.forEach((product) => {
      alerts.push({
        title: 'Stock Agotado',
        time: 'Ahora',
        message: `${product.name} (${product.size}) no tiene unidades disponibles`,
        actionText: 'Ver producto',
        onAction: () => handleViewProduct(product),
      })
    })

    // Productos con stock bajo (1-5 unidades)
    const criticalStock = products.filter((p) => p.stock > 0 && p.stock <= 5)
    criticalStock.forEach((product) => {
      alerts.push({
        title: 'Stock Crítico',
        time: 'Hace 2 horas',
        message: `${product.name} (${product.size}) tiene solo ${product.stock} unidades en stock`,
        actionText: 'Reabastecer ahora',
        onAction: () => handleEditProduct(product),
      })
    })

    // Productos con stock bajo (6-10 unidades)
    const lowStock = products.filter((p) => p.stock > 5 && p.stock <= 10)
    lowStock.forEach((product) => {
      alerts.push({
        title: 'Stock Bajo',
        time: 'Hace 5 horas',
        message: `${product.name} (${product.size}) ha alcanzado el nivel mínimo de stock (${product.stock} unidades)`,
        actionText: 'Ver detalles',
        onAction: () => handleViewProduct(product),
      })
    })

    return alerts.slice(0, 6) // Limitar a 6 alertas
  }

  const inventoryAlertsData = generateInventoryAlerts()

  return (
    <PageLayout onLogout={onLogout}>
      <PageHeader
        title="Gestión de Productos"
        description="Administra el inventario de productos, registra entradas y salidas, y establece niveles de stock mínimo y máximo."
      />

      {/* Inventory Summary */}
      <section className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-[25px] mb-[30px]">
        {summaryCards.map((card, index) => (
          <SummaryCard key={index} {...card} />
        ))}
      </section>

      {/* Search and Filters Section */}
      <section className="bg-white rounded-lg p-[25px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] mb-[30px]">
        <div className="flex flex-wrap gap-4 items-end mb-4">
          {/* Search by Name */}
          <div className="flex-1 min-w-[250px]">
            <label className="block mb-2 font-semibold text-sm text-[#333]">
              Buscar por Nombre
            </label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full py-3 px-4 bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#e74c3c]"
              placeholder="Buscar productos..."
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="bg-[#e74c3c] text-white border-none py-3 px-6 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#c0392b] flex items-center gap-2"
          >
            <i className="fas fa-filter"></i>
            Filtros {isFiltersOpen ? '▲' : '▼'}
          </button>

          {/* Add Product Button */}
          <button
            onClick={handleAddProduct}
            className="bg-[#666] text-white border-none py-3 px-6 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#555] flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Agregar Producto
          </button>
        </div>

        {/* Advanced Filters */}
        {isFiltersOpen && (
          <div className="border-t border-[#dcdcdc] pt-4 mt-4 animate-fadeIn">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-4">
              {/* Category Filter */}
              <div>
                <label className="block mb-2 font-semibold text-sm text-[#333]">Categoría</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full py-3 px-4 bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#e74c3c]"
                >
                  <option value="">Todas</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div>
                <label className="block mb-2 font-semibold text-sm text-[#333]">Marca</label>
                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="w-full py-3 px-4 bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#e74c3c]"
                >
                  <option value="">Todas</option>
                  {uniqueBrands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              {/* Size Filter */}
              <div>
                <label className="block mb-2 font-semibold text-sm text-[#333]">Talla</label>
                <select
                  value={filterSize}
                  onChange={(e) => setFilterSize(e.target.value)}
                  className="w-full py-3 px-4 bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#e74c3c]"
                >
                  <option value="">Todas</option>
                  {uniqueSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Filter */}
              <div>
                <label className="block mb-2 font-semibold text-sm text-[#333]">Color</label>
                <input
                  type="text"
                  value={filterColor}
                  onChange={(e) => setFilterColor(e.target.value)}
                  className="w-full py-3 px-4 bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#e74c3c]"
                  placeholder="Buscar por color..."
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            <button
              onClick={clearFilters}
              className="bg-[#95a5a6] text-white border-none py-2 px-4 rounded-md font-semibold cursor-pointer transition-colors hover:bg-[#7f8c8d] text-sm"
            >
              <i className="fas fa-times mr-2"></i>
              Limpiar Filtros
            </button>
          </div>
        )}

        {/* Active Filters Display */}
        {(searchName || filterCategory || filterBrand || filterSize || filterColor) && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm font-semibold text-[#333]">Filtros activos:</span>
            {searchName && (
              <span className="bg-[#e74c3c] text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                Nombre: {searchName}
                <i
                  className="fas fa-times cursor-pointer"
                  onClick={() => setSearchName('')}
                ></i>
              </span>
            )}
            {filterCategory && (
              <span className="bg-[#e74c3c] text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                Categoría: {filterCategory}
                <i
                  className="fas fa-times cursor-pointer"
                  onClick={() => setFilterCategory('')}
                ></i>
              </span>
            )}
            {filterBrand && (
              <span className="bg-[#e74c3c] text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                Marca: {filterBrand}
                <i
                  className="fas fa-times cursor-pointer"
                  onClick={() => setFilterBrand('')}
                ></i>
              </span>
            )}
            {filterSize && (
              <span className="bg-[#e74c3c] text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                Talla: {filterSize}
                <i
                  className="fas fa-times cursor-pointer"
                  onClick={() => setFilterSize('')}
                ></i>
              </span>
            )}
            {filterColor && (
              <span className="bg-[#e74c3c] text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                Color: {filterColor}
                <i
                  className="fas fa-times cursor-pointer"
                  onClick={() => setFilterColor('')}
                ></i>
              </span>
            )}
          </div>
        )}
      </section>

      {/* Products Table */}
      <section className="bg-white rounded-lg p-[25px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] mb-[30px] overflow-x-auto">
        <div className="flex justify-between items-center mb-5 max-md:flex-col max-md:items-start max-md:gap-4">
          <h2 className="text-xl text-[#1a1a1a] font-montserrat font-bold">
            Lista de Productos
            {displayProducts.length !== products.length && (
              <span className="text-sm text-[#95a5a6] ml-2">
                ({displayProducts.length} de {products.length})
              </span>
            )}
          </h2>
          <div className="flex gap-[10px] items-center">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-') as [
                    'name' | 'price' | 'stock' | 'category',
                    'asc' | 'desc'
                  ]
                  setSortBy(field)
                  setSortOrder(order)
                }}
                className="bg-[#f5f5f5] border border-[#dcdcdc] text-[#333] py-2 px-3 rounded text-sm cursor-pointer transition-all hover:bg-[#dcdcdc] pr-8"
              >
                <option value="name-asc">Nombre (A-Z)</option>
                <option value="name-desc">Nombre (Z-A)</option>
                <option value="price-asc">Precio (Menor a Mayor)</option>
                <option value="price-desc">Precio (Mayor a Menor)</option>
                <option value="stock-asc">Stock (Menor a Mayor)</option>
                <option value="stock-desc">Stock (Mayor a Menor)</option>
                <option value="category-asc">Categoría (A-Z)</option>
                <option value="category-desc">Categoría (Z-A)</option>
              </select>
            </div>

            <button
              onClick={exportToCSV}
              className="bg-[#f5f5f5] border border-[#dcdcdc] text-[#333] py-2 px-3 rounded text-sm cursor-pointer transition-all hover:bg-[#dcdcdc]"
              title="Exportar a CSV"
            >
              <i className="fas fa-download mr-1"></i> Exportar
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-[#f5f5f5] border border-[#dcdcdc] text-[#333] py-2 px-3 rounded text-sm cursor-pointer transition-all hover:bg-[#dcdcdc] disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualizar listado"
            >
              <i className={`fas fa-sync mr-1 ${loading ? 'fa-spin' : ''}`}></i> Actualizar
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-10">
            <i className="fas fa-spinner fa-spin text-4xl text-[#e74c3c]"></i>
            <p className="mt-4 text-[#95a5a6]">Cargando productos...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-md text-red-700 text-center">
            {error}
            <button
              onClick={loadProducts}
              className="ml-4 text-[#e74c3c] underline hover:text-[#c0392b]"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && displayProducts.length === 0 && (
          <div className="text-center py-10">
            <i className="fas fa-box-open text-6xl text-[#95a5a6] mb-4"></i>
            <p className="text-[#95a5a6] text-lg">
              {products.length === 0
                ? 'No hay productos registrados'
                : 'No se encontraron productos con los filtros aplicados'}
            </p>
            {products.length === 0 ? (
              <button
                onClick={handleAddProduct}
                className="mt-4 bg-[#666] text-white py-2 px-6 rounded-md font-semibold hover:bg-[#555]"
              >
                Agregar primer producto
              </button>
            ) : (
              <button
                onClick={clearFilters}
                className="mt-4 bg-[#e74c3c] text-white py-2 px-6 rounded-md font-semibold hover:bg-[#c0392b]"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Products Table */}
        {!loading && !error && displayProducts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-[#f5f5f5] dark:bg-[#1a1a1a] py-3 px-[15px] text-left font-semibold text-[#333] dark:text-white border-b-2 border-[#dcdcdc] dark:border-gray-700">
                    Código
                  </th>
                  <th className="bg-[#f5f5f5] dark:bg-[#1a1a1a] py-3 px-[15px] text-left font-semibold text-[#333] dark:text-white border-b-2 border-[#dcdcdc] dark:border-gray-700">
                    Nombre
                  </th>
                  <th className="bg-[#f5f5f5] dark:bg-[#1a1a1a] py-3 px-[15px] text-left font-semibold text-[#333] dark:text-white border-b-2 border-[#dcdcdc] dark:border-gray-700">
                    Marca
                  </th>
                  <th className="bg-[#f5f5f5] dark:bg-[#1a1a1a] py-3 px-[15px] text-left font-semibold text-[#333] dark:text-white border-b-2 border-[#dcdcdc] dark:border-gray-700">
                    Categoría
                  </th>
                  <th className="bg-[#f5f5f5] dark:bg-[#1a1a1a] py-3 px-[15px] text-left font-semibold text-[#333] dark:text-white border-b-2 border-[#dcdcdc] dark:border-gray-700">
                    Talla
                  </th>
                  <th className="bg-[#f5f5f5] dark:bg-[#1a1a1a] py-3 px-[15px] text-left font-semibold text-[#333] dark:text-white border-b-2 border-[#dcdcdc] dark:border-gray-700">
                    Color
                  </th>
                  <th className="bg-[#f5f5f5] dark:bg-[#1a1a1a] py-3 px-[15px] text-left font-semibold text-[#333] dark:text-white border-b-2 border-[#dcdcdc] dark:border-gray-700">
                    Stock
                  </th>
                  <th className="bg-[#f5f5f5] dark:bg-[#1a1a1a] py-3 px-[15px] text-left font-semibold text-[#333] dark:text-white border-b-2 border-[#dcdcdc] dark:border-gray-700">
                    Precio
                  </th>
                  <th className="bg-[#f5f5f5] dark:bg-[#1a1a1a] py-3 px-[15px] text-left font-semibold text-[#333] dark:text-white border-b-2 border-[#dcdcdc] dark:border-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-[rgba(231,76,60,0.05)] dark:hover:bg-[rgba(231,76,60,0.1)] transition-colors cursor-pointer"
                    onClick={() => handleViewProduct(product)}
                  >
                    <td className="py-[15px] px-[15px] border-b border-[#dcdcdc] dark:border-gray-700 font-mono text-sm text-[#e74c3c]">
                      {product.code}
                    </td>
                    <td className="py-[15px] px-[15px] border-b border-[#dcdcdc] dark:border-gray-700 font-semibold text-[#1a1a1a] dark:text-white">
                      {product.name}
                    </td>
                    <td className="py-[15px] px-[15px] border-b border-[#dcdcdc] dark:border-gray-700 text-[#333] dark:text-gray-300">
                      {product.brand}
                    </td>
                    <td className="py-[15px] px-[15px] border-b border-[#dcdcdc] dark:border-gray-700">
                      <span className="inline-block py-1 px-[10px] rounded-[20px] text-xs font-semibold bg-[#dcdcdc] dark:bg-gray-700 text-[#333] dark:text-white">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-[15px] px-[15px] border-b border-[#dcdcdc] dark:border-gray-700 text-[#333] dark:text-gray-300">
                      {product.size}
                    </td>
                    <td className="py-[15px] px-[15px] border-b border-[#dcdcdc] dark:border-gray-700 text-[#333] dark:text-gray-300">
                      {product.color}
                    </td>
                    <td className="py-[15px] px-[15px] border-b border-[#dcdcdc] dark:border-gray-700 text-[#333] dark:text-white">
                      <span
                        className={`inline-block w-3 h-3 rounded-full mr-[5px] ${getStockStatusColor(product.stock)}`}
                      ></span>
                      {product.stock}
                    </td>
                    <td className="py-[15px] px-[15px] border-b border-[#dcdcdc] dark:border-gray-700 text-[#333] dark:text-white font-semibold">
                      ${Math.round(getProductPrice(product)).toLocaleString('es-ES')}
                    </td>
                    <td className="py-[15px] px-[15px] border-b border-[#dcdcdc] dark:border-gray-700">
                      <div className="flex gap-[10px]">
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewProduct(product)
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white cursor-pointer transition-transform hover:scale-110 bg-[#666] dark:bg-gray-600"
                          title="Ver detalles"
                        >
                          <i className="fas fa-eye text-sm"></i>
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditProduct(product)
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white cursor-pointer transition-transform hover:scale-110 bg-[#e74c3c]"
                          title="Editar"
                        >
                          <i className="fas fa-edit text-sm"></i>
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            product.id && handleDeleteProduct(product.id)
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white cursor-pointer transition-transform hover:scale-110 bg-[#e74c3c]"
                          title="Eliminar"
                        >
                          <i className="fas fa-trash text-sm"></i>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Alerts Section */}
      {inventoryAlertsData.length > 0 && (
        <InventoryAlerts alerts={inventoryAlertsData} title="Alertas de Inventario" />
      )}

      {/* Product Details Modal */}
      <ProductDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        product={selectedProduct}
        onEdit={handleEditFromDetails}
        onDelete={handleDeleteProduct}
      />

      {/* Product Edit/Create Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProduct}
        product={selectedProduct}
        mode={modalMode}
      />
    </PageLayout>
  )
}

export default Products
