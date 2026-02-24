/**
 * CSV Parser Utility
 * Handles parsing CSV and Excel files for product imports
 */

export interface ParsedProductRow {
  sku: string
  name: string
  category?: string
  description?: string
  unit_type: 'weight' | 'count'
  base_unit: string
  default_supplier?: string
}

/**
 * Parse CSV content into product rows
 */
export function parseCSV(csvContent: string): ParsedProductRow[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header and one data row')
  }

  const headers = lines[0]
    .split(',')
    .map((h) => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/"/g, ''))

  const requiredHeaders = ['sku', 'name', 'unit_type', 'base_unit']
  const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`)
  }

  const products: ParsedProductRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines

    const cells = parseCSVLine(line)
    if (cells.length < requiredHeaders.length) {
      console.warn(`Skipping row ${i + 1}: insufficient columns`)
      continue
    }

    const skuIdx = headers.indexOf('sku')
    const nameIdx = headers.indexOf('name')
    const categoryIdx = headers.indexOf('category')
    const descIdx = headers.indexOf('description')
    const unitTypeIdx = headers.indexOf('unit_type')
    const baseUnitIdx = headers.indexOf('base_unit')
    const supplierIdx = headers.indexOf('default_supplier')

    const sku = cells[skuIdx]?.trim()
    const name = cells[nameIdx]?.trim()
    const category = cells[categoryIdx]?.trim() || undefined
    const description = cells[descIdx]?.trim() || undefined
    const unit_type = cells[unitTypeIdx]?.trim().toLowerCase() as 'weight' | 'count'
    const base_unit = cells[baseUnitIdx]?.trim().toLowerCase()
    const default_supplier = cells[supplierIdx]?.trim() || undefined

    if (!sku || !name) {
      console.warn(`Skipping row ${i + 1}: missing required fields`)
      continue
    }

    if (!['weight', 'count'].includes(unit_type)) {
      console.warn(`Skipping row ${i + 1}: invalid unit_type`)
      continue
    }

    products.push({
      sku: sku.toUpperCase(),
      name,
      category,
      description,
      unit_type,
      base_unit,
      default_supplier,
    })
  }

  if (products.length === 0) {
    throw new Error('No valid products found in CSV')
  }

  if (products.length > 50) {
    throw new Error('Maximum 50 products per import')
  }

  return products
}

/**
 * Parse a single CSV line (handles quoted fields)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let insideQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes
      }
    } else if (char === ',' && !insideQuotes) {
      // Column separator
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

/**
 * Parse Excel file (requires xlsx library)
 * This is a placeholder - you'll need to add xlsx package if you want full Excel support
 */
export async function parseExcel(file: File): Promise<ParsedProductRow[]> {
  // For now, we'll convert Excel to CSV using a basic approach
  // In production, you'd use a library like xlsx
  throw new Error(
    'Excel parsing requires xlsx library. Please use CSV format or upload through the UI.'
  )
}
