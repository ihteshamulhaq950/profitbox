-- =====================================================
-- PROFITBOX - COMPLETE SUPABASE SCHEMA REFERENCE
-- Combined Schema + RPC Functions + Dummy Data
-- =====================================================
-- Last Updated: February 18, 2026
-- Purpose: Complete database setup for ProfitBox
-- Usage: Run this file in Supabase SQL Editor to initialize entire system
-- =====================================================

-- =====================================================
-- PART 1: SETUP & EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PART 2: CLEANUP (for re-runs)
-- =====================================================

DROP TABLE IF EXISTS public.daily_sales CASCADE;
DROP TABLE IF EXISTS public.stock_batches CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP FUNCTION IF EXISTS public.bulk_insert_sales(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.bulk_insert_stock_batches(jsonb) CASCADE;

-- =====================================================
-- PART 3: TABLE DEFINITIONS
-- =====================================================

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
-- PART 4: RPC FUNCTIONS
-- =====================================================

-- =====================================================
-- FUNCTION 1: BULK INSERT STOCK BATCHES
-- =====================================================
-- Purpose: Atomically insert multiple stock batches
-- Validates all SKUs exist before inserting any
-- Input: jsonb array of batch objects

CREATE OR REPLACE FUNCTION public.bulk_insert_stock_batches(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_input_count int;
  v_matched_count int;
  v_result jsonb;
BEGIN
  -- Count input rows
  v_input_count := jsonb_array_length(data);
  
  -- Validate that we have data
  IF v_input_count = 0 THEN
    RAISE EXCEPTION 'No data provided';
  END IF;

  -- Check if all SKUs exist for current user
  SELECT COUNT(*) INTO v_matched_count
  FROM jsonb_to_recordset(data) AS t(
    sku text,
    batch_number text,
    boxes_purchased integer,
    quantity_per_box numeric,
    unit_per_box text,
    cost_per_box numeric,
    supplier_name text,
    reorder_level integer,
    critical_level integer
  )
  INNER JOIN products p ON p.sku = t.sku AND p.user_id = auth.uid();

  -- Abort if any SKU doesn't exist
  IF v_matched_count != v_input_count THEN
    RAISE EXCEPTION 'Not all SKUs exist for current user. Found % of % SKUs.', v_matched_count, v_input_count;
  END IF;

  -- Insert all stock batches in single operation
  INSERT INTO stock_batches (
    user_id,
    product_id,
    batch_number,
    boxes_purchased,
    boxes_remaining,
    quantity_per_box,
    unit_per_box,
    cost_per_box,
    supplier_name,
    reorder_level,
    critical_level,
    alert_status,
    status,
    created_at
  )
  SELECT
    auth.uid(),
    p.id,
    t.batch_number,
    t.boxes_purchased,
    t.boxes_purchased AS boxes_remaining,
    t.quantity_per_box,
    t.unit_per_box,
    t.cost_per_box,
    t.supplier_name,
    t.reorder_level,
    t.critical_level,
    CASE
      WHEN t.boxes_purchased <= t.critical_level THEN 'critical'::text
      WHEN t.boxes_purchased <= t.reorder_level THEN 'warning'::text
      ELSE 'healthy'::text
    END,
    'active'::text,
    NOW()
  FROM jsonb_to_recordset(data) AS t(
    sku text,
    batch_number text,
    boxes_purchased integer,
    quantity_per_box numeric,
    unit_per_box text,
    cost_per_box numeric,
    supplier_name text,
    reorder_level integer,
    critical_level integer
  )
  INNER JOIN products p ON p.sku = t.sku AND p.user_id = auth.uid();

  -- Return success response
  v_result := jsonb_build_object(
    'success', true,
    'inserted_count', v_input_count,
    'message', format('Successfully inserted %s stock batches', v_input_count)
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_insert_stock_batches(jsonb) TO authenticated;

-- =====================================================
-- FUNCTION 2: BULK INSERT SALES
-- =====================================================
-- Purpose: Atomically insert multiple sales records
-- Auto-decrements stock and updates alert status
-- Validates all products/batches exist and have sufficient stock

CREATE OR REPLACE FUNCTION public.bulk_insert_sales(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_input_count int;
  v_result jsonb;
  v_row jsonb;
  v_remaining int;
  v_sold int;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Count input rows
  SELECT jsonb_array_length(data) INTO v_input_count;

  IF v_input_count = 0 THEN
    RAISE EXCEPTION 'No data provided';
  END IF;

  -- Validate all products and batches
  FOR v_row IN SELECT jsonb_array_elements(data)
  LOOP
    -- Check product exists and belongs to user
    IF NOT EXISTS (
      SELECT 1 FROM products
      WHERE id = (v_row->>'product_id')::uuid
      AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'Product % does not exist or does not belong to you',
        v_row->>'product_id';
    END IF;

    -- Check batch exists and belongs to user
    IF NOT EXISTS (
      SELECT 1 FROM stock_batches
      WHERE id = (v_row->>'batch_id')::uuid
      AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'Batch % does not exist or does not belong to you',
        v_row->>'batch_id';
    END IF;

    -- Check batch has sufficient stock
    SELECT boxes_remaining INTO v_remaining
    FROM stock_batches
    WHERE id = (v_row->>'batch_id')::uuid;

    v_sold := (v_row->>'boxes_sold')::int;

    IF v_remaining < v_sold THEN
      RAISE EXCEPTION 'Insufficient stock in batch %. Available: %, Requested: %',
        v_row->>'batch_id', v_remaining, v_sold;
    END IF;
  END LOOP;

  -- Insert all sales records atomically
  INSERT INTO daily_sales (
    user_id,
    product_id,
    batch_id,
    boxes_sold,
    selling_price_per_box,
    customer_name,
    notes,
    created_at
  )
  SELECT
    v_user_id,
    (value->>'product_id')::uuid,
    (value->>'batch_id')::uuid,
    (value->>'boxes_sold')::int,
    (value->>'selling_price_per_box')::numeric,
    value->>'customer_name',
    value->>'notes',
    COALESCE((value->>'created_at')::timestamp, NOW())
  FROM jsonb_array_elements(data);

  -- Update stock batches and alert status (single atomic operation)
  WITH sales_grouped AS (
    SELECT
      (value->>'batch_id')::uuid as batch_id,
      SUM((value->>'boxes_sold')::int) as total_sold
    FROM jsonb_array_elements(data)
    GROUP BY (value->>'batch_id')::uuid
  )
  UPDATE stock_batches sb
  SET
    boxes_remaining = boxes_remaining - sg.total_sold,
    status = CASE
      WHEN (boxes_remaining - sg.total_sold) = 0 THEN 'depleted'::text
      ELSE 'active'::text
    END,
    alert_status = CASE
      WHEN (boxes_remaining - sg.total_sold) <= sb.critical_level THEN 'critical'::text
      WHEN (boxes_remaining - sg.total_sold) <= sb.reorder_level THEN 'warning'::text
      ELSE 'healthy'::text
    END
  FROM sales_grouped sg
  WHERE sb.id = sg.batch_id
  AND sb.user_id = v_user_id;

  -- Return success response
  v_result := jsonb_build_object(
    'success', true,
    'inserted_count', v_input_count,
    'message', format('Successfully inserted %s sales records', v_input_count)
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_insert_sales(jsonb) TO authenticated;

-- =====================================================
-- PART 5: STORAGE BUCKET FOR PRODUCT IMAGES
-- =====================================================

-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies (allowing uploads)
-- Note: RLS policies omitted as per requirements

-- =====================================================
-- PART 6: HELPFUL VIEWS & QUERIES
-- =====================================================

-- View: Product Inventory Summary
-- Shows total stock value and quantities

CREATE OR REPLACE VIEW public.product_inventory_view AS
SELECT 
  p.id,
  p.sku,
  p.name,
  p.unit_type,
  p.base_unit,
  COUNT(sb.id) as batch_count,
  SUM(sb.boxes_remaining) as total_boxes_remaining,
  SUM(sb.boxes_purchased) as total_boxes_purchased,
  ROUND(
    SUM(sb.boxes_remaining * sb.quantity_per_box)::numeric, 
    2
  ) as total_units_remaining,
  ROUND(
    SUM(sb.boxes_remaining * sb.cost_per_box)::numeric, 
    2
  ) as inventory_value,
  MAX(sb.created_at) as last_purchase_date
FROM public.products p
LEFT JOIN public.stock_batches sb ON p.id = sb.product_id AND sb.user_id = p.user_id
WHERE p.is_active = true
GROUP BY p.id, p.sku, p.name, p.unit_type, p.base_unit;

-- View: Sales Summary by Product
-- Shows revenue, costs, and profit

CREATE OR REPLACE VIEW public.sales_summary_view AS
SELECT 
  p.id,
  p.sku,
  p.name,
  COUNT(ds.id) as transaction_count,
  SUM(ds.boxes_sold) as total_boxes_sold,
  ROUND(
    SUM(ds.boxes_sold * sb.quantity_per_box)::numeric,
    2
  ) as total_units_sold,
  ROUND(
    SUM(ds.boxes_sold * ds.selling_price_per_box)::numeric,
    2
  ) as total_revenue,
  ROUND(
    SUM(ds.boxes_sold * sb.cost_per_box)::numeric,
    2
  ) as total_cost,
  ROUND(
    SUM(ds.boxes_sold * (ds.selling_price_per_box - sb.cost_per_box))::numeric,
    2
  ) as total_profit,
  ROUND(
    (SUM(ds.boxes_sold * (ds.selling_price_per_box - sb.cost_per_box)) / 
     NULLIF(SUM(ds.boxes_sold * ds.selling_price_per_box), 0) * 100)::numeric,
    2
  ) as profit_margin_percent
FROM public.products p
LEFT JOIN public.daily_sales ds ON p.id = ds.product_id
LEFT JOIN public.stock_batches sb ON ds.batch_id = sb.id
GROUP BY p.id, p.sku, p.name;

-- View: Alert Status
-- Shows products with low stock

CREATE OR REPLACE VIEW public.alert_status_view AS
SELECT 
  p.sku,
  p.name,
  sb.batch_number,
  sb.boxes_remaining,
  sb.boxes_purchased,
  sb.reorder_level,
  sb.critical_level,
  sb.alert_status,
  CASE 
    WHEN sb.alert_status = 'critical' THEN 'URGENT: Stock critically low - Place order immediately'
    WHEN sb.alert_status = 'warning' THEN 'CAUTION: Stock below reorder level'
    ELSE 'OK: Stock level is healthy'
  END as action_required,
  sb.created_at as batch_date,
  sb.supplier_name
FROM public.stock_batches sb
JOIN public.products p ON sb.product_id = p.id
ORDER BY 
  CASE 
    WHEN sb.alert_status = 'critical' THEN 1
    WHEN sb.alert_status = 'warning' THEN 2
    ELSE 3
  END,
  sb.created_at DESC;

-- =====================================================
-- VERIFICATION QUERIES (Run these to check setup)
-- =====================================================

-- Query 1: Check all tables exist
-- Result: Should show 3 tables (products, stock_batches, daily_sales)
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('products', 'stock_batches', 'daily_sales');

-- Query 2: Check all functions exist
-- Result: Should show 2 functions
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('bulk_insert_stock_batches', 'bulk_insert_sales');

-- Query 3: Check indexes
-- Result: Should show 12+ indexes
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public';

-- Query 4: Check RLS is enabled
-- Result: Should show 'true' for all 3 tables
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('products', 'stock_batches', 'daily_sales');

-- =====================================================
-- SCHEMA COMPLETE ✅
-- =====================================================
-- You now have:
-- ✅ 3 production tables (products, stock_batches, daily_sales)
-- ✅ 2 atomic RPC functions (bulk insert batches, bulk insert sales)
-- ✅ Row Level Security enabled on all tables
-- ✅ Performance indexes on all key columns
-- ✅ 3 helpful views (inventory, sales, alerts)
-- ✅ Proper constraints and validations
-- =====================================================
