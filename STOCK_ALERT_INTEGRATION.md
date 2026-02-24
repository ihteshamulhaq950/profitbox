# Stock Alert Status - API Integration Guide

## Overview

When you added the alert fields to `stock_batches`:
- `reorder_level` (INT) - Threshold for "warning" status
- `critical_level` (INT) - Threshold for "critical" status  
- `alert_status` (TEXT) - Current status: 'healthy' | 'warning' | 'critical'

These are now **automatically updated** when sales are recorded. No manual database changes needed.

## How It Works

### Alert Status Logic

```
if boxes_remaining <= critical_level:
  alert_status = 'critical'
else if boxes_remaining <= reorder_level:
  alert_status = 'warning'
else:
  alert_status = 'healthy'
```

### When Alert Status Updates

1. **Sale is recorded** → `boxes_remaining` decreases
2. **API automatically recalculates** → `alert_status` updated based on new stock level
3. **No manual intervention needed**

## Updated APIs

### 1. POST /api/sales (Record Sale)

**What changed:**
- Now fetches `reorder_level` and `critical_level` from batch
- Calculates new `alert_status` based on `boxes_remaining` after sale
- Updates batch with: `boxes_remaining`, `status`, and `alert_status`

**Example flow:**
```
POST /api/sales
{
  "product_id": "prod-123",
  "batch_id": "batch-456",
  "boxes_sold": 3,
  "selling_price_per_box": 2000
}

Before sale:
  boxes_remaining: 5
  reorder_level: 2
  critical_level: 1
  alert_status: "healthy"

After sale (3 boxes sold):
  boxes_remaining: 2 // Was 5
  status: "active"   // Batch still has stock
  alert_status: "warning" // Now 2 <= reorder_level (2)
```

### 2. POST /api/inventory (Create New Batch)

**What changed:**
- Accepts optional `reorder_level` and `critical_level` in request body
- Validates threshold constraints (critical ≤ reorder)
- Calculates initial `alert_status` based on boxes_purchased
- Stores thresholds in database

**Request schema:**
```json
{
  "product_id": "prod-123",
  "boxes_purchased": 10,
  "quantity_per_box": 50,
  "unit_per_box": "kg",
  "cost_per_box": 2000,
  "supplier_name": "ABC Wholesale",
  "reorder_level": 3,
  "critical_level": 1
}
```

**Validation:**
- `reorder_level >= 0` (required)
- `critical_level >= 0` (required)
- `critical_level <= reorder_level` (required)

**Initial alert_status calculation:**
```
if boxes_purchased <= critical_level:
  alert_status = "critical"
else if boxes_purchased <= reorder_level:
  alert_status = "warning"
else:
  alert_status = "healthy"
```

### 3. Bulk Stock Upload - Modified

**Changes:**
- Now accepts `reorder_level` and `critical_level` as optional CSV columns
- SQL function calculates alert_status for each row
- All rows inserted atomically with proper alert thresholds

**CSV Format:**
```csv
sku,boxes_purchased,quantity_per_box,unit_per_box,cost_per_box,supplier_name,reorder_level,critical_level
SUGAR-50KG,10,50,kg,2000,ABC Wholesale,2,1
GHEE-5KG,5,5,packet,4500,XYZ Traders,1,0
```

**SQL Function Updated:**
- Accepts `reorder_level` and `critical_level` in JSON
- Defaults to 0 if not provided
- Uses CASE statement to calculate alert_status
- Validates critical_level <= reorder_level

## Database Behavior

### When Stock Levels Trigger Alerts

| Scenario | Condition | alert_status |
|----------|-----------|--------------|
| Fresh batch, well stocked | boxes_remaining > reorder_level | `healthy` |
| Stock running low | boxes_remaining ≤ reorder_level AND > critical_level | `warning` |
| Stock critically low | boxes_remaining ≤ critical_level | `critical` |
| Batch empty | boxes_remaining = 0 | `healthy` (status = "depleted") |

### Example Thresholds

**High-value items (expensive):**
```
reorder_level: 2
critical_level: 1
```
Alert when only 2 boxes left, critical at 1

**Bulk commodities:**
```
reorder_level: 50
critical_level: 10
```
Alert when below 50 boxes, critical below 10

