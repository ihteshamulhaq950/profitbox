# UUID Reference Guide for Sales Upload

## Products UUID Mapping

After uploading products.csv, map the UUIDs like this:

```
Product Name                           SKU     Example UUID to Replace
============================================================================
Premium Coffee Beans                   SKU001  550e8400-e29b-41d4-a716-446655440001
Organic Tea Assortment                 SKU002  550e8400-e29b-41d4-a716-446655440002
Artisan Chocolate Bar                  SKU003  550e8400-e29b-41d4-a716-446655440003
Olive Oil Extra Virgin                 SKU004  550e8400-e29b-41d4-a716-446655440004
Pasta Selection Box                    SKU005  550e8400-e29b-41d4-a716-446655440005
Honey Raw Natural                      SKU006  550e8400-e29b-41d4-a716-446655440006
Almond Butter Smooth                   SKU007  550e8400-e29b-41d4-a716-446655440007
Coconut Milk Organic                   SKU008  550e8400-e29b-41d4-a716-446655440008
Quinoa Premium Grade                   SKU009  550e8400-e29b-41d4-a716-446655440009
Sea Salt Himalayan                     SKU010  550e8400-e29b-41d4-a716-446655440010
```

## Stock Batches UUID Mapping

After uploading stock_batches.csv, map the UUIDs like this:

```
Batch Number        Product SKU    Boxes Purchased    Example UUID to Replace
===============================================================================
BATCH-2026-001      SKU001         500                550e8400-e29b-41d4-a716-446655440011
BATCH-2026-002      SKU001         300                550e8400-e29b-41d4-a716-446655440012
BATCH-2026-003      SKU002         400                550e8400-e29b-41d4-a716-446655440013
BATCH-2026-004      SKU002         250                550e8400-e29b-41d4-a716-446655440014
BATCH-2026-005      SKU003         600                550e8400-e29b-41d4-a716-446655440015
BATCH-2026-006      SKU003         400                550e8400-e29b-41d4-a716-446655440016
BATCH-2026-007      SKU004         200                550e8400-e29b-41d4-a716-446655440017
BATCH-2026-008      SKU004         150                550e8400-e29b-41d4-a716-446655440018
BATCH-2026-009      SKU005         800                550e8400-e29b-41d4-a716-446655440019
BATCH-2026-010      SKU005         500                550e8400-e29b-41d4-a716-446655440020
BATCH-2026-011      SKU006         300                550e8400-e29b-41d4-a716-446655440021
BATCH-2026-012      SKU007         250                550e8400-e29b-41d4-a716-446655440022
BATCH-2026-013      SKU008         1000               550e8400-e29b-41d4-a716-446655440023
BATCH-2026-014      SKU009         180                550e8400-e29b-41d4-a716-446655440024
BATCH-2026-015      SKU010         500                550e8400-e29b-41d4-a716-446655440025
```

## Sales CSV Replacements Required

The example sales CSV has 10 transactions that need UUID replacements:

### Transaction 1 & 2 (SKU001 - Premium Coffee Beans)
```
Replace: 550e8400-e29b-41d4-a716-446655440001 → Your SKU001 product_id
Replace: 550e8400-e29b-41d4-a716-446655440011 → Your BATCH-2026-001 batch_id
Replace: 550e8400-e29b-41d4-a716-446655440012 → Your BATCH-2026-002 batch_id

Row 1: 50 boxes sold @ 500.00 from BATCH-2026-001
Row 2: 30 boxes sold @ 500.00 from BATCH-2026-002
```

### Transaction 3 & 4 (SKU002 - Organic Tea Assortment)
```
Replace: 550e8400-e29b-41d4-a716-446655440002 → Your SKU002 product_id
Replace: 550e8400-e29b-41d4-a716-446655440013 → Your BATCH-2026-003 batch_id
Replace: 550e8400-e29b-41d4-a716-446655440014 → Your BATCH-2026-004 batch_id

Row 3: 40 boxes sold @ 310.00 from BATCH-2026-003
Row 4: 25 boxes sold @ 310.00 from BATCH-2026-004
```

