# Bulk Product Import - Quick Start Guide

## What's New?

Your Products page now has a **"Bulk Add"** button that lets you add multiple products at once in two ways:
- 📝 **Manual Entry**: Type in products one by one
- 📤 **File Upload**: Import from CSV files

---

## How to Add Products Manually

1. **Click "Bulk Add"** button in the Products page
2. **Select "Add Manually"** tab (it's already selected by default)
3. **Fill in product details**:
   - SKU (required) - e.g., `SUGAR001`
   - Name (required) - e.g., `Sugar`
   - Category - e.g., `Groceries` (optional)
   - Default Supplier - e.g., `Local Supplier` (optional)
   - Unit Type - Choose between:
     - **Weight**: For kg, g, lb, oz
     - **Count**: For box, packet, piece, bottle, can, carton, dozen
   - Base Unit - Automatically filtered based on unit type
   - Description (optional)

4. **Add more products** - Click "+ Add Another Product" button
5. **Review your entries** - Make sure all required fields are filled
6. **Click "Add Products"** - The system will validate and save them
7. **See the confirmation** - You'll get a success message!

---

## How to Upload Products from CSV

### Step 1: Prepare Your CSV File

**Option A: Download Our Template**
1. Click "Bulk Add" → "Upload File" tab
2. Click "Download CSV Template"
3. Fill in your products in the downloaded template

**Option B: Create Your Own CSV**

Make sure your CSV has these columns (in any order):
```
SKU, Name, Category, Description, Unit Type, Base Unit, Default Supplier
```

Example:
```csv
SKU,Name,Category,Description,Unit Type,Base Unit,Default Supplier
SUGAR001,Sugar,Groceries,White sugar,count,bag,Local Supplier
FLOUR001,Flour,Groceries,All-purpose flour,weight,kg,Local Supplier
RICE001,Rice,Groceries,Basmati rice,weight,kg,Local Supplier
OIL001,Cooking Oil,Groceries,Pure vegetable oil,weight,liter,Supplier Z
```

### Step 2: Upload the File

1. Click **"Bulk Add"** button
2. Select **"Upload File"** tab
3. **Drag & drop** your CSV file or click to select
4. **Review the preview** - First few rows will show
5. Click **"Upload & Process"**
6. **Wait for completion** - You'll see a progress bar
7. **Get results** - Number of successful/failed uploads

---

## Required vs Optional Fields

### Required Fields
- **SKU**: Product code (e.g., `SUGAR001`)
  - Must be unique
  - Will be converted to uppercase
- **Name**: Product name (e.g., `Sugar`)
- **Unit Type**: `weight` or `count`
- **Base Unit**: Must match the unit type

### Optional Fields
- **Category**: Product category
- **Description**: Product details
- **Default Supplier**: Supplier name

---

## Unit Type Reference

### Weight Unit Type
Valid base units: `kg`, `g`, `lb`, `oz`

Examples:
- Sugar: weight → kg
- Flour: weight → kg  
- Oil: weight → liter

### Count Unit Type
Valid base units: `box`, `packet`, `piece`, `bottle`, `can`, `carton`, `dozen`

Examples:
- Tissue: count → box
- Spices: count → packet
- Candy: count → piece
- Water: count → bottle

---

## Tips & Tricks

✅ **Do:**
- Use the template CSV for easiest setup
- Keep SKUs short and meaningful
- Use consistent naming (e.g., always "Sugar" not "SUGAR" and "sugar")
- Check preview before uploading files
- Add categories for better organization

❌ **Don't:**
- Mix spaces in SKUs (use `SUGAR_001` not `SUGAR 001`)
- Duplicate SKUs across products
- Use special characters in names
- Leave required fields empty
- Copy from Excel without saving as CSV first

---

## Troubleshooting

### "File not found" or "Can't upload"
→ Make sure file is less than 5MB and is CSV format

### "Missing required columns"
→ Check that your CSV has: SKU, Name, Unit Type, Base Unit

### "SKU already exists"
→ Your product list already has that SKU. Either:
- Edit the existing product instead
- Use a different SKU (e.g., add a number: `SUGAR002`)

### "Invalid unit type"
→ Unit Type must be exactly `weight` or `count` (lowercase)

### "Base Unit doesn't match"
→ If Unit Type is `weight`, base unit must be: kg, g, lb, or oz
→ If Unit Type is `count`, base unit must be: box, packet, piece, bottle, can, carton, or dozen

---

## CSV Format Rules

📋 **Important:**
1. **Headers are required** (at least one data row)
2. **Commas separate columns** (use CSV format, not TSV)
3. **Quotes around fields with commas**: `"Product, Inc."` 
4. **UTF-8 encoding** recommended
5. **Max 50 products per upload**
6. **Column names are case-insensitive**

Example with quoted field:
```csv
SKU,Name,Category,Description,Unit Type,Base Unit,Default Supplier
BRAND001,"Company, Inc.",Brands,Leading brands,count,box,Main Supplier
```

---

## What Happens After Upload?

1. **Validation**: AI checks your data format
2. **Insertion**: Products added to your catalog
3. **Report**: You see how many succeeded/failed
4. **Refresh**: Product list updates automatically

---

## Questions?

If you need help:
1. Check the error message shown in the app
2. Review this guide's troubleshooting section
3. Check your product names and unit types
4. Try the template CSV format first

Happy bulk importing! 🚀
