# ProfitBox Analytics Features - Setup Guide

This document explains how to set up and use the new AI-powered analytics features in ProfitBox.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google GenAI API Setup](#google-genai-api-setup)
3. [Features Overview](#features-overview)
4. [Using the Analytics Dashboard](#using-the-analytics-dashboard)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- ProfitBox application running and configured with Supabase
- Node.js 16+ installed
- A Google Cloud account or Google AI free tier account

---

## Google GenAI API Setup

### Step 1: Get Your API Key

**Option A: Google AI Studio (Recommended for development)**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

**Option B: Google Cloud Console (For production)**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Generative Language API"
4. Go to "Credentials" and create an API key
5. Copy your API key

### Step 2: Configure Environment Variable

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Google GenAI API key to `.env.local`:
   ```
   GOOGLE_GENAI_API_KEY=your_api_key_here
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

---

## Features Overview

### 1. **Profit Analytics** 📊
**Path:** `/dashboard/analytics/profit`

Detailed breakdown of your revenue, costs, and profit margins.

**What it shows:**
- Total revenue, cost, and profit for a selected period
- Profit margin percentage
- Product-by-product breakdown with individual margins
- Time period filtering (7, 30, 90, 365 days)

**Use case:** Identify which products are most profitable and which need pricing adjustments.

---

### 2. **Top Performers** 🏆
**Path:** `/dashboard/analytics/performers`

Rank your products by multiple metrics.

**Tabs available:**
- **By Revenue:** Highest-selling products by total income
- **By Profit:** Products generating the most profit
- **By Margin %:** Most efficient products (profit %)
- **By Volume:** Most units sold

**Features:**
- Trend indicators (↑ up, ↓ down) showing week-over-week changes
- Individual product metrics at a glance
- 10 products per view, sorted by performance

**Use case:** Understand which products drive your business and discover opportunities for growth.

---

### 3. **Stock Alerts** ⚠️
**Path:** `/dashboard/analytics/stock-alerts`

Intelligent inventory monitoring with reorder recommendations.

**Alert Levels:**
- **🔴 Critical:** Stock will run out in ≤3 days
- **🟡 Warning:** Stock will run out in 3-7 days
- **🟢 Healthy:** Stock level sufficient

**What it shows:**
- Current boxes remaining
- Average daily sales rate
- Days until stockout (calculated from sales history)
- Supplier information
- AI-powered reorder recommendations

**How it works:**
1. System analyzes your sales from the last 30 days
2. Calculates average daily consumption per product
3. Estimates when you'll run out of stock
4. Generates smart reorder quantities

**Use case:** Never miss a stockout. Avoid leaving revenue on the table due to unavailable inventory.

---

### 4. **Weekly Report** 📈
**Path:** `/dashboard/analytics/weekly-report`

AI-generated summary of your business performance.

**Includes:**
- Weekly revenue and profit totals
- Profit margin percentage
- Boxes sold this week
- Revenue change vs. last week (with trend indicator)
- **AI Narrative:** GenAI writes 3-4 sentence summary of your week
- Top 3 products by revenue
- Low stock products alert section

**AI Narrative Examples:**
- "Sales were strong this week thanks to increased Sugar purchases. However, Dairy category showed weakness—consider running promotions."
- "Revenue grew 15% week-over-week, driven primarily by bulk orders. Profit margin improved to 22% with better cost control."

**Use case:** Get a quick business summary without diving into dashboards. Perfect for daily/weekly check-ins or team updates.

---

## Using the Analytics Dashboard

### Accessing Analytics

1. **Log in** to your ProfitBox dashboard
2. In the sidebar, scroll to the **ANALYTICS** section
3. Choose from:
   - Profit Analytics
   - Top Performers
   - Stock Alerts
   - Weekly Report

### Time Period Filtering

**Profit Analytics** and **Top Performers** allow filtering by:
- 7 days (current week)
- 30 days (current month)
- 90 days (quarterly)
- 365 days (yearly)

Click any timeframe button to refresh the data.

### Data Accuracy

- **Stock Alerts:** Updated automatically every 5 minutes
- **Profit Analytics:** Real-time based on your sales records
- **Top Performers:** Calculated on demand with historical comparison
- **Weekly Report:** Current week (last 7 days) vs. previous week

---

## How the Algorithms Work

### Stock Alert Calculation

```
Days Until Stockout = Boxes Remaining ÷ Average Daily Sales

Average Daily Sales = Total Boxes Sold in Last 30 Days ÷ 30
```

**Example:**
- Sugar: 20 boxes remaining, 2 boxes/day average
- Days until stockout: 20 ÷ 2 = 10 days → **Healthy**

---

### Profit Margin Calculation

```
Profit Margin % = (Revenue - Cost) ÷ Revenue × 100
```

**Example:**
- Product sells for $100, costs $75
- Profit: $25
- Margin: 25 ÷ 100 × 100 = **25%**

---

### AI Weekly Report

The Google Gemini model analyzes:
1. Current week's financial data
2. Previous week's comparison
3. Top products by revenue
4. Low stock items
5. Your business trends

Then generates a **natural language summary** highlighting:
- Key achievements
- Concerns or challenges
- Anomalies in the data
- Recommendations (contextual)

---

## Troubleshooting

### "Unauthorized" Error

**Problem:** Getting 401 Unauthorized when accessing analytics

**Solutions:**
1. Ensure you're logged in to ProfitBox
2. Check that your Supabase auth token is valid
3. Clear browser cookies and log in again
4. Check browser console for error details

---

### "GenAI Error" in Weekly Report

**Problem:** AI narrative not generating or showing error message

**Solutions:**
1. **Check API Key:**
   - Verify `GOOGLE_GENAI_API_KEY` is set in `.env.local`
   - Restart dev server (`npm run dev`)

2. **Check API Quota:**
   - Log in to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Verify you have remaining API calls
   - Free tier has rate limits; wait a few moments and retry

3. **Network Issue:**
   - Check your internet connection
   - Clear browser cache
   - Try again in a few moments

---

### Empty Analytics

**Problem:** Seeing no data in any analytics section

**Solutions:**
1. **Ensure you have sales data:**
   - Go to `/dashboard/sales`
   - Verify you've recorded at least one sale
   - Analytics require sales history to calculate

2. **Check date range:**
   - If you have very old sales, try the "365 days" filter
   - Recent sales may not show in "7 days" view

3. **Verify data in Supabase:**
   - Check that your products, batches, and sales tables have data
   - Ensure user_id is correctly set for all records

---

### Performance Issues

**Problem:** Analytics pages loading slowly

**Solutions:**
1. **Reduce time period:** Use 7-day or 30-day filter instead of 365
2. **Check network:** Ensure good internet connection
3. **Browser:** Try a different browser or incognito mode
4. **Clear cache:** Clear browser cache and reload

---

## Best Practices

1. **Review Weekly Report every Monday** - Stay on top of business performance
2. **Monitor Stock Alerts daily** - Prevent stockouts before they happen
3. **Check Top Performers monthly** - Identify growth opportunities
4. **Use Profit Analytics quarterly** - Understand pricing and margin trends
5. **Act on AI recommendations** - The narrative highlights actionable insights

---

## Future Enhancements (Coming Soon)

- Pricing recommendations based on demand elasticity
- Inventory demand forecasting (ML-powered)
- Automatic email reports
- Customer segmentation and insights
- Supplier performance analysis
- Budget forecasting

---

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review browser console for error messages (F12)
3. Check GitHub issues or documentation
4. Contact support with error details

---

**Happy analyzing! 📊**