### Transaction 5 & 6 (SKU003 - Artisan Chocolate Bar)
```
Replace: 550e8400-e29b-41d4-a716-446655440003 → Your SKU003 product_id
Replace: 550e8400-e29b-41d4-a716-446655440015 → Your BATCH-2026-005 batch_id
Replace: 550e8400-e29b-41d4-a716-446655440016 → Your BATCH-2026-006 batch_id

Row 5: 75 boxes sold @ 350.00 from BATCH-2026-005
Row 6: 40 boxes sold @ 350.00 from BATCH-2026-006
```

### Transaction 7 (SKU004 - Olive Oil Extra Virgin)
```
Replace: 550e8400-e29b-41d4-a716-446655440004 → Your SKU004 product_id
Replace: 550e8400-e29b-41d4-a716-446655440017 → Your BATCH-2026-007 batch_id

Row 7: 20 boxes sold @ 600.00 from BATCH-2026-007
```

### Transaction 8 & 9 (SKU005 - Pasta Selection Box)
```
Replace: 550e8400-e29b-41d4-a716-446655440005 → Your SKU005 product_id
Replace: 550e8400-e29b-41d4-a716-446655440019 → Your BATCH-2026-009 batch_id
Replace: 550e8400-e29b-41d4-a716-446655440020 → Your BATCH-2026-010 batch_id

Row 8: 100 boxes sold @ 200.00 from BATCH-2026-009
Row 9: 60 boxes sold @ 200.00 from BATCH-2026-010
```

### Transaction 10 (SKU006 - Honey Raw Natural)
```
Replace: 550e8400-e29b-41d4-a716-446655440006 → Your SKU006 product_id
Replace: 550e8400-e29b-41d4-a716-446655440021 → Your BATCH-2026-011 batch_id

Row 10: 35 boxes sold @ 480.00 from BATCH-2026-011
```

## How to Get Real UUIDs from Supabase

### Step 1: Get Product UUIDs
1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Run this query:
```sql
SELECT id, sku, name FROM products 
WHERE user_id = auth.uid()
ORDER BY created_at;
```
4. Copy the `id` values (these are product_id UUIDs)

### Step 2: Get Batch UUIDs
1. In SQL Editor, run:
```sql
SELECT id, batch_number, sku FROM stock_batches 
WHERE user_id = auth.uid()
ORDER BY created_at;
```
2. Copy the `id` values (these are batch_id UUIDs)

### Step 3: Create Mapping Table
Create a file with your actual UUIDs, like:

```
SKU001 product_id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
SKU002 product_id: b2c3d4e5-f6g7-8901-bcde-f12345678901

BATCH-2026-001 batch_id: c3d4e5f6-g7h8-9012-cdef-123456789012
BATCH-2026-002 batch_id: d4e5f6g7-h8i9-0123-defg-234567890123
```

### Step 4: Replace UUIDs in Sales CSV
Use find & replace in your text editor:
- Find: 550e8400-e29b-41d4-a716-446655440001
- Replace with: a1b2c3d4-e5f6-7890-abcd-ef1234567890

Repeat for all 10 product UUIDs and 10 batch UUIDs.

## Validation After Upload

Once you upload the sales CSV, check:

```sql
-- Check if sales were recorded
SELECT COUNT(*), SUM(boxes_sold), SUM(boxes_sold * selling_price_per_box) 
FROM daily_sales 
WHERE user_id = auth.uid();

-- Check if stock was updated
SELECT batch_number, boxes_purchased, boxes_remaining, alert_status 
FROM stock_batches 
WHERE user_id = auth.uid()
ORDER BY batch_number;

-- Check alert status calculation
SELECT batch_number, critical_level, reorder_level, boxes_remaining, alert_status,
  CASE 
    WHEN boxes_remaining <= critical_level THEN 'Expected: CRITICAL'
    WHEN boxes_remaining <= reorder_level THEN 'Expected: WARNING'
    ELSE 'Expected: HEALTHY'
  END as expected_status
FROM stock_batches 
WHERE user_id = auth.uid();
```

## Common Issues & Solutions

**Issue: "product_id is not a valid UUID"**
- Solution: Check that you replaced the example UUID with actual product_id from database

**Issue: "batch_id not found"**
- Solution: Ensure batch_id UUID matches a real batch in your database

**Issue: "Insufficient stock in batch"**
- Solution: Ensure boxes_sold <= boxes_remaining in batch

**Issue: "Product does not belong to current user"**
- Solution: Use products from your own account, not from other users

**Issue: "Upload failed - validation error"**
- Solution: Check CSV format - all required columns present, correct data types
