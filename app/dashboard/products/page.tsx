'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Loader, 
  AlertTriangle,
  Package,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Upload
} from 'lucide-react'
import { fetchProducts, createProduct, updateProduct, deleteProduct, toggleProductStatus, fetchInventory, recordSale, formatCurrency } from '@/lib/api'
import { Product, StockBatch } from '@/lib/types'
import { BulkAddDialog } from '@/components/products/bulk-add-dialog'
import { getDateRangeFromFilter, type DateFilter } from '@/lib/date-utils'

// Unit options based on unit type
const UNIT_OPTIONS = {
  weight: ['kg', 'g', 'lb', 'oz', 'liter'],
  count: ['box', 'packet', 'piece', 'bottle', 'can', 'carton', 'dozen']
}

export default function ProductsPage() {
  // Router
  const router = useRouter()
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, hasMore: false })
  const [loading, setLoading] = useState(true)
  
  // Analytics state
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [analytics, setAnalytics] = useState({
    total: 0,
    active: 0,
    inactive: 0
  })
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  
  // Sale dialog state
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false)
  const [selectedProductForSale, setSelectedProductForSale] = useState<Product | null>(null)
  const [batchesForSale, setBatchesForSale] = useState<StockBatch[]>([])
  const [saleLoading, setSaleLoading] = useState(false)
  const [selectedBatchForSale, setSelectedBatchForSale] = useState<StockBatch | null>(null)
  const [saleFormData, setSaleFormData] = useState({
    boxes_sold: 0,
    selling_price_per_box: 0,
    customer_name: '',
    notes: '',
  })
  const [saleRecordingLoading, setSaleRecordingLoading] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    unitType: 'count' as 'count' | 'weight',
    baseUnit: 'box',
    category: '',
    description: '',
    defaultSupplier: '',
  })

  // Load products on mount
  useEffect(() => {
    loadProducts(1)
  }, [])

  // Load analytics when date filter changes
  useEffect(() => {
    loadAnalytics()
  }, [dateFilter])

  // Load analytics with date filter using centralized utilities
  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true)
      const dateRange = getDateRangeFromFilter(dateFilter)
      
      console.log("=== Loading Analytics ===")
      console.log("Selected filter:", dateFilter)
      console.log("Date range:", dateRange)
      
      // Build URL with params
      const params = new URLSearchParams()
      if ('from' in dateRange && dateRange.from) {
        params.append('from_date', dateRange.from)
      }
      if ('to' in dateRange && dateRange.to) {
        params.append('to_date', dateRange.to)
      }
      
      const url = `/api/products/analytics?${params.toString()}`
      console.log("Fetching URL:", url)
      
      // Fetch products with date filter
      const response = await fetch(url)
      
      console.log("Response status:", response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Response not OK:", errorText)
        throw new Error('Failed to fetch analytics')
      }
      
      const data = await response.json()
      console.log("Analytics data received:", data)
      
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
      setAnalytics({ total: 0, active: 0, inactive: 0 })
    } finally {
      setAnalyticsLoading(false)
      console.log("=== Analytics Loading Complete ===")
    }
  }

  // Load products function (paginated for table)
  const loadProducts = async (page: number = 1) => {
    try {
      setLoading(true)
      const response = await fetchProducts(
        page, 
        meta.limit, 
        searchTerm.trim() || undefined, 
        categoryFilter || undefined
      )
      setProducts(response.data)
      setMeta(response.meta)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Debounced search handler
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(1)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, categoryFilter])

  // Handle adding a new product
  const handleAddProduct = async () => {
    if (!formData.sku.trim()) {
      alert('SKU is required')
      return
    }
    if (!formData.name.trim()) {
      alert('Product name is required')
      return
    }

    const result = await createProduct(formData)
    if (result) {
      resetForm()
      setIsDialogOpen(false)
      loadProducts(meta.page)
      loadAnalytics() // Refresh analytics
    }
  }

  // Handle editing an existing product
  const handleEditProduct = async () => {
    if (!editingProduct) return
    
    if (!formData.sku.trim()) {
      alert('SKU is required')
      return
    }
    if (!formData.name.trim()) {
      alert('Product name is required')
      return
    }

    const result = await updateProduct(editingProduct.id, formData)
    if (result) {
      resetForm()
      setIsDialogOpen(false)
      setIsEditMode(false)
      setEditingProduct(null)
      loadProducts(meta.page)
      loadAnalytics() // Refresh analytics
    }
  }

  // Handle deleting a product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    const result = await deleteProduct(productToDelete.id)
    if (result) {
      setDeleteDialogOpen(false)
      setProductToDelete(null)
      loadProducts(meta.page)
      loadAnalytics() // Refresh analytics
    }
  }

  // Handle toggling product status
  const handleToggleStatus = async (product: Product) => {
    const result = await toggleProductStatus(product.id, !product.is_active)
    if (result) {
      loadProducts(meta.page)
      loadAnalytics() // Refresh analytics
    }
  }

  // Open edit dialog
  const openEditDialog = (product: Product) => {
    setIsEditMode(true)
    setEditingProduct(product)
    setFormData({
      sku: product.sku,
      name: product.name,
      unitType: product.unit_type,
      baseUnit: product.base_unit,
      category: product.category || '',
      description: product.description || '',
      defaultSupplier: product.default_supplier || '',
    })
    setIsDialogOpen(true)
  }

  // Open delete dialog
  const openDeleteDialog = (product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  // Open sale dialog and fetch batches
  const openSaleDialog = async (product: Product) => {
    setSelectedProductForSale(product)
    setIsSaleDialogOpen(true)
    setSaleLoading(true)
    try {
      const response = await fetchInventory(1, 100, {
        product_id: product.id,
        status: 'active',
      })
      setBatchesForSale(response.data)
    } catch (error) {
      console.error('Error fetching batches:', error)
      setBatchesForSale([])
    } finally {
      setSaleLoading(false)
    }
  }

  // Handle recording a sale
  const handleRecordSale = async () => {
    if (!selectedProductForSale || !selectedBatchForSale) {
      alert('Please select a batch')
      return
    }

    if (!saleFormData.boxes_sold || saleFormData.boxes_sold <= 0) {
      alert('Boxes sold must be greater than 0')
      return
    }

    if (saleFormData.boxes_sold > selectedBatchForSale.boxes_remaining) {
      alert(`Cannot sell more than remaining boxes (${selectedBatchForSale.boxes_remaining} available)`)
      return
    }

    if (!saleFormData.selling_price_per_box || saleFormData.selling_price_per_box <= 0) {
      alert('Selling price per box must be greater than 0')
      return
    }

    try {
      setSaleRecordingLoading(true)

      const result = await recordSale({
        product_id: selectedProductForSale.id,
        batch_id: selectedBatchForSale.id,
        boxes_sold: saleFormData.boxes_sold,
        selling_price_per_box: saleFormData.selling_price_per_box.toString(),
        customer_name: saleFormData.customer_name || null,
        notes: saleFormData.notes || null,
      })

      if (result) {
        // Reset sale form
        setSaleFormData({
          boxes_sold: 0,
          selling_price_per_box: 0,
          customer_name: '',
          notes: '',
        })
        setSelectedBatchForSale(null)
        setIsSaleDialogOpen(false)
        alert('Sale recorded successfully!')
      }
    } catch (error) {
      console.error('Error recording sale:', error)
      alert('Failed to record sale')
    } finally {
      setSaleRecordingLoading(false)
    }
  }

  // Reset sale form
  const resetSaleForm = () => {
    setSaleFormData({
      boxes_sold: 0,
      selling_price_per_box: 0,
      customer_name: '',
      notes: '',
    })
    setSelectedBatchForSale(null)
    setSelectedProductForSale(null)
    setBatchesForSale([])
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      unitType: 'count',
      baseUnit: 'box',
      category: '',
      description: '',
      defaultSupplier: '',
    })
    setIsEditMode(false)
    setEditingProduct(null)
  }

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }

  const getFilterLabel = (filter: DateFilter): string => {
    switch (filter) {
      case 'today': return 'Today'
      case 'yesterday': return 'Yesterday'
      case 'last7days': return 'Last 7 Days'
      case 'last30days': return 'Last 30 Days'
      case 'alltime': return 'All Time'
      default: return 'Today'
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Products</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Manage your product catalog
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
          <Button 
            size="lg" 
            className="gap-2"
            onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="gap-2"
            onClick={() => setIsBulkDialogOpen(true)}
          >
            <Upload className="w-4 h-4" />
            Bulk Add
          </Button>
        </div>
      </div>

      {/* Date Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {(['today', 'yesterday', 'last7days', 'last30days', 'all'] as DateFilter[]).map((filter) => (
          <Button
            key={filter}
            variant={dateFilter === filter ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateFilter(filter)}
            className="text-xs sm:text-sm"
          >
            {getFilterLabel(filter)}
          </Button>
        ))}
      </div>

      {/* Analytics Cards - Single Section Based on Selected Filter */}
      {analyticsLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Total Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Total Products
              </CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-foreground">{analytics.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {getFilterLabel(dateFilter)}
              </p>
            </CardContent>
          </Card>

          {/* Active Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Active Products
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{analytics.active}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.total > 0 
                  ? `${Math.round((analytics.active / analytics.total) * 100)}% of total`
                  : 'No products'
                }
              </p>
            </CardContent>
          </Card>

          {/* Inactive Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Inactive Products
              </CardTitle>
              <XCircle className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-600">{analytics.inactive}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.total > 0
                  ? `${Math.round((analytics.inactive / analytics.total) * 100)}% of total`
                  : 'No products'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm w-full sm:w-40"
        >
          <option value="">All Categories</option>
          <option value="grocery">Grocery</option>
          <option value="dairy">Dairy</option>
          <option value="beverages">Beverages</option>
          <option value="confectionery">Confectionery</option>
        </select>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Product Catalog ({meta.total} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {meta.total === 0
                ? 'No products yet. Add your first product to get started!'
                : 'No products found matching your filters.'}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto text-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Name</TableHead>
                      <TableHead className="text-xs sm:text-sm">SKU</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Category</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Unit Type</TableHead>
                      <TableHead className="text-xs sm:text-sm">Base Unit</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Status</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow 
                        key={product.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => router.push(`/dashboard/products/${product.id}`)}
                      >
                        <TableCell className="font-medium text-xs sm:text-sm">{product.name}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{product.sku}</TableCell>
                        <TableCell className="text-xs sm:text-sm hidden md:table-cell">{product.category || '-'}</TableCell>
                        <TableCell className="text-xs sm:text-sm capitalize hidden lg:table-cell">{product.unit_type}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{product.base_unit}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleStatus(product)
                            }}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                              product.is_active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {product.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="gap-1"
                              onClick={() => openSaleDialog(product)}
                              title="Add Sale"
                            >
                              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="gap-1"
                              onClick={() => openEditDialog(product)}
                            >
                              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                openDeleteDialog(product)
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {meta.page} of {Math.ceil(meta.total / meta.limit)} ({meta.total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadProducts(meta.page - 1)}
                    disabled={meta.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadProducts(meta.page + 1)}
                    disabled={!meta.hasMore}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog - UNCHANGED */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update product information' : 'Create a new product in your catalog'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">SKU *</label>
                <Input
                  placeholder="SKU"
                  className="mt-1"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Name *</label>
                <Input
                  placeholder="Product name"
                  className="mt-1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Unit Type *</label>
                <select
                  value={formData.unitType}
                  onChange={(e) => {
                    const newUnitType = e.target.value as 'weight' | 'count'
                    setFormData({ 
                      ...formData, 
                      unitType: newUnitType,
                      baseUnit: UNIT_OPTIONS[newUnitType][0]
                    })
                  }}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="count">Count (pieces, boxes)</option>
                  <option value="weight">Weight (kg, g)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Base Unit *</label>
                <select
                  value={formData.baseUnit}
                  onChange={(e) => setFormData({ ...formData, baseUnit: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  {UNIT_OPTIONS[formData.unitType].map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Category</label>
                <Input
                  placeholder="e.g. Grocery"
                  className="mt-1"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Supplier</label>
                <Input
                  placeholder="Default supplier"
                  className="mt-1"
                  value={formData.defaultSupplier}
                  onChange={(e) => setFormData({ ...formData, defaultSupplier: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <Input
                placeholder="Product description"
                className="mt-1"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={isEditMode ? handleEditProduct : handleAddProduct}
            >
              {isEditMode ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - UNCHANGED */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{productToDelete?.name}</strong> (SKU: {productToDelete?.sku})?
              <br /><br />
              <span className="text-destructive font-medium">
                Warning: This will also delete all associated stock batches and sales records.
              </span>
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Sale Dialog */}
      <Dialog open={isSaleDialogOpen} onOpenChange={(open) => {
        setIsSaleDialogOpen(open)
        if (!open) resetSaleForm()
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Sale - {selectedProductForSale?.name}</DialogTitle>
            <DialogDescription>
              Select a stock batch and enter sale details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Batches Table */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Select Stock Batch *</label>
              {saleLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : batchesForSale.length > 0 ? (
                <div className="border border-border rounded-md overflow-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Batch Number</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead className="text-right">Per Box</TableHead>
                        <TableHead className="text-right">Unit</TableHead>
                        <TableHead className="text-right">Cost/Box</TableHead>
                        <TableHead className="text-center">Select</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchesForSale.map((batch) => (
                        <TableRow 
                          key={batch.id}
                          className={selectedBatchForSale?.id === batch.id ? "bg-blue-50" : ""}
                        >
                          <TableCell className="font-medium">{batch.batch_number || batch.id.substring(0, 8)}</TableCell>
                          <TableCell className="text-right">{batch.boxes_remaining}</TableCell>
                          <TableCell className="text-right">{batch.quantity_per_box}</TableCell>
                          <TableCell className="text-right">{batch.unit_per_box}</TableCell>
                          <TableCell className="text-right">{formatCurrency(batch.cost_per_box)}</TableCell>
                          <TableCell className="text-center">
                            <input
                              type="radio"
                              name="batch"
                              checked={selectedBatchForSale?.id === batch.id}
                              onChange={() => setSelectedBatchForSale(batch)}
                              className="w-4 h-4"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-md">
                  No active stock batches available for this product
                </p>
              )}
            </div>

            {selectedBatchForSale && (
              <>
                {/* Sale Form */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Boxes to Sell *</label>
                    <Input
                      type="number"
                      min="0"
                      max={selectedBatchForSale.boxes_remaining}
                      value={saleFormData.boxes_sold}
                      onChange={(e) =>
                        setSaleFormData({
                          ...saleFormData,
                          boxes_sold: parseInt(e.target.value) || 0,
                        })
                      }
                      className="mt-1"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Price Per Box *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={saleFormData.selling_price_per_box}
                      onChange={(e) =>
                        setSaleFormData({
                          ...saleFormData,
                          selling_price_per_box: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Customer Name (Optional)</label>
                  <Input
                    value={saleFormData.customer_name}
                    onChange={(e) =>
                      setSaleFormData({
                        ...saleFormData,
                        customer_name: e.target.value,
                      })
                    }
                    className="mt-1"
                    placeholder="Customer name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Notes (Optional)</label>
                  <Input
                    value={saleFormData.notes}
                    onChange={(e) =>
                      setSaleFormData({
                        ...saleFormData,
                        notes: e.target.value,
                      })
                    }
                    className="mt-1"
                    placeholder="Additional notes"
                  />
                </div>

                <Button 
                  onClick={handleRecordSale} 
                  className="w-full"
                  disabled={saleRecordingLoading}
                >
                  {saleRecordingLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Recording...
                    </>
                  ) : (
                    'Record Sale'
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <BulkAddDialog
        isOpen={isBulkDialogOpen}
        onClose={() => setIsBulkDialogOpen(false)}
        onSuccess={() => {
          loadProducts(1)
        }}
      />
    </div>
  )
}
