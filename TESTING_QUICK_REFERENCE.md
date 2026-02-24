-- =====================================================
-- QUICK TESTING & VERIFICATION GUIDE
-- Fast way to verify everything works
-- =====================================================

## 🧪 UNIT TESTS (Database Level)

### Test 1: Verify Schema Fields Exist

**In Supabase Dashboard → SQL Editor:**

```sql
-- Check stock_batches table has all required fields
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'stock_batches'
ORDER BY ordinal_position;

-- Expected columns (among others):
-- ✅ reorder_level (integer)
-- ✅ critical_level (integer)
-- ✅ alert_status (text)
-- ✅ batch_number (text)
-- ✅ boxes_purchased (integer)
-- ✅ cost_per_box (numeric)
```

### Test 2: Verify RPC Functions Exist

**In Supabase Dashboard → SQL Editor:**

```sql
-- List all RPC functions
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Expected functions:
-- ✅ bulk_insert_stock_batches()
-- ✅ bulk_insert_sales()
```

### Test 3: Manual Insert Test (Single Batch)

**In Supabase Dashboard or API Test:**

```sql
-- First, get a product_id (or use known one from products table)
SELECT id FROM products LIMIT 1;
-- Result: Copy the UUID

-- Then test direct insert (manual before using form)
INSERT INTO stock_batches (
  product_id,
  batch_number,
  boxes_purchased,
  boxes_remaining,
  quantity_per_box,
  unit_per_box,
  cost_per_box,
  supplier_name,
  purchase_date,
  reorder_level,
  critical_level,
  alert_status,
  status,
  user_id
) VALUES (
  '{product_id_here}',
  'TEST-2026-001',
  500,
  500,
  50,
  'kg',
  350.00,
  'Test Supplier',
  '2026-02-15',
  50,
  20,
  'healthy',
  'active',
  '{your_user_id}'
);

-- Verify insert
SELECT * FROM stock_batches WHERE batch_number = 'TEST-2026-001';
```

---

## 🌐 API TESTS (Using curl or Postman)

### Test 4: Test CSV Template Download

**Command:** Get template

```bash
curl -X GET "http://localhost:3000/api/inventory/bulk-upload" \
  -H "Authorization: Bearer {YOUR_SESSION_TOKEN}"

# Expected Response:
# CSV content with headers:
# sku,batch_number,boxes_purchased,cost_per_box,supplier_name,purchase_date,reorder_level,critical_level
# SKU001,SKU001-2026-001,500,350.00,...
```

### Test 5: Test Single Batch API

**Command:** Create one batch (raw API call)

```bash
curl -X POST "http://localhost:3000/api/inventory" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {YOUR_SESSION_TOKEN}" \
  -d '{
    "product_id": "{product_uuid}",
    "batch_number": "API-TEST-001",
    "boxes_purchased": 300,
    "quantity_per_box": 50,
    "unit_per_box": "kg",
    "cost_per_box": 350.00,
    "supplier_name": "API Test Supplier",
    "purchase_date": "2026-02-15",
    "reorder_level": 50,
    "critical_level": 20
  }'

# Expected Response:
# { "success": true, "batch_id": "uuid", ... }
```

### Test 6: Test Bulk Upload API - Valid CSV

**Command:** Upload valid CSV file

```bash
# Create a CSV file (test.csv)
# sku,batch_number,boxes_purchased,cost_per_box,supplier_name,purchase_date,reorder_level,critical_level
# SKU001,SKU001-BULK-001,500,350.00,Test Co.,2026-02-15,50,20
# SKU002,SKU002-BULK-001,400,200.00,Test Co.,2026-02-15,40,15

curl -X POST "http://localhost:3000/api/inventory/bulk-upload" \
  -H "Authorization: Bearer {YOUR_SESSION_TOKEN}" \
  -F "file=@test.csv"

# Expected Response:
# { "success": true, "inserted_count": 2, "message": "2 stock batches inserted" }
```

### Test 7: Test Bulk Upload API - Invalid SKU

**Command:** Upload CSV with non-existent SKU

