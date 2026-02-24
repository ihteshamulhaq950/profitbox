'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts'
import { Plus, DollarSign, Loader, Search, TrendingUp, Upload } from 'lucide-react'
import { fetchProducts, fetchSales, recordSale, formatCurrency, formatDate, fetchInventory } from '@/lib/api'
import { Product, DailySale, StockBatch } from '@/lib/types'
import { getDateRangeFromFilter, type DateFilter } from '@/lib/date-utils'

export default function SalesPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sales, setSales] = useState<DailySale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [inventory, setInventory] = useState<StockBatch[]>([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, hasMore: false })
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsDateFilter, setAnalyticsDateFilter] = useState<DateFilter>('today')
  
  // Product search state
  const [productSearch, setProductSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedBatches, setSelectedBatches] = useState<StockBatch[]>([])
  
  const [formData, setFormData] = useState({
    product_id: '',
    batch_id: '',
    boxes_sold: 0,
    selling_price_per_box: 0,
    customer_name: '',
    notes: '',
  })
  const [formError, setFormError] = useState('')

  useEffect(() => {
    loadData()
    loadAnalytics()
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [analyticsDateFilter])

  // Load analytics data using centralized date utilities
  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true)
      const dateRange = getDateRangeFromFilter(analyticsDateFilter as DateFilter)
      const params = new URLSearchParams()
      
      if ('from' in dateRange && dateRange.from) {
        params.append('from_date', dateRange.from)
      }
      if ('to' in dateRange && dateRange.to) {
        params.append('to_date', dateRange.to)
      }
      
      const response = await fetch(`/api/sales/analytics?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
      setAnalytics(null)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // Search products for dialog (debounced with 600ms)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (productSearch.trim().length >= 2) {
        setSearchLoading(true)
        try {
          const response = await fetchProducts(1, 5, productSearch.trim())
          setSearchResults(response.data)
        } catch (error) {
          console.error('Error searching products:', error)
          setSearchResults([])
        } finally {
          setSearchLoading(false)
        }
      } else {
        setSearchResults([])
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [productSearch])

  // Fetch batches when product is selected
  const handleSelectProduct = async (product: Product) => {
    setSelectedProduct(product)
    setProductSearch('')
    setSearchResults([])
    setFormData({ ...formData, product_id: product.id, batch_id: '' })

    // Fetch batches for this product
    try {
      const response = await fetchInventory(1, 100, {
        product_id: product.id,
        status: 'active',
      })
      setSelectedBatches(response.data)
    } catch (error) {
      console.error('Error fetching batches:', error)
      setSelectedBatches([])
    }
  }

  const loadData = async (page: number = 1) => {
    try {
      setLoading(true)
      const [salesResp, productsResp, inventoryResp] = await Promise.all([
        fetchSales(page, 10, {
          from_date: dateFrom || undefined,
          to_date: dateTo || undefined,
        }),
        fetchProducts(1, 100), // Get all products for dropdown
        fetchInventory(1, 100, { status: 'active' }),
      ])
      setSales(salesResp.data)
      setProducts(productsResp.data)
      setInventory(inventoryResp.data)
      setMeta(salesResp.meta)
    } catch (error) {
      console.error('Error loading sales data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    loadData(1)
  }

  const handleRecordSale = async () => {
    setFormError('')
    
    if (!formData.product_id || !formData.batch_id) {
      setFormError('Please select a product and batch')
      return
    }
    if (!formData.boxes_sold || formData.boxes_sold <= 0) {
      setFormError('Boxes sold must be greater than 0')
      return
    }
    if (!formData.selling_price_per_box || formData.selling_price_per_box <= 0) {
      setFormError('Selling price must be greater than 0')
      return
    }

    // Check if boxes_sold exceeds boxes_remaining
    const selectedBatch = selectedBatches.find(b => b.id === formData.batch_id)
    if (!selectedBatch) {
      setFormError('Could not find selected batch')
      return
    }
    if (formData.boxes_sold > selectedBatch.boxes_remaining) {
      setFormError(`Cannot sell ${formData.boxes_sold} boxes. Only ${selectedBatch.boxes_remaining} boxes available in this batch.`)
      return
    }

    const result = await recordSale({
      product_id: formData.product_id,
      batch_id: formData.batch_id,
      boxes_sold: formData.boxes_sold,
      selling_price_per_box: formData.selling_price_per_box.toString(),
      customer_name: formData.customer_name || undefined,
      notes: formData.notes || undefined,
    })

    if (result) {
      setFormData({
        product_id: '',
        batch_id: '',
        boxes_sold: 0,
        selling_price_per_box: 0,
        customer_name: '',
        notes: '',
      })
      setFormError('')
      setIsOpen(false)
      loadData(1)
    } else {
      setFormError('Failed to record sale. Please try again.')
    }
  }

  // Prepare chart data (group sales by date)
  const salesByDate: Record<string, { revenue: string; boxes: number }> = {}
  sales.forEach((sale) => {
    const dateKey = sale.created_at.split('T')[0]
    if (!salesByDate[dateKey]) {
      salesByDate[dateKey] = { revenue: '0', boxes: 0 }
    }
    const saleRevenue = Number(sale.boxes_sold) * Number(sale.selling_price_per_box)
    salesByDate[dateKey].revenue = (Number(salesByDate[dateKey].revenue) + saleRevenue).toString()
    salesByDate[dateKey].boxes += sale.boxes_sold
  })

  const salesChartData = Object.entries(salesByDate)
    .map(([date, data]) => ({
      date,
      revenue: Math.round(Number(data.revenue)),
      boxes: data.boxes,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30) // Last 30 days

  // Calculate metrics
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.boxes_sold) * Number(s.selling_price_per_box), 0)
  const totalBoxes = sales.reduce((sum, s) => sum + s.boxes_sold, 0)
  const avgPrice = totalBoxes > 0 ? totalRevenue / totalBoxes : 0



  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Sales</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Record and track daily sales
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
          <Link href="/dashboard/sales/bulk-upload" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="gap-2 w-full">
              <Upload className="w-4 h-4" />
              Bulk Upload
            </Button>
          </Link>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) {
              // Reset form when dialog closes
              setFormError('')
              setProductSearch('')
              setSelectedProduct(null)
              setSearchResults([])
              setSelectedBatches([])
              setFormData({
                product_id: '',
                batch_id: '',
                boxes_sold: 0,
                selling_price_per_box: 0,
                customer_name: '',
                notes: '',
              })
            }
          }}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Record Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record New Sale</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
              {/* Error Alert */}
              {formError && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}
              {/* Product Search */}
              <div>
                <label className="text-sm font-medium text-foreground">Search Product *</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Type to search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10 text-sm"
                  />
                  
                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          className="w-full text-left px-4 py-2 hover:bg-muted transition-colors"
                        >
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-muted-foreground">{product.sku}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {searchLoading && (
                  <p className="text-xs text-muted-foreground mt-1">Searching...</p>
                )}
              </div>

              {/* Selected Product Display */}
              {selectedProduct && (
                <>
                  {/* Batch Selection Table */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Select Stock Batch *</label>
                    <div className="border border-border rounded-md overflow-auto max-h-48">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs">Batch Number</TableHead>
                            <TableHead className="text-right text-xs">Remaining</TableHead>
                            <TableHead className="text-right text-xs hidden sm:table-cell">Per Box</TableHead>
                            <TableHead className="text-right text-xs hidden md:table-cell">Cost/Box</TableHead>
                            <TableHead className="text-center text-xs">Select</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedBatches.map((batch) => (
                            <TableRow 
                              key={batch.id}
                              className={formData.batch_id === batch.id ? "bg-blue-50" : ""}
                            >
                              <TableCell className="font-medium text-xs">{batch.batch_number || batch.id.substring(0, 8)}</TableCell>
                              <TableCell className="text-right text-xs">{batch.boxes_remaining}</TableCell>
                              <TableCell className="text-right text-xs hidden sm:table-cell">{batch.quantity_per_box}</TableCell>
                              <TableCell className="text-right text-xs hidden md:table-cell">{formatCurrency(batch.cost_per_box)}</TableCell>
                              <TableCell className="text-center">
                                <input
                                  type="radio"
                                  name="batch"
                                  checked={formData.batch_id === batch.id}
                                  onChange={() => setFormData({ ...formData, batch_id: batch.id })}
                                  className="w-4 h-4"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {formData.batch_id && (
                    <>
                      {/* Batch Details */}
                      {selectedBatches.find(b => b.id === formData.batch_id) && (
                        <div className="p-3 bg-muted rounded-md border border-border">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Batch Number</p>
                              <p className="font-medium text-xs sm:text-sm">{selectedBatches.find(b => b.id === formData.batch_id)?.batch_number || selectedBatches.find(b => b.id === formData.batch_id)?.id.substring(0, 8)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Remaining Stock</p>
                              <p className="font-medium text-green-600 text-xs sm:text-sm">{selectedBatches.find(b => b.id === formData.batch_id)?.boxes_remaining} boxes</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Per Box</p>
                              <p className="font-medium text-xs sm:text-sm">{selectedBatches.find(b => b.id === formData.batch_id)?.quantity_per_box} {selectedBatches.find(b => b.id === formData.batch_id)?.unit_per_box}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Cost/Box</p>
                              <p className="font-medium text-xs sm:text-sm">{formatCurrency(selectedBatches.find(b => b.id === formData.batch_id)?.cost_per_box || 0)}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sale Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground">Boxes to Sell *</label>
                          <Input
                            type="number"
                            min="0"
                            max={selectedBatches.find(b => b.id === formData.batch_id)?.boxes_remaining}
                            value={formData.boxes_sold}
                            onChange={(e) =>
                              setFormData({ ...formData, boxes_sold: parseInt(e.target.value) || 0 })
                            }
                            className="mt-1"
                            placeholder="0"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Max: {selectedBatches.find(b => b.id === formData.batch_id)?.boxes_remaining} boxes
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground">Price Per Box *</label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.selling_price_per_box}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
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
                          value={formData.customer_name}
                          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                          className="mt-1"
                          placeholder="Customer name"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground">Notes (Optional)</label>
                        <Input
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="mt-1"
                          placeholder="Additional notes"
                        />
                      </div>

                      <Button onClick={handleRecordSale} className="w-full">
                        Record Sale
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">Sales Analytics</h2>
          <div className="flex flex-wrap gap-2">
            {(['today', 'yesterday', 'alltime'] as DateFilter[]).map((filter) => (
              <Button
                key={filter}
                variant={analyticsDateFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAnalyticsDateFilter(filter)}
                className="text-xs sm:text-sm"
              >
                {filter === 'today' ? 'Today' : filter === 'yesterday' ? 'Yesterday' : 'All Time'}
              </Button>
            ))}
          </div>
        </div>

        {analyticsLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : analytics ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-foreground">
                    {formatCurrency(analytics.summary?.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.summary?.totalTransactions} transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Profit</CardTitle>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-foreground">
                    {formatCurrency(analytics.summary?.totalProfit || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.summary?.profitMargin?.toFixed(1)}% margin
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Boxes</CardTitle>
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {analytics.summary?.totalBoxes || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Units sold</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Price/Box</CardTitle>
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(analytics.summary?.avgPrice || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Average price</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(analytics.summary?.totalCost || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">COGS</p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            {analytics.dailyData && analytics.dailyData.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Revenue, Cost & Profit Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={analytics.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => {
                        const numValue = Array.isArray(value) ? value[0] : value
                        return formatCurrency(numValue ?? 0)
                      }} />
                      <Legend />
                      <Bar
                        dataKey="revenue"
                        fill="#10b981"
                        name="Revenue"
                      />
                      <Bar
                        dataKey="cost"
                        fill="#ef4444"
                        name="Cost"
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Profit"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <p className="text-muted-foreground text-center">No sales data available for this period</p>
                </CardContent>
              </Card>
            )}

            {/* Top Products */}
            {analytics.topProducts && analytics.topProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Products by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topProducts.slice(0, 5).map((product: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.boxes} boxes sold</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">{formatCurrency(product.revenue)}</p>
                          <p className="text-xs text-muted-foreground">
                            Profit: {formatCurrency(product.profit)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-muted-foreground text-center">Failed to load analytics</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          placeholder="Search by product..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="From date"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="To date"
        />
        <Button onClick={handleApplyFilters} variant="outline">
          Apply Filters
        </Button>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Records ({meta.total} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sales.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead className="text-right">Boxes</TableHead>
                      <TableHead className="text-right">Price/Box</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead>Customer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => {
                      const product = products.find((p) => p.id === sale.product_id)
                      const revenue = Number(sale.boxes_sold) * Number(sale.selling_price_per_box)
                      return (
                        <TableRow key={sale.id}>
                          <TableCell>{sale.created_at.split('T')[0]}</TableCell>
                          <TableCell className="font-medium">{product?.name}</TableCell>
                          <TableCell className="text-sm">{sale.batch_id.substring(0, 8)}</TableCell>
                          <TableCell className="text-right">{sale.boxes_sold}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(sale.selling_price_per_box)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(revenue.toString())}
                          </TableCell>
                          <TableCell>{sale.customer_name || '-'}</TableCell>
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
          ) : (
            <p className="text-muted-foreground text-center py-8">No sales recorded yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
