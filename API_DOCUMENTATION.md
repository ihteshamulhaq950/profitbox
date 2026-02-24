# ProfitBox Analytics API Documentation

## Overview

Four RESTful API endpoints provide analytics data for ProfitBox. All endpoints require authentication and return JSON responses.

### Authentication
All requests require Bearer token in Authorization header:
```
Authorization: Bearer {supabase_auth_token}
```

### Base URL
```
https://yourapp.com/api/analytics
```

---

## 1. Profit Analytics

**Endpoint:** `GET /api/analytics/profit`

**Purpose:** Calculate revenue, cost, and profit breakdown by product for a specified time period.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | integer | 30 | Time period in days (7, 30, 90, 365) |

### Request Example

```javascript
const response = await fetch('/api/analytics/profit?days=30', {
  headers: {
    'Authorization': `Bearer ${authToken}`
  }
});
```

### Response Format

```json
{
  "totalRevenue": "50000.00",
  "totalCost": "35000.00",
  "totalProfit": "15000.00",
  "profitMarginPercent": 30,
  "productCount": 5,
  "averageProfitPerProduct": "3000.00",
  "byProduct": [
    {
      "productId": "uuid",
      "productName": "Sugar",
      "sku": "SUGAR-50KG",
      "revenue": "20000.00",
      "cost": "13000.00",
      "profit": "7000.00",
      "profitMargin": 35,
      "boxesSold": 100
    }
  ]
}
```

### Response Field Descriptions

- **totalRevenue** (Decimal): Sum of all selling prices × boxes sold
- **totalCost** (Decimal): Sum of all cost per box × boxes sold
- **totalProfit** (Decimal): totalRevenue - totalCost
- **profitMarginPercent** (number): (totalProfit / totalRevenue) × 100
- **productCount** (number): Number of products sold in period
- **averageProfitPerProduct** (Decimal): totalProfit / productCount
- **byProduct** (array): Per-product breakdown with same metrics

### Error Responses

```json
// 401 Unauthorized
{ "error": "Unauthorized" }

// 500 Server Error
{ "error": "Internal Server Error" }
```

---

## 2. Top Performers

**Endpoint:** `GET /api/analytics/performers`

**Purpose:** Rank products by multiple metrics with trend analysis.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | integer | 30 | Time period for current metrics |
| `limit` | integer | 10 | Max products per category |

### Request Example

```javascript
const response = await fetch('/api/analytics/performers?days=30&limit=5', {
  headers: {
    'Authorization': `Bearer ${authToken}`
  }
});
```

### Response Format

```json
{
  "byRevenue": [
    {
      "productId": "uuid",
      "productName": "Sugar",
      "sku": "SUGAR-50KG",
      "category": "Groceries",
      "revenue": "20000.00",
      "cost": "13000.00",
      "profit": "7000.00",
      "profitMargin": 35,
      "boxesSold": 100,
      "avgPricePerBox": "200.00",
      "trend": "up",
      "trendPercent": 12.5
    }
  ],
  "byProfit": [...],
  "byMargin": [...],
  "byVolume": [...]
}
```

### Response Structure

The response contains 4 arrays, each containing the same product data but sorted differently:

- **byRevenue**: Sorted by total revenue (highest first)
- **byProfit**: Sorted by profit amount (highest first)
- **byMargin**: Sorted by profit margin percentage (highest first)
- **byVolume**: Sorted by boxes sold (highest first)

### Trend Field

- **trend**: "up" (>5% growth), "down" (<-5% decline), or "flat"
- **trendPercent**: Percentage change from previous period

---

## 3. Stock Alerts

**Endpoint:** `GET /api/analytics/stock-alerts`

**Purpose:** Identify inventory items needing attention with reorder recommendations.

### Query Parameters

None (returns all active batches with stock)

### Request Example