```bash
# Create a CSV file (bad_sku.csv)
# sku,batch_number,boxes_purchased,cost_per_box,supplier_name,purchase_date,reorder_level,critical_level
# INVALID_SKU,TEST-001,500,350.00,Test Co.,2026-02-15,50,20

curl -X POST "http://localhost:3000/api/inventory/bulk-upload" \
  -H "Authorization: Bearer {YOUR_SESSION_TOKEN}" \
  -F "file=@bad_sku.csv"

# Expected Response (ERROR):
# { 
#   "success": false, 
#   "error": "The following SKUs do not exist: INVALID_SKU. Aborting entire operation.",
#   "missing_skus": ["INVALID_SKU"]
# }
```

### Test 8: Test Bulk Upload API - Invalid Threshold

**Command:** Upload CSV with critical > reorder

```bash
# Create a CSV file (bad_threshold.csv)
# sku,batch_number,boxes_purchased,cost_per_box,supplier_name,purchase_date,reorder_level,critical_level
# SKU001,TEST-001,500,350.00,Test Co.,2026-02-15,50,60

curl -X POST "http://localhost:3000/api/inventory/bulk-upload" \
  -H "Authorization: Bearer {YOUR_SESSION_TOKEN}" \
  -F "file=@bad_threshold.csv"

# Expected Response (ERROR):
# { 
#   "success": false, 
#   "error": "critical_level cannot exceed reorder_level at row 1"
# }
```

---

## 🎨 UI TESTS (Browser)

### Test 9: Manual Form - Product Search

**Steps:**

```
1. Navigate to Dashboard > Inventory
2. Click "Add Stock Batch" button
3. See search form appear
4. Type "coffee" (or product name from sample data)
5. See results appear below
6. Click one result
7. Form should advance to Step 2
8. See product details at top
```

**Expected Results:**
- ✅ Search works for product names
- ✅ Shows matching products
- ✅ Click selects product
- ✅ Form advances to Step 2

### Test 10: Manual Form - Batch Details

**Steps:** (Continuing from Test 9)

```
1. After selecting product, see Step 2 form
2. Check all fields are present:
   ✅ batch_number (empty or auto-filled)
   ✅ boxes_purchased (empty)
   ✅ quantity_per_box (shows 1)
   ✅ unit_per_box (shows "box")
   ✅ cost_per_box (empty)
   ✅ supplier_name (empty)
   ✅ purchase_date (shows today)
   ✅ reorder_level (empty) ← NEW
   ✅ critical_level (empty) ← NEW

3. Fill in values:
   - boxes_purchased: 500
   - quantity_per_box: 50
   - unit_per_box: kg
   - cost_per_box: 350.00
   - supplier_name: Test Supplier
   - reorder_level: 50
   - critical_level: 20

4. Check alert status preview shows "Healthy"
   (because 500 > 50)
```

**Expected Results:**
- ✅ All fields visible
- ✅ New fields present (reorder, critical)
- ✅ Alert status preview works
- ✅ Shows "Healthy" for 500 boxes with reorder=50

### Test 11: Manual Form - Alert Status Preview

**Steps:** (Same form, change boxes_purchased)

```
1. Change boxes_purchased to 45
2. Watch alert status change to "Warning"
   (because 45 ≤ 50 but 45 > 20)

3. Change boxes_purchased to 15
4. Watch alert status change to "Critical"
   (because 15 ≤ 20)

5. Change boxes_purchased to 500
6. Watch alert status change back to "Healthy"

7. Change critical_level to 60
8. See error message (critical > reorder)
9. Cannot submit form
```

**Expected Results:**
- ✅ Status updates in real-time
- ✅ Shows correct status for each value
- ✅ Validation prevents bad thresholds
- ✅ Cannot submit with invalid thresholds

### Test 12: Manual Form - Submit

**Steps:**

```
1. Fill form with valid values
2. Click "Create Stock Batch"
3. Button shows loading spinner
4. Wait for submit...
5. See success toast message
6. Form resets to Step 1
7. Ready for next batch
```

**Expected Results:**
- ✅ Submit works
- ✅ Loading indicator shows
- ✅ Success message appears
- ✅ Form resets
- ✅ Data saves to database

### Test 13: Bulk Upload - Download Template

**Steps:**

```
1. Navigate to Dashboard > Inventory > Bulk Upload
2. Click "Download Template" button
3. File downloads as "stock_batches_template.csv"
4. Open file in Excel or text editor
5. Check headers are:
   sku,batch_number,boxes_purchased,cost_per_box,supplier_name,purchase_date,reorder_level,critical_level
```

