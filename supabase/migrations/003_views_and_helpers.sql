-- =====================================================
-- PROFITBOX - VIEWS AND HELPERS
-- Migration: 003_views_and_helpers.sql
-- Purpose: Create helpful views for analytics and reporting
-- =====================================================

-- =====================================================
-- VIEW 1: PRODUCT INVENTORY SUMMARY
-- =====================================================
-- Shows total stock quantity, units, and values by product
-- Useful for inventory dashboard and reporting

CREATE OR REPLACE VIEW public.product_inventory_view AS
SELECT 
  p.id,
  p.sku,
  p.name,
  p.unit_type,
  p.base_unit,
  COUNT(sb.id) as batch_count,
  COALESCE(SUM(sb.boxes_remaining), 0) as total_boxes_remaining,
  COALESCE(SUM(sb.boxes_purchased), 0) as total_boxes_purchased,
  ROUND(
    COALESCE(SUM(sb.boxes_remaining * sb.quantity_per_box), 0)::numeric, 
    2
  ) as total_units_remaining,
  ROUND(
    COALESCE(SUM(sb.boxes_remaining * sb.cost_per_box), 0)::numeric, 
    2
  ) as inventory_value,
  MAX(sb.created_at) as last_purchase_date
FROM public.products p
LEFT JOIN public.stock_batches sb ON p.id = sb.product_id AND sb.user_id = p.user_id
WHERE p.is_active = true
GROUP BY p.id, p.sku, p.name, p.unit_type, p.base_unit;

-- =====================================================
-- VIEW 2: SALES SUMMARY BY PRODUCT
-- =====================================================
-- Shows revenue, costs, and profit analysis by product
-- Useful for profitability analysis and sales metrics

CREATE OR REPLACE VIEW public.sales_summary_view AS
SELECT 
  p.id,
  p.sku,
  p.name,
  COUNT(ds.id) as transaction_count,
  COALESCE(SUM(ds.boxes_sold), 0) as total_boxes_sold,
  ROUND(
    COALESCE(SUM(ds.boxes_sold * sb.quantity_per_box), 0)::numeric,
    2
  ) as total_units_sold,
  ROUND(
    COALESCE(SUM(ds.boxes_sold * ds.selling_price_per_box), 0)::numeric,
    2
  ) as total_revenue,
  ROUND(
    COALESCE(SUM(ds.boxes_sold * sb.cost_per_box), 0)::numeric,
    2
  ) as total_cost,
  ROUND(
    COALESCE(SUM(ds.boxes_sold * (ds.selling_price_per_box - sb.cost_per_box)), 0)::numeric,
    2
  ) as total_profit,
  ROUND(
    (COALESCE(SUM(ds.boxes_sold * (ds.selling_price_per_box - sb.cost_per_box)), 0) / 
     NULLIF(COALESCE(SUM(ds.boxes_sold * ds.selling_price_per_box), 0), 0) * 100)::numeric,
    2
  ) as profit_margin_percent
FROM public.products p
LEFT JOIN public.daily_sales ds ON p.id = ds.product_id
LEFT JOIN public.stock_batches sb ON ds.batch_id = sb.id
GROUP BY p.id, p.sku, p.name;

-- =====================================================
-- VIEW 3: ALERT STATUS
-- =====================================================
-- Shows all batches with low stock alerts
-- Useful for inventory management and ordering decisions

CREATE OR REPLACE VIEW public.alert_status_view AS
SELECT 
  p.sku,
  p.name,
  sb.id as batch_id,
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
WHERE p.user_id = auth.uid()
ORDER BY 
  CASE 
    WHEN sb.alert_status = 'critical' THEN 1
    WHEN sb.alert_status = 'warning' THEN 2
    ELSE 3
  END,
  sb.created_at DESC;

-- =====================================================
-- VIEW 4: BATCH PERFORMANCE
-- =====================================================
-- Shows sales and profitability per batch
-- Useful for understanding which batches are most profitable

CREATE OR REPLACE VIEW public.batch_performance_view AS
SELECT 
  p.sku,
  p.name,
  sb.batch_number,
  sb.boxes_purchased,
  sb.boxes_remaining,
  (sb.boxes_purchased - sb.boxes_remaining) as boxes_sold,
  ROUND(
    (sb.boxes_purchased - sb.boxes_remaining)::numeric / NULLIF(sb.boxes_purchased, 0) * 100,
    2
  ) as sell_through_percent,
  COUNT(ds.id) as sale_transactions,
  ROUND(
    (SUM(ds.boxes_sold * ds.selling_price_per_box) - 
     SUM(ds.boxes_sold * sb.cost_per_box))::numeric,
    2
  ) as total_profit,
  ROUND(
    COALESCE(SUM(ds.boxes_sold * ds.selling_price_per_box), 0)::numeric,
    2
  ) as total_revenue,
  sb.created_at as batch_date,
  sb.alert_status
