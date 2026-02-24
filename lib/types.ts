/**
 * Type definitions for ProfitBox application
 * Matches production schema with NUMERIC precision for financial data
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Product - Master catalog (box-level tracking)
 * Simplified schema with weight/count based units
 */
export interface Product {
  id: string
  user_id: string
  sku: string
  name: string
  category: string | null
  description: string | null
  image_url: string | null
  unit_type: 'weight' | 'count' // 'weight' = kg/g, 'count' = box/packet/piece
  base_unit: string // 'kg', 'g', 'box', 'packet', 'piece', 'bottle', 'can'
  default_supplier: string | null
  is_active: boolean
  created_at: string
}

export interface ProductInsert {
  sku: string
  name: string
  category?: string
  description?: string
  image_url?: string
  unit_type: 'weight' | 'count'
  base_unit: string
  default_supplier?: string
  is_active?: boolean
}

/**
 * Stock Batch - Inventory purchases (box-level)
 * Each batch = one purchase order of X boxes
 * Each box contains quantity_per_box units
 */
export interface StockBatch {
  id: string
  user_id: string
  product_id: string
  boxes_purchased: number
  boxes_remaining: number
  quantity_per_box: string // NUMERIC(14,4) - What's in each box
  unit_per_box: string // 'kg', 'packet', 'piece'
  cost_per_box: string // NUMERIC(14,2)
  supplier_name: string | null
  batch_number: string | null // ProductName-RandomNumber
  status: 'active' | 'depleted'
  created_at: string
}

export interface StockBatchInsert {
  product_id: string
  boxes_purchased: number
  quantity_per_box: number | string
  unit_per_box: string
  cost_per_box: number | string
  supplier_name?: string
  batch_number?: string
  status?: 'active' | 'depleted'
}

/**
 * Daily Sale - End of day sales transactions
 * Records boxes sold, selling price per box
 * Profit calculated: (boxes_sold × selling_price) - (boxes_sold × cost_per_box)
 */
export interface DailySale {
  id: string
  user_id: string
  product_id: string
  batch_id: string
  boxes_sold: number
  selling_price_per_box: string // NUMERIC(14,2)
  customer_name: string | null
  notes: string | null
  created_at: string
}

