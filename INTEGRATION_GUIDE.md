-- =====================================================
-- STOCK BATCH UPLOAD INTEGRATION GUIDE
-- How to add the new forms to your inventory page
-- =====================================================

## FILES READY TO INTEGRATE

### 1. API Routes (Backend ✅ COMPLETE)

#### `/api/inventory/bulk-upload` [READY]
- **GET**: Download CSV template
- **POST**: Upload and process CSV file
- Returns: `{ success, inserted_count, message, error, missing_skus }`

#### `/api/inventory` [READY]
- **POST**: Add single batch (also used by manual form)
- Accepts JSON with product_id and batch details

### 2. React Components (Frontend ✅ COMPLETE)

#### `components/inventory/stock-batch-form.tsx` [READY]
- Two-step form for manual entry
- Step 1: Search product by name/SKU
- Step 2: Fill batch details with alert thresholds
- Self-contained, ready to import

### 3. Documentation (Reference ✅ COMPLETE)

#### `STOCK_BATCH_WORKFLOW_GUIDE.md`
- Complete guide covering both methods
- Validation rules, test scenarios, troubleshooting
- Dummy data reference

---

## CURRENT INVENTORY PAGE STRUCTURE

File: `app/dashboard/inventory/page.tsx`

**Current Features:**
- Product listing with pagination
- Inventory analytics
- Stock alerts display
- Search/filter functionality

**What Needs Adding:**
- [ ] Import StockBatchForm component
- [ ] Create tab/section for "Add Stock Batch"
- [ ] Button to open modal/form
- [ ] Refresh inventory after successful add

---

## STEP-BY-STEP INTEGRATION

### Step 1: Update Inventory Page

**File:** `app/dashboard/inventory/page.tsx`

```tsx
// Add to imports
import { StockBatchForm } from "@/components/inventory/stock-batch-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

// In your inventory page component:
export default function InventoryPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div>
      {/* Existing inventory content */}
      
      {/* Add button for stock batch form */}
      <div className="mb-4">
        <Button onClick={() => setIsFormOpen(true)}>
          Add Stock Batch
        </Button>
      </div>

      {/* Dialog with form */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Stock Batch</DialogTitle>
          </DialogHeader>
          <StockBatchForm />
        </DialogContent>
      </Dialog>

      {/* Rest of page */}
    </div>
  );
}
```

### Step 2: Create Bulk Upload Page (Optional)

**File:** `app/dashboard/inventory/bulk-upload/page.tsx` (NEW)

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Download, Loader2, Upload } from "lucide-react";

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type !== "text/csv") {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "CSV file must be under 5MB",
        variant: "destructive",
      });
      return;
    }
    setFile(selectedFile);
    setResult(null);
  };

  // Download template
  const downloadTemplate = async () => {
    try {
      const response = await fetch("/api/inventory/bulk-upload");
      const csvContent = await response.text();
      
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "stock_batches_template.csv";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download template",
        variant: "destructive",
      });
    }
  };

  // Upload CSV
  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/inventory/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          error: data.error || "Upload failed",
          ...(data.missing_skus && { missing_skus: data.missing_skus }),
        });
        toast({
          title: "Upload failed",
          description: data.error || "Failed to upload stock batches",
          variant: "destructive",
        });
      } else {
        setResult({
          success: true,
          inserted_count: data.inserted_count,
          message: data.message,
        });
        toast({
          title: "Success",
          description: `${data.inserted_count} stock batches inserted`,
        });
        setFile(null);
      }
    } catch (error) {
      setResult({
        success: false,
        error: "Network error. Please try again.",
      });
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bulk Upload Stock Batches</h1>
        <p className="text-gray-600 mt-2">Upload multiple stock batches at once from a CSV file</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Template Download */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Download className="w-8 h-8 text-blue-500" />
            <div>
              <h3 className="font-semibold">Download Template</h3>
              <p className="text-sm text-gray-600">Start with a correctly formatted CSV</p>
            </div>
          </div>
          <Button onClick={downloadTemplate} className="mt-4 w-full">
            Download Template
          </Button>
        </Card>

        {/* File Upload */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Upload className="w-8 h-8 text-green-500" />
            <div>
              <h3 className="font-semibold">Upload Your CSV</h3>
              <p className="text-sm text-gray-600">Select a filled CSV file to upload</p>
            </div>
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={loading}
            className="mb-4 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {file && (
            <p className="text-sm text-gray-600 mb-4">
              Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? "Uploading..." : "Upload Stock Batches"}
          </Button>
        </Card>
      </div>

      {/* Result */}
      {result && (
        result.success ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Success!</strong> {result.message} ({result.inserted_count} batches)
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Error:</strong> {result.error}
              {result.missing_skus && (
                <div className="mt-2">
                  <p className="text-sm">Missing SKUs: {result.missing_skus.join(", ")}</p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )
      )}

      {/* Instructions */}
      <Card className="p-6 bg-blue-50">
        <h3 className="font-semibold text-blue-900 mb-2">CSV Format Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li><strong>sku</strong>: Product SKU (must exist in products table)</li>
          <li><strong>batch_number</strong>: Optional, auto-generated if blank</li>
          <li><strong>boxes_purchased</strong>: Number of boxes (required)</li>
          <li><strong>cost_per_box</strong>: Price per box (required)</li>
          <li><strong>supplier_name</strong>: Optional, your supplier name</li>
          <li><strong>purchase_date</strong>: YYYY-MM-DD format (optional)</li>
          <li><strong>reorder_level</strong>: Warning threshold (required)</li>
          <li><strong>critical_level</strong>: Critical threshold ≤ reorder_level (required)</li>
        </ul>
      </Card>
    </div>
  );
}
```

### Step 3: Add Bulk Upload Link to Nav

**File:** `components/dashboard/dashboard-nav.tsx`

Add to the navigation:

```tsx
{
  href: "/dashboard/inventory/bulk-upload",
  label: "Bulk Upload",
  icon: <Upload className="w-4 h-4" />,
}
```

Or add within inventory section:

```tsx
<NavItem href="/dashboard/inventory/bulk-upload" label="Bulk Upload" />
```

---

## COMPONENT USAGE

### Using StockBatchForm

```tsx
import { StockBatchForm } from "@/components/inventory/stock-batch-form";

