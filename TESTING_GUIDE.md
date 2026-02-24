SAMPLE DATA QUICK REFERENCE
===========================

Created Files:
1. sample-data/products_bulk_upload.csv - 10 products ready to upload
2. sample-data/stock_batches_bulk_upload.csv - 15 stock batches ready to upload
3. sample-data/sales_bulk_upload_example.csv - Example sales (UUIDs need replacement)
4. DUMMY_DATA.md - Complete guide with field requirements

TESTING WORKFLOW
================

STEP 1: Upload Products
-----------------------
File: products_bulk_upload.csv
Contains: 10 products with SKU, pricing, and alert thresholds
Action: Upload → Check Supabase products table for created records

Products included:
- SKU001: Premium Coffee Beans (450.00)
- SKU002: Organic Tea Assortment (280.00)
- SKU003: Artisan Chocolate Bar (320.00)
- SKU004: Olive Oil Extra Virgin (550.00)
- SKU005: Pasta Selection Box (180.00)
- SKU006: Honey Raw Natural (420.00)
- SKU007: Almond Butter Smooth (380.00)
- SKU008: Coconut Milk Organic (220.00)
- SKU009: Quinoa Premium Grade (490.00)
- SKU010: Sea Salt Himalayan (150.00)


STEP 2: Upload Stock Batches
-----------------------------
File: stock_batches_bulk_upload.csv
Contains: 15 batches across 10 products
Requires: SKUs must match uploaded products
Action: Upload → Check Supabase stock_batches table → COPY all product_id and batch_id UUIDs

Batch summary:
- SKU001: 2 batches (500 + 300 boxes)
- SKU002: 2 batches (400 + 250 boxes)
- SKU003: 2 batches (600 + 400 boxes)
- SKU004: 2 batches (200 + 150 boxes)
- SKU005: 2 batches (800 + 500 boxes)
- SKU006: 1 batch (300 boxes)
- SKU007: 1 batch (250 boxes)
- SKU008: 1 batch (1000 boxes)
- SKU009: 1 batch (180 boxes)
- SKU010: 1 batch (500 boxes)


STEP 3: Get UUIDs for Sales Upload
-----------------------------------
Go to Supabase Dashboard:
1. Open products table → Copy all product_id UUIDs
2. Open stock_batches table → Copy all batch_id UUIDs

Store these in a reference file like:
Product UUIDs:
SKU001: [your-uuid-here]
SKU002: [your-uuid-here]
...

Batch UUIDs:
BATCH-2026-001: [your-uuid-here]
BATCH-2026-002: [your-uuid-here]
...


STEP 4: Create Your Sales CSV
------------------------------
File: sales_bulk_upload_example.csv (TEMPLATE - Replace UUIDs)
Contains: 10 example sales transactions with dummy UUIDs

Required replacements:
- 550e8400-e29b-41d4-a716-446655440001 → Your SKU001 product_id
- 550e8400-e29b-41d4-a716-446655440002 → Your SKU002 product_id
- 550e8400-e29b-41d4-a716-446655440003 → Your SKU003 product_id
- 550e8400-e29b-41d4-a716-446655440004 → Your SKU004 product_id
- 550e8400-e29b-41d4-a716-446655440005 → Your SKU005 product_id
- 550e8400-e29b-41d4-a716-446655440006 → Your SKU006 product_id
- 550e8400-e29b-41d4-a716-446655440011 → Your BATCH-2026-001 batch_id
- 550e8400-e29b-41d4-a716-446655440012 → Your BATCH-2026-002 batch_id
- etc...

Sales included (after UUID replacement):
- 10 transactions
- Total boxes: 415
- Date range: 2026-02-15 to 2026-02-17
- Price range: 200-600 per box


STEP 5: Upload Sales
--------------------
File: Your UUID-replaced sales CSV
Contains: 10 sales transactions with actual UUIDs
Action: Upload → Verify in Supabase:
  - daily_sales table has 10 new records
  - stock_batches.boxes_remaining decremented
  - stock_batches.alert_status updated

Expected results:
- 415 boxes sold across 10 transactions
- Stock levels decreased accordingly
- Alert statuses calculated (healthy/warning/critical)


VERIFICATION QUERIES
====================

After each upload, verify in Supabase SQL Editor:

1. Count products:
   SELECT COUNT(*) as product_count FROM products WHERE user_id = auth.uid();
   Expected: 10

2. Count batches:
   SELECT COUNT(*) as batch_count FROM stock_batches WHERE user_id = auth.uid();
   Expected: 15

3. Count sales:
   SELECT COUNT(*) as sales_count FROM daily_sales WHERE user_id = auth.uid();
   Expected: 10

4. Check alert statuses:
   SELECT batch_number, boxes_remaining, alert_status FROM stock_batches 
   WHERE user_id = auth.uid() ORDER BY created_at;

5. Total boxes purchased:
   SELECT SUM(boxes_purchased) as total_purchased FROM stock_batches 
   WHERE user_id = auth.uid();
   Expected: ~5,730 boxes

6. Total boxes sold:
   SELECT SUM(boxes_sold) as total_sold FROM daily_sales 
   WHERE user_id = auth.uid();
   Expected: 415 boxes (after sales upload)


CSV FIELD REQUIREMENTS
======================

Products CSV:
- sku: Text, unique (SKU001, SKU002, etc.)
- name: Text, product name
- description: Text, product details
- unit_price: Number, decimal (150.00, 450.00, etc.)
- reorder_level: Number, integer (20, 50, etc.)
- critical_level: Number, integer (8, 25, etc.)
- category: Text, optional (Beverages, Condiments, etc.)

Stock Batches CSV:
- sku: Text, must match product SKU
- batch_number: Text, unique (BATCH-2026-001, etc.)
- boxes_purchased: Number, integer > 0
- cost_per_box: Number, decimal (140.00, 350.00, etc.)
- supplier_name: Text, optional (Global Coffee Co., etc.)
- purchase_date: Date, optional (YYYY-MM-DD format)

Sales CSV:
- product_id: UUID (36 chars, dashes included)
- batch_id: UUID (36 chars, dashes included)
- boxes_sold: Number, integer > 0
- selling_price_per_box: Number, decimal >= 0
- customer_name: Text, optional
- notes: Text, optional
- created_at: Date, optional (YYYY-MM-DD format)

Max rows per upload: 100
Max file size: 5MB
Allowed format: .csv only
