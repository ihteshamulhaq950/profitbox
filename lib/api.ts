/**
 * API utility functions for ProfitBox
 * Handles data fetching, validation, and calculations with NUMERIC precision
 */

import { Product, StockBatch, DailySale } from '@/lib/types'
import Decimal from 'decimal.js'

// ============================================================================
// PRODUCTS API - Extended with Update, Delete, Toggle Status
// ============================================================================

export interface ProductFormData {
  sku: string
  name: string
  unitType: 'weight' | 'count'
  baseUnit: string
  category?: string
  description?: string
  defaultSupplier?: string
}

/**
 * Fetch products with pagination and filters
 * Default: 10 recent products
 */
export async function fetchProducts(
  page = 1,
  limit = 10,
  search?: string,
  category?: string
): Promise<{ data: Product[]; meta: any }> {
  try {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    if (search) params.append('search', search)
    if (category) params.append('category', category)

    const response = await fetch(`/api/products?${params.toString()}`)
    if (!response.ok) throw new Error('Failed to fetch products')
    return response.json()
  } catch (error) {
    console.error('Error fetching products:', error)
    return { data: [], meta: { page: 1, limit, total: 0, hasMore: false } }
  }
}

/**
 * Create a new product
 */
export async function createProduct(
  formData: ProductFormData
): Promise<Product | null> {
  try {
    const product = {
      sku: formData.sku,
      name: formData.name,
      unit_type: formData.unitType,
      base_unit: formData.baseUnit,
      category: formData.category || null,
      description: formData.description || null,
      default_supplier: formData.defaultSupplier || null,
    }

    console.log('Creating product:', product)

    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    })

    if (!response.ok) {
      const error = await response.json()
      alert(error.error || 'Failed to create product')
      throw new Error(error.error || 'Failed to create product')
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.error('Error creating product:', error)
    return null
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(
  productId: string,
  formData: ProductFormData
): Promise<Product | null> {
  try {
    const product = {
      sku: formData.sku,
      name: formData.name,
      unit_type: formData.unitType,
      base_unit: formData.baseUnit,
      category: formData.category || null,
      description: formData.description || null,
      default_supplier: formData.defaultSupplier || null,
    }

    console.log('Updating product:', productId, product)

    const response = await fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    })

    if (!response.ok) {
      const error = await response.json()
      alert(error.error || 'Failed to update product')
      throw new Error(error.error || 'Failed to update product')
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.error('Error updating product:', error)
    return null
  }
}

/**
 * Delete a product (cascade deletes stock batches and sales)
 */
export async function deleteProduct(productId: string): Promise<boolean> {
  try {
    console.log('Deleting product:', productId)

    const response = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      alert(error.error || 'Failed to delete product')
      throw new Error(error.error || 'Failed to delete product')
    }

    return true
  } catch (error) {
    console.error('Error deleting product:', error)
    return false
  }
}

/**
 * Toggle product active status
 */
