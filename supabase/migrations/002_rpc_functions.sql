-- =====================================================
-- PROFITBOX - RPC FUNCTIONS
-- Migration: 002_rpc_functions.sql
-- Purpose: Create all RPC functions for bulk operations
-- =====================================================

-- =====================================================
-- FUNCTION 1: BULK INSERT STOCK BATCHES
-- =====================================================
-- Purpose: Atomically insert multiple stock batches
-- Validates all SKUs exist before inserting any
-- Calculates initial alert_status based on purchase quantity
-- Input: jsonb array of batch objects
-- Returns: jsonb with success status and count

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

  -- Insert all stock batches in single atomic operation
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
    -- Calculate alert status based on initial purchase quantity
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
-- RPC FUNCTIONS COMPLETE ✅
-- =====================================================
-- Functions created:
-- ✅ bulk_insert_stock_batches(jsonb)
-- =====================================================
