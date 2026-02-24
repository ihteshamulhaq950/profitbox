import { ParsedSalesRow } from "@/lib/types";

/**
 * Parses CSV for sales bulk upload
 * Expected format: product_id, batch_id, boxes_sold, selling_price_per_box, customer_name, notes, created_at
 */
export function parseSalesCSV(csvContent: string): ParsedSalesRow[] {
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
  const requiredHeaders = ["product_id", "batch_id", "boxes_sold", "selling_price_per_box"];
  const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(
      `Missing required headers: ${missingHeaders.join(", ")}`
    );
  }

  // Parse data rows
  const rows: ParsedSalesRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = parseCsvLine(line);
    if (values.length < requiredHeaders.length) {
      throw new Error(`Row ${i + 1}: Not enough columns`);
    }

    const rowData: Record<string, any> = {};
    headers.forEach((header, index) => {
      rowData[header] = values[index]?.trim() || "";
    });

    // Validate and convert row
    try {
      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!rowData.product_id || !uuidRegex.test(rowData.product_id)) {
        throw new Error(
          `product_id must be a valid UUID, got: ${rowData.product_id}`
        );
      }

      if (!rowData.batch_id || !uuidRegex.test(rowData.batch_id)) {
        throw new Error(
          `batch_id must be a valid UUID, got: ${rowData.batch_id}`
        );
      }

      const boxesSold = parseInt(rowData.boxes_sold);
      if (isNaN(boxesSold) || boxesSold <= 0) {
        throw new Error(
          `boxes_sold must be a positive integer, got: ${rowData.boxes_sold}`
        );
      }

      const sellingPrice = parseFloat(rowData.selling_price_per_box);
      if (isNaN(sellingPrice) || sellingPrice < 0) {
        throw new Error(
          `selling_price_per_box must be a non-negative number, got: ${rowData.selling_price_per_box}`
        );
      }

      const row: ParsedSalesRow = {
        product_id: rowData.product_id,
        batch_id: rowData.batch_id,
        boxes_sold: boxesSold,
        selling_price_per_box: sellingPrice,
        customer_name: rowData.customer_name || null,
        notes: rowData.notes || null,
        created_at: rowData.created_at || undefined,
      };

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
    throw new Error("Maximum 100 sales per upload");
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
 * Generates a CSV template for sales bulk upload
 */
export function generateSalesCSVTemplate(): string {
  const headers = [
    "product_id",
    "batch_id",
    "boxes_sold",
    "selling_price_per_box",
    "customer_name",
    "notes",
    "created_at",
  ];
  
  return [
    headers.join(","),
    "3ea93e55-3ece-4fa0-b811-5d6c48819d74,a3e0e18c-1234-5678-abcd-ef1234567890,5,3500,Usman,Bulk order,2026-02-18T10:00:00Z",
    "68af5bef-04e3-42ff-a289-1850691d5684,7044347e-cff9-469c-94d9-9af5ab0a6d1c,10,3300,Ahmed,Regular customer,2026-02-18T11:00:00Z",
  ].join("\n");
}
