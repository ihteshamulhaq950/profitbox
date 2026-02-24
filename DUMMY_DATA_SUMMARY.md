# DUMMY DATA SUMMARY - Visual Reference

## 📊 Quick Statistics

Total Products: 10
Total Stock Batches: 15
Total Stock Available: ~5,730 boxes
Sample Sales Transactions: 10

---

## 🛒 Product Inventory

| # | SKU | Product Name | Unit Price | Reorder Level | Critical Level | Category |
|---|-----|-------|-----------|---------|-----|------|
| 1 | SKU001 | Premium Coffee Beans | 450.00 | 50 | 20 | Beverages |
| 2 | SKU002 | Organic Tea Assortment | 280.00 | 40 | 15 | Beverages |
| 3 | SKU003 | Artisan Chocolate Bar | 320.00 | 60 | 25 | Confectionery |
| 4 | SKU004 | Olive Oil Extra Virgin | 550.00 | 30 | 10 | Oils |
| 5 | SKU005 | Pasta Selection Box | 180.00 | 75 | 30 | Pantry |
| 6 | SKU006 | Honey Raw Natural | 420.00 | 25 | 10 | Condiments |
| 7 | SKU007 | Almond Butter Smooth | 380.00 | 35 | 15 | Spreads |
| 8 | SKU008 | Coconut Milk Organic | 220.00 | 100 | 40 | Beverages |
| 9 | SKU009 | Quinoa Premium Grade | 490.00 | 20 | 8 | Grains |
| 10 | SKU010 | Sea Salt Himalayan | 150.00 | 45 | 20 | Seasonings |

---

## 📦 Stock Batches

| Batch Number | SKU | Supplier | Boxes | Cost/Box | Total Cost | Status |
|---|---|---|---|---|---|---|
| BATCH-2026-001 | SKU001 | Global Coffee Co. | 500 | 350.00 | 175,000 | Ready |
| BATCH-2026-002 | SKU001 | Global Coffee Co. | 300 | 360.00 | 108,000 | Ready |
| BATCH-2026-003 | SKU002 | Tea Masters Ltd. | 400 | 200.00 | 80,000 | Ready |
| BATCH-2026-004 | SKU002 | Tea Masters Ltd. | 250 | 210.00 | 52,500 | Ready |
| BATCH-2026-005 | SKU003 | Artisan Chocolatiers | 600 | 250.00 | 150,000 | Ready |
| BATCH-2026-006 | SKU003 | Artisan Chocolatiers | 400 | 260.00 | 104,000 | Ready |
| BATCH-2026-007 | SKU004 | Mediterranean Imports | 200 | 450.00 | 90,000 | Ready |
| BATCH-2026-008 | SKU004 | Mediterranean Imports | 150 | 460.00 | 69,000 | Ready |
| BATCH-2026-009 | SKU005 | Italian Pasta House | 800 | 140.00 | 112,000 | Ready |
| BATCH-2026-010 | SKU005 | Italian Pasta House | 500 | 145.00 | 72,500 | Ready |
| BATCH-2026-011 | SKU006 | Organic Honey Farms | 300 | 350.00 | 105,000 | Ready |
| BATCH-2026-012 | SKU007 | Nut Butter Makers | 250 | 300.00 | 75,000 | Ready |
| BATCH-2026-013 | SKU008 | Coconut Direct | 1000 | 180.00 | 180,000 | Ready |
| BATCH-2026-014 | SKU009 | Quinoa Growers | 180 | 400.00 | 72,000 | Ready |
| BATCH-2026-015 | SKU010 | Salt Distributors | 500 | 120.00 | 60,000 | Ready |

**Total Investment: 1,385,000**

---

## 💰 Sales Transactions (Sample)

| Trans # | Product | Batch | Boxes Sold | Price/Box | Total Revenue | Customer |
|---|---|---|---|---|---|---|
| 1 | Premium Coffee Beans | BATCH-2026-001 | 50 | 500.00 | 25,000 | ABC Retail Store |
| 2 | Premium Coffee Beans | BATCH-2026-002 | 30 | 500.00 | 15,000 | XYZ Boutique |
| 3 | Organic Tea | BATCH-2026-003 | 40 | 310.00 | 12,400 | Coffee Shop Pro |
| 4 | Organic Tea | BATCH-2026-004 | 25 | 310.00 | 7,750 | Tea House |
| 5 | Chocolate Bar | BATCH-2026-005 | 75 | 350.00 | 26,250 | Sweet Treats Ltd |
| 6 | Chocolate Bar | BATCH-2026-006 | 40 | 350.00 | 14,000 | Candy Corner |
| 7 | Olive Oil | BATCH-2026-007 | 20 | 600.00 | 12,000 | Gourmet Kitchen |
| 8 | Pasta Box | BATCH-2026-009 | 100 | 200.00 | 20,000 | Restaurant Supply Co |
| 9 | Pasta Box | BATCH-2026-010 | 60 | 200.00 | 12,000 | Pasta Palace |
| 10 | Honey | BATCH-2026-011 | 35 | 480.00 | 16,800 | Health Store |

**Total Sales: 415 boxes | Total Revenue: 161,200**

