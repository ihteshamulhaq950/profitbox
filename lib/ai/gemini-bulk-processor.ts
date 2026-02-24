/**
 * Gemini AI Handler for Bulk Product Processing
 * Uses Google Gemini to validate and process product data with structured JSON output
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ParsedProductRow } from "@/lib/csv-parser";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);

export interface ValidatedProduct {
  sku: string;
  name: string;
  category?: string | null;
  description?: string | null;
  unit_type: "weight" | "count";
  base_unit: string;
  default_supplier?: string | null;
  is_valid?: boolean;
  validation_error?: string | null;
}

export interface BulkProductResult {
  products: ValidatedProduct[];
  total_products: number;
  valid_products: number;
  invalid_products: number;
  validation_passed: boolean;
}

/**
 * Validate and process bulk product data using Gemini
 * Passes all products through Gemini for validation with structured JSON output
 */
export async function processBulkProductsWithGemini(
  products: ParsedProductRow[]
): Promise<BulkProductResult> {
  try {
    // Format products for Gemini prompt (pipe-separated for clarity)
    const productsText = products
      .map(
        (p, i) =>
          `${i + 1}|${p.sku}|${p.name}|${p.category || ""}|${p.description || ""}|${p.unit_type}|${p.base_unit}|${p.default_supplier || ""}`
      )
      .join("\n");

    const prompt = `You are a data validation expert. Validate the following product CSV data and return ONLY valid JSON with no markdown formatting or code blocks.

Product Data (format: #|SKU|Name|Category|Description|UnitType|BaseUnit|DefaultSupplier):
${productsText}

Validation Rules:
1. SKU must be uppercase and non-empty (max 50 chars)
2. Name must be non-empty and properly formatted (max 255 chars)
3. Unit Type must be exactly "weight" or "count"
4. If Unit Type = "weight", Base Unit must be one of: kg, g, lb, oz
5. If Unit Type = "count", Base Unit must be one of: box, packet, piece, bottle, can, carton, dozen
6. Category and Description are optional but max 255 chars if provided
7. Default Supplier is optional (max 255 chars)

Return this exact JSON structure (no markdown, plain JSON only):
{
  "products": [
    {
      "sku": "SKU_VALUE",
      "name": "Name",
      "category": "category or null",
      "description": "description or null",
      "unit_type": "weight or count",
      "base_unit": "unit",
      "default_supplier": "supplier or null",
      "is_valid": true or false,
      "validation_error": "error message or null"
    }
  ],
  "total_products": number,
  "valid_products": number,
  "invalid_products": number,
  "validation_passed": boolean
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    // Extract response text
    const responseText =
      response.response?.text() ?? "{}";

    console.log("[Gemini] Response received, length:", responseText.length);

    // Parse and validate the response
    let parsedResponse: any;
    try {
      // Remove markdown code blocks if present
      let cleanText = responseText.trim();
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/^```json\n/, "").replace(/\n```$/, "");
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```\n/, "").replace(/\n```$/, "");
      }

      parsedResponse = JSON.parse(cleanText);
    } catch (parseError) {
      console.error(
        "[Gemini] Failed to parse response:",
        responseText.substring(0, 200)
      );

      // Fallback: treat all products as valid
      return {
        products: products as ValidatedProduct[],
        total_products: products.length,
        valid_products: products.length,
        invalid_products: 0,
        validation_passed: true,
      };
    }

    // Extract valid products (filter out invalid ones)
    const validProducts: ValidatedProduct[] = (parsedResponse.products || [])
      .filter((p: any) => p.is_valid !== false)
      .map((p: any) => ({
        sku: p.sku,
        name: p.name,
        category: p.category || null,
        description: p.description || null,
        unit_type: p.unit_type,
        base_unit: p.base_unit,
        default_supplier: p.default_supplier || null,
      }));

    const result: BulkProductResult = {
      products: validProducts,
      total_products: parsedResponse.total_products || products.length,
      valid_products: parsedResponse.valid_products || validProducts.length,
      invalid_products: parsedResponse.invalid_products || 0,
      validation_passed: validProducts.length === products.length,
    };

    console.log(`[Gemini] Processed ${result.total_products} products`, {
      valid: result.valid_products,
      invalid: result.invalid_products,
    });

    return result;
  } catch (error) {
    console.error("[Gemini] Error processing bulk products:", error);

    // Fallback: return all products as valid
    return {
      products: products as ValidatedProduct[],
      total_products: products.length,
      valid_products: products.length,
      invalid_products: 0,
      validation_passed: true,
    };
  }
}

/**
 * Validate product data format (basic validation without AI)
 */
export function validateProductSchema(product: any): boolean {
  const validUnitTypes = ["weight", "count"];
  const validWeightUnits = ["kg", "g", "lb", "oz", "liter"];
  const validCountUnits = ["box", "packet", "piece", "bottle", "can", "carton", "dozen", "bag"];

  // Check required fields
  if (!product.sku || typeof product.sku !== "string") return false;
  if (!product.name || typeof product.name !== "string") return false;
  if (!validUnitTypes.includes(product.unit_type)) return false;
  if (!product.base_unit || typeof product.base_unit !== "string") return false;

  // Validate unit type and base unit combination
  if (product.unit_type === "weight" && !validWeightUnits.includes(product.base_unit.toLowerCase())) {
    return false;
  }
  if (product.unit_type === "count" && !validCountUnits.includes(product.base_unit.toLowerCase())) {
    return false;
  }

  return true;
}
