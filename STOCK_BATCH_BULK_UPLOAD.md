# Bulk Stock Batch Upload - Implementation Guide

## Overview

This implementation provides a production-ready bulk stock batch upload feature for ProfitBox. It allows users to import multiple stock batches via CSV file in a single atomic database operation.

## Architecture

### 1. Database Layer (Supabase SQL)
**File**: `supabase/migrations/001_bulk_insert_stock_batches.sql`

**Function**: `bulk_insert_stock_batches(data jsonb)`

**Features**:
- Accepts JSON array of stock batch data
- Validates all SKUs exist before insertion
- Performs atomic transaction (all-or-nothing)
- Uses set-based INSERT (no loops)
- Respects RLS with `auth.uid()`
- Sets `boxes_remaining = boxes_purchased` and `status = 'active'` automatically

**Key Logic**:
```sql
1. Count input rows
2. Verify all SKUs match products for current user
3. If count mismatch → RAISE EXCEPTION (abort)
4. INSERT via SELECT with join on products table
5. Return success response with inserted count
```

### 2. Backend API (`app/api/stock/bulk-upload/route.ts`)

**Endpoints**:
- `POST /api/stock/bulk-upload` - Upload and process CSV
- `GET /api/stock/bulk-upload` - Download CSV template

**POST Handler**:
- Validates authentication via Supabase
- Accepts `multipart/form-data` with CSV file
- Validates file type (.csv) and size (<5MB)
- Parses CSV using `parseStockBatchCSV()`
- Calls RPC function `bulk_insert_stock_batches`
- Returns inserted count on success or detailed error

**Error Handling**:
- 401: Unauthorized (no user session)
- 400: Invalid file, parsing error, SKU not found
- 500: Database error

### 3. CSV Parser (`lib/csv-stock-parser.ts`)

**Function**: `parseStockBatchCSV(csvContent: string)`

**Validates**:
- Header presence (sku, boxes_purchased, quantity_per_box, unit_per_box, cost_per_box)
- Required fields non-empty
- Numeric fields valid and > 0
- Maximum 100 rows per file
- Proper CSV format (handles quoted fields, escapes)

**Returns**:
- Array of `ParsedStockBatchRow` objects
- Throws error with line number and detail if validation fails

**Example Valid CSV**:
```
sku,boxes_purchased,quantity_per_box,unit_per_box,cost_per_box,supplier_name
SUGAR-50KG,10,50,kg,2000,ABC Wholesale
GHEE-5KG,5,5,packet,4500,XYZ Traders
```

### 4. React Component (`components/stock/stock-batch-bulk-upload.tsx`)

**Features**:
- Drag-and-drop file input
- File validation (type, size)
- Template download button
- Loading state with spinner
- Success/error alerts with details
- Responsive design

**State Management**:
- `file`: Selected File object
- `loading`: Upload in progress
- `error`: Error message with details
- `success`: Response from API with inserted count

**User Flow**:
1. Click "Download Template" or select CSV
2. Click "Upload Stock Batches"
3. Shows loading state
4. On success: Shows count, clears form, shows toast
5. On error: Shows detailed error message, toast notification

## Database Schema Requirements

```sql
products:
  id (uuid, pk)
  user_id (uuid, fk auth.users)
  sku (text, UNIQUE per user)
  unit_type ('weight' | 'count')
  base_unit (text)
  ...other fields

stock_batches:
  id (uuid, pk)
  user_id (uuid, fk auth.users)
  product_id (uuid, fk products)
  boxes_purchased (int, > 0)
  boxes_remaining (int, <= boxes_purchased)
  quantity_per_box (numeric, > 0)
  unit_per_box (text)
  cost_per_box (numeric, > 0)
  supplier_name (text)
  status ('active' | 'depleted')
  created_at (timestamp)

Constraints:
  UNIQUE(products.user_id, products.sku)
  FOREIGN KEY products(user_id) REFERENCES auth.users(id)
  FOREIGN KEY stock_batches(user_id) REFERENCES auth.users(id)
  FOREIGN KEY stock_batches(product_id) REFERENCES products(id)
```

## Setup Instructions

### 1. Deploy SQL Function

Run the migration in your Supabase project:
```sql
-- Copy contents of supabase/migrations/001_bulk_insert_stock_batches.sql
-- Run in Supabase SQL editor
```

### 2. Use in React

```tsx
import { StockBatchBulkUpload } from "@/components/stock/stock-batch-bulk-upload";

export default function StockPage() {
  return (
    <div>
      <h1>Stock Inventory</h1>
      <StockBatchBulkUpload />
    </div>
  );
}
```

### 3. Add Route (Optional)

