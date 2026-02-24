'use client'

import { useEffect, useState } from 'react'
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
import { Plus, Package, Loader, Search, TrendingUp, DollarSign, ShoppingCart, Upload } from 'lucide-react'
import Link from 'next/link'
import { fetchProducts, fetchInventory, addStockBatch, formatCurrency, formatDate, recordSale } from '@/lib/api'
import { Product, StockBatch } from '@/lib/types'
import { getDateRangeFromFilter, type DateFilter } from '@/lib/date-utils'

export default function InventoryPage() {
  const [productFilter, setProductFilter] = useState('')
  const [batches, setBatches] = useState<StockBatch[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, hasMore: false })
  const [loading, setLoading] = useState(true)
  
  // Analytics state
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [analytics, setAnalytics] = useState({
    totalValue: 0,
    totalBoxes: 0,
    totalBatches: 0
  })
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  
  // Dialog state
  const [isOpen, setIsOpen] = useState(false)
  
  // Product search in dialog
  const [productSearch, setProductSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  
  // Sale dialog state
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<StockBatch | null>(null)
  const [saleFormData, setSaleFormData] = useState({
    boxes_sold: 0,
    selling_price_per_box: 0,
    customer_name: '',
    notes: '',
  })
  const [saleRecordingLoading, setSaleRecordingLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    product_id: '',
    boxes_purchased: 0,
    quantity_per_box: 0,
    unit_per_box: '',
    cost_per_box: 0,
    supplier_name: '',
  })

  useEffect(() => {
    loadData()
    loadAllProducts()
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [dateFilter])

  // Load analytics data using centralized date utilities
  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true)
      const dateRange = getDateRangeFromFilter(dateFilter)
      
      const params = new URLSearchParams()
      if ('from' in dateRange && dateRange.from) {
        params.append('from_date', dateRange.from)
      }
      if ('to' in dateRange && dateRange.to) {
        params.append('to_date', dateRange.to)
      }
      
      const response = await fetch(`/api/inventory/analytics?${params.toString()}`)
      
      if (!response.ok) throw new Error('Failed to fetch analytics')
      
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
      setAnalytics({ totalValue: 0, totalBoxes: 0, totalBatches: 0 })
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // Load all products for filter dropdown
  const loadAllProducts = async () => {
    try {
      const response = await fetchProducts(1, 1000)
      setAllProducts(response.data)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  // Load inventory data
  const loadData = async (page: number = 1) => {
    try {
      setLoading(true)
      const response = await fetchInventory(page, 10, { 
        status: 'active', 
        product_id: productFilter || undefined 
      })
      setBatches(response.data)
      setMeta(response.meta)
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  // Search products for dialog (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (productSearch.trim().length >= 2) {
        setSearchLoading(true)
        try {
          const response = await fetchProducts(1, 5, productSearch.trim())
          setSearchResults(response.data)
        } catch (error) {
          console.error('Error searching products:', error)
        } finally {
          setSearchLoading(false)
        }
      } else {
        setSearchResults([])
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [productSearch])

  const handleAddBatch = async () => {
    if (!selectedProduct) {
      alert('Please select a product')
      return
    }
    if (!formData.boxes_purchased || formData.boxes_purchased <= 0) {
      alert('Boxes purchased must be greater than 0')
      return
    }
    if (!formData.quantity_per_box || formData.quantity_per_box <= 0) {
      alert('Quantity per box must be greater than 0')
      return
    }
    if (!formData.cost_per_box || formData.cost_per_box <= 0) {
      alert('Cost per box must be greater than 0')
      return
    }

    // Generate batch number: ProductName-RandomNumber
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
    const batchNumber = `${selectedProduct.name}-${randomNum}`

    const result = await addStockBatch({
      product_id: selectedProduct.id,
      boxes_purchased: formData.boxes_purchased,
      boxes_remaining: formData.boxes_purchased,
      quantity_per_box: formData.quantity_per_box.toString(),
      unit_per_box: formData.unit_per_box,
      cost_per_box: formData.cost_per_box.toString(),
      supplier_name: formData.supplier_name || null,
      batch_number: batchNumber,
      status: 'active',
    })

    if (result) {
      resetForm()
      setIsOpen(false)
      loadData(meta.page)
      loadAnalytics()
    }
  }

  const resetForm = () => {
    setFormData({
      product_id: '',
      boxes_purchased: 0,
      quantity_per_box: 0,
      unit_per_box: '',
      cost_per_box: 0,
      supplier_name: '',
    })
    setSelectedProduct(null)
    setProductSearch('')
    setSearchResults([])
  }

  const selectProduct = (product: Product) => {
    setSelectedProduct(product)
    setProductSearch(product.name)
    setSearchResults([])
    setFormData({
      ...formData,
      product_id: product.id,
      unit_per_box: product.base_unit, // Pre-fill with product's base unit
    })
  }

  // Handle opening sale dialog for a batch
  const openSaleDialog = (batch: StockBatch) => {
    setSelectedBatch(batch)
    setSaleFormData({
      boxes_sold: 0,
      selling_price_per_box: 0,
      customer_name: '',
      notes: '',
    })
    setIsSaleDialogOpen(true)
  }

  // Handle recording a sale
  const handleRecordSale = async () => {
    if (!selectedBatch) {
      alert('No batch selected')
      return
    }

    if (!saleFormData.boxes_sold || saleFormData.boxes_sold <= 0) {
      alert('Boxes sold must be greater than 0')
      return
    }

    if (saleFormData.boxes_sold > selectedBatch.boxes_remaining) {
      alert(`Cannot sell more than remaining boxes (${selectedBatch.boxes_remaining} available)`)
      return
    }

    if (!saleFormData.selling_price_per_box || saleFormData.selling_price_per_box <= 0) {
      alert('Selling price per box must be greater than 0')
      return
    }

    try {
      setSaleRecordingLoading(true)

      const result = await recordSale({
        product_id: selectedBatch.product_id,
        batch_id: selectedBatch.id,
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
        setSelectedBatch(null)
        setIsSaleDialogOpen(false)
        alert('Sale recorded successfully!')
        loadData(meta.page)
        loadAnalytics()
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
    setSelectedBatch(null)
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Track stock levels and manage inventory
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
          <Link href="/dashboard/inventory/bulk-upload" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              variant="outline"
              className="gap-2 w-full"
            >
              <Upload className="w-4 h-4" />
              Bulk Upload
            </Button>
          </Link>
          <Button 
            size="lg" 
            className="gap-2 w-full sm:w-auto"
            onClick={() => {
              resetForm()
              setIsOpen(true)
            }}
          >
            <Plus className="w-4 h-4" />
            Add Stock
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

      {/* Analytics Cards */}
      {analyticsLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Total Inventory Value */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Total Inventory Value
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {formatCurrency(analytics.totalValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {getFilterLabel(dateFilter)}
              </p>
            </CardContent>
          </Card>

          {/* Total Boxes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Total Boxes
              </CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {analytics.totalBoxes}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Boxes in stock
              </p>
            </CardContent>
          </Card>

          {/* Active Batches */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Stock Batches
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {analytics.totalBatches}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {getFilterLabel(dateFilter)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <select
          value={productFilter}
          onChange={(e) => {
            setProductFilter(e.target.value)
            loadData(1)
          }}
          className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm w-full sm:w-48"
        >
          <option value="">All Products</option>
          {allProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Batches ({meta.total} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : batches.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {meta.total === 0
                ? 'No stock batches yet. Add inventory to get started!'
                : 'No batches found matching your filters.'}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Number</TableHead>
                      <TableHead className="text-right">Qty Purchased</TableHead>
                      <TableHead className="text-right">Qty Remaining</TableHead>
                      <TableHead className="text-right">Size/Box</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Cost/Box</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Added Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => {
                      const batchValue = batch.boxes_remaining * parseFloat(batch.cost_per_box.toString())
                      return (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">{batch.batch_number || '-'}</TableCell>
                          <TableCell className="text-right">{batch.boxes_purchased}</TableCell>
                          <TableCell className="text-right font-medium">{batch.boxes_remaining}</TableCell>
                          <TableCell className="text-right">
                            {batch.quantity_per_box}
                          </TableCell>
                          <TableCell>{batch.unit_per_box}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(batch.cost_per_box)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(batchValue)}
                          </TableCell>
                          <TableCell>{batch.supplier_name || '-'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(batch.created_at)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                batch.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {batch.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() => openSaleDialog(batch)}
                              disabled={batch.boxes_remaining <= 0}
                              title={batch.boxes_remaining > 0 ? 'Record Sale' : 'No stock available'}
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
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
                    onClick={() => loadData(meta.page - 1)}
                    disabled={meta.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadData(meta.page + 1)}
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

      {/* Add Stock Dialog with Searchable Product */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Stock Batch</DialogTitle>
            <DialogDescription>
              Add new inventory to your stock
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Searchable Product Selector */}
            <div>
              <label className="text-sm font-medium text-foreground">Search Product *</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Type to search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10"
                />
                
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => selectProduct(product)}
                        className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{product.base_unit}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {searchLoading && (
                  <div className="absolute right-3 top-3">
                    <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Selected Product Display */}
              {selectedProduct && (
                <div className="mt-2 p-3 bg-accent rounded-md border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{selectedProduct.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedProduct.sku} • {selectedProduct.unit_type}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(null)
                        setProductSearch('')
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Boxes Purchased *</label>
                <Input
                  type="number"
                  placeholder="0"
                  className="mt-1"
                  value={formData.boxes_purchased || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      boxes_purchased: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Qty Per Box *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  className="mt-1"
                  value={formData.quantity_per_box || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity_per_box: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Unit *</label>
                <Input
                  placeholder="packet, kg, piece"
                  className="mt-1"
                  value={formData.unit_per_box}
                  onChange={(e) =>
                    setFormData({ ...formData, unit_per_box: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Cost/Box *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="mt-1"
                  value={formData.cost_per_box || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cost_per_box: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Supplier (Optional)</label>
              <Input
                placeholder="Supplier name"
                className="mt-1"
                value={formData.supplier_name}
                onChange={(e) =>
                  setFormData({ ...formData, supplier_name: e.target.value })
                }
              />
            </div>

            <Button className="w-full" onClick={handleAddBatch}>
              Add Stock Batch
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Sale Dialog */}
      <Dialog open={isSaleDialogOpen} onOpenChange={(open) => {
        setIsSaleDialogOpen(open)
        if (!open) resetSaleForm()
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Sale</DialogTitle>
            <DialogDescription>
              Record a new sale for this stock batch
            </DialogDescription>
          </DialogHeader>

          {selectedBatch && (
            <div className="space-y-4">
              {/* Batch Details */}
              <div className="p-3 bg-muted rounded-md border border-border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Batch Number</p>
                    <p className="font-medium">{selectedBatch.batch_number || selectedBatch.id.substring(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Remaining Stock</p>
                    <p className="font-medium text-green-600">{selectedBatch.boxes_remaining} boxes</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Per Box</p>
                    <p className="font-medium">{selectedBatch.quantity_per_box} {selectedBatch.unit_per_box}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cost/Box</p>
                    <p className="font-medium">{formatCurrency(selectedBatch.cost_per_box)}</p>
                  </div>
                </div>
              </div>

              {/* Sale Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Boxes to Sell *</label>
                  <Input
                    type="number"
                    min="0"
                    max={selectedBatch.boxes_remaining}
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Max: {selectedBatch.boxes_remaining} boxes
                  </p>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
