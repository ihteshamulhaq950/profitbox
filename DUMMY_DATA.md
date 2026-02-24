# Dummy CSV Data for ProfitBox

This document contains complete dummy CSV data for testing all bulk upload features.

## 1. PRODUCT BULK UPLOAD CSV

**File:** `products_bulk_upload.csv`

Use this to bulk upload products with SKUs, pricing, and alert thresholds.

```csv
sku,name,description,unit_price,reorder_level,critical_level,category
SKU001,Premium Coffee Beans,High-quality arabica blend,450.00,50,20,Beverages
SKU002,Organic Tea Assortment,Mixed herbal tea selection,280.00,40,15,Beverages
SKU003,Artisan Chocolate Bar,Dark chocolate with nuts,320.00,60,25,Confectionery
SKU004,Olive Oil Extra Virgin,Cold-pressed extra virgin,550.00,30,10,Oils
SKU005,Pasta Selection Box,Assorted Italian pasta shapes,180.00,75,30,Pantry
SKU006,Honey Raw Natural,Unfiltered raw honey,420.00,25,10,Condiments
SKU007,Almond Butter Smooth,Organic almond butter,380.00,35,15,Spreads
SKU008,Coconut Milk Organic,Canned coconut milk,220.00,100,40,Beverages
SKU009,Quinoa Premium Grade,White quinoa grains,490.00,20,8,Grains
SKU010,Sea Salt Himalayan,Pink sea salt crystals,150.00,45,20,Seasonings
```

---

## 2. STOCK BATCH BULK UPLOAD CSV

**File:** `stock_batches_bulk_upload.csv`

Use this to bulk upload stock batches. Match SKUs with products created above.

```csv
sku,batch_number,boxes_purchased,cost_per_box,supplier_name,purchase_date
SKU001,BATCH-2026-001,500,350.00,Global Coffee Co.,2026-02-01
SKU001,BATCH-2026-002,300,360.00,Global Coffee Co.,2026-02-10
SKU002,BATCH-2026-003,400,200.00,Tea Masters Ltd.,2026-02-02
SKU002,BATCH-2026-004,250,210.00,Tea Masters Ltd.,2026-02-12
SKU003,BATCH-2026-005,600,250.00,Artisan Chocolatiers,2026-01-25
SKU003,BATCH-2026-006,400,260.00,Artisan Chocolatiers,2026-02-08
SKU004,BATCH-2026-007,200,450.00,Mediterranean Imports,2026-02-03
SKU004,BATCH-2026-008,150,460.00,Mediterranean Imports,2026-02-14
SKU005,BATCH-2026-009,800,140.00,Italian Pasta House,2026-02-04
SKU005,BATCH-2026-010,500,145.00,Italian Pasta House,2026-02-11
SKU006,BATCH-2026-011,300,350.00,Organic Honey Farms,2026-02-05
SKU007,BATCH-2026-012,250,300.00,Nut Butter Makers,2026-02-06
SKU008,BATCH-2026-013,1000,180.00,Coconut Direct,2026-02-07
SKU009,BATCH-2026-014,180,400.00,Quinoa Growers,2026-02-09
SKU010,BATCH-2026-015,500,120.00,Salt Distributors,2026-02-13
```

---

## 3. SALES BULK UPLOAD CSV

**File:** `sales_bulk_upload.csv`

Use this to bulk upload sales. Use product UUIDs and batch IDs from your database.

**Important:** Before uploading sales, you need the actual UUIDs from your database:
1. Get product_id UUIDs by viewing products table in Supabase
2. Get batch_id UUIDs by viewing stock_batches table in Supabase

Example format (replace UUIDs with real ones from your database):

```csv
product_id,batch_id,boxes_sold,selling_price_per_box,customer_name,notes,created_at
550e8400-e29b-41d4-a716-446655440001,550e8400-e29b-41d4-a716-446655440011,50,500.00,ABC Retail Store,Regular order,2026-02-15
550e8400-e29b-41d4-a716-446655440001,550e8400-e29b-41d4-a716-446655440012,30,500.00,XYZ Boutique,Wholesale discount,2026-02-15
550e8400-e29b-41d4-a716-446655440002,550e8400-e29b-41d4-a716-446655440003,40,310.00,Coffee Shop Pro,Bulk order,2026-02-15
550e8400-e29b-41d4-a716-446655440002,550e8400-e29b-41d4-a716-446655440004,25,310.00,Tea House,Regular restock,2026-02-15
550e8400-e29b-41d4-a716-446655440003,550e8400-e29b-41d4-a716-446655440005,75,350.00,Sweet Treats Ltd,Festival orders,2026-02-16
550e8400-e29b-41d4-a716-446655440003,550e8400-e29b-41d4-a716-446655440006,40,350.00,Candy Corner,Restocking,2026-02-16
550e8400-e29b-41d4-a716-446655440004,550e8400-e29b-41d4-a716-446655440007,20,600.00,Gourmet Kitchen,Premium order,2026-02-16
550e8400-e29b-41d4-a716-446655440005,550e8400-e29b-41d4-a716-446655440009,100,200.00,Restaurant Supply Co,Bulk purchase,2026-02-16
550e8400-e29b-41d4-a716-446655440005,550e8400-e29b-41d4-a716-446655440010,60,200.00,Pasta Palace,Renovation sale,2026-02-17
550e8400-e29b-41d4-a716-446655440006,550e8400-e29b-41d4-a716-446655440011,35,480.00,Health Store,Organic section,2026-02-17
```

