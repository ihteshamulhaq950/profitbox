import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { SalesBulkUpload } from "@/components/sales/sales-bulk-upload";

export default function SalesBulkUploadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Link
          href="/dashboard/sales"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Sales
        </Link>

        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Bulk Sales Upload</h1>
          <p className="text-gray-600">
            Upload multiple sales records at once with automatic stock and alert updates
          </p>
        </div>

        <SalesBulkUpload />
      </div>
    </div>
  );
}