FROM public.stock_batches sb
JOIN public.products p ON sb.product_id = p.id
LEFT JOIN public.daily_sales ds ON sb.id = ds.batch_id
WHERE p.user_id = auth.uid()
GROUP BY p.sku, p.name, sb.id, sb.batch_number, sb.boxes_purchased, 
         sb.boxes_remaining, sb.cost_per_box, sb.created_at, sb.alert_status
ORDER BY sb.created_at DESC;

-- =====================================================
-- VIEW 5: DAILY SALES REPORT
-- =====================================================
-- Shows daily sales with product and batch details
-- Useful for sales tracking and reconciliation

CREATE OR REPLACE VIEW public.daily_sales_report_view AS
SELECT 
  ds.id,
  ds.created_at::date as sale_date,
  ds.created_at::time as sale_time,
  p.sku,
  p.name,
  sb.batch_number,
  ds.boxes_sold,
  ROUND((sb.quantity_per_box)::numeric, 2) as units_per_box,
  ROUND((ds.boxes_sold * sb.quantity_per_box)::numeric, 2) as total_units_sold,
  ROUND((ds.selling_price_per_box)::numeric, 2) as selling_price_per_box,
  ROUND((ds.boxes_sold * ds.selling_price_per_box)::numeric, 2) as total_revenue,
  ROUND((sb.cost_per_box)::numeric, 2) as cost_per_box,
  ROUND((ds.boxes_sold * sb.cost_per_box)::numeric, 2) as total_cost,
  ROUND((ds.boxes_sold * (ds.selling_price_per_box - sb.cost_per_box))::numeric, 2) as profit,
  ROUND(
    ((ds.selling_price_per_box - sb.cost_per_box) / NULLIF(sb.cost_per_box, 0) * 100)::numeric,
    2
  ) as profit_margin_percent,
  ds.customer_name,
  ds.notes
FROM public.daily_sales ds
JOIN public.products p ON ds.product_id = p.id
JOIN public.stock_batches sb ON ds.batch_id = sb.id
WHERE p.user_id = auth.uid()
ORDER BY ds.created_at DESC;

-- =====================================================
-- VIEW 6: INVENTORY VALUATION
-- =====================================================
-- Shows complete inventory value analysis
-- Useful for financial reporting and balance sheet

CREATE OR REPLACE VIEW public.inventory_valuation_view AS
SELECT 
  p.sku,
  p.name,
  ROUND((SUM(sb.boxes_remaining * sb.cost_per_box))::numeric, 2) as current_value,
  ROUND((SUM(sb.boxes_purchased * sb.cost_per_box))::numeric, 2) as original_value,
  ROUND((SUM((sb.boxes_purchased - sb.boxes_remaining) * sb.cost_per_box))::numeric, 2) as cost_of_goods_sold,
  ROUND(
    (SUM(sb.boxes_remaining * sb.cost_per_box) / 
     NULLIF(SUM(sb.boxes_purchased * sb.cost_per_box), 0) * 100)::numeric,
    2
  ) as inventory_remaining_percent,
  COUNT(sb.id) as batch_count,
  SUM(sb.boxes_remaining) as total_boxes_remaining
FROM public.products p
LEFT JOIN public.stock_batches sb ON p.id = sb.product_id
GROUP BY p.id, p.sku, p.name
ORDER BY current_value DESC;

-- =====================================================
-- VIEW 7: SUPPLIER ANALYSIS
-- =====================================================
-- Shows purchases and performance by supplier
-- Useful for vendor management and evaluation

CREATE OR REPLACE VIEW public.supplier_analysis_view AS
SELECT 
  sb.supplier_name,
  COUNT(DISTINCT sb.id) as total_batches,
  COUNT(DISTINCT sb.product_id) as unique_products,
  SUM(sb.boxes_purchased) as total_boxes_purchased,
  ROUND((SUM(sb.boxes_purchased * sb.cost_per_box))::numeric, 2) as total_investment,
  ROUND((AVG(sb.cost_per_box))::numeric, 2) as avg_cost_per_box,
  MAX(sb.created_at) as last_purchase_date,
  MIN(sb.created_at) as first_purchase_date
FROM public.stock_batches sb
WHERE sb.user_id = auth.uid()
  AND sb.supplier_name IS NOT NULL
GROUP BY sb.supplier_name
ORDER BY total_investment DESC;

-- =====================================================
-- VIEWS COMPLETE ✅
-- =====================================================
-- Views created:
-- ✅ product_inventory_view
-- ✅ sales_summary_view
-- ✅ alert_status_view
-- ✅ batch_performance_view
-- ✅ daily_sales_report_view
-- ✅ inventory_valuation_view
-- ✅ supplier_analysis_view
-- =====================================================