## Production Checklist

✅ **Done automatically now:**
- Alert status updates on every sale
- No manual database updates needed
- Atomic transaction (sale + alert update together)
- Validates threshold constraints on batch creation

✅ **Manual setup required:**
1. Run the SQL migration for `bulk_insert_stock_batches` function
2. Existing batches will have default values (reorder_level: 0, critical_level: 0, alert_status: 'healthy')
3. Optionally update existing batches to set meaningful thresholds

**Update existing batch thresholds (optional):**
```sql
UPDATE stock_batches
SET 
  reorder_level = 5,
  critical_level = 2,
  alert_status = CASE 
    WHEN boxes_remaining <= 2 THEN 'critical'
    WHEN boxes_remaining <= 5 THEN 'warning'
    ELSE 'healthy'
  END
WHERE product_id = 'prod-123';
```

## Testing Alert Updates

### Test Case 1: Sale triggers warning status

```sql
-- Setup
INSERT INTO stock_batches (
  user_id, product_id, boxes_purchased, boxes_remaining,
  reorder_level, critical_level, alert_status, ...
) VALUES (
  'user-1', 'prod-1', 10, 10,
  3, 1, 'healthy', ...
);

-- Record sale for 8 boxes
POST /api/sales { boxes_sold: 8, ... }

-- Verify
SELECT boxes_remaining, alert_status FROM stock_batches WHERE id = 'batch-1';
-- Expected: boxes_remaining=2, alert_status='warning'
```

### Test Case 2: Sale triggers critical status

```
Setup: boxes_remaining=2, reorder_level=3, critical_level=1

POST /api/sales { boxes_sold: 1 }

Expected: boxes_remaining=1, alert_status='critical'
```

### Test Case 3: Bulk upload sets correct initial alert status

```
CSV:
sku,boxes_purchased,quantity_per_box,unit_per_box,cost_per_box,supplier_name,reorder_level,critical_level
GHEE-5KG,2,5,packet,4500,XYZ,3,1

Expected: alert_status='critical' (because 2 <= critical_level 1 is false, but 2 <= reorder_level 3 is true)
```

## Files Modified

```
app/api/sales/route.ts
  └─ POST handler now calculates alert_status on sale

app/api/inventory/route.ts
  └─ POST handler now accepts and validates reorder/critical levels
  └─ Calculates initial alert_status on batch creation

app/api/stock/bulk-upload/route.ts
  └─ GET template now includes reorder_level and critical_level columns

lib/csv-stock-parser.ts
  └─ Parses optional reorder_level and critical_level columns
  └─ Validates threshold constraints
  └─ Updated template generation

lib/types.ts
  └─ ParsedStockBatchRow now includes optional reorder/critical levels

supabase/migrations/001_bulk_insert_stock_batches.sql
  └─ Function now accepts reorder/critical levels
  └─ Calculates alert_status using CASE statement on bulk insert
```

## Error Handling

### Sales API - Alert Status Update Failure

If batch update fails after sale insert:
- Sale record is rolled back (deleted)
- Error returned to client
- Database remains consistent

### Inventory API - Invalid Thresholds

```
POST /api/inventory
{
  "reorder_level": 5,
  "critical_level": 10  // Invalid: > reorder_level
}

Response: 400
{
  "error": "critical_level must be <= reorder_level"
}
```

## Notes

- **Backward compatible**: Existing batches continue to work with default thresholds (0/0)
- **Optional fields**: reorder_level and critical_level can be omitted (defaults to 0)
- **Automatic**: Alert status is calculated server-side, no client logic needed
- **Atomic**: Sale insert and alert update are in single transaction
- **Performance**: Uses indexed lookup on batch_id, minimal overhead

## Support for Alerts

When displaying batches/inventory, check `alert_status` field:

```tsx
<div className={`
  px-3 py-1 rounded text-sm font-medium
  ${batch.alert_status === 'critical' ? 'bg-red-100 text-red-700'
    : batch.alert_status === 'warning' ? 'bg-yellow-100 text-yellow-700'
    : 'bg-green-100 text-green-700'}
`}>
  {batch.alert_status}
</div>
```
