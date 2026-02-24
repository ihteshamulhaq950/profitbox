'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Loader,
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Box,
  Calendar,
} from 'lucide-react'
import { 
  fetchProductDetail, 
  fetchProductStock, 
  fetchProductSales,
  calculateInventoryValue,
  getTotalBoxesInStock,
  getTotalQuantityInStock,
  formatCurrency,
  formatDate,
  calculateSalesMetrics
} from '@/lib/api'
import { Product, StockBatch, DailySale } from '@/lib/types'
import Decimal from 'decimal.js'

type DateFilter = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'all'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  // State management
  const [product, setProduct] = useState<Product | null>(null)
  const [stockBatches, setStockBatches] = useState<StockBatch[]>([])
  const [sales, setSales] = useState<DailySale[]>([])
  
  // Loading states
  const [productLoading, setProductLoading] = useState(true)
  const [stockLoading, setStockLoading] = useState(true)
  const [salesLoading, setSalesLoading] = useState(true)
  
  // Pagination
  const [stockMeta, setStockMeta] = useState({ page: 1, limit: 10, total: 0, hasMore: false })
  const [salesMeta, setSalesMeta] = useState({ page: 1, limit: 10, total: 0, hasMore: false })
  
  // Date filter for sales
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')

  // Load product details
  useEffect(() => {
    loadProductDetail()
  }, [productId])

  // Load stock batches
  useEffect(() => {
    loadStockBatches(1)
  }, [productId])

  // Load sales with date filter
  useEffect(() => {
    loadSales(1)
  }, [productId, dateFilter])

  // Load product details
  const loadProductDetail = async () => {
    try {
      setProductLoading(true)
      const data = await fetchProductDetail(productId)
      setProduct(data)
    } catch (error) {
      console.error('Error loading product details:', error)
    } finally {
      setProductLoading(false)
    }
  }

  // Load stock batches
  const loadStockBatches = async (page: number = 1) => {
    try {
      setStockLoading(true)
      const response = await fetchProductStock(productId, page, 10)
      setStockBatches(response.data)
      setStockMeta(response.meta)
    } catch (error) {
      console.error('Error loading stock:', error)
    } finally {
      setStockLoading(false)
    }
  }

  // Load sales with date filter
  const loadSales = async (page: number = 1) => {
    try {
      setSalesLoading(true)
      
      // Get date range for filter
      const dateRange = getDateRange(dateFilter)
      
      const response = await fetchProductSales(productId, page, 10, dateRange)
      setSales(response.data)
      setSalesMeta(response.meta)
    } catch (error) {
      console.error('Error loading sales:', error)
    } finally {
      setSalesLoading(false)
    }
  }

  // Get date range for filter
  const getDateRange = (filter: DateFilter): { from_date?: string; to_date?: string } => {
    const getLocalDateString = (daysOffset: number = 0): string => {
      const date = new Date()
      date.setDate(date.getDate() + daysOffset)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    switch (filter) {
      case 'today':
        const today = getLocalDateString(0)
        return { from_date: today, to_date: today }
      case 'yesterday':
        const yesterday = getLocalDateString(-1)
        return { from_date: yesterday, to_date: yesterday }
      case 'last7days':
        const last7 = getLocalDateString(-7)
        const todayFor7 = getLocalDateString(0)
        return { from_date: last7, to_date: todayFor7 }
      case 'last30days':
        const last30 = getLocalDateString(-30)
        const todayFor30 = getLocalDateString(0)
        return { from_date: last30, to_date: todayFor30 }
      case 'all':
        return {}
      default:
        const defaultToday = getLocalDateString(0)
        return { from_date: defaultToday, to_date: defaultToday }
    }
  }

  // Calculate metrics
  const getInventoryMetrics = () => {
    if (stockBatches.length === 0) {
      return { value: '0.00', boxes: 0, quantity: '0.00' }
    }
    return {
      value: calculateInventoryValue(stockBatches),
      boxes: getTotalBoxesInStock(stockBatches),
      quantity: getTotalQuantityInStock(stockBatches),
    }
  }

  const getSalesMetrics = () => {
    if (sales.length === 0) {
      return { totalRevenue: '0.00', totalBoxes: 0, avgPrice: '0.00' }
    }
    const metrics = calculateSalesMetrics(sales)
    return {
      totalRevenue: metrics.totalRevenue,
      totalBoxes: metrics.totalBoxes,
      avgPrice: metrics.avgPrice,
    }
  }

  const getFilterLabel = (filter: DateFilter): string => {
    switch (filter) {
      case 'today': return 'Today'
      case 'yesterday': return 'Yesterday'
      case 'last7days': return 'Last 7 Days'
      case 'last30days': return 'Last 30 Days'
      case 'all': return 'All Time'
      default: return 'Today'
    }
  }

  // Calculate profit for a sale
  const calculateProfit = (sale: DailySale, batch: StockBatch | null) => {
    if (!batch) return '0.00'
    const revenue = new Decimal(sale.boxes_sold).times(sale.selling_price_per_box)
    const cost = new Decimal(sale.boxes_sold).times(batch.cost_per_box)
    return revenue.minus(cost).toFixed(2)
  }

  // Find batch for a sale
  const findBatchForSale = (saleId: string): StockBatch | null => {
    return stockBatches.find((batch) => {
      // This is a simple match - in production you'd want to store batch_id with each sale
      return batch.id !== saleId
    }) || null
  }

  if (productLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Button>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Product not found</p>
        </div>
      </div>
    )
  }

  const inventoryMetrics = getInventoryMetrics()
  const salesMetrics = getSalesMetrics()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
            <p className="text-muted-foreground mt-1">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Status</p>
          <button
            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              product.is_active
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {product.is_active ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>

      {/* Product Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Category</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {product.category || '-'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Product category</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unit Type</CardTitle>
            <Box className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground capitalize">
              {product.unit_type}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{product.base_unit}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supplier</CardTitle>
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {product.default_supplier || '-'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Default supplier</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Inventory</h2>
        
        {/* Inventory Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(inventoryMetrics.value)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">All active batches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Boxes in Stock</CardTitle>
              <Box className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {inventoryMetrics.boxes}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Active boxes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
              <Package className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {inventoryMetrics.quantity}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{product.base_unit}s</p>
            </CardContent>
          </Card>
        </div>

        {/* Stock Batches Table */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Batches ({stockMeta.total} total)</CardTitle>
          </CardHeader>
          <CardContent>
            {stockLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : stockBatches.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No stock batches found. Add a batch to get started.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Added Date</TableHead>
                        <TableHead>Boxes Purchased</TableHead>
                        <TableHead>Boxes Remaining</TableHead>
                        <TableHead>Qty per Box</TableHead>
                        <TableHead>Cost per Box</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockBatches.map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell>{formatDate(batch.created_at)}</TableCell>
                          <TableCell className="font-medium">{batch.boxes_purchased}</TableCell>
                          <TableCell>{batch.boxes_remaining}</TableCell>
                          <TableCell>
                            {batch.quantity_per_box} {batch.unit_per_box}
                          </TableCell>
                          <TableCell>{formatCurrency(batch.cost_per_box)}</TableCell>
                          <TableCell>{batch.supplier_name || '-'}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                batch.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {batch.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {stockMeta.total > stockMeta.limit && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <p className="text-sm text-muted-foreground">
                      Page {stockMeta.page} of {Math.ceil(stockMeta.total / stockMeta.limit)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadStockBatches(stockMeta.page - 1)}
                        disabled={stockMeta.page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadStockBatches(stockMeta.page + 1)}
                        disabled={!stockMeta.hasMore}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Sales</h2>
          
          {/* Date Filter Buttons */}
          <div className="flex gap-2">
            {(['today', 'yesterday', 'last7days', 'last30days', 'all'] as DateFilter[]).map((filter) => (
              <Button
                key={filter}
                variant={dateFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateFilter(filter)}
              >
                {getFilterLabel(filter)}
              </Button>
            ))}
          </div>
        </div>

        {/* Sales Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(salesMetrics.totalRevenue)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getFilterLabel(dateFilter)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Boxes Sold</CardTitle>
              <Box className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {salesMetrics.totalBoxes}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total boxes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Price per Box</CardTitle>
              <DollarSign className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(salesMetrics.avgPrice)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Average selling price</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales ({salesMeta.total} total)</CardTitle>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sales.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No sales found for {getFilterLabel(dateFilter).toLowerCase()}.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Boxes Sold</TableHead>
                        <TableHead>Price per Box</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((sale) => {
                        const revenue = new Decimal(sale.boxes_sold).times(sale.selling_price_per_box).toFixed(2)
                        return (
                          <TableRow key={sale.id}>
                            <TableCell>{formatDate(sale.created_at)}</TableCell>
                            <TableCell className="font-medium">{sale.boxes_sold}</TableCell>
                            <TableCell>{formatCurrency(sale.selling_price_per_box)}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(revenue)}</TableCell>
                            <TableCell>{sale.customer_name || '-'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {sale.notes || '-'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {salesMeta.total > salesMeta.limit && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <p className="text-sm text-muted-foreground">
                      Page {salesMeta.page} of {Math.ceil(salesMeta.total / salesMeta.limit)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadSales(salesMeta.page - 1)}
                        disabled={salesMeta.page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadSales(salesMeta.page + 1)}
                        disabled={!salesMeta.hasMore}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