If you want a dedicated page:

```tsx
// app/dashboard/stock/bulk-upload/page.tsx
"use client";

import { StockBatchBulkUpload } from "@/components/stock/stock-batch-bulk-upload";

export default function BulkUploadPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <StockBatchBulkUpload />
    </div>
  );
}
```

## Security Features

✅ **Row Level Security (RLS)**
- All queries scoped to `auth.uid()`
- Function runs with `SECURITY DEFINER` but validates user

✅ **Input Validation**
- CSV parsing validates all fields
- Numeric ranges enforced
- SKU existence verified

✅ **Atomic Operations**
- Single RPC call
- All-or-nothing transaction
- No partial inserts

✅ **Authentication**
- Requires active Supabase session
- Returns 401 if not authenticated

## Type Definitions

```typescript
// CSV row after parsing
interface ParsedStockBatchRow {
  sku: string
  boxes_purchased: number
  quantity_per_box: number
  unit_per_box: string
  cost_per_box: number
  supplier_name?: string | null
}

// API response
interface BulkUploadResult {
  success: boolean
  inserted_count: number
  message: string
}

// Error response
interface StockBatchUploadError {
  error: string
  code?: string
  details?: string
}
```

## CSV Template Format

Download from `/api/stock/bulk-upload` (GET request):

```csv
sku,boxes_purchased,quantity_per_box,unit_per_box,cost_per_box,supplier_name
SUGAR-50KG,10,50,kg,2000,ABC Wholesale
GHEE-5KG,5,5,packet,4500,XYZ Traders
```

## Error Scenarios

| Scenario | HTTP Code | Message |
|----------|-----------|---------|
| No file uploaded | 400 | "No file provided" |
| Wrong file type | 400 | "Only CSV files are supported" |
| File too large | 400 | "File size must be less than 5MB" |
| Missing headers | 400 | "Missing required headers: ..." |
| Invalid numeric value | 400 | "Row X: quantity_per_box must be a positive number" |
| SKU doesn't exist | 400 | "Not all SKUs exist for current user. Found X of Y SKUs." |
| Not authenticated | 401 | "Unauthorized" |
| RLS violation | 403 | (Supabase RLS error) |
| Database error | 500 | "Failed to insert stock batches" |

## Performance Characteristics

- **CSV Parsing**: O(n) where n = rows
- **Database Insert**: O(n) set-based operation
- **Memory**: Streams file as text (low overhead)
- **Concurrency**: Full RLS isolation per user

## Limits

- Maximum 100 batches per file
- Maximum 5MB file size
- No concurrent uploads per user (can implement with unique constraint)

## Testing Checklist

- [ ] Deploy SQL function to Supabase
- [ ] Download CSV template from API
- [ ] Fill template with test data (ensure products exist)
- [ ] Upload via component
- [ ] Verify batches inserted in Supabase
- [ ] Test with missing SKU (should fail)
- [ ] Test with invalid numeric value (should fail)
- [ ] Test file size validation
- [ ] Test unauthorized access (logged out)

## Integration Notes

1. **CSV Parser**: Works independently, used by both component and API
2. **Types**: All shared via `lib/types.ts`
3. **No External Dependencies**: Uses only:
   - Next.js built-in APIs
   - Supabase client
   - React hooks
   - Custom CSV parser
4. **No AI/Gemini**: Pure validation logic

## Files Created

```
supabase/migrations/
  └─ 001_bulk_insert_stock_batches.sql

app/api/stock/bulk-upload/
  └─ route.ts

lib/
  ├─ csv-stock-parser.ts
  └─ types.ts (updated)

components/stock/
  └─ stock-batch-bulk-upload.tsx
```

## Support for Multiple Suppliers

Each row can have different `supplier_name`. The system tracks all suppliers per batch for audit trail and reordering.

## CSV Format Details

### Header Normalization
- Spaces converted to underscores
- Case-insensitive matching
- Quoted headers handled correctly

### Data Parsing
- Quoted fields preserve special characters
- Escaped quotes ("""") handled
- Empty supplier_name defaults to NULL

### Examples

Valid:
```csv
sku,boxes_purchased,quantity_per_box,unit_per_box,cost_per_box,supplier_name
TEST-001,5,10,kg,1000,Supplier A
```

Also valid (different header casing):
```csv
SKU,Boxes Purchased,Quantity Per Box,Unit Per Box,Cost Per Box,Supplier Name
TEST-001,5,10,kg,1000,Supplier A
```

Invalid (missing column):
```csv
sku,boxes_purchased,quantity_per_box,unit_per_box,cost_per_box
TEST-001,5,10,kg
# Missing supplier_name column and cost_per_box value
```
