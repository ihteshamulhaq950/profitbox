/**
 * POST /api/products/bulk-upload
 * Handle file uploads (CSV/Excel) and process them
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parseCSV } from '@/lib/csv-parser'

// export const config = {
//   api: {
//     bodyParser: {
//       sizeLimit: '5mb',
//     },
//   },
// }

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File

    console.log('Received file:', file)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file
    const validExtensions = ['.csv', '.xlsx', '.xls']
    const fileName = file.name.toLowerCase()
    const hasValidExtension = validExtensions.some((ext) => fileName.endsWith(ext))

    if (!hasValidExtension) {
      return NextResponse.json(
        { error: 'Only CSV and Excel files are supported' },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Read file content
    const fileContent = await file.text()

    // Parse CSV (for Excel, we'd need a library, but CSV is primary)
    let products
    try {
      if (fileName.endsWith('.csv')) {
        products = parseCSV(fileContent)
        console.log('Parsed products:', products)
      } else {
        // For Excel files, instruct user to convert to CSV
        return NextResponse.json(
          {
            error:
              'Please save your Excel file as CSV before uploading. Some systems may support direct Excel upload in the future.',
            successCount: 0,
            failedCount: 0,
          },
          { status: 400 }
        )
      }
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Failed to parse file'
      console.error('CSV Parse Error:', parseError)
      return NextResponse.json(
        {
          error: `Failed to parse file: ${errorMessage}`,
          successCount: 0,
          failedCount: 0,
        },
        { status: 400 }
      )
    }

    // Forward to bulk products endpoint
    const bulkResponse = await fetch(`${request.nextUrl.origin}/api/products/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        products,
        source: 'file',
      }),
    })

    const bulkData = await bulkResponse.json()

    return NextResponse.json(bulkData, { status: bulkResponse.status })
  } catch (error) {
    console.error('[File Upload] Error:', error)
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