**Expected Results:**
- ✅ Download works
- ✅ File is CSV format
- ✅ Headers correct
- ✅ Sample rows included

### Test 14: Bulk Upload - Valid CSV

**Steps:**

```
1. Modify downloaded template with sample data
2. Or use sample-data/stock_batches_bulk_upload.csv
3. Click "Select CSV File"
4. Choose file
5. Click "Upload Stock Batches"
6. See loading spinner
7. Wait for upload...
8. See success message:
   "Success! X stock batches inserted"
9. File input resets
```

**Expected Results:**
- ✅ File selection works
- ✅ Upload starts
- ✅ Shows count of inserted batches
- ✅ Success message appears
- ✅ Data saves to database

### Test 15: Bulk Upload - Invalid SKU

**Steps:**

```
1. Create CSV with one row that has non-existent SKU:
   FAKE_SKU,TEST-001,500,350.00,Test,2026-02-15,50,20

2. Upload file
3. See error message appearing:
   "Error: The following SKUs do not exist: FAKE_SKU. 
    Aborting entire operation."

4. Check database - NO batches inserted
   (All-or-nothing validation worked!)
```

**Expected Results:**
- ✅ Detects missing SKU
- ✅ Shows clear error
- ✅ Nothing inserted (all-or-nothing works!)
- ✅ User can fix and retry

### Test 16: Database Verification

**After successful uploads, check data:**

**In Supabase Dashboard:**

```sql
-- View inserted stock batches
SELECT 
  batch_number,
  boxes_purchased,
  reorder_level,
  critical_level,
  alert_status,
  status,
  created_at
FROM stock_batches
ORDER BY created_at DESC
LIMIT 10;

-- Check specific batch
SELECT * FROM stock_batches WHERE batch_number = 'SKU001-2026-001';

-- Expected fields to see:
-- ✅ batch_number (SKU-based format)
-- ✅ boxes_purchased (matches input)
-- ✅ reorder_level (matches input)
-- ✅ critical_level (matches input)
-- ✅ alert_status (correct value: healthy/warning/critical)
-- ✅ status (should be 'active')
-- ✅ boxes_remaining (should equal boxes_purchased)
```

---

## 🔍 ALERT STATUS VERIFICATION

### Correct Alert Status Calculation

**Test cases:**

```
If reorder_level=50, critical_level=20:

Test Case 1:
  boxes_purchased = 500
  Expected alert_status: "healthy" ✅
  (500 > 50)

Test Case 2:
  boxes_purchased = 45
  Expected alert_status: "warning" ✅
  (45 ≤ 50 AND 45 > 20)

Test Case 3:
  boxes_purchased = 15
  Expected alert_status: "critical" ✅
  (15 ≤ 20)

Test Case 4:
  boxes_purchased = 50
  Expected alert_status: "warning" ✅
  (50 ≤ 50 AND 50 > 20)

Test Case 5:
  boxes_purchased = 20
  Expected alert_status: "critical" ✅
  (20 ≤ 20)

Test Case 6:
  boxes_purchased = 21
  Expected alert_status: "warning" ✅
  (21 ≤ 50 AND 21 > 20)
```

---

## ⚡ QUICK TEST SEQUENCE (Recommended)

### Fast Full Test (10 minutes)

**1. Database Verification (1 min)**
```
1. Open Supabase Dashboard
2. Run Test 1: Verify fields
3. Run Test 2: Verify functions
```

**2. API Verification (2 min)**
```
4. Run Test 4: Download template
5. Run Test 5: Create one batch
6. Check database: should see new batch
```

**3. Bulk Upload (4 min)**
```
7. Run Test 6: Upload sample data
8. Check database: should see multiple batches
9. Run Test 7: Test error handling (optional)
```

**4. UI Verification (3 min)**
```
10. Browser: Test 9 - Product search
11. Browser: Test 10 - Fill form
12. Browser: Test 11 - Alert status
13. Browser: Test 12 - Submit
```

---

## 📝 TEST RESULT TEMPLATE

Use this to record your test results:

