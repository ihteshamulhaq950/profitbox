"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, TrendingUp, TrendingDown, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface TopPerformer {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  boxesSold: number;
  avgPricePerBox: number;
  trend: "up" | "down" | "flat";
  trendPercent: number;
}

type TabType = "revenue" | "profit" | "margin" | "volume";

const ITEMS_PER_PAGE = 5;

export function TopPerformers() {
  const [data, setData] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("revenue");
  const [days, setDays] = useState(30);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch performers based on current filters
  const fetchPerformers = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/analytics/search?q=${encodeURIComponent(query)}&days=${days}&sortBy=${activeTab}&limit=100`
      );

      if (!response.ok) throw new Error("Failed to fetch performers");
      const json = await response.json();

      // Parse Decimal values
      const parsed = json.map((p: any) => ({
        ...p,
        revenue: parseFloat(p.revenue) || 0,
        cost: parseFloat(p.cost) || 0,
        profit: parseFloat(p.profit) || 0,
        avgPricePerBox: parseFloat(p.avgPricePerBox) || 0,
      }));

      setData(parsed);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [days, activeTab]);

  // Fetch initial data when days change
  useEffect(() => {
    fetchPerformers(searchQuery);
  }, [days, activeTab]);

  // Handle search with debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer (debounce 600ms)
    debounceTimerRef.current = setTimeout(() => {
      fetchPerformers(value);
    }, 600);
  }, [fetchPerformers]);

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
        <AlertCircle className="w-5 h-5" />
        {error}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate pagination
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = data.slice(startIndex, endIndex);

  const tabs: { value: TabType; label: string }[] = [
    { value: "revenue", label: "By Revenue" },
    { value: "profit", label: "By Profit" },
    { value: "margin", label: "By Margin %" },
    { value: "volume", label: "By Volume" },
  ];

  return (
    <div className="space-y-6">
      {/* Time Filter */}
      <div className="flex gap-2">
        {[7, 30, 90, 365].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              days === d
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {d === 7 ? "7d" : d === 30 ? "30d" : d === 90 ? "90d" : "1y"}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === tab.value
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search by product name, SKU, or category..."
          className="pl-10 py-2"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Product Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading...</div>
        ) : paginatedData.length > 0 ? (
          paginatedData.map((product, index) => (
            <Card key={product.productId} className="p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-gray-400 w-8">
                      {startIndex + index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{product.productName}</div>
                      <div className="text-sm text-gray-600">
                        {product.sku} • {product.category}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trend Indicator */}
                {product.trend !== "flat" && (
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                      product.trend === "up"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {product.trend === "up" ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {Math.abs(product.trendPercent)}%
                  </div>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                <div>
                  <div className="text-xs text-gray-600">Revenue</div>
                  <div className="font-semibold">{formatCurrency(product.revenue)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Profit</div>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(product.profit)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Margin</div>
                  <div className="font-semibold text-blue-600">{product.profitMargin}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">
                    {activeTab === "volume" ? "Boxes Sold" : "Avg Price/Box"}
                  </div>
                  <div className="font-semibold">
                    {activeTab === "volume" 
                      ? product.boxesSold 
                      : formatCurrency(product.avgPricePerBox)}
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-gray-600">
            No performers found matching your search criteria
          </div>
        )}
      </div>

      {/* Pagination */}
      {data.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            Showing {paginatedData.length > 0 ? startIndex + 1 : 0} to{" "}
            {Math.min(endIndex, data.length)} of {data.length} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
