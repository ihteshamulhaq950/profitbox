"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Plus, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchProducts } from "@/lib/api";
import { Product } from "@/lib/types";

export function StockBatchForm() {
  const [step, setStep] = useState<"search" | "form">("search");
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    batch_number: "",
    boxes_purchased: 0,
    quantity_per_box: 1,
    unit_per_box: "box",
    cost_per_box: 0,
    supplier_name: "",
    purchase_date: new Date().toISOString().split("T")[0],
    reorder_level: 0,
    critical_level: 0,
  });

  // Search products
  const handleSearch = useCallback(async (query: string) => {
    setProductSearch(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetchProducts();
      const products = response.data || response;
      const filtered = products.filter(
        (p: Product) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to search products",
      });
    } finally {
      setSearchLoading(false);
    }
  }, [toast]);

  // Select product and move to form
  const handleSelectProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    setProductSearch("");
    setSearchResults([]);
    setStep("form");
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedProduct) {
        setError("Product not selected");
        return;
      }

      // Validate alert levels
      if (formData.critical_level > formData.reorder_level) {
        setError("Critical level cannot exceed reorder level");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const response = await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: selectedProduct.id,
            batch_number: formData.batch_number || `${selectedProduct.sku}-${new Date().getFullYear()}-${String(Math.random()).substring(2, 5)}`,
            boxes_purchased: formData.boxes_purchased,
            boxes_remaining: formData.boxes_purchased,
            quantity_per_box: formData.quantity_per_box,
            unit_per_box: formData.unit_per_box,
            cost_per_box: formData.cost_per_box,
            supplier_name: formData.supplier_name || null,
            purchase_date: formData.purchase_date,
            reorder_level: formData.reorder_level,
            critical_level: formData.critical_level,
            alert_status:
              formData.boxes_purchased <= formData.critical_level
                ? "critical"
                : formData.boxes_purchased <= formData.reorder_level
                  ? "warning"
                  : "healthy",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create batch");
        }

        setSuccess("Stock batch added successfully!");
        
        // Reset form
        setSelectedProduct(null);
        setFormData({
          batch_number: "",
          boxes_purchased: 0,
          quantity_per_box: 1,
          unit_per_box: "box",
          cost_per_box: 0,
          supplier_name: "",
          purchase_date: new Date().toISOString().split("T")[0],
          reorder_level: 0,
          critical_level: 0,
        });
        setStep("search");

        toast({
          title: "Success",
          description: "Stock batch created successfully",
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        toast({
          title: "Error",
          description: errorMsg,
        });
      } finally {
        setLoading(false);
      }
    },
    [selectedProduct, formData, toast]
  );

  return (
    <div className="space-y-4">
      {/* Step 1: Product Selection */}
      {step === "search" && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Select Product</h3>

          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by product name or SKU..."
                value={productSearch}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
                disabled={searchLoading}
              />
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive" className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <p>{error}</p>
              </Alert>
            )}

            {/* Success */}
            {success && (
              <Alert className="flex items-start gap-3 border-green-200 bg-green-50">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <p className="text-green-900">{success}</p>
              </Alert>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 transition"
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">
                      SKU: {product.sku} • Unit: {product.base_unit}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching products...
              </div>
            )}

            {productSearch && searchResults.length === 0 && !searchLoading && (
              <p className="text-sm text-gray-500 text-center py-4">
                No products found
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Step 2: Batch Details */}
      {step === "form" && selectedProduct && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-500">SKU: {selectedProduct.sku}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStep("search");
                setSelectedProduct(null);
              }}
            >
              Change Product
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Batch Number */}
            <div>
              <label className="text-sm font-medium block mb-1">
                Batch Number (Optional)
              </label>
              <Input
                placeholder={`e.g., ${selectedProduct.sku}-2026-001`}
                value={formData.batch_number}
                onChange={(e) =>
                  setFormData({ ...formData, batch_number: e.target.value })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated if left empty
              </p>
            </div>

            {/* Purchase Quantity & Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">
                  Boxes Purchased *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.boxes_purchased}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      boxes_purchased: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Units per Box *
                </label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.quantity_per_box}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity_per_box: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
            </div>

            {/* Unit Type & Cost */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">
                  Unit Type
                </label>
                <Input
                  placeholder="kg, box, packet, etc."
                  value={formData.unit_per_box}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      unit_per_box: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Cost per Box *
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost_per_box}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cost_per_box: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
            </div>

            {/* Supplier & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">
                  Supplier (Optional)
                </label>
                <Input
                  placeholder="e.g., ABC Wholesale"
                  value={formData.supplier_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supplier_name: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Purchase Date
                </label>
                <Input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      purchase_date: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Alert Thresholds */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Alert Thresholds</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Reorder Level (boxes)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.reorder_level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reorder_level: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Warn when stock falls below this
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">
                    Critical Level (boxes)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.critical_level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        critical_level: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Alert when stock falls below this
                  </p>
                </div>
              </div>
            </div>

            {/* Alert Status Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-blue-900">
                Expected Alert Status:{" "}
                <span className="capitalize font-semibold">
                  {formData.boxes_purchased <= formData.critical_level
                    ? "Critical"
                    : formData.boxes_purchased <= formData.reorder_level
                      ? "Warning"
                      : "Healthy"}
                </span>
              </p>
            </div>

            {/* Errors */}
            {error && (
              <Alert variant="destructive" className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <p>{error}</p>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("search");
                  setSelectedProduct(null);
                }}
                disabled={loading}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  loading || !selectedProduct || formData.boxes_purchased <= 0
                }
                className="flex-1 gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Batch...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Stock Batch
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
