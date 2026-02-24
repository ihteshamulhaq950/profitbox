"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Download, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BulkUploadResult } from "@/lib/types";

export function StockBatchBulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<BulkUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith(".csv")) {
      setError("Only CSV files are supported");
      setFile(null);
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(null);
  }, []);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await fetch("/api/stock/bulk-upload");
      const csvContent = await response.text();
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "stock_batch_template.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Template downloaded",
        description: "Fill in the template and upload it back",
      });
    } catch (err) {
      toast({
        title: "Download failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, [toast]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/stock/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details || data.error || "Upload failed";
        setError(errorMsg);
        toast({
          title: "Upload failed",
          description: errorMsg,
        });
        return;
      }

      // Success
      setSuccess(data as BulkUploadResult);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast({
        title: "Upload successful",
        description: `${data.inserted_count} stock batches inserted`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      toast({
        title: "Upload failed",
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  }, [file, toast]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-4">Bulk Stock Batch Upload</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV file with stock batch information. Maximum 100 batches per file.
            </p>
          </div>

          {/* Template Download */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadTemplate}
              className="gap-2"
              disabled={loading}
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
            <p className="text-xs text-gray-500 flex items-center">
              Download a template CSV to see the required format
            </p>
          </div>

          {/* File Input */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading}
              className="hidden"
              aria-label="CSV file input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full"
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-700">
                    {file ? file.name : "Click to select CSV file"}
                  </p>
                  <p className="text-sm text-gray-500">
                    or drag and drop (max 5MB)
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Upload error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="flex items-start gap-3 border-green-200 bg-green-50">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-green-900">{success.message}</p>
                <p className="text-sm text-green-800 mt-1">
                  {success.inserted_count} stock batch(es) have been added to inventory
                </p>
              </div>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!file || loading}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Stock Batches
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Information Box */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="text-sm text-blue-900 space-y-2">
          <p className="font-medium">CSV Format Requirements</p>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li><strong>sku:</strong> Must reference an existing product (required)</li>
            <li><strong>batch_number:</strong> Unique batch identifier (optional - auto-generated if empty)</li>
            <li><strong>boxes_purchased:</strong> Total boxes bought - must be greater than 0 (required)</li>
            <li><strong>boxes_remaining:</strong> Boxes still in stock - if omitted, defaults to boxes_purchased (optional)</li>
            <li><strong>quantity_per_box:</strong> What's inside each box, must be greater than 0 (required)</li>
            <li><strong>unit_per_box:</strong> Unit type (kg, liter, piece, packet, etc.) (required)</li>
            <li><strong>cost_per_box:</strong> Cost per box in PKR - no currency symbols (required)</li>
            <li><strong>supplier_name:</strong> Supplier name (optional)</li>
            <li><strong>reorder_level:</strong> Boxes at which status becomes "warning" (optional)</li>
            <li><strong>critical_level:</strong> Boxes at which status becomes "critical" (optional, must be ≤ reorder_level)</li>
            <li>Alert status is automatically calculated based on current stock</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
