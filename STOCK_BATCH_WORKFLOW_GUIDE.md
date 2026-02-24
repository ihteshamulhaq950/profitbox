-- =====================================================
-- STOCK BATCH UPLOAD WORKFLOW GUIDE
-- Manual vs Bulk Upload with Alert Thresholds
-- =====================================================

## OVERVIEW

There are TWO ways to add stock batches:

1. **Manual Form** - Add one batch at a time with full UI
2. **Bulk CSV Upload** - Upload multiple batches from CSV file

Both methods support the new ALERT THRESHOLD fields:
- `reorder_level` - Warn when stock falls below this
- `critical_level` - Alert when stock falls below this

---

## ALERT THRESHOLD EXPLANATION

### reorder_level
- When boxes_remaining falls BELOW this → Status becomes YELLOW (warning)
- Example: reorder_level = 50 boxes
- Meaning: When you have 49 boxes left, time to reorder

### critical_level  
- When boxes_remaining falls BELOW this → Status becomes RED (critical)
- Example: critical_level = 20 boxes
- Meaning: When you have 19 boxes left, URGENT - must reorder now!

### Constraint
`critical_level` must always be ≤ `reorder_level`
- If reorder = 50, critical can be 0-50
- If reorder = 50, critical cannot be 51+

### Status Calculation
The system automatically calculates `alert_status` at insert time:
```
If boxes_purchased <= critical_level → 'critical' 🔴
Else if boxes_purchased <= reorder_level → 'warning' 🟡
Else → 'healthy' 🟢
```

This status updates automatically as sales are recorded.

---

## METHOD 1: MANUAL FORM

### Use Case
- Adding 1-2 batches
- Want to use interactive form
- Easy to verify data before submission

### Workflow

**Step 1: Search Product**
```
1. Go to Dashboard > Inventory
2. Click "Add Stock Batch" button
3. Search for product by name or SKU
4. Click product to select it
```

**Step 2: Fill Batch Details**
```
Form has sections:

📦 BATCH IDENTIFICATION
├─ batch_number (auto-generated if blank)
│  Example: SKU001-2026-001
│
├─ boxes_purchased *
│  How many boxes/bags bought this time
│  Example: 50
│
├─ quantity_per_box *
│  How much is IN each box
│  Example: 50 (if 50kg per bag)
│
└─ unit_per_box
   What unit (kg, packet, piece, etc)
   Example: kg

💰 COST & SUPPLIER
├─ cost_per_box *
│  What you paid per box
│  Example: 350.00
│
├─ supplier_name (optional)
│  Who sold it to you
│  Example: Global Coffee Co.
│
└─ purchase_date
   When you bought it
   Example: 2026-02-10

⚠️  ALERT THRESHOLDS (NEW!)
├─ reorder_level
│  Reorder when below this many boxes
│  Example: 50
│
└─ critical_level
   URGENT reorder when below this many boxes
   Example: 20
```

**Step 3: Review Alert Status**
```
Before submitting, you see:
"Expected Alert Status: [Healthy/Warning/Critical]"

This shows what status this batch will have at purchase.
```

**Step 4: Submit**
```
Click "Create Stock Batch"
→ Data saved successfully
→ Form clears
→ Ready for next batch
```

---

## METHOD 2: BULK CSV UPLOAD

### Use Case
- Adding 10+ batches at once
- Already have data in spreadsheet
- Want faster bulk operation

### File Format

**Required Columns:**
```
sku                  Required  The SKU of product (must exist)
batch_number         Optional  Auto-generated if blank
boxes_purchased      Required  Positive integer
cost_per_box         Required  Decimal number
supplier_name        Optional  Text
purchase_date        Optional  YYYY-MM-DD format
reorder_level        Required  Non-negative integer
critical_level       Required  Non-negative integer
```

**Example CSV:**
```csv
sku,batch_number,boxes_purchased,cost_per_box,supplier_name,purchase_date,reorder_level,critical_level
SKU001,SKU001-2026-001,500,350.00,Global Coffee Co.,2026-02-01,50,20
SKU002,SKU002-2026-001,400,200.00,Tea Masters Ltd.,2026-02-02,40,15
SKU003,SKU003-2026-001,600,250.00,Artisan Chocolatiers,2026-01-25,60,25
```