```javascript
const response = await fetch('/api/analytics/stock-alerts', {
  headers: {
    'Authorization': `Bearer ${authToken}`
  }
});
```

### Response Format

```json
{
  "totalAlerts": 3,
  "criticalCount": 1,
  "warningCount": 2,
  "alerts": [
    {
      "productId": "uuid",
      "productName": "Sugar",
      "sku": "SUGAR-50KG",
      "batchId": "uuid",
      "boxesRemaining": 5,
      "avgDailySales": 2.5,
      "daysUntilStockout": 2,
      "severity": "critical",
      "supplier": "ABC Wholesale",
      "recommendation": "URGENT: Order 75 boxes immediately. Will stockout in 2 days."
    },
    {
      "productId": "uuid",
      "productName": "Flour",
      "sku": "FLOUR-25KG",
      "batchId": "uuid",
      "boxesRemaining": 15,
      "avgDailySales": 3,
      "daysUntilStockout": 5,
      "severity": "warning",
      "supplier": "XYZ Traders",
      "recommendation": "Order 90 boxes soon. Current stock will last 5 days."
    }
  ]
}
```

### Severity Levels

- **critical**: daysUntilStockout ≤ 3 (60 days stock = 30-day supply)
- **warning**: 3 < daysUntilStockout ≤ 7
- **info**: daysUntilStockout > 7 (not returned in default response)

### Calculation Logic

```
Average Daily Sales = Total boxes sold in last 30 days ÷ 30
Days Until Stockout = Boxes Remaining ÷ Average Daily Sales
```

**Note:** If no sales history exists, defaults to 2 boxes/day average.

### Auto-Recommended Reorder Quantity

```
Recommended Order = Average Daily Sales × 30 (30-day supply)
```

---

## 4. Weekly Report

**Endpoint:** `GET /api/analytics/weekly-report`

**Purpose:** Generate AI-powered business summary for the current week.

### Query Parameters

None

### Request Example

```javascript
const response = await fetch('/api/analytics/weekly-report', {
  headers: {
    'Authorization': `Bearer ${authToken}`
  }
});
```

### Response Format

```json
{
  "period": "2/10/2026 - 2/17/2026",
  "totalRevenue": 12400,
  "totalProfit": 3100,
  "profitMargin": 25,
  "totalBoxesSold": 450,
  "previousWeekRevenue": 11500,
  "revenueChange": 7.8,
  "topProducts": [
    {
      "name": "Sugar",
      "revenue": 5000,
      "profit": 1500
    },
    {
      "name": "Flour",
      "revenue": 3200,
      "profit": 800
    },
    {
      "name": "Oil",
      "revenue": 2800,
      "profit": 600
    }
  ],
  "lowStockProducts": [
    "Sugar",
    "Ghee"
  ],
  "aiNarrative": "Week of Feb 10-16 showed strong performance with 7.8% revenue growth compared to the previous week. Your top product Sugar drove 40% of revenue this week. Profit margins remained healthy at 25%. Two products are currently low on stock and require immediate reordering to avoid potential losses."
}
```

### Field Descriptions

- **period**: Human-readable date range (last 7 days)
- **totalRevenue**: Total sales for the week
- **totalProfit**: Total profit for the week
- **profitMargin**: Average profit margin percentage
- **totalBoxesSold**: Total units sold
- **previousWeekRevenue**: Revenue from the 7 days before current week
- **revenueChange**: Percentage change (positive = growth)
- **topProducts**: Top 3 products by revenue
- **lowStockProducts**: Products with < 5 boxes remaining
- **aiNarrative**: Google Gemini-generated business summary (2-4 sentences)

### When AI Narrative May Not Generate

If there are issues with the Google GenAI API:
```json
{
  "aiNarrative": "Unable to generate AI insights at this moment. Please try again later."
}
```

This is a graceful fallback—the rest of the data is always available.

---

## Error Handling

### Common HTTP Status Codes

