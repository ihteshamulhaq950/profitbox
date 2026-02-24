# QUICK START - Bulk Upload Testing

## 3 CSV Files Ready to Use:

1. **`sample-data/products_bulk_upload.csv`** ✅ Ready now
2. **`sample-data/stock_batches_bulk_upload.csv`** ✅ Ready now  
3. **`sample-data/sales_bulk_upload_example.csv`** ⚠️ Needs UUID replacement

---

## Phase 1: Upload Products (5 min)

1. Go to **Dashboard → Inventory**
2. Click **"Bulk Upload"** button
3. Select `products_bulk_upload.csv`
4. Click **Upload**
5. ✅ You should see: "10 products have been imported"

**What was added:**
- 10 unique products with SKUs
- Pricing from 150 to 550 per unit
- Reorder & critical alert levels
- Categories (Beverages, Oils, Pantry, etc.)

---

## Phase 2: Upload Stock Batches (5 min)

1. Go to **Dashboard → Inventory**
2. Click **"Bulk Upload (Stock Batches)"** button
3. Select `stock_batches_bulk_upload.csv`
4. Click **Upload**
5. ✅ You should see: "15 batches have been created"

**What was added:**
- 15 stock batches across 10 products
- Total 5,730 boxes in inventory
- Suppliers and purchase dates
- Cost per box from 120 to 460

**Next step:**
Open Supabase dashboard and copy these UUIDs:
- All `products.id` values (10 UUIDs)
- All `stock_batches.id` values (15 UUIDs)

---

## Phase 3: Prepare Sales for Upload (10 min)

The sales CSV template has dummy UUIDs. Follow these steps:

### Option A: Manual Edit (Simple)
1. Open `sample-data/sales_bulk_upload_example.csv` in any text editor
2. Replace all instances of `550e8400-*` UUIDs with your real UUIDs
3. Use the mapping in `UUID_REPLACEMENT_GUIDE.md`
4. Save as `sales_bulk_upload_real.csv`

### Option B: SQL Query (Faster)
Run this in Supabase SQL Editor:

```sql
SELECT 
  p.id as product_id,
  sb.id as batch_id,
  p.sku,
  sb.batch_number
FROM products p
LEFT JOIN stock_batches sb ON p.id = sb.product_id
WHERE p.user_id = auth.uid()
ORDER BY p.sku, sb.batch_number;
```

Copy the IDs and use find & replace in text editor.

---

## Phase 4: Upload Sales (5 min)

1. Go to **Dashboard → Sales**
2. Click **"Bulk Upload"** button
3. Select your UUID-replaced CSV file
4. Click **Upload**
5. ✅ You should see: "10 sales records have been inserted and stock levels updated"

**What happens:**
- 415 boxes sold across 10 transactions
- Stock levels automatically decremented
- Alert statuses calculated and updated
- Revenue tracked in daily_sales table

---

## Verify Everything Worked

Open Supabase **SQL Editor** and run quick checks:

```sql
-- Check products
SELECT COUNT(*) FROM products WHERE user_id = auth.uid();
-- Expected: 10

-- Check batches
SELECT COUNT(*) FROM stock_batches WHERE user_id = auth.uid();
-- Expected: 15

-- Check sales
SELECT COUNT(*) FROM daily_sales WHERE user_id = auth.uid();
-- Expected: 10

-- Check stock was decremented
SELECT batch_number, boxes_purchased, boxes_remaining 
FROM stock_batches WHERE user_id = auth.uid() LIMIT 5;
-- Expected: boxes_remaining < boxes_purchased

-- Check alert status
SELECT batch_number, alert_status 
FROM stock_batches WHERE user_id = auth.uid() LIMIT 5;
-- Expected: All should be "healthy" (none sold enough to trigger alerts)
```

---

## Detailed Documentation

Need more details? Check these files:

- **`DUMMY_DATA.md`** — Complete field requirements and format guide
- **`TESTING_GUIDE.md`** — Step-by-step workflow with SQL verification
- **`UUID_REPLACEMENT_GUIDE.md`** — UUID mapping tables and SQL queries
- **`DUMMY_DATA_SUMMARY.md`** — Visual tables and quick reference

---

## Data Summary

| | Count | Units |
|---|---|---|
| Products | 10 | SKU001-SKU010 |
| Stock Batches | 15 | BATCH-2026-001 to 015 |
| Total Stock | 5,730 | boxes |
| Sales Transactions | 10 | (example) |
| Total Sales | 415 | boxes |
| Total Revenue | 161,200 | (from samples) |

---

## Common Issues

| Issue | Solution |
|-------|----------|
| "CSV headers not found" | Make sure column names match exactly (lowercase, underscore format) |
| "Invalid UUID format" | Replace example UUIDs with real ones from your database |
| "Product not found" | Use products from your own account, check Supabase products table |
| "Insufficient stock" | Sample sales are designed to not exceed stock; verify boxes_remaining |
| "Upload failed - validation" | Check file size < 5MB and rows <= 100 |

---

## Next Steps

1. ✅ Upload products.csv
2. ✅ Upload stock_batches.csv  
3. ✅ Get UUIDs from Supabase
4. ✅ Replace UUIDs in sales CSV
5. ✅ Upload sales CSV
6. ✅ Verify in Supabase dashboard
7. 🚀 Start testing analytics and reports!