```
TEST RESULTS - Stock Batch Upload System
Date: ______________
Tester: ______________

UNIT TESTS
─────────────────────────────────────────
Test 1: Schema fields           ☐ PASS ☐ FAIL
Test 2: RPC functions          ☐ PASS ☐ FAIL
Test 3: Manual insert          ☐ PASS ☐ FAIL

API TESTS
─────────────────────────────────────────
Test 4: Template download      ☐ PASS ☐ FAIL
Test 5: Single batch API       ☐ PASS ☐ FAIL
Test 6: Bulk upload (valid)    ☐ PASS ☐ FAIL
Test 7: Bulk upload (bad SKU)  ☐ PASS ☐ FAIL
Test 8: Bulk upload (bad threshold) ☐ PASS ☐ FAIL

UI TESTS
─────────────────────────────────────────
Test 9: Product search         ☐ PASS ☐ FAIL
Test 10: Form fields           ☐ PASS ☐ FAIL
Test 11: Alert status          ☐ PASS ☐ FAIL
Test 12: Submit                ☐ PASS ☐ FAIL
Test 13: Download template     ☐ PASS ☐ FAIL
Test 14: Bulk upload (UI)      ☐ PASS ☐ FAIL
Test 15: Error handling        ☐ PASS ☐ FAIL

DATABASE VERIFICATION
─────────────────────────────────────────
Test 16: Verify data           ☐ PASS ☐ FAIL

ALERT STATUS VERIFICATION
─────────────────────────────────────────
Test Case 1 (500 boxes): ☐ healthy
Test Case 2 (45 boxes):  ☐ warning
Test Case 3 (15 boxes):  ☐ critical

OVERALL STATUS
─────────────────────────────────────────
All tests passed? ☐ YES ☐ NO

Issues found:
_________________________________
_________________________________
_________________________________

Notes:
_________________________________
_________________________________
```

---

## 🚨 COMMON ISSUES & QUICK FIXES

### Issue: "Product not found" when searching

**Fix:**
```
1. Make sure products are seeded in database
2. Run: INSERT INTO products (...) VALUES (...)
3. Or upload sample data first
4. Then try search again
```

### Issue: Form fields not showing

**Fix:**
```
1. Make sure StockBatchForm imported in page
2. Make sure Dialog/Modal wrapping it
3. Check browser console for JavaScript errors
4. Force refresh page (Ctrl+Shift+R)
```

### Issue: "Cannot find module" error

**Fix:**
```
1. Make sure file path is correct
2. Check file uses 'use client' directive
3. Check all imports are relative paths
4. Run: npm install (if missing dependencies)
```

### Issue: API returns 401 Unauthorized

**Fix:**
```
1. Make sure user is logged in
2. Check session token is valid
3. Check Supabase auth is configured
4. Try logging out and back in
```

### Issue: CSV upload says "Invalid headers"

**Fix:**
```
1. Download template from API
2. Use exact headers from template
3. Don't add/remove/rename columns
4. Save as CSV (not XLSX)
```

### Issue: "Critical level exceeds reorder level" error

**Fix:**
```
1. Check critical_level value
2. Make sure critical_level ≤ reorder_level
3. Example: If reorder=50, critical must be ≤50
4. Fix values and try again
```

---

## ✅ SUCCESS CHECKLIST

After all tests pass:

- ☑️ Schema has all fields (reorder, critical, alert_status)
- ☑️ RPC functions exist and callable
- ☑️ Single batch insert works (database)
- ☑️ API template download works
- ☑️ API single batch creation works
- ☑️ API bulk upload works (valid CSV)
- ☑️ API properly rejects (invalid SKU, bad threshold)
- ☑️ Manual form searches products
- ☑️ Manual form shows all fields
- ☑️ Manual form calculates alert status correctly
- ☑️ Manual form submits and saves data
- ☑️ Bulk upload page works (download, upload)
- ☑️ Database shows all inserted data
- ☑️ Alert status values are correct

**If all ✓:** System is ready for production! 🎉

---

## 📞 DEBUGGING HELP

**If a test fails, check:**

1. **Database connection**
   - Can you access Supabase dashboard?
   - Can you run SQL queries?

2. **API routes**
   - Does Next.js development server run?
   - Can you see routes in /api/inventory?

3. **Component imports**
   - Check file paths are correct
   - Check all dependencies installed

4. **Data format**
   - CSV has correct headers?
   - JSON has required fields?

5. **Browser console**
   - Any JavaScript errors?
   - Check Network tab for API response

6. **Supabase logs**
   - Check logs.supabase.com for errors
   - Check RLS policy violations

---

**Need help?** Check `STOCK_BATCH_WORKFLOW_GUIDE.md` for detailed explanations of each feature!

