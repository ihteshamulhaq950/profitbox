import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Diagnostic endpoint to check what products exist for the current user
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all products for this user
    const { data: allProducts, error: allError } = await supabase
      .from("products")
      .select("id, sku, name")
      .eq("user_id", user.id)
      .order("sku");

    if (allError) {
      return NextResponse.json(
        { error: "Failed to fetch products", details: allError },
        { status: 500 }
      );
    }

    // Get specific SKUs as query param
    const searchParams = request.nextUrl.searchParams;
    const skusParam = searchParams.get("skus");

    if (skusParam) {
      const skus = skusParam.split(",").map((s) => s.trim());
      
      const { data: foundProducts, error: foundError } = await supabase
        .from("products")
        .select("id, sku, name")
        .eq("user_id", user.id)
        .in("sku", skus);

      if (foundError) {
        return NextResponse.json(
          { error: "Failed to search products", details: foundError },
          { status: 500 }
        );
      }

      const foundSkus = new Set(foundProducts?.map((p) => p.sku) || []);
      const missingSkus = skus.filter((sku) => !foundSkus.has(sku));

      return NextResponse.json({
        user_id: user.id,
        searched_skus: skus,
        found_count: foundProducts?.length || 0,
        found_products: foundProducts,
        missing_skus: missingSkus,
        all_products_count: allProducts?.length || 0,
        all_products: allProducts,
      });
    }

    return NextResponse.json({
      user_id: user.id,
      total_products: allProducts?.length || 0,
      products: allProducts,
      note: "Use ?skus=SKU1,SKU2,SKU3 to check specific SKUs",
    });
  } catch (error) {
    console.error("Diagnostic error:", error);
    return NextResponse.json(
      {
        error: "Diagnostic failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