// In your component
<StockBatchForm />

// Features:
// - Two-step form (search → details)
// - Auto-calculates alert status
// - Includes reorder_level and critical_level fields
// - Validates critical_level ≤ reorder_level
// - Success message and form reset
```

### Using Bulk Upload API

```tsx
// Download template
const response = await fetch("/api/inventory/bulk-upload");
const csvContent = await response.text();

// Upload CSV
const formData = new FormData();
formData.append("file", csvFile);
const result = await fetch("/api/inventory/bulk-upload", {
  method: "POST",
  body: formData,
});
const data = await result.json();
// data: { success, inserted_count, message, error, missing_skus }
```

---

## FIELD REFERENCE

### Stock Batch Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| product_id | UUID | Yes | From product search |
| batch_number | String | No | Auto-generated if blank: `${SKU}-${year}-${randomId}` |
| boxes_purchased | Integer | Yes | Must be > 0 |
| boxes_remaining | Integer | Auto | Set to boxes_purchased initially |
| quantity_per_box | Decimal | No | Default: 1 |
| unit_per_box | String | No | Default: "box" |
| cost_per_box | Decimal | Yes | Non-negative |
| supplier_name | String | No | Optional |
| purchase_date | Date | No | Defaults to today |
| reorder_level | Integer | Yes | Warning threshold |
| critical_level | Integer | Yes | Critical threshold (≤ reorder_level) |
| alert_status | String | Auto | "healthy", "warning", or "critical" |
| status | String | Auto | Set to "active" |

### CSV Headers (Bulk Upload)

```
sku,batch_number,boxes_purchased,cost_per_box,supplier_name,purchase_date,reorder_level,critical_level
```

---

## ERROR HANDLING

### Manual Form Errors
- Product not found: Show in search results
- Validation error: Show inline under field
- API error: Show toast notification + alert box

### Bulk Upload Errors
- File not CSV: Toast + reject
- File too large: Toast + reject
- Missing headers: Return 400 + error message
- Invalid rows: Return 400 + row numbers with errors
- Missing SKUs: Return 400 with list of missing SKUs
- Invalid thresholds: Return 400 + row numbers

### Success Handling
- Manual form: Reset and show success message
- Bulk upload: Show count of inserted batches, allow new upload

---

## TESTING CHECKLIST

### Manual Form
- [ ] Search product by name
- [ ] Search product by SKU
- [ ] Fill all required fields
- [ ] Alert status shows correctly (healthy/warning/critical)
- [ ] Reorder level > critical level validation works
- [ ] Submit button creates batch
- [ ] Form resets after success
- [ ] Toast notification shows

### Bulk Upload
- [ ] Download template button works
- [ ] CSV file selection works
- [ ] File type validation (CSV only)
- [ ] File size validation
- [ ] Upload with valid CSV succeeds
- [ ] Invalid SKU causes rollback
- [ ] Invalid threshold causes error
- [ ] Success shows batch count
- [ ] All SKUs still cannot upload partially

---

## SAMPLE TEST DATA

CSV file: `sample-data/stock_batches_bulk_upload.csv`

**15 batches ready to test:**
- 2 batches each for SKU001-SKU005
- 1 batch each for SKU006-SKU010
- All fields populated with realistic values
- Different alert threshold levels

---

## NEXT STEPS

1. **Copy StockBatchForm component** (already created)
2. **Import into inventory page** (with modal dialog)
3. **Create bulk upload page** (optional but recommended)
4. **Add navigation links**
5. **Test both workflows**
6. **Deploy and monitor**

---

## QUICK REFERENCE

**Manual Entry:** Best for 1-3 batches, interactive UI  
**Bulk Upload:** Best for 10+ batches, via CSV file

Both use same validation rules and alert calculations.  
Both auto-generate batch numbers if not provided.  
Both support new alert threshold fields.

---

## FILES CREATED/MODIFIED

### NEW Files (Ready to integrate):
- ✅ `app/api/inventory/bulk-upload/route.ts` - API for CSV upload
- ✅ `components/inventory/stock-batch-form.tsx` - Manual form component
- ✅ `STOCK_BATCH_WORKFLOW_GUIDE.md` - Comprehensive guide
- ✅ `INTEGRATION_GUIDE.md` - This file

### TO MODIFY (for integration):
- 📝 `app/dashboard/inventory/page.tsx` - Add form modal
- 📝 `components/dashboard/dashboard-nav.tsx` - Add bulk upload link

### EXISTING (no changes):
- ✅ `app/api/inventory/route.ts` - Already handles single inserts
- ✅ Database schema - Already has all fields
- ✅ Sample data - Already updated with new format

---

## QUESTIONS?

Check `STOCK_BATCH_WORKFLOW_GUIDE.md` for:
- How the system works
- Validation rules
- Test scenarios
- Troubleshooting
- Best practices

