# ProfitBox Analytics - Launch Checklist

## Pre-Launch Setup (5 minutes)

- [ ] **Get Google GenAI API Key**
  - Visit: https://makersuite.google.com/app/apikey
  - Sign in with Google
  - Click "Create API Key"
  - Copy the key to clipboard

- [ ] **Create `.env.local` file**
  - In project root, create `.env.local`
  - Add this line: `GOOGLE_GENAI_API_KEY=paste_your_key_here`
  - Save the file

- [ ] **Restart Development Server**
  - Stop current `npm run dev` (Ctrl+C)
  - Run: `npm run dev`
  - Wait for build to complete

- [ ] **Verify Installation**
  - Log in to ProfitBox
  - Check sidebar for "ANALYTICS" section
  - Should see 4 options: Profit Analytics, Top Performers, Stock Alerts, Weekly Report

---

## First-Time Testing

### Add Test Data (if needed)

- [ ] Log in to ProfitBox
- [ ] Go to `/dashboard/products` - Add at least 1 product
- [ ] Go to `/dashboard/inventory` - Add a stock batch
- [ ] Go to `/dashboard/sales` - Record at least 1 sale

### Test Each Analytics Page

- [ ] **Profit Analytics**
  - Click: Sidebar → ANALYTICS → Profit Analytics
  - Verify: Page loads without errors
  - Verify: Shows revenue, cost, profit
  - Verify: Time filters (7d, 30d, 90d, 365d) work
  - Verify: Product breakdown table shows

- [ ] **Top Performers**
  - Click: Sidebar → ANALYTICS → Top Performers
  - Verify: Page loads without errors
  - Verify: Tab buttons visible (Revenue, Profit, Margin %, Volume)
  - Verify: Products ranked correctly
  - Verify: Trend indicators show (↑ or ↓)
  - Verify: Time filters work

- [ ] **Stock Alerts**
  - Click: Sidebar → ANALYTICS → Stock Alerts
  - Verify: Page loads without errors
  - Verify: Shows alert counts at top
  - Verify: Color-coded alerts (red/yellow)
  - Verify: Reorder recommendations visible
  - Optional: Add more stock to verify changes

- [ ] **Weekly Report**
  - Click: Sidebar → ANALYTICS → Weekly Report
  - Verify: Page loads without errors
  - Verify: Shows time period
  - Verify: Revenue, profit, margin displays
  - Verify: Top products section populated
  - **Key:** AI Narrative section shows text (not "Unable to generate")
  - If error: Check .env.local has correct API key

---

## Troubleshooting During Testing

### If seeing "Unauthorized" error:
- [ ] Verify you're logged in to ProfitBox
- [ ] Try refreshing the page
- [ ] Clear browser cookies (Settings → Clear Cache)
- [ ] Log out and log back in

### If Weekly Report shows "Unable to generate AI insights":
- [ ] Check `.env.local` exists with correct API key
- [ ] Verify API key is from: https://makersuite.google.com/app/apikey
- [ ] Restart dev server: `npm run dev`
- [ ] Wait 10 seconds and reload page
- [ ] Check browser console (F12) for error details

### If analytics show "No data":
- [ ] Verify you have sales records
  - Go to `/dashboard/sales`
  - Should see at least 1 entry
- [ ] Try different time period:
  - Currently viewing 7d? Try 30d or 365d
- [ ] Check sales are recent:
  - If sales are from 6 months ago, 7d filter won't show them

### If page loads slowly:
- [ ] Check internet connection (should be fast)
- [ ] Try 7-day or 30-day filter instead of 365
- [ ] Reload page with Ctrl+Shift+R (hard refresh)

---

## Post-Launch Usage

### Daily Tasks
- [ ] Check **Stock Alerts** → prevents stockouts
- [ ] Monitor **Weekly Report** every Monday morning

### Weekly Tasks
- [ ] Review **Top Performers** → identify opportunities
- [ ] Check **Profit Analytics** → ensure margins healthy

