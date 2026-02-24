import { ParsedStockBatchRow } from "@/lib/types";

/**
 * Parses CSV for stock batch upload
 * Expected format: sku,boxes_purchased,quantity_per_box,unit_per_box,cost_per_box,supplier_name,reorder_level,critical_level
 */
export function parseStockBatchCSV(csvContent: string): ParsedStockBatchRow[] {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  
  if (lines.length < 2) {
    throw new Error("CSV must contain header and at least one data row");
  }

  // Parse header
  const headerLine = lines[0].toLowerCase();
  const headers = parseCsvLine(headerLine).map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, "_").replace(/"/g, "")
  );

  // Validate required headers
  const requiredHeaders = [
    "sku",
    "boxes_purchased",
    "quantity_per_box",
    "unit_per_box",
    "cost_per_box",
  ];
  const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(
      `Missing required headers: ${missingHeaders.join(", ")}`
    );
  }

  // Parse data rows
  const rows: ParsedStockBatchRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1}: Expected ${headers.length} columns, got ${values.length}`);
    }

    const rowData: Record<string, any> = {};
    headers.forEach((header, index) => {
      rowData[header] = values[index].trim();
    });

    // Validate and convert row
    try {
      const row: ParsedStockBatchRow = {
        sku: rowData.sku.toUpperCase(), // Normalize to uppercase for case-insensitive matching
        batch_number: rowData.batch_number || null,
        boxes_purchased: parseInt(rowData.boxes_purchased),
        boxes_remaining: rowData.boxes_remaining ? parseInt(rowData.boxes_remaining) : undefined,
        quantity_per_box: parseFloat(rowData.quantity_per_box),
        unit_per_box: rowData.unit_per_box,
        cost_per_box: parseFloat(rowData.cost_per_box),
        supplier_name: rowData.supplier_name || null,
        reorder_level: rowData.reorder_level ? parseInt(rowData.reorder_level) : undefined,
        critical_level: rowData.critical_level ? parseInt(rowData.critical_level) : undefined,
      };

      // Validate
      if (!row.sku || row.sku.trim().length === 0) {
        throw new Error("SKU is required");
      }
      if (isNaN(row.boxes_purchased) || row.boxes_purchased <= 0) {
        throw new Error("boxes_purchased must be a positive integer");
      }
      if (isNaN(row.quantity_per_box) || row.quantity_per_box <= 0) {
        throw new Error("quantity_per_box must be a positive number");
      }
      if (!row.unit_per_box || row.unit_per_box.trim().length === 0) {
        throw new Error("unit_per_box is required");
      }
      if (isNaN(row.cost_per_box) || row.cost_per_box <= 0) {
        throw new Error("cost_per_box must be a positive number");
      }

      // Validate boxes_remaining if provided
      if (row.boxes_remaining !== undefined) {
        if (isNaN(row.boxes_remaining) || row.boxes_remaining < 0) {
          throw new Error("boxes_remaining must be a non-negative integer");
        }
        if (row.boxes_remaining > row.boxes_purchased) {
          throw new Error("boxes_remaining cannot exceed boxes_purchased");
        }
      }
      
      // Validate alert thresholds if provided
      if (row.reorder_level !== undefined && row.reorder_level < 0) {
        throw new Error("reorder_level must be >= 0");
      }
      if (row.critical_level !== undefined && row.critical_level < 0) {
        throw new Error("critical_level must be >= 0");
      }
      if (
        row.reorder_level !== undefined && 
        row.critical_level !== undefined && 
        row.critical_level > row.reorder_level
      ) {
        throw new Error("critical_level must be <= reorder_level");
      }

      rows.push(row);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Row ${i + 1}: ${message}`);
    }
  }

  if (rows.length === 0) {
    throw new Error("No valid data rows found in CSV");
  }

  // Validate max 100 rows
  if (rows.length > 100) {
    throw new Error("Maximum 100 stock batches per upload");
  }

  return rows;
}

/**
 * Parses a single CSV line, handling quoted fields and escape sequences
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      // End of field
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

/**
 * Generates a CSV template for stock batch upload
 */
export function generateStockBatchTemplate(): string {
  const headers = [
    "sku",
    "batch_number",
    "boxes_purchased",
    "boxes_remaining",
    "quantity_per_box",
    "unit_per_box",
    "cost_per_box",
    "supplier_name",
    "reorder_level",
    "critical_level",
  ];
  const example1 = [
    "SKU-Premium-2026-5739",
    "BATCH-Premium-2026-1847",
    "500",
    "500",
    "25",
    "kg",
    "350.00",
    "Global Coffee Co.",
    "50",
    "20",
  ];
  const example2 = [
    "SKU-Tea-2026-2841",
    "BATCH-Tea-2026-5316",
    "400",
    "400",
    "10",
    "kg",
    "200.00",
    "Tea Masters Ltd.",
    "40",
    "15",
  ];

  return [
    headers.join(","),
    example1.join(","),
    example2.join(","),
  ].join("\n");
}
