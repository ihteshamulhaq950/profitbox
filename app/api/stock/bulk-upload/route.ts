import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { parseStockBatchCSV, generateStockBatchTemplate } from "@/lib/csv-stock-parser";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Get file from FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only CSV files are supported" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Read file content
    const csvContent = await file.text();

    // Step 1: Parse CSV
    let parsedRows;
    try {
      parsedRows = parseStockBatchCSV(csvContent);
    } catch (parseError) {
      return NextResponse.json(
        {
          error: "CSV parsing failed",
          details: parseError instanceof Error ? parseError.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    // Step 2: Extract unique SKUs from parsed rows
    const skus = [...new Set(parsedRows.map((r) => r.sku))];
    console.log("✅ Extracted SKUs from CSV:", skus);
    console.log("📊 User ID:", user.id);

    // Step 3: Fetch all products in ONE query using .in()
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, sku")
      .eq("user_id", user.id)
      .in("sku", skus);

    console.log("🔍 Products query error:", productsError);
    console.log("✅ Found products:", products?.map(p => ({ sku: p.sku, id: p.id })));

    if (productsError) {
      console.error("Product fetch error:", productsError);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    // Step 4: Check if all SKUs were found
    const foundSkus = new Set((products || []).map((p) => p.sku));
    console.log("📌 Found SKUs in database:", Array.from(foundSkus));
    
    const missingSkus = skus.filter((sku) => !foundSkus.has(sku));
    console.log("⚠️ Missing SKUs:", missingSkus);

    if (missingSkus.length > 0) {
      return NextResponse.json(
        {
          error: `The following SKUs do not exist: ${missingSkus.join(", ")}. Please create these products first.`,
          missing_skus: missingSkus,
        },
        { status: 400 }
      );
    }

    // Step 5: Build SKU → Product ID lookup map (O(1) lookup)
    const skuToProductId = new Map<string, string>();
    (products || []).forEach((p) => {
      skuToProductId.set(p.sku, p.id);
    });

    // Step 6: Transform CSV rows → StockBatch insert objects
    const batchesToInsert = parsedRows.map((row) => {
      const productId = skuToProductId.get(row.sku);
      const boxesRemaining = row.boxes_remaining ?? row.boxes_purchased;
      
      // Calculate alert status
      const alert_status = 
        boxesRemaining <= (row.critical_level || 0) ? 'critical' :
        boxesRemaining <= (row.reorder_level || 0) ? 'warning' :
        'healthy';

      return {
        user_id: user.id,
        product_id: productId,
        batch_number: row.batch_number,
        boxes_purchased: row.boxes_purchased,
        boxes_remaining: boxesRemaining,
        quantity_per_box: row.quantity_per_box,
        unit_per_box: row.unit_per_box,
        cost_per_box: row.cost_per_box,
        supplier_name: row.supplier_name || null,
        reorder_level: row.reorder_level || 0,
        critical_level: row.critical_level || 0,
        alert_status,
        status: "active",
      };
    });

    // Step 7: Bulk insert all batches using .insert()
    const { data: insertedBatches, error: insertError } = await supabase
      .from("stock_batches")
      .insert(batchesToInsert)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        {
          error: "Failed to insert stock batches",
          details: insertError.message,
        },
        { status: 400 }
      );
    }

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        inserted_count: insertedBatches?.length || 0,
        total_rows: parsedRows.length,
        message: `Successfully inserted ${insertedBatches?.length || 0} stock batches`,
        data: insertedBatches,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint returns CSV template for download
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const template = generateStockBatchTemplate();

    return new Response(template, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="stock_batch_template.csv"',
      },
    });
  } catch (error) {
    console.error("Template error:", error);
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    );
  }
}
