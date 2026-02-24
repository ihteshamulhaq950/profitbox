'use client'

import { StockBatchBulkUpload } from '@/components/stock/stock-batch-bulk-upload'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function BulkUploadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header with back button */}
        <div className="mb-8">
          <Link href="/dashboard/inventory">
            <Button variant="outline" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Inventory
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Bulk Stock Upload</h1>
          <p className="text-gray-600 mt-2">
            Import multiple stock batches at once using a CSV file
          </p>
        </div>

        {/* Upload Component */}
        <StockBatchBulkUpload />
      </div>
    </div>
  )
}
