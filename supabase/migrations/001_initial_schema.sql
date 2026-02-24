-- =====================================================
-- PROFITBOX - INITIAL SCHEMA SETUP
-- Migration: 001_initial_schema.sql
-- Purpose: Create all tables with RLS and indexes
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CLEANUP (for re-runs)
-- =====================================================

DROP TABLE IF EXISTS public.daily_sales CASCADE;
DROP TABLE IF EXISTS public.stock_batches CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;

-- =====================================================
-- TABLE 1: PRODUCTS (Master Catalog)
-- =====================================================
-- Stores all products with flexible unit configuration
-- Supports both weight-based (sugar, flour) and count-based (boxes, packets)

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Product identification
  sku TEXT NOT NULL,                    -- Example: 'SUGAR-50KG', 'GHEE-5KG'
  name TEXT NOT NULL,                   -- Example: 'White Sugar', 'Desi Ghee'
  category TEXT,                        -- Example: 'Groceries', 'Dairy', 'Snacks'
  description TEXT,                     -- Optional product details
  image_url TEXT,                       -- Product image from storage
  
  -- Unit configuration
  unit_type TEXT NOT NULL CHECK (unit_type IN ('weight', 'count')),
  -- 'weight' = Products sold by weight (sugar bags, flour, oil)
  -- 'count' = Products sold by count (ghee boxes, chip packets)
  
  base_unit TEXT NOT NULL,
  -- For weight: 'kg', 'g', 'lb', 'oz', 'liter'
  -- For count: 'box', 'packet', 'piece', 'bottle', 'can'
  
  -- Optional
  default_supplier TEXT,                -- Example: 'ABC Wholesale'
  is_active BOOLEAN DEFAULT TRUE,       -- False = discontinued
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, sku)                  -- Each user has unique SKUs
);

-- Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products" ON public.products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON public.products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON public.products
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_user_active ON public.products(user_id, is_active);
CREATE INDEX idx_products_sku ON public.products(sku);

-- =====================================================
-- TABLE 2: STOCK_BATCHES (Inventory Purchases)
-- =====================================================
-- Each batch represents a purchase from supplier
-- BOX-level tracking (not item-level)

CREATE TABLE public.stock_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Batch identification
  batch_number TEXT,                    -- Example: 'BATCH-2026-001'
  
  -- Quantity tracking (BOX level)
  boxes_purchased INT NOT NULL,         -- Total boxes bought
  boxes_remaining INT NOT NULL,         -- Boxes still in stock
  
  -- What's inside each box
  quantity_per_box NUMERIC(14,4) NOT NULL,
  -- For weight: 50.0000 (50 kg per bag)
  -- For count: 5.0000 (5 packets per box)
  
  unit_per_box TEXT NOT NULL,
  -- For weight: 'kg', 'g', 'liter'
  -- For count: 'packet', 'piece', 'bottle'
  
  -- Costing
  cost_per_box NUMERIC(14,2) NOT NULL, -- Per box cost
  
  -- Optional supplier
  supplier_name TEXT,                   -- Example: 'ABC Wholesale'
  
  -- Stock Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'depleted')),
  
  -- Alert Thresholds & Status
  reorder_level INT DEFAULT 0,          -- Reorder when below this
  critical_level INT DEFAULT 0,         -- Critical when below this
  alert_status TEXT 
    DEFAULT 'healthy'
    CHECK (alert_status IN ('healthy', 'warning', 'critical')),
  -- healthy = above reorder_level
  -- warning = below reorder_level but above critical_level
  -- critical = below critical_level
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (boxes_purchased > 0),
  CHECK (boxes_remaining >= 0),
  CHECK (boxes_remaining <= boxes_purchased),
  CHECK (quantity_per_box > 0),
  CHECK (cost_per_box > 0),
  CHECK (reorder_level >= 0),
  CHECK (critical_level >= 0),
  CHECK (critical_level <= reorder_level)
);

-- Row Level Security
ALTER TABLE public.stock_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own batches" ON public.stock_batches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create batches" ON public.stock_batches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batches" ON public.stock_batches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own batches" ON public.stock_batches
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_stock_batches_user_product ON public.stock_batches(user_id, product_id);
CREATE INDEX idx_stock_batches_status ON public.stock_batches(status);
CREATE INDEX idx_stock_batches_alert ON public.stock_batches(alert_status);
CREATE INDEX idx_stock_batches_created_at ON public.stock_batches(created_at);

-- =====================================================
-- TABLE 3: DAILY_SALES (Sales Transactions)
-- =====================================================
-- Each record = boxes sold from specific batch on specific day

CREATE TABLE public.daily_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.stock_batches(id) ON DELETE CASCADE,
  
  -- Sale quantity (BOX level)
  boxes_sold INT NOT NULL,              -- Boxes sold in this transaction
  
  -- Pricing
  selling_price_per_box NUMERIC(14,2) NOT NULL,
  
  -- Optional info
  customer_name TEXT,                   -- Who bought it
  notes TEXT,                           -- Additional notes
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (boxes_sold > 0),
  CHECK (selling_price_per_box > 0)
);

-- Row Level Security
ALTER TABLE public.daily_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sales" ON public.daily_sales
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create sales" ON public.daily_sales
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales" ON public.daily_sales
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales" ON public.daily_sales
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_daily_sales_user_id ON public.daily_sales(user_id);
CREATE INDEX idx_daily_sales_created_at ON public.daily_sales(created_at);
CREATE INDEX idx_daily_sales_batch_id ON public.daily_sales(batch_id);
CREATE INDEX idx_daily_sales_product_id ON public.daily_sales(product_id);

-- =====================================================
-- INITIAL SCHEMA COMPLETE ✅
-- =====================================================
-- Tables created:
-- ✅ products (with RLS & indexes)
-- ✅ stock_batches (with RLS & indexes)
-- ✅ daily_sales (with RLS & indexes)
-- =====================================================