### Monthly Tasks
- [ ] Detailed analysis of **Profit Analytics** → pricing decisions
- [ ] Review trends over trailing 30-90 days

---

## Documentation Reference

Keep these bookmarked:

- [ ] **Quick questions?** → `QUICKSTART.md`
- [ ] **Full setup details?** → `ANALYTICS_SETUP_GUIDE.md`
- [ ] **Technical overview?** → `IMPLEMENTATION_SUMMARY.md`
- [ ] **File locations?** → `FILE_STRUCTURE.md`
- [ ] **This checklist?** → `LAUNCH_CHECKLIST.md`

---

## Feature Verification Matrix

|Feature|Loads|Data Shows|AI Works|Mobile OK|
|-------|-----|----------|--------|---------|
|Profit Analytics|[ ]|[ ]|N/A|[ ]|
|Top Performers|[ ]|[ ]|N/A|[ ]|
|Stock Alerts|[ ]|[ ]|N/A|[ ]|
|Weekly Report|[ ]|[ ]|[ ]|[ ]|

---

## Common Settings to Adjust (Optional)

In `/components/analytics/stock-alerts.tsx`:
- Line ~60: Change critical threshold (currently ≤3 days)
- Line ~61: Change warning threshold (currently 3-7 days)

In `/app/api/analytics/stock-alerts/route.ts`:
- Line ~84: Adjust default avg sales if no history (currently 2 boxes/day)

In `/components/analytics/profit-analytics.tsx`:
- Line ~63: Add/remove time filter options

---

## Performance Expectations

**Page Load Times (on good internet):**
- Profit Analytics: 1-2 seconds
- Top Performers: 1-2 seconds
- Stock Alerts: 1-2 seconds
- Weekly Report: 2-3 seconds (includes AI generation)

**If slower:**
- Check internet speed
- Try clearing browser cache
- Reduce time period filter
- Check server logs for errors

---

## Security Verification

- [ ] Environment variable stored in `.env.local` (NOT in code)
- [ ] `.env.local` is in `.gitignore` (don't commit!)
- [ ] API key is never logged to console
- [ ] All endpoints require authentication
- [ ] User only sees own data

---

## Backup & Recovery

### Important Files Not to Delete
- `/lib/genai.ts` - Core AI functionality
- `/components/analytics/*` - All analytics components
- `/app/api/analytics/*` - All analytics APIs
- `/app/dashboard/analytics/*` - All analytics pages

### To Reset (if needed)
1. Keep `.env.local` with your API key
2. Delete node_modules: `rm -r node_modules`
3. Clear cache: `npm cache clean --force`
4. Reinstall: `npm install`
5. Restart: `npm run dev`

---

## Success Indicators

You'll know everything works when:

✅ All 4 analytics pages load without errors
✅ Data populates correctly from your sales records
✅ Weekly Report shows AI-generated narrative
✅ Time filters update the dashboard
✅ Mobile view is responsive and usable
✅ No error messages in browser console (F12)

---

## Next Steps After Launch

1. **Use regularly** - Check analytics weekly
2. **Provide feedback** - What's missing? What's useful?
3. **Monitor costs** - Google API usage stays free tier
4. **Plan enhancements** - Pricing recommendations, forecasting, etc.

---

## Contact & Support

If something isn't working:
1. Check browser console (F12) for error messages
2. Review `ANALYTICS_SETUP_GUIDE.md` troubleshooting section
3. Verify `.env.local` has correct API key
4. Try restarting dev server

---

## Final Verification

Before considering launch complete:

```
All pages load? ✓
Data displays correctly? ✓
AI narrative generates? ✓
Mobile responsive? ✓
No console errors? ✓
All features working? ✓
```

Once all ✓, you're ready to maximize insights! 📊

---

**Status:** Ready to Launch 🚀
**Estimated Setup Time:** 5 minutes
**Ongoing Maintenance:** Minimal (API key is only config)
