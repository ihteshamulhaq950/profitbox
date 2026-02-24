-- =====================================================
-- PROFITBOX MIGRATIONS - QUICK START GUIDE
-- =====================================================

HOW TO APPLY MIGRATIONS
=======================

Option 1: Using Supabase CLI (Recommended)
─────────────────────────────────────────
# Initialize Supabase (if not done)
supabase init

# Link to your project
supabase link

# Apply all migrations
supabase migration up

# Verify migrations applied
supabase db pull


Option 2: Manual SQL Editor (Step-by-step)
─────────────────────────────────────────
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Copy entire contents of 001_initial_schema.sql
5. Paste into SQL Editor
6. Click Run ▶️
7. Repeat for 002, 003, 004 in order

8. Verify success:
   - Check Tables: Tables → Should see 3 tables
   - Check Functions: Functions → Should see 2 RPC functions
   - Check Views: Custom SQL Viewer
   - Check Storage: Storage → product-images bucket


Option 3: Using psql Command Line
─────────────────────────────────
# Get your database URL from Supabase
export DATABASE_URL="postgresql://..."

# Run all migrations in order
psql $DATABASE_URL -f 001_initial_schema.sql
psql $DATABASE_URL -f 002_rpc_functions.sql
psql $DATABASE_URL -f 003_views_and_helpers.sql
psql $DATABASE_URL -f 004_storage_bucket.sql

# Verify
psql $DATABASE_URL -c "SELECT * FROM pg_tables WHERE schemaname = 'public';"


MIGRATION FILES IN ORDER
========================

001_initial_schema.sql
├─ Extensions: uuid-ossp
├─ Tables: 3 (products, stock_batches, daily_sales)
├─ RLS Policies: 12 (4 per table)
└─ Indexes: 10 (performance optimization)
Time: ~2 seconds
Rows: Tables created (0 data)


002_rpc_functions.sql
├─ Function 1: bulk_insert_stock_batches(jsonb)
│  └─ Purpose: Atomically insert multiple batches
├─ Function 2: bulk_insert_sales(jsonb)
│  └─ Purpose: Atomically insert sales + auto-update stock
└─ Permissions: Grant EXECUTE to authenticated
Time: ~1 second
Rows: Functions created (0 data)


003_views_and_helpers.sql
├─ View 1: product_inventory_view
├─ View 2: sales_summary_view
├─ View 3: alert_status_view
├─ View 4: batch_performance_view
├─ View 5: daily_sales_report_view
├─ View 6: inventory_valuation_view
└─ View 7: supplier_analysis_view
Time: ~1 second
Rows: Views created (0 data)


004_storage_bucket.sql
├─ Bucket: product-images
├─ Visibility: Public
└─ RLS Policies: Configure in dashboard
Time: ~0.5 seconds
Rows: Bucket created


WHAT GETS CREATED
=================

Tables (3):
┌─ products
│  ├─ id (UUID, PK)
│  ├─ user_id (FK to auth.users)
│  ├─ sku (unique per user)
│  ├─ name, category, description
│  ├─ unit_type (weight|count)
│  ├─ base_unit (kg|box|etc)
│  └─ ... (10+ columns total)
│
├─ stock_batches
│  ├─ id (UUID, PK)
│  ├─ user_id (FK)
│  ├─ product_id (FK → products)
│  ├─ boxes_purchased, boxes_remaining
│  ├─ quantity_per_box, unit_per_box
│  ├─ cost_per_box, supplier_name
│  ├─ reorder_level, critical_level
│  ├─ alert_status (healthy|warning|critical)
│  └─ status (active|depleted)
│
└─ daily_sales
   ├─ id (UUID, PK)
   ├─ user_id (FK)
   ├─ product_id (FK → products)
   ├─ batch_id (FK → stock_batches)
   ├─ boxes_sold
   ├─ selling_price_per_box
   ├─ customer_name, notes
   └─ created_at


RPC Functions (2):
┌─ bulk_insert_stock_batches(jsonb)
│  Input: [{ sku, batch_number, boxes_purchased, ... }]
│  Returns: { success, inserted_count, message }
│  What it does:
│    1. Validates all SKUs exist
│    2. Calculates initial alert_status
│    3. Inserts all batches atomically
└─ bulk_insert_sales(jsonb)
   Input: [{ product_id, batch_id, boxes_sold, ... }]
   Returns: { success, inserted_count, message }
   What it does:
     1. Validates products/batches/stock
     2. Inserts all sales atomically
     3. Decrements boxes_remaining
     4. Recalculates alert_status


Views (7):
┌─ product_inventory_view
│  Shows: Total stock, units, value per product
├─ sales_summary_view
│  Shows: Revenue, cost, profit per product
├─ alert_status_view
│  Shows: Low stock alerts
├─ batch_performance_view
│  Shows: Sales and profit per batch
├─ daily_sales_report_view
│  Shows: Daily sales with margins
├─ inventory_valuation_view
│  Shows: Inventory value for accounting
└─ supplier_analysis_view
   Shows: Vendor performance and spending


VERIFICATION COMMANDS
====================

# Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
-- Expected: products, stock_batches, daily_sales

# Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
-- Expected: bulk_insert_stock_batches, bulk_insert_sales

# Check views exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'VIEW';
-- Expected: 7 views

# Check indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public';
-- Expected: 10 indexes

# Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';
-- Expected: true for all 3 tables

# Check RLS policies
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';
-- Expected: 12 policies total


TESTING THE SETUP
==================