export async function toggleProductStatus(
  productId: string,
  isActive: boolean
): Promise<boolean> {
  try {
    console.log('Toggling product status:', productId, isActive)

    const response = await fetch(`/api/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: isActive }),
    })

    if (!response.ok) {
      const error = await response.json()
      alert(error.error || 'Failed to update status')
      throw new Error(error.error || 'Failed to update status')
    }

    return true
  } catch (error) {
    console.error('Error toggling product status:', error)
    return false
  }
}

// ============================================================================
// INVENTORY (STOCK BATCHES) API
// ============================================================================

/**
 * Fetch stock batches with pagination and filters
 * Default: 10 recent active batches
 */
export async function fetchInventory(
  page = 1,
  limit = 10,
  filters?: { product_id?: string; status?: 'active' | 'depleted' }
): Promise<{ data: StockBatch[]; meta: any }> {
  try {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    if (filters?.product_id) params.append('product_id', filters.product_id)
    if (filters?.status) params.append('status', filters.status)

    const response = await fetch(`/api/inventory?${params.toString()}`)
    if (!response.ok) throw new Error('Failed to fetch inventory')
    return response.json()
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return { data: [], meta: { page: 1, limit, total: 0, hasMore: false } }
  }
}

/**
 * Add a new stock batch
 */
export async function addStockBatch(
  batch: Partial<StockBatch>
): Promise<StockBatch | null> {
  try {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to add stock batch')
    }
    return response.json()
  } catch (error) {
    console.error('Error adding stock batch:', error)
    return null
  }
}

/**
 * Calculate total inventory value from batches
 * Handles NUMERIC precision values (boxes × cost_per_box)
 */
export function calculateInventoryValue(batches: StockBatch[]): string {
  let total = new Decimal(0)

  batches.forEach((batch) => {
    if (batch.status === 'active' && batch.boxes_remaining > 0) {
      const value = new Decimal(batch.boxes_remaining).times(batch.cost_per_box)
      total = total.plus(value)
    }
  })

  return total.toFixed(2)
}

/**
 * Get total boxes in stock
 */
export function getTotalBoxesInStock(batches: StockBatch[]): number {
  return batches
    .filter((b) => b.status === 'active')
    .reduce((sum, batch) => sum + batch.boxes_remaining, 0)
}

/**
 * Calculate total quantity (boxes × quantity_per_box)
 */
export function getTotalQuantityInStock(batches: StockBatch[]): string {
  let total = new Decimal(0)

  batches.forEach((batch) => {
    if (batch.status === 'active' && batch.boxes_remaining > 0) {
      const qty = new Decimal(batch.boxes_remaining).times(batch.quantity_per_box)
      total = total.plus(qty)
    }
  })

  return total.toFixed(2)
}

// ============================================================================
// SALES API - Enhanced with Date Filtering
// ============================================================================

/**
 * Fetch daily sales with pagination and filters
 * Default: 10 recent sales
 * Now supports date range filtering for dashboard
 */
export async function fetchSales(
  page = 1,
  limit = 10,
  filters?: { 
    product_id?: string
    from_date?: string
    to_date?: string
    from?: string  // Alternative naming for date range
    to?: string    // Alternative naming for date range
  }
): Promise<{ data: DailySale[]; meta: any }> {
  try {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    
    if (filters?.product_id) params.append('product_id', filters.product_id)
    
    // Support both naming conventions for date filters
    if (filters?.from_date) params.append('from_date', filters.from_date)
    if (filters?.to_date) params.append('to_date', filters.to_date)
    if (filters?.from) params.append('from_date', filters.from)
    if (filters?.to) params.append('to_date', filters.to)

    const response = await fetch(`/api/sales?${params.toString()}`)
    if (!response.ok) throw new Error('Failed to fetch sales')
    return response.json()
  } catch (error) {
    console.error('Error fetching sales:', error)
    return { data: [], meta: { page: 1, limit, total: 0, hasMore: false } }
  }
}

/**
 * Record a new sale with profit calculation
 */
export async function recordSale(
  sale: Partial<DailySale>
): Promise<DailySale | null> {
  try {
    const response = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to record sale')
    }
    return response.json()
  } catch (error) {
    console.error('Error recording sale:', error)
    return null
  }
}

/**
 * Calculate total sales metrics
 * Handles NUMERIC precision values
 */
export function calculateSalesMetrics(sales: DailySale[]): {
  totalRevenue: string
  totalBoxes: number
  avgPrice: string
} {
  let revenue = new Decimal(0)
  let totalBoxes = 0

  sales.forEach((sale) => {
    const saleRevenue = new Decimal(sale.boxes_sold).times(sale.selling_price_per_box)
    revenue = revenue.plus(saleRevenue)
    totalBoxes += sale.boxes_sold
  })

  const avgPrice =
    totalBoxes > 0
      ? revenue.dividedBy(totalBoxes).toFixed(2)
      : '0.00'

  return {
    totalRevenue: revenue.toFixed(2),
    totalBoxes,
    avgPrice,
  }
}

// ============================================================================
// PRODUCT DETAIL API
// ============================================================================

/**
 * Fetch product details with full information
 */
export async function fetchProductDetail(productId: string): Promise<Product | null> {
  try {
    const response = await fetch(`/api/products/${productId}`)
    if (!response.ok) throw new Error('Failed to fetch product details')
    const result = await response.json()
    return result.data || null
  } catch (error) {
    console.error('Error fetching product details:', error)
    return null
  }
}

/**
 * Fetch stock batches for a specific product
 */
export async function fetchProductStock(
  productId: string,
  page = 1,
  limit = 10
): Promise<{ data: StockBatch[]; meta: any }> {
  try {
    const params = new URLSearchParams()
    params.append('product_id', productId)
    params.append('page', page.toString())
    params.append('limit', limit.toString())

    const response = await fetch(`/api/inventory?${params.toString()}`)
    if (!response.ok) throw new Error('Failed to fetch stock')
    return response.json()
  } catch (error) {
    console.error('Error fetching stock:', error)
    return { data: [], meta: { page: 1, limit, total: 0, hasMore: false } }
  }
}

/**
 * Fetch daily sales for a specific product
 */
export async function fetchProductSales(
  productId: string,
  page = 1,
  limit = 10,
  dateRange?: { from_date?: string; to_date?: string }
): Promise<{ data: DailySale[]; meta: any }> {
  try {
    const params = new URLSearchParams()
    params.append('product_id', productId)
    params.append('page', page.toString())
    params.append('limit', limit.toString())

    if (dateRange?.from_date) params.append('from_date', dateRange.from_date)
    if (dateRange?.to_date) params.append('to_date', dateRange.to_date)

    const response = await fetch(`/api/sales?${params.toString()}`)
    if (!response.ok) throw new Error('Failed to fetch sales')
    return response.json()
  } catch (error) {
    console.error('Error fetching sales:', error)
    return { data: [], meta: { page: 1, limit, total: 0, hasMore: false } }
  }
}

// ============================================================================
// FORMATTING & UTILITY FUNCTIONS
// ============================================================================

/**
 * Format currency with proper precision
 */
export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

/**
 * Format percentage
 */
export function formatPercent(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return `${num.toFixed(2)}%`
}

/**
 * Format date in readable format
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.toISOString().split('T')[0]
}

/**
 * Calculate profit margin percentage from strings (NUMERIC values)
 */
export function calculateMarginPercent(
  revenue: string | number,
  profit: string | number
): string {
  const rev = new Decimal(revenue)
  if (rev.isZero()) return '0.00'
  return rev.equals(0)
    ? '0.00'
    : new Decimal(profit).dividedBy(rev).times(100).toFixed(2)
}

/**
 * Get date range for dashboard filters
 */
export function getDateRange(
  filter: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'all'
): { from?: string; to?: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const last7days = new Date(today)
  last7days.setDate(last7days.getDate() - 7)
  
  const last30days = new Date(today)
  last30days.setDate(last30days.getDate() - 30)
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0]
  
  switch (filter) {
    case 'today':
      return { from: formatDate(today), to: formatDate(today) }
    case 'yesterday':
      return { from: formatDate(yesterday), to: formatDate(yesterday) }
    case 'last7days':
      return { from: formatDate(last7days), to: formatDate(today) }
    case 'last30days':
      return { from: formatDate(last30days), to: formatDate(today) }
    case 'all':
      return {}
    default:
      return { from: formatDate(today), to: formatDate(today) }
  }
}