---

## 📈 Alert Thresholds

### SKU001 - Premium Coffee Beans
- Reorder Level: 50 boxes
- Critical Level: 20 boxes
- Starting Stock: 800 boxes (500+300)
- After Sales: 720 boxes (-80)
- Status: HEALTHY ✅

### SKU002 - Organic Tea Assortment
- Reorder Level: 40 boxes
- Critical Level: 15 boxes
- Starting Stock: 650 boxes
- After Sales: 585 boxes (-65)
- Status: HEALTHY ✅

### SKU003 - Artisan Chocolate Bar
- Reorder Level: 60 boxes
- Critical Level: 25 boxes
- Starting Stock: 1000 boxes
- After Sales: 885 boxes (-115)
- Status: HEALTHY ✅

### SKU004 - Olive Oil Extra Virgin
- Reorder Level: 30 boxes
- Critical Level: 10 boxes
- Starting Stock: 350 boxes
- After Sales: 330 boxes (-20)
- Status: HEALTHY ✅

### SKU005 - Pasta Selection Box
- Reorder Level: 75 boxes
- Critical Level: 30 boxes
- Starting Stock: 1300 boxes
- After Sales: 1140 boxes (-160)
- Status: HEALTHY ✅

### SKU006 - Honey Raw Natural
- Reorder Level: 25 boxes
- Critical Level: 10 boxes
- Starting Stock: 300 boxes
- After Sales: 265 boxes (-35)
- Status: HEALTHY ✅

---

## 🗂️ Files Created

```
sample-data/
├── products_bulk_upload.csv           (10 products, ready to upload)
├── stock_batches_bulk_upload.csv      (15 batches, ready to upload)
└── sales_bulk_upload_example.csv      (10 sales, needs UUID replacement)

Documentation/
├── DUMMY_DATA.md                      (Complete field guide)
├── TESTING_GUIDE.md                   (Step-by-step testing workflow)
├── UUID_REPLACEMENT_GUIDE.md          (UUID mapping & SQL queries)
└── SUMMARY.md                         (This file - quick reference)
```

---

## ✅ Testing Checklist

### After Product Upload
- [ ] Check Supabase: 10 products created
- [ ] Verify SKUs: SKU001 through SKU010
- [ ] Check prices: Range from 150 to 550

### After Stock Batch Upload
- [ ] Check Supabase: 15 batches created
- [ ] Verify relationships: All batches linked to products
- [ ] Copy product_id UUIDs for sales
- [ ] Copy batch_id UUIDs for sales

### After Sales Upload
- [ ] Check Supabase: 10 sales recorded
- [ ] Verify stock decremented: 415 total boxes sold
- [ ] Check alert statuses: Should all be "healthy" 
- [ ] Verify revenue: 161,200 total

---

## 🔍 Verification SQL Queries

```sql
-- 1. Count all records
SELECT 
  (SELECT COUNT(*) FROM products) as products,
  (SELECT COUNT(*) FROM stock_batches) as batches,
  (SELECT COUNT(*) FROM daily_sales) as sales;

-- 2. Stock summary
SELECT sku, name, 
  SUM(sb.boxes_purchased) as total_purchased,
  SUM(sb.boxes_remaining) as total_remaining,
  SUM(ds.boxes_sold) as total_sold
FROM products p
LEFT JOIN stock_batches sb ON p.id = sb.product_id
LEFT JOIN daily_sales ds ON sb.id = ds.batch_id
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.sku, p.name
ORDER BY p.sku;

-- 3. Revenue summary
SELECT p.sku, p.name, 
  SUM(ds.boxes_sold) as boxes_sold,
  SUM(ds.boxes_sold * ds.selling_price_per_box) as total_revenue,
  AVG(ds.selling_price_per_box) as avg_price
FROM products p
LEFT JOIN stock_batches sb ON p.id = sb.product_id
LEFT JOIN daily_sales ds ON sb.id = ds.batch_id
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.sku, p.name
ORDER BY p.sku;

-- 4. Alert status check
SELECT batch_number, boxes_remaining, reorder_level, critical_level, alert_status
FROM stock_batches
WHERE user_id = auth.uid()
ORDER BY alert_status DESC, batch_number;
```

---

## 🎯 Expected Results

| Metric | Expected | Actual |
|--------|----------|--------|
| Total Products | 10 | ? |
| Total Batches | 15 | ? |
| Total Stock | 5,730 boxes | ? |
| Total Sales | 415 boxes | ? |
| Total Revenue | 161,200 | ? |
| Product Cost | 1,385,000 | ? |
| Gross Profit | -1,223,800 | (Cost > Sales in sample) |

*Note: Sample sales are limited. In production, revenue would exceed costs.*

---

## 💡 Tips

1. **Backup UUIDs**: After step 2, save all UUID mappings in a text file
2. **Use Find & Replace**: Text editor's find/replace feature for UUID substitution
3. **Validate CSV**: Open in Excel to check formatting before upload
4. **Check Limits**: Max 100 rows per CSV, 5MB file size
5. **Monitor Alerts**: After sales upload, verify alert_status calculations
6. **Test Constraints**: Try uploading more boxes than available to test validation

