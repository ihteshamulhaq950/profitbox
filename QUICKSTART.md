# ProfitBox Analytics - Quick Start (5 Minutes)

## Step 1: Get Google GenAI API Key (2 min)

Go to: **https://makersuite.google.com/app/apikey**
1. Sign in with Google
2. Click "Create API Key"
3. Copy the key

## Step 2: Configure Environment (1 min)

1. Create a file named `.env.local` in your project root
2. Add this line:
   ```
   GOOGLE_GENAI_API_KEY=your_copied_key_here
   ```

## Step 3: Restart Server (1 min)

```bash
npm run dev
```

## Step 4: Access Analytics (1 min)

After logging in to ProfitBox:

1. **Profit Analytics**
   → Sidebar → ANALYTICS → Profit Analytics
   → View revenue, cost, profit breakdown

2. **Top Performers**
   → Sidebar → ANALYTICS → Top Performers
   → Switch tabs: Revenue | Profit | Margin | Volume

3. **Stock Alerts**
   → Sidebar → ANALYTICS → Stock Alerts
   → See which products need reordering

4. **Weekly Report**
   → Sidebar → ANALYTICS → Weekly Report
   → Read AI-generated business summary

---

## Key Features at a Glance

| Feature | What It Does | Best For |
|---------|-------------|----------|
| **Profit Analytics** | Shows profit by product | Understanding margins |
| **Top Performers** | Ranks products by revenue/profit/margin/volume | Finding growth opportunities |
| **Stock Alerts** | Warns before stockouts with reorder suggestions | Inventory management |
| **Weekly Report** | AI summary of your week | Quick business check-in |

---

## Notes

- Analytics need **sales data** to work (record at least 1 sale first)
- Stock Alerts update every 5 minutes automatically
- Weekly Report shows last 7 days vs. previous 7 days
- All profit calculations use precise decimal math (financial-grade accuracy)

---

## Troubleshooting

**"GenAI Error" in Weekly Report?**
- Check your API key is correct in `.env.local`
- Restart the server
- Free tier Google APIs have rate limits—try again in a few seconds

**No data showing?**
- Make sure you have sales records
- Try filtering by longer time period (7d → 30d → 365d)
- Check that you're logged in with the correct account

---

## Next Steps

Review the full guide: [ANALYTICS_SETUP_GUIDE.md](./ANALYTICS_SETUP_GUIDE.md)

Happy analyzing! 📊