1. Test Table Creation:
   SELECT COUNT(*) FROM products;
   → Should work and return 0

2. Test RPC Function:
   SELECT * FROM public.bulk_insert_stock_batches('[]'::jsonb);
   → Should succeed (empty input)

3. Test View:
   SELECT * FROM public.product_inventory_view;
   → Should work (shows 0 rows)

4. Test Storage:
   Check Supabase Dashboard → Storage → product-images
   → Should see bucket created


ERROR TROUBLESHOOTING
====================

Error: "relation "products" does not exist"
→ Migration 001 didn't run. Re-run it.

Error: "function bulk_insert_stock_batches does not exist"
→ Migration 002 didn't run. Run it now.

Error: "permission denied for schema public"
→ User doesn't have permissions. Use elevated role.

Error: "Bucket already exists"
→ Safe to ignore. Bucket created successfully.

Error: "relation already exists"
→ Run migrations again (they include DROP statements first)


FILE REFERENCE
==============

001_initial_schema.sql (275 lines)
├─ Tables with constraints
├─ RLS policies for security
├─ Performance indexes
└─ DROP statements for re-runs

002_rpc_functions.sql (190 lines)
├─ bulk_insert_stock_batches()
├─ bulk_insert_sales()
└─ Full validation and atomicity

003_views_and_helpers.sql (250 lines)
├─ 7 analytical views
├─ Real-time aggregations
└─ RLS integrated

004_storage_bucket.sql (70 lines)
├─ Create bucket
├─ Usage instructions
└─ Policy recommendations

00_MIGRATIONS_INDEX.md (400 lines)
├─ Complete schema documentation
├─ SQL query examples
└─ Helpful reference guide


NEXT STEPS AFTER MIGRATION
==========================

1. Load Dummy Data (Optional):
   - Run sample INSERT statements from 00_MIGRATIONS_INDEX.md
   - Or use bulk_insert_stock_batches() RPC

2. Test Bulk Operations:
   - Frontend: Try uploading CSV files
   - Backend: Call RPC functions directly
   - Verify: Check Supabase dashboard

3. Configure Storage Policies:
   - Go to Supabase Dashboard
   - Storage → product-images → Policies
   - Add RLS policies (examples in 004_storage_bucket.sql)

4. Setup Frontend Queries:
   - Create useEffect hooks for views
   - Subscribe to real-time updates
   - Build dashboard components

5. Monitor & Optimize:
   - Check query performance
   - Review indexes
   - Adjust RLS if needed


ROLLBACK (If Needed)
====================

To rollback all migrations:

1. In Supabase SQL Editor:

   DROP TABLE IF EXISTS public.daily_sales CASCADE;
   DROP TABLE IF EXISTS public.stock_batches CASCADE;
   DROP TABLE IF EXISTS public.products CASCADE;
   DROP FUNCTION IF EXISTS public.bulk_insert_sales CASCADE;
   DROP FUNCTION IF EXISTS public.bulk_insert_stock_batches CASCADE;
   DROP VIEW IF EXISTS public.product_inventory_view CASCADE;
   DROP VIEW IF EXISTS public.sales_summary_view CASCADE;
   DROP VIEW IF EXISTS public.alert_status_view CASCADE;
   DROP VIEW IF EXISTS public.batch_performance_view CASCADE;
   DROP VIEW IF EXISTS public.daily_sales_report_view CASCADE;
   DROP VIEW IF EXISTS public.inventory_valuation_view CASCADE;
   DROP VIEW IF EXISTS public.supplier_analysis_view CASCADE;

2. Or delete the bucket in Storage

3. Then re-run migrations


SUPABASE CLI COMMANDS
====================

# Install CLI
npm install -g supabase

# Initialize project
supabase init

# Link to project
supabase link --project-ref <PROJECT_ID>

# Create new migration
supabase migration new <name>

# Push migrations to remote
supabase migration up

# Pull latest from remote
supabase db pull

# Check migration status
supabase migration list

# Seed database (optional)
supabase seed run

# Export database (backup)
supabase db dump -f backup.sql


DATABASE SIZE & LIMITS
====================

With these migrations:
├─ Schema size: ~5 MB (includes indexes)
├─ Free tier storage: 500 MB
├─ Pro tier storage: 8 GB
├─ Tables: 3
├─ Columns: ~50
├─ Rows: Can store millions
└─ Queries: Unlimited (with RLS)


PRODUCTION READINESS
====================

✅ Security:
   - Row Level Security enabled
   - User isolation enforced
   - Atomic transactions guaranteed

✅ Performance:
   - 10 indexes optimized
   - Set-based operations (not loops)
   - View aggregations cached

✅ Reliability:
   - Constraints enforce data quality
   - Foreign key cascades
   - Backup-friendly

✅ Scalability:
   - Partitioning ready (add manually)
   - Bulk operation support
   - Multi-tenancy setup


REFERENCE DOCS
==============

Supabase Docs:
https://supabase.com/docs

PostgreSQL Docs:
https://www.postgresql.org/docs/

Row Level Security:
https://supabase.com/docs/guides/auth/row-level-security

RPC Functions:
https://supabase.com/docs/guides/database/functions

Storage:
https://supabase.com/docs/guides/storage


SUPPORT & QUESTIONS
===================

If you encounter issues:

1. Check 00_MIGRATIONS_INDEX.md for details
2. Review error message carefully
3. Try rollback and re-run
4. Check Supabase documentation
5. Contact Supabase support

Good luck! 🚀
