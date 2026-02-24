-- =====================================================
-- BULK INSERT SALES RPC FUNCTION
-- =====================================================
-- This function atomically inserts multiple sales records
-- and updates stock batch quantities and alert status

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

  -- Validate all products belong to user
  FOR v_row IN SELECT jsonb_array_elements(data)
  LOOP
    -- Check product exists
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

    -- Check batch has enough stock
    SELECT boxes_remaining INTO v_remaining
    FROM stock_batches
    WHERE id = (v_row->>'batch_id')::uuid;

    v_sold := (v_row->>'boxes_sold')::int;

    IF v_remaining < v_sold THEN
      RAISE EXCEPTION 'Insufficient stock in batch %. Available: %, Requested: %',
        v_row->>'batch_id', v_remaining, v_sold;
    END IF;
  END LOOP;

  -- Insert all sales records
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

  -- Update stock batches: decrement boxes_remaining and update alert status
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
      WHEN (boxes_remaining - sg.total_sold) <= critical_level THEN 'critical'::text
      WHEN (boxes_remaining - sg.total_sold) <= reorder_level THEN 'warning'::text
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.bulk_insert_sales(jsonb) TO authenticated;
