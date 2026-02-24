/**
 * POST /api/products/bulk
 * Handle bulk product creation with Gemini validation
 * Supports manual entry and file upload data
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  processBulkProductsWithGemini,
  validateProductSchema,
} from '@/lib/ai/gemini-bulk-processor'
import type { ParsedProductRow } from '@/lib/csv-parser'

interface BulkProductRequest {
  products: any[]
  source: 'manual' | 'file'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: BulkProductRequest = await request.json()

    if (!Array.isArray(body.products) || body.products.length === 0) {
      return NextResponse.json(
        { error: 'Products array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (body.products.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 products per request' },
        { status: 400 }
      )
    }

    // Normalize product data from various field naming conventions
    const normalizedProducts = body.products.map((p) => ({
      sku: String(p.sku || p.SKU || '').trim().toUpperCase(),
      name: String(p.name || p.Name || '').trim(),
      category: p.category || p.Category || null,
      description: p.description || p.Description || null,
      unit_type: String(p.unit_type || p.unitType || p['Unit Type'] || '').trim().toLowerCase(),
      base_unit: String(p.base_unit || p.baseUnit || p['Base Unit'] || '').trim().toLowerCase(),
      default_supplier: p.default_supplier || p.defaultSupplier || p['Default Supplier'] || null,
    })) as ParsedProductRow[]

    console.log('Normalized products:', normalizedProducts)

    // Validate basic schema format
    const invalidProducts = normalizedProducts.filter((p) => !validateProductSchema(p))
    if (invalidProducts.length > 0) {
      return NextResponse.json(
        {
          error: `${invalidProducts.length} product(s) have invalid schema. Check SKU, Name, Unit Type, and Base Unit.`,
          successCount: 0,
          failedCount: body.products.length,
          details: invalidProducts.slice(0, 5).map((p) => ({
            sku: p.sku,
            name: p.name,
            issue: 'Invalid unit_type/base_unit combination or missing required fields',
          })),
        },
        { status: 400 }
      )
    }

    // Process with Gemini for validation
    console.log(
      `[Bulk Products] Processing ${normalizedProducts.length} products with Gemini...`
    )
    const processedData = await processBulkProductsWithGemini(normalizedProducts)

    // Prepare products for insertion (only valid products)
    const productsToInsert = processedData.products.map((p) => ({
      user_id: user.id,
      sku: p.sku,
      name: p.name,
      category: p.category || null,
      description: p.description || null,
      image_url: null,
      unit_type: p.unit_type as 'weight' | 'count',
      base_unit: p.base_unit,
      default_supplier: p.default_supplier || null,
      is_active: true,
    }))

    if (productsToInsert.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid products to insert after Gemini validation',
          successCount: 0,
          failedCount: body.products.length,
        },
        { status: 400 }
      )
    }

    // Insert products into database
    const { data: insertedProducts, error: insertError } = await supabase
      .from('products')
      .insert(productsToInsert)
      .select()

    if (insertError) {
      console.error('Database insert error:', insertError)

      // Handle unique constraint violations
      if (insertError.code === '23505') {
        return NextResponse.json(
          {
            error: 'Some SKUs already exist. Products must have unique SKUs.',
            successCount: 0,
            failedCount: body.products.length,
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        {
          error: insertError.message || 'Failed to insert products',
          successCount: 0,
          failedCount: body.products.length,
        },
        { status: 400 }
      )
    }

    const successCount = insertedProducts?.length || 0
    const failedCount = processedData.invalid_products

    console.log(
      `[Bulk Products] Success: ${successCount}, Failed: ${failedCount}`
    )

    return NextResponse.json(
      {
        message: 'Products created successfully',
        successCount,
        failedCount,
        products: insertedProducts,
        validation: {
          total: processedData.total_products,
          valid: processedData.valid_products,
          invalid: processedData.invalid_products,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Bulk Products] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        successCount: 0,
        failedCount: 0,
      },
      { status: 500 }
    )
  }
}