### Workflow

**Step 1: Download Template**
```
1. Go to Dashboard > Inventory > Bulk Upload
2. Click "Download Template CSV"
3. Opens file: stock_batches_template.csv
```

**Step 2: Fill Your Data**
```
Open the CSV in Excel/Google Sheets:

Row 1: Headers (don't change)
Row 2+: Your data

Example from template:
┌─────────────────────────────────────────────────────────┐
│ SKU001,SKU001-2026-001,500,350.00,Global...,2026-02-01,50,20 │
│ SKU002,SKU002-2026-001,400,200.00,Tea......,2026-02-02,40,15 │
│ SKU003,SKU003-2026-001,600,250.00,Artisan...,2026-01-25,60,25 │
└─────────────────────────────────────────────────────────┘

MAX 100 rows per file
```

**Step 3: Understand the Process**

When you upload the CSV, SERVER does this:

1. **Parse CSV**
   ├─ Read all rows
   ├─ Validate headers
   └─ Extract SKUs

2. **Fetch All Products** (One Query!)
   ├─ Get products by SKUs: SELECT ... WHERE sku IN (...)
   │  This is ONE database query for all SKUs
   ├─ Match products to rows
   └─ If ANY SKU missing → ABORT ENTIRE OPERATION
      (Don't insert any data - all or nothing)

3. **Validate Rows**
   ├─ Check boxes_purchased > 0
   ├─ Check cost_per_box >= 0
   ├─ Check reorder_level >= 0
   ├─ Check critical_level >= 0
   ├─ Check critical_level ≤ reorder_level
   └─ If any row invalid → Collect errors, show to user

4. **Insert All Data** (One Atomic Operation!)
   ├─ Insert all valid rows at once
   ├─ Map SKU → Product ID (from earlier fetch)
   ├─ Set alert_status based on boxes_purchased vs levels
   └─ All rows inserted or all rollback (atomic)

5. **Return Result**
   ├─ success: true/false
   ├─ inserted_count: How many rows inserted
   ├─ message: Confirmation message
   └─ error: Any error details

**Step 4: Upload File**
```
1. Go to Dashboard > Inventory > Bulk Upload
2. Click "Select CSV File" or drag-drop
3. Click "Upload Stock Batches"
4. Wait for processing...
5. See result: "10 stock batches inserted" ✅
```

**Error Handling:**
```
If SKU doesn't exist:
→ ERROR: "The following SKUs do not exist: SKU999. Aborting entire operation."
→ NOTHING is inserted
→ User must fix CSV and re-upload

If alert threshold invalid:
→ ERROR: "critical_level cannot be greater than reorder_level"
→ NOTHING is inserted
→ User must fix CSV and re-upload

If cost_per_box is negative:
→ ERROR: "cost_per_box must be non-negative"
→ NOTHING is inserted

All errors clearly tell which row has problem
```

---

## API ENDPOINTS

### Bulk Upload Endpoint
```
POST /api/inventory/bulk-upload
Multipart Form Data:
  - file: CSV file

GET /api/inventory/bulk-upload
Returns: CSV template for download
```

### Single Batch Endpoint
```
POST /api/inventory
JSON body:
{
  "product_id": "uuid",
  "batch_number": "SKU001-2026-001",
  "boxes_purchased": 500,
  "boxes_remaining": 500,
  "quantity_per_box": 50,
  "unit_per_box": "kg",
  "cost_per_box": 350.00,
  "supplier_name": "Global Coffee Co.",
  "reorder_level": 50,
  "critical_level": 20,
  "alert_status": "healthy",
  "status": "active"
}
```

---

## BACKEND LOGIC FLOW

### Single Manual Add:
```
1. User selects product → Gets product_id
2. User fills form → Validates on client
3. Submit to POST /api/inventory
4. Server:
   ├─ Get user from auth
   ├─ Validate all fields
   ├─ Calculate alert_status
   ├─ Insert record
   └─ Return success
5. Updated inventory shown in UI
```

### Bulk CSV Upload:
```
1. User uploads CSV file
2. Server receives file
3. Parse CSV → Extract rows
4. Get all SKUs from rows
5. FETCH products WHERE sku IN (skus) 
   └─ This is ONE query for ALL products
6. For each row:
   ├─ Map SKU → Product ID
   ├─ Validate fields
   ├─ Calculate alert_status
   └─ Prepare insert data
7. Insert ALL data together
8. Return count of inserted rows
```

---

## DUMMY DATA EXAMPLE

File: `sample-data/stock_batches_bulk_upload.csv`

```csv
sku,batch_number,boxes_purchased,cost_per_box,supplier_name,purchase_date,reorder_level,critical_level
SKU001,SKU001-2026-001,500,350.00,Global Coffee Co.,2026-02-01,50,20
SKU001,SKU001-2026-002,300,360.00,Global Coffee Co.,2026-02-10,50,20
SKU002,SKU002-2026-001,400,200.00,Tea Masters Ltd.,2026-02-02,40,15
SKU002,SKU002-2026-002,250,210.00,Tea Masters Ltd.,2026-02-12,40,15
SKU003,SKU003-2026-001,600,250.00,Artisan Chocolatiers,2026-01-25,60,25
SKU003,SKU003-2026-002,400,260.00,Artisan Chocolatiers,2026-02-08,60,25
SKU004,SKU004-2026-001,200,450.00,Mediterranean Imports,2026-02-03,30,10
SKU004,SKU004-2026-002,150,460.00,Mediterranean Imports,2026-02-14,30,10
SKU005,SKU005-2026-001,800,140.00,Italian Pasta House,2026-02-04,75,30
SKU005,SKU005-2026-002,500,145.00,Italian Pasta House,2026-02-11,75,30
SKU006,SKU006-2026-001,300,350.00,Organic Honey Farms,2026-02-05,25,10
SKU007,SKU007-2026-001,250,300.00,Nut Butter Makers,2026-02-06,35,15
SKU008,SKU008-2026-001,1000,180.00,Coconut Direct,2026-02-07,100,40
SKU009,SKU009-2026-001,180,400.00,Quinoa Growers,2026-02-09,20,8
SKU010,SKU010-2026-001,500,120.00,Salt Distributors,2026-02-13,45,20
```

**Key Points in Dummy Data:**
- Batch numbers follow pattern: `SKU###-YYYY-###`
- Each product has 1-2 batches
- reorder_level: When to order (warning threshold)
- critical_level: URGENT reorder (critical threshold)
- All have realistic values for grocery items

---

## AUTO-GENERATED FIELDS

When data is inserted, these fields are auto-set:

**Manual Form:**
```
boxes_remaining = boxes_purchased (start with full stock)
alert_status = calculated from boxes_purchased vs thresholds
status = 'active'
created_at = NOW()
user_id = authenticated user
product_id = selected product
```

**Bulk Upload CSV:**
```
Same as manual, plus:
batch_number = auto-generated if blank
  Format: {sku}-{year}-{3digit random}
  Example: SKU001-2026-847
```

---

## COMMON SCENARIOS

### Scenario 1: Add 3 Batches Quickly
**Method:** Manual Form (fastest)
```
1. Dashboard > Inventory
2. Click "Add Stock Batch"
3. Search "Coffee Beans" → Select
4. Fill: 500 boxes, 50kg/box, $350/box
5. Set reorder=50, critical=20
6. Click Submit
7. Repeat 2 more times (same form resets)
```

### Scenario 2: Import From Spreadsheet
**Method:** Bulk CSV Upload
```
1. Already have Excel with 15 batches
2. Export as CSV
3. Check columns match template
4. Dashboard > Inventory > Bulk Upload
5. Upload file
6. All 15 inserted in seconds
```

### Scenario 3: Low Stock Alert
**Setup with Manual Form:**
```
Product: Premium Coffee
- reorder_level = 50
- critical_level = 20

If boxes_remaining falls to 45 → Status = "Warning" 🟡
If boxes_remaining falls to 15 → Status = "Critical" 🔴

Team sees alert, takes action immediately
```

---

## VALIDATION RULES

### Batch Numbers
✅ Optional - auto-generated if blank
✅ Should follow pattern: SKU###-YYYY-###
❌ No special characters
❌ Max 100 chars

### Boxes Purchased
✅ Must be > 0
✅ Positive integer
❌ Cannot be 0 or negative
❌ Cannot be decimal

### Cost per Box
✅ Can be 0 (free product)
✅ Decimal allowed (350.00)
❌ Cannot be negative
❌ Max 2 decimal places recommended

### Alert Thresholds
✅ Both can be 0
✅ Non-negative integers
❌ Decimal not allowed
❌ critical_level must be ≤ reorder_level

### SKU (Bulk Upload)
✅ Must exist in products table
✅ Exactly as entered in products
❌ If any SKU missing → Entire upload fails
❌ Case sensitive

---

## TESTING THE SETUP

### Test 1: Manual Form - Healthy Stock
```
Product: "Artisan Chocolate Bar"
boxes_purchased: 600
reorder_level: 60
critical_level: 25

Expected alert_status: healthy ✅
(600 > 60, so healthy)
```

### Test 2: Manual Form - Warning Stock
```
Product: Same
But boxes_purchased: 55

Expected alert_status: warning ⚠️
(55 ≤ 60 but 55 > 25)
```

### Test 3: Manual Form - Critical Stock
```
Product: Same
But boxes_purchased: 15

Expected alert_status: critical 🔴
(15 ≤ 25)
```

### Test 4: Bulk Upload - Valid Data
```
Upload sample-data/stock_batches_bulk_upload.csv
Expected: ✅ "15 stock batches inserted"
```

### Test 5: Bulk Upload - Missing SKU
```
Change one SKU to "INVALID"
Upload
Expected: ❌ "SKU does not exist: INVALID. Aborting entire operation."
Nothing inserted
```

### Test 6: Bulk Upload - Invalid Threshold
```
Change one row: critical_level=50, reorder_level=40
Upload
Expected: ❌ "critical_level cannot exceed reorder_level"
Nothing inserted
```

---

## TIPS & BEST PRACTICES

**For Manual Form:**
- Always set realistic reorder levels (80% of purchase)
- Critical level should be 30-40% of reorder level
- Use batch numbers to track purchase date

**For Bulk Upload:**
- Download template first (right headers)
- Test with 3-5 rows before full import
- Verify all SKUs exist in products table
- Use consistent supplier names

**Alert Levels Suggestion:**
```
For high-volume items (sugar, flour):
- reorder_level = 80% of avg purchase quantity
- critical_level = 30% of reorder_level
- Example: Buy 100 bags → reorder=80, critical=25

For low-volume items (specialty products):
- reorder_level = 50% of avg purchase quantity
- critical_level = 20% of reorder_level
- Example: Buy 20 boxes → reorder=10, critical=2
```

---

## TROUBLESHOOTING

### "Product not found"
**Cause:** SKU doesn't match exactly
**Fix:** Check products table, copy exact SKU

### "Critical level exceeds reorder level"  
**Cause:** Entered wrong values
**Fix:** critical_level must be ≤ reorder_level

### "All batches failed to insert"
**Cause:** SKU validation failed
**Fix:** Check all SKUs exist in database

### "File too large"
**Cause:** CSV > 5MB
**Fix:** Split into multiple files

### "Invalid CSV format"
**Cause:** Missing required headers
**Fix:** Download template and use exact headers

---

## COMPLETION CHECKLIST

After setting up stock batches system:

- ☑️ Understand alert threshold fields
- ☑️ Know when to use manual vs bulk
- ☑️ Can add single batch manually
- ☑️ Can upload CSV with multiple batches
- ☑️ Know validation rules
- ☑️ Tested both methods
- ☑️ Set realistic alert thresholds
- ☑️ Ready to track inventory! 🎉

---

Need help? Check:
- API logs for detailed errors
- Supabase dashboard for data
- Sample CSV for format reference

Good luck! 🚀
