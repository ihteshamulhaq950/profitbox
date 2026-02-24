import { createClient } from "@/lib/supabase/server";
import { generateStockBatchTemplate } from "@/lib/csv-stock-parser";

export async function GET() {
  try {
    // Get Supabase client
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Generate CSV template from parser
    const csvTemplate = generateStockBatchTemplate();

    return new Response(csvTemplate, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition":
          "attachment; filename=stock_batches_template.csv",
      },
    });
  } catch (error) {
    console.error("Error generating template:", error);
    return Response.json(
      { error: "Failed to generate template" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Get Supabase client
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      return Response.json(
        { error: "Only CSV files are supported" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return Response.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Read CSV file
    const fileContent = await file.text();

    // Step 1: Parse CSV using the dedicated parser
    const { parseStockBatchCSV } = await import("@/lib/csv-stock-parser");
    let rows;
    try {
      rows = parseStockBatchCSV(fileContent);
    } catch (parseError) {
      return Response.json(
        { error: parseError instanceof Error ? parseError.message : "CSV parsing failed" },
        { status: 400 }
      );
    }

    // Step 2: Extract unique SKUs from parsed rows
    const skus = [...new Set(rows.map((r) => r.sku))];

    // Step 3: Fetch all products in ONE query using .in()
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, sku")
      .eq("user_id", user.id)
      .in("sku", skus);

    if (productsError) {
      console.error("Product fetch error:", productsError);
      return Response.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    // Step 4: Check if all SKUs were found
    const foundSkus = new Set((products || []).map((p) => p.sku));
    const missingSkus = skus.filter((sku) => !foundSkus.has(sku));

    if (missingSkus.length > 0) {
      return Response.json(
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
    const batchesToInsert = rows.map((row) => {
      const productId = skuToProductId.get(row.sku);
      const boxesRemaining = row.boxes_remaining ?? row.boxes_purchased;
      
      // Calculate alert_status
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

    // Step 7: Bulk insert all batches
    const { data: insertedBatches, error: insertError } = await supabase
      .from("stock_batches")
      .insert(batchesToInsert)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return Response.json(
        { 
          error: "Failed to insert stock batches",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    // Success response
    return Response.json({
      success: true,
      inserted_count: insertedBatches?.length || 0,
      total_rows: rows.length,
      message: `Successfully inserted ${insertedBatches?.length || 0} stock batches`,
      data: insertedBatches,
    });
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