export interface DailySaleInsert {
  product_id: string
  batch_id: string
  boxes_sold: number
  selling_price_per_box: number | string
  customer_name?: string
  notes?: string
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

/**
 * CSV Import - Bulk import tracking
 */
export interface CSVImport {
  id: string
  user_id: string
  file_name: string
  import_type: 'products' | 'stock_batches' | 'sales'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_rows: number | null
  successful_rows: number
  failed_rows: number
  error_details: Json | null
  created_at: string
  updated_at: string
}

/**
 * AI Insight - Automated recommendations
 */
export interface AIInsight {
  id: string
  user_id: string
  product_id: string | null
  insight_type: 'price_suggestion' | 'stock_alert' | 'demand_forecast' | 'profit_alert'
  title: string
  description: string
  insight_data: Json | null
  recommended_action: string | null
  confidence_score: string | null
  is_read: boolean
  is_dismissed: boolean
  created_at: string
}

/**
 * Analytics Views (simplified for box-level tracking)
 */
export interface ProductInventorySummary {
  product_id: string
  product_name: string
  category: string | null
  total_boxes: number
  total_quantity: string // boxes × quantity_per_box
  inventory_value: string
  active_batches: number
  oldest_batch_date: string | null
}

export interface ProductSalesSummary {
  product_id: string
  product_name: string
  total_transactions: number
  total_boxes_sold: number
  total_revenue: string
  total_profit: string
  avg_profit_margin: string
  last_sale_date: string | null
}

export interface BatchProfitSummary {
  batch_id: string
  batch_number: string
  product_name: string
  created_at: string
  boxes_purchased: number
  boxes_remaining: number
  total_investment: string
  status: string
  boxes_sold: number
  total_revenue: string
  roi_percentage: string
}

export interface DailyRevenueSummary {
  sale_date: string
  products_sold: number
  total_boxes_sold: number
  daily_revenue: string
  daily_profit: string
}

export interface MonthlyRevenueSummary {
  month: string
  products_sold: number
  total_boxes_sold: number
  monthly_revenue: string
  monthly_profit: string
}

export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product
        Insert: ProductInsert
        Update: Partial<ProductInsert>
      }
      stock_batches: {
        Row: StockBatch
        Insert: StockBatchInsert
        Update: Partial<StockBatchInsert>
      }
      daily_sales: {
        Row: DailySale
        Insert: DailySaleInsert
        Update: Partial<DailySaleInsert>
      }
      csv_imports: {
        Row: CSVImport
        Insert: Partial<CSVImport>
        Update: Partial<CSVImport>
      }
      ai_insights: {
        Row: AIInsight
        Insert: Partial<AIInsight>
        Update: Partial<AIInsight>
      }
    }
    Views: {
      product_inventory_summary: {
        Row: ProductInventorySummary
      }
      product_sales_summary: {
        Row: ProductSalesSummary
      }
      batch_profit_summary: {
        Row: BatchProfitSummary
      }
      daily_revenue_summary: {
        Row: DailyRevenueSummary
      }
      monthly_revenue_summary: {
        Row: MonthlyRevenueSummary
      }
    }
    Functions: {
      get_fifo_batch: {
        Args: {
          p_product_id: string
        }
        Returns: {
          batch_id: string
          batch_number: string
          packets_remaining: number
          cost_per_packet: string
        }[]
      }
      update_batch_stock: {
        Args: {
          p_batch_id: string
          p_packets_sold: number
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

/**
 * Extended types with relationships (optional properties for UI enrichment)
 */
export interface ProductWithStats extends Product {
  totalBoxes?: number
  inventoryValue?: string
  totalSales?: number
}

export interface StockBatchWithProduct extends StockBatch {
  product?: Product
  totalValue?: string
}

export interface DailySaleWithDetails extends DailySale {
  product?: Product
  costOfGoods?: string
  profit?: string
  profitMargin?: string
}

export interface CSVImportRow extends CSVImport {}

/**
 * User types
 */
export interface AuthUser {
  id: string
  email: string
  user_metadata?: Record<string, any>
  aud?: string
  created_at?: string
  updated_at?: string
}

/**
 * Dashboard metrics
 */
export interface DashboardMetrics {
  totalProducts: number
  totalBoxes: number
  totalInventoryValue: string
  totalRevenueToday: string
  totalProfitToday: string
  lowStockBatches: StockBatch[]
}

/**
 * Analytics data
 */
export interface SalesAnalytics {
  date: string
  revenue: string
  profit: string
  boxesSold: number
}

export interface InventoryAnalytics {
  productId: string
  productName: string
  totalBoxes: number
  totalValue: string
  boxesSold: number
  averagePrice: string
}

/**
 * Form types
 */
export interface ProductFormData {
  sku: string
  name: string
  category?: string
  description?: string
  unitType: 'weight' | 'count'
  baseUnit: string
  defaultSupplier?: string
}

export interface StockBatchFormData {
  productId: string
  boxesPurchased: number
  quantityPerBox: string | number
  unitPerBox: string
  costPerBox: string | number
  supplierName?: string
}

export interface DailySaleFormData {
  productId: string
  batchId: string
  boxesSold: number
  sellingPricePerBox: string | number
  customerName?: string
  notes?: string
}

/**
 * API Response types
 */
export interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}

export interface ApiListResponse<T> {
  data: T[]
  count: number
  error?: string
}

/**
 * Notification types
 */
export interface Toast {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

/**
 * Gemini AI Schema for bulk product processing
 */
export interface GeminiCallOptions {
  prompt: string
  responseSchema?: Record<string, any>
  model?: string
  temperature?: number
  maxOutputTokens?: number
}

/**
 * Bulk Stock Batch Upload
 * Schema for CSV import and RPC function
 */
export interface BulkStockBatchRow {
  sku: string
  boxes_purchased: number
  quantity_per_box: number
  unit_per_box: string
  cost_per_box: number
  supplier_name?: string
}

export interface ParsedStockBatchRow {
  sku: string
  batch_number?: string | null
  boxes_purchased: number
  boxes_remaining?: number // Optional - defaults to boxes_purchased if not provided
  quantity_per_box: number
  unit_per_box: string
  cost_per_box: number
  supplier_name?: string | null
  reorder_level?: number
  critical_level?: number
}

export interface BulkUploadResult {
  success: boolean
  inserted_count: number
  message: string
}

export interface StockBatchUploadError {
  error: string
  code?: string
  details?: string
}