---

## Step-by-Step Testing Guide

### Phase 1: Upload Products
1. Go to **Dashboard > Inventory > Bulk Upload**
2. Download the product CSV template
3. Use the data from **PRODUCT BULK UPLOAD CSV** section above
4. Upload the file
5. Verify 10 products created in database

### Phase 2: Upload Stock Batches
1. Go to **Dashboard > Inventory > Bulk Upload (Stock Batches)**
2. Download the stock batch CSV template
3. Use the data from **STOCK BATCH BULK UPLOAD CSV** section above
4. Upload the file
5. Verify batches created and linked to products
6. Copy the product_id and batch_id UUIDs for next phase

### Phase 3: Record Sales
1. Copy product_id and batch_id UUIDs from Supabase
2. Replace UUIDs in **SALES BULK UPLOAD CSV** with real ones
3. Go to **Dashboard > Sales > Bulk Upload**
4. Download the sales CSV template
5. Upload the file with real UUIDs
6. Verify:
   - Sales recorded in daily_sales table
   - Stock batches.boxes_remaining decremented
   - Alert status calculated (healthy/warning/critical)

---

## Field Requirements Summary

### Products
- **sku**: Unique identifier (required)
- **name**: Product name (required)
- **description**: Product details (required)
- **unit_price**: Base price (required, numeric)
- **reorder_level**: When to reorder (required, numeric)
- **critical_level**: Critical stock level (required, numeric)
- **category**: Product category (optional)

### Stock Batches
- **sku**: Match with product SKU (required)
- **batch_number**: Unique batch identifier (required)
- **boxes_purchased**: Initial quantity (required, > 0)
- **cost_per_box**: Purchase cost (required, numeric)
- **supplier_name**: Supplier details (optional)
- **purchase_date**: When purchased (optional, YYYY-MM-DD)

### Sales
- **product_id**: Product UUID (required, must be valid UUID from database)
- **batch_id**: Stock batch UUID (required, must be valid UUID from database)
- **boxes_sold**: Quantity sold (required, > 0, <= boxes_remaining)
- **selling_price_per_box**: Sale price (required, numeric >= 0)
- **customer_name**: Customer name (optional)
- **notes**: Sale notes (optional)
- **created_at**: Sale date (optional, YYYY-MM-DD)

---

## Sample Data Statistics

### Products
- 10 products created
- Price range: 150 - 550 per unit
- Reorder levels: 20-100 boxes
- Critical levels: 8-40 boxes
- Categories: Beverages, Confectionery, Oils, Pantry, Condiments, Spreads, Grains, Seasonings

### Stock Batches
- 15 batches across 10 products
- Boxes per batch: 150-1000
- Cost range: 120-460 per box
- Suppliers: Global Coffee Co, Tea Masters Ltd, Artisan Chocolatiers, etc.

### Sales (Example)
- 10 sample sales transactions
- Boxes sold per transaction: 20-100
- Selling prices: 200-600 per box
- Dates: February 15-17, 2026

---

## Notes for Testing

1. **Product SKUs**: These are human-readable identifiers (SKU001, SKU002, etc.)
2. **Batch Numbers**: Format like BATCH-2026-001 for easy reference
3. **UUIDs**: Product and batch IDs are PostgreSQL UUIDs assigned by database
4. **Alert Calculation**: 
   - Stock falls below critical_level → **Alert Status: Critical** 🔴
   - Stock falls below reorder_level → **Alert Status: Warning** 🟡
   - Stock above reorder_level → **Alert Status: Healthy** 🟢
5. **Max Upload**: Each CSV can have 100 rows max
6. **Validation**: All numeric fields validated, UUIDs must be valid format