| Status | Meaning | Typical Cause |
|--------|---------|---------------|
| 200 | Success | Valid request |
| 401 | Unauthorized | Missing/invalid auth token |
| 500 | Server Error | Database or processing error |

### Error Response Format

```json
{
  "error": "Error description"
}
```

---

## Rate Limiting

- **Profit Analytics:** No rate limit (calculation-based)
- **Top Performers:** No rate limit (calculation-based)
- **Stock Alerts:** No rate limit (calculation-based)
- **Weekly Report:** Google GenAI free tier: 60 requests/minute

If you exceed rate limits:
```json
{
  "error": "Rate limit exceeded"
}
```

---

## Data Types

### Decimal Values

Some fields return Decimal values as strings (e.g., "50000.00") for financial precision. Parse with:

```javascript
const number = parseFloat(decimalString);
```

Or use a library like `decimal.js`:
```javascript
import Decimal from 'decimal.js';
const value = new Decimal(decimalString);
```

### Date Format

Dates use ISO 8601 format: `YYYY-MM-DD`

---

## Usage Examples

### React Component Example

```typescript
import { useEffect, useState } from 'react';

export function ProfitChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/profit?days=30', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
      .then(r => r.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Monthly Profit: ${data.totalProfit}</h2>
      <p>Margin: {data.profitMarginPercent}%</p>
    </div>
  );
}
```

### JavaScript Fetch Example

```javascript
// Get top 5 products by profit
const response = await fetch('/api/analytics/performers?days=30&limit=5', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  }
});

const { byProfit } = await response.json();
byProfit.forEach(product => {
  console.log(`${product.productName}: $${product.profit}`);
});
```

---

## Performance Considerations

### Optimization Tips

1. **Cache responses** - Weekly Report data doesn't change for 24 hours
2. **Batch requests** - Fetch multiple analytics in parallel
3. **Pagination** - Top Performers limits to 10 items per category
4. **Time filtering** - Use specific date ranges instead of full year

### Query Performance

- Profit Analytics: ~500ms (30-day period)
- Top Performers: ~500ms (30-day period)
- Stock Alerts: ~200ms (real-time active batches)
- Weekly Report: ~2-3 seconds (includes AI generation)

---

## Security

### Best Practices

1. **Never log auth tokens** to console
2. **Store token securely** (HttpOnly cookie or secure storage)
3. **Use HTTPS only** in production
4. **Refresh tokens** as needed per your auth system
5. **Validate responses** client-side if using untrusted networks

### Data Privacy

- All endpoints are user-scoped (users only see their own data)
- Row-level security (RLS) enforced at database level
- No data is shared between users

---

## Changelog

### Version 1.0 (Feb 2026)

- Initial release of 4 analytics endpoints
- Added Google GenAI integration for weekly reports
- Implemented profit calculations with Decimal.js precision
- Added stock alert intelligence
- Trend analysis for top performers

---

## Support & Troubleshooting

### Common Issues

**Q: Getting 401 Unauthorized?**
A: Verify auth token is valid. Check localStorage for auth token or re-login.

**Q: Weekly Report aiNarrative is empty?**
A: Check GOOGLE_GENAI_API_KEY in environment. May be rate-limited—try again in 10 seconds.

**Q: Data seems outdated?**
A: Analytics are real-time. If you just added a sale, refresh page. Data updates immediately.

**Q: API returns "Internal Server Error"?**
A: Check browser console (F12) for details. Verify you have sales data. Contact support with error details.

---

## Future Enhancements

Planned API endpoints:

- `POST /api/analytics/recommendations/pricing` - AI pricing suggestions
- `GET /api/analytics/forecast/demand` - Demand forecasting
- `GET /api/analytics/insights/customers` - Customer segmentation
- `POST /api/analytics/export/pdf` - PDF report generation

---

**Last Updated:** Feb 2026  
**API Version:** 1.0  
**Status:** Production Ready ✅
