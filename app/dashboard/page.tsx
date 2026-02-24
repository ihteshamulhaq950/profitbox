'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  AlertCircle,
  Loader,
  ShoppingCart,
  Percent,
} from 'lucide-react'
import { fetchProducts, fetchInventory, fetchSales, formatCurrency, calculateSalesMetrics } from '@/lib/api'
import { Product, StockBatch, DailySale } from '@/lib/types'
import { getDateRangeFromFilter, type DateFilter } from '@/lib/date-utils'
import Decimal from 'decimal.js'

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [inventory, setInventory] = useState<StockBatch[]>([])
  const [sales, setSales] = useState<DailySale[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')

  useEffect(() => {
    loadData()
  }, [dateFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      const dateRange = getDateRangeFromFilter(dateFilter)
      
      const [productsResp, inventoryResp, salesResp] = await Promise.all([
        fetchProducts(1, 100), // Fetch all products
        fetchInventory(1, 100, { status: 'active' }), // Fetch all active inventory
        fetchSales(1, 1000, dateRange), // Fetch sales with date filter
      ])
      
      setProducts(productsResp.data)
      setInventory(inventoryResp.data)
      setSales(salesResp.data)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Calculate metrics
  const totalBoxesInStock = inventory.reduce(
    (sum, batch) => sum + batch.boxes_remaining,
    0
  )
  
  const inventoryValue = inventory.reduce((sum, batch) => {
    if (batch.status === 'active') {
      return sum + batch.boxes_remaining * parseFloat(batch.cost_per_box.toString())
    }
    return sum
  }, 0)

  const salesMetrics = calculateSalesMetrics(sales)
  
  // Calculate total cost and profit
  let totalCost = new Decimal(0)
  let totalRevenue = new Decimal(0)
  
  sales.forEach((sale) => {
    const batch = inventory.find(b => b.id === sale.batch_id)
    if (batch) {
      const saleCost = new Decimal(sale.boxes_sold).times(batch.cost_per_box)
      totalCost = totalCost.plus(saleCost)
    }
    const saleRevenue = new Decimal(sale.boxes_sold).times(sale.selling_price_per_box)
    totalRevenue = totalRevenue.plus(saleRevenue)
  })
  
  const totalProfit = totalRevenue.minus(totalCost)
  const profitMargin = totalRevenue.isZero() 
    ? '0.00' 
    : totalProfit.dividedBy(totalRevenue).times(100).toFixed(2)

  // Prepare chart data (group sales by date)
  const salesByDate: Record<string, { revenue: number; boxes: number; profit: number; cost: number }> = {}
  
  sales.forEach((sale) => {
    const dateKey = sale.created_at.split('T')[0]
    if (!salesByDate[dateKey]) {
      salesByDate[dateKey] = { revenue: 0, boxes: 0, profit: 0, cost: 0 }
    }
    
    const batch = inventory.find(b => b.id === sale.batch_id)
    const saleRevenue = Number(sale.boxes_sold) * Number(sale.selling_price_per_box)
    const saleCost = batch ? Number(sale.boxes_sold) * Number(batch.cost_per_box) : 0
    const saleProfit = saleRevenue - saleCost
    
    salesByDate[dateKey].revenue += saleRevenue
    salesByDate[dateKey].boxes += sale.boxes_sold
    salesByDate[dateKey].cost += saleCost
    salesByDate[dateKey].profit += saleProfit
  })

  const salesChartData = Object.entries(salesByDate)
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Math.round(data.revenue),
      profit: Math.round(data.profit),
      boxes: data.boxes,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Top selling products
  const productSales: Record<string, { boxes: number; revenue: number }> = {}
  
  sales.forEach((sale) => {
    if (!productSales[sale.product_id]) {
      productSales[sale.product_id] = { boxes: 0, revenue: 0 }
    }
    productSales[sale.product_id].boxes += sale.boxes_sold
    productSales[sale.product_id].revenue += Number(sale.boxes_sold) * Number(sale.selling_price_per_box)
  })

  const topProducts = Object.entries(productSales)
    .map(([productId, data]) => {
      const product = products.find(p => p.id === productId)
      return {
        product: product?.name || 'Unknown',
        boxes: data.boxes,
        revenue: Math.round(data.revenue),
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Inventory chart data
  const inventoryChartData = products
    .map((product) => {
      const productInventory = inventory.filter((b) => b.product_id === product.id)
      const totalBoxes = productInventory.reduce(
        (sum, b) => sum + b.boxes_remaining,
        0
      )
      const value = productInventory.reduce(
        (sum, b) => sum + b.boxes_remaining * Number(b.cost_per_box),
        0
      )
      return {
        product: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
        stock: totalBoxes,
        value: Math.round(value),
      }
    })
    .filter(item => item.stock > 0)
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 8)

  // Low stock alerts
  const lowStockProducts = products
    .map((product) => {
      const productInventory = inventory.filter((b) => b.product_id === product.id)
      const totalBoxes = productInventory.reduce(
        (sum, b) => sum + b.boxes_remaining,
        0
      )
      return { product, totalBoxes }
    })
    .filter(item => item.totalBoxes > 0 && item.totalBoxes < 5)
    .sort((a, b) => a.totalBoxes - b.totalBoxes)

  const getFilterLabel = (filter: DateFilter): string => {
    switch (filter) {
      case 'today':
        return 'Today'
      case 'yesterday':
        return 'Yesterday'
      case 'last7days':
        return 'Last 7 Days'
      case 'last30days':
        return 'Last 30 Days'
      case 'alltime':
        return 'All Time'
      default:
        return 'Today'
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Welcome back! Here&apos;s your business overview.
          </p>
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {formatCurrency(salesMetrics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {sales.length} transaction{sales.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {formatCurrency(totalProfit.toFixed(2))}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Percent className="w-3 h-3" />
              {profitMargin}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Boxes Sold</CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {salesMetrics.totalBoxes}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {formatCurrency(salesMetrics.avgPrice)}/box
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Inventory Value</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {formatCurrency(inventoryValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalBoxesInStock} boxes in stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900 text-sm sm:text-base">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.map((item) => (
                <div
                  key={item.product.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 px-3 bg-white rounded-md text-sm"
                >
                  <span className="font-medium text-yellow-900">{item.product.name}</span>
                  <span className="text-xs sm:text-sm text-yellow-700">
                    Only {item.totalBoxes} box{item.totalBoxes !== 1 ? 'es' : ''} remaining
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue & Profit Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Revenue & Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number | undefined, name: string | undefined) => value !== undefined ? formatCurrency(value) : ''}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Profit"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8 text-sm">
                No sales data for selected period
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number | undefined, name: string | undefined) => 
                      value !== undefined ? (name === 'revenue' ? formatCurrency(value) : value) : ''
                    }
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    fill="#10b981"
                    name="Revenue"
                  />
                  <Bar
                    dataKey="boxes"
                    fill="#3b82f6"
                    name="Boxes Sold"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8 text-sm">
                No sales data for selected period
              </p>
            )}
          </CardContent>
        </Card>

        {/* Inventory Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Current Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
            {inventoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={inventoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number | undefined, name: string | undefined) => 
                      value !== undefined ? (name === 'value' ? formatCurrency(value) : value) : ''
                    }
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Bar
                    dataKey="stock"
                    fill="#8b5cf6"
                    name="Boxes in Stock"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8 text-sm">
                No inventory data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Inventory Value Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Inventory Value by Product</CardTitle>
          </CardHeader>
          <CardContent>
            {inventoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={inventoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Bar
                    dataKey="value"
                    fill="#f59e0b"
                    name="Value (PKR)"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8 text-sm">
                No inventory data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Recent Sales Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {sales.slice(0, 10).map((sale) => {
                const product = products.find((p) => p.id === sale.product_id)
                const batch = inventory.find((b) => b.id === sale.batch_id)
                const revenue = Number(sale.boxes_sold) * Number(sale.selling_price_per_box)
                const cost = batch ? Number(sale.boxes_sold) * Number(batch.cost_per_box) : 0
                const profit = revenue - cost
                const profitMarginSale = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0'
                
                return (
                  <div
                    key={sale.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-border last:border-0 text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm sm:text-base">
                        {product?.name || 'Unknown Product'}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {sale.boxes_sold} boxes × {formatCurrency(sale.selling_price_per_box)}
                        {sale.customer_name && ` • ${sale.customer_name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground text-sm sm:text-base">
                        {formatCurrency(revenue.toString())}
                      </p>
                      <p className="text-xs sm:text-sm flex items-center justify-end gap-1">
                        <span className="text-green-600">
                          +{formatCurrency(profit.toString())}
                        </span>
                        <span className="text-muted-foreground">
                          ({profitMarginSale}%)
                        </span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8 text-sm">
              No sales recorded for selected period
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}