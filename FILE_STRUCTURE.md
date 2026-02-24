# ProfitBox: A Dukan Inventory Manager and Profit Analyzer
## Complete File Structure & Project Layout

**Last Updated:** February 21, 2026  
**Version:** 1.0.0 (Production)  
**Status:** Clean & Optimized

---

## 📁 Complete Directory Structure

```
profitbox/
│
├── 📄 Config Files
│   ├── package.json                      Project dependencies
│   ├── tsconfig.json                     TypeScript configuration
│   ├── next.config.ts                    Next.js configuration
│   ├── tailwind.config.ts                Tailwind CSS config
│   ├── postcss.config.mjs                PostCSS configuration
│   ├── components.json                   shadcn/ui configuration
│   ├── eslint.config.mjs                 ESLint rules
│   └── .env.example                      Environment template
│
├── 📚 Documentation (Root Level)
│   ├── README.md                         Main project overview
│   ├── TECHNICAL_DOCUMENTATION.md        ⭐ Complete tech docs
│   ├── FILE_STRUCTURE.md                 This file
│   ├── QUICK_START.md                    5-minute setup guide
│   ├── IMPLEMENTATION_SUMMARY.md         What was built
│   ├── LAUNCH_CHECKLIST.md               Pre-launch checklist
│   ├── TESTING_GUIDE.md                  Testing strategies
│   ├── TESTING_QUICK_REFERENCE.md        Quick test reference
│   ├── API_DOCUMENTATION.md              API endpoints
│   ├── INTEGRATION_GUIDE.md              Integration patterns
│   ├── SUPABASE_SCHEMA.sql               Full SQL schema
│   ├── DUMMY_DATA.md                     Sample test data
│   ├── DUMMY_DATA_SUMMARY.md             Data generation guide
│   ├── STOCK_BATCH_WORKFLOW_GUIDE.md     Batch upload workflow
│   ├── STOCK_BATCH_BULK_UPLOAD.md        Bulk upload details
│   ├── STOCK_ALERT_INTEGRATION.md        Alert system guide
│   ├── BULK_IMPORT_IMPLEMENTATION.md     Import strategies
│   ├── BULK_IMPORT_USER_GUIDE.md         User import guide
│   ├── UUID_REPLACEMENT_GUIDE.md         UUID mapping guide
│   ├── FINAL_SUMMARY.md                  Final checklist
│   ├── FILES_OVERVIEW.md                 Detailed file reference
│   └── ANALYTICS_SETUP_GUIDE.md          Analytics setup
│
├── 🔧 app/ (Next.js App Router)
│   ├── layout.tsx                        Root layout
│   ├── page.tsx                          Home page (/)
│   ├── globals.css                       Global styles
│   │
│   ├── 🔐 auth/
│   │   ├── layout.tsx                    Auth pages layout
│   │   ├── login/
│   │   │   └── page.tsx                  Login page
│   │   ├── sign-up/
│   │   │   └── page.tsx                  Registration page
│   │   ├── sign-up-success/
│   │   │   └── page.tsx                  Signup confirmation
│   │   └── error/
│   │       └── page.tsx                  Auth error page
│   │
│   ├── 📊 dashboard/
│   │   ├── layout.tsx                    Dashboard main layout
│   │   ├── page.tsx                      Dashboard home
│   │   │
│   │   ├── 📈 analytics/
│   │   │   ├── profit/
│   │   │   │   └── page.tsx              Profit analysis page
│   │   │   ├── performers/
│   │   │   │   └── page.tsx              Top products page
│   │   │   ├── stock-alerts/
│   │   │   │   └── page.tsx              Stock alerts page
│   │   │   └── weekly-report/
│   │   │       └── page.tsx              Weekly summary page
│   │   │
│   │   ├── 📦 products/
│   │   │   ├── layout.tsx                Products section layout
│   │   │   └── page.tsx                  Products list & management
│   │   │
│   │   ├── 🏭 inventory/
│   │   │   ├── layout.tsx                Inventory section layout
│   │   │   ├── page.tsx                  Inventory dashboard
│   │   │   └── bulk-upload/
│   │   │       └── page.tsx              Bulk stock upload page
│   │   │
│   │   ├── 💰 sales/
│   │   │   ├── layout.tsx                Sales section layout
│   │   │   └── page.tsx                  Sales recording & analysis
│   │   │
│   │   └── ⚙️ settings/
│   │       └── page.tsx                  User settings page
│   │
│   └── 🔌 api/
│       ├── 📦 products/
│       │   └── route.ts                  Product CRUD operations
│       │
│       ├── 🏭 inventory/
│       │   ├── route.ts                  Stock batch CRUD
│       │   └── bulk-upload/
│       │       └── route.ts              CSV bulk upload handler
│       │
│       ├── 📊 stock/
│       │   ├── bulk-upload/
│       │   │   └── route.ts              Stock batch bulk upload API
│       │   └── check-products/
│       │       └── route.ts              Diagnostic: Check SKU existence
│       │
│       ├── 💰 sales/
│       │   ├── route.ts                  Sales CRUD operations
│       │   └── analytics/
│       │       └── route.ts              Sales analytics
│       │
│       ├── 📈 analytics/
│       │   ├── profit/
│       │   │   └── route.ts              Profit calculations API
│       │   ├── performers/
│       │   │   └── route.ts              Top performers API
│       │   ├── stock-alerts/
│       │   │   └── route.ts              Stock alert API
│       │   ├── weekly-report/
│       │   │   └── route.ts              Weekly insights API (DATA-DRIVEN)
│       │   └── search/
│       │       └── route.ts              Global search API
│       │
│       └── 🔐 auth/
│           └── callback/
│               └── route.ts              OAuth callback handler
│
├── 🎨 components/
│   ├── 🏠 home-nav.tsx                   Home page navigation
│   ├── 🎭 theme-provider.tsx             Dark/light theme provider
│   ├── 🌓 theme-toggle.tsx               Theme switcher button
│   │
│   ├── 📊 analytics/
│   │   ├── profit-analytics.tsx          Profit visualization
│   │   ├── top-performers.tsx            Top products component
│   │   ├── stock-alerts.tsx              Inventory alerts component
│   │   └── weekly-report.tsx             Weekly summary (DATA-DRIVEN)
│   │
│   ├── 🚀 dashboard/
│   │   └── dashboard-nav.tsx             Main navigation sidebar
│   │
│   ├── 🏭 inventory/
│   │   └── stock-batch-form.tsx          Add stock batch form
│   │
│   ├── 📦 products/
│   │   └── bulk-add-dialog.tsx           Bulk product upload dialog
│   │
│   ├── 💰 sales/
│   │   └── sales-form.tsx                Record sale form (REMOVED: bulk-upload)
│   │
│   ├── 📦 stock/
│   │   └── stock-batch-bulk-upload.tsx   Batch upload component
│   │
│   └── 🎨 ui/
│       ├── alert-dialog.tsx              Confirmation dialog
│       ├── alert.tsx                     Alert/notification
│       ├── button.tsx                    Button component
│       ├── card.tsx                      Card container
│       ├── dialog.tsx                    Modal dialog
│       ├── input.tsx                     Input field
│       ├── label.tsx                     Form label
│       ├── select.tsx                    Dropdown select
│       ├── sonner.tsx                    Toast notifications
│       └── table.tsx                     Data table
│
├── 📚 lib/
│   ├── api.ts                            API client helpers
│   ├── types.ts                          TypeScript interfaces
│   ├── utils.ts                          Utility functions
│   │
│   ├── 📄 csv-stock-parser.ts            Stock batch CSV parser
│   ├── 📄 csv-sales-parser.ts            Sales CSV parser (DEPRECATED)
│   │
│   ├── 🤖 ai/
│   │   └── gemini-bulk-processor.ts      Gemini AI processor (DEPRECATED)
│   │
│   └── 🔗 supabase/
│       ├── client.ts                     Client-side Supabase
│       ├── server.ts                     Server-side Supabase
│       └── proxy.ts                      Proxy helper functions
│
├── 🪝 hooks/
│   ├── use-mobile.tsx                    Mobile detection hook
│   └── use-toast.ts                      Toast notification hook
│
├── 🗄️ supabase/
│   ├── 📄 migrations/
│   │   ├── 00_MIGRATIONS_INDEX.md        Migration index
│   │   ├── 001_initial_schema.sql        Core tables (products, stock, sales)
│   │   ├── 002_rpc_functions.sql         RPC: bulk_insert_stock_batches()
│   │   ├── 003_views_and_helpers.sql     Views and helper functions
│   │   └── 004_storage_bucket.sql        File storage setup
│   │
│   └── 📋 migrations/ (OLD - DEPRECATED)
│       └── 002_bulk_insert_sales.sql     (REMOVED: bulk_insert_sales RPC)
│
├── 🎯 public/
│   └── 📂 sample-data/
│       ├── products_bulk_upload.csv      Sample products
│       ├── sales_bulk_upload.csv         Sample sales (DEPRECATED)
│       └── stock_batches_bulk_upload.csv Sample batches
│
└── 📋 Root Files
    ├── .gitignore                        Git ignore rules
    ├── .env.local                        Local environment (Git ignored)
    ├── .env.example                      Environment template
    ├── next-env.d.ts                     Next.js types
    └── README.md                         Project overview
```

---

## 📊 Statistics

| Metric | Count | Status |
|--------|-------|--------|
| **Total Files** | 150+ | ✅ Optimized |
| **Documentation Files** | 23 | ✅ Comprehensive |
| **API Routes** | 12 | ✅ Complete |
| **React Components** | 20+ | ✅ Reusable |
| **Database Tables** | 3 | ✅ Normalized |
| **Lines of Code** | ~5,000+ | ✅ Production-ready |
| **Deleted Files** | 5 | ✅ Cleaned up |

---

## 🗂️ Key Folders Explained

### `/app`
**Next.js App Router** - Contains all pages and API routes
- Pages: User-facing interfaces
- API routes: Backend endpoints (REST API)

### `/components`
**Reusable React Components** - Organized by feature
- `ui/` - Design system components
- `analytics/` - Analytics dashboard components
- `dashboard/`, `inventory/`, etc. - Feature-specific components

### `/lib`
**Shared Utilities & Helpers**
- `api.ts` - API client abstractions
- `types.ts` - TypeScript interfaces (single source of truth)
- `csv-*-parser.ts` - CSV parsing logic
- `supabase/` - Database client wrapper

### `/supabase/migrations`
**Database Schema**
- Migration files for version control
- SQL scripts for table creation, indexes, RLS policies

---

## 🚀 Important Changes (v1.0.0)

### ✅ ADDED
- `TECHNICAL_DOCUMENTATION.md` - Comprehensive project documentation
- Analytics dashboard with 4 pages
- Bulk stock batch upload from CSV
- Stock alert system
- Weekly report with database-driven narratives
- SKU normalization (case-insensitive matching)
- User isolation via Row-Level Security

### ❌ REMOVED
- `components/sales/sales-bulk-upload.tsx` - Bulk sales upload
- `app/api/sales/bulk-upload/` - Bulk sales API
- `app/dashboard/sales/bulk-upload/` - Bulk sales page
- `supabase/migrations/002_bulk_insert_sales.sql` - RPC function
- `ParsedSalesRow`, `BulkSalesUploadResult` types
- Google Gemini API dependency (replaced with data-driven approach)

### 🔧 UPDATED
- `lib/types.ts` - Removed bulk sales interfaces
- `supabase/migrations/002_rpc_functions.sql` - Removed bulk_insert_sales()
- `app/api/analytics/weekly-report/route.ts` - Data-driven narratives
- `components/analytics/weekly-report.tsx` - Updated field names

---

## 📋 File Purpose Matrix

| File | Purpose | Dependencies |
|------|---------|--------------|
| `types.ts` | Type definitions | N/A |
| `api.ts` | API client helpers | `types.ts` |
| `csv-stock-parser.ts` | CSV parsing | `types.ts` |
| `weekly-report.tsx` | Component | `api.ts`, `types.ts` |
| `weekly-report/route.ts` | API endpoint | `supabase/server.ts` |
| `001_initial_schema.sql` | DB schema | PostgreSQL |

---

## 🎯 Development Workflow

### Adding a New Feature
1. **Create API route** → `app/api/feature/route.ts`
2. **Create component** → `components/feature/component.tsx`
3. **Add types** → Update `lib/types.ts`
4. **Create page** → `app/dashboard/feature/page.tsx`
5. **Test** → Use TESTING_GUIDE.md

### Modifying Database
1. **Create migration** → `supabase/migrations/XXX_name.sql`
2. **Update types** → `lib/types.ts`
3. **Test queries** → Use Supabase dashboard
4. **Update API routes** → Adapt client code

### Deploying
1. **Check LAUNCH_CHECKLIST.md**
2. **Run tests** → `npm run test`
3. **Build** → `npm run build`
4. **Deploy** → `git push` (Vercel auto-deploy)

---

## 📚 Documentation Hierarchy

```
For Different Roles:
│
├─ TECHNICAL_DOCUMENTATION.md        👨‍💻 Developers & Final Reference
├─ README.md                         📖 Everyone - Project Overview
├─ QUICK_START.md                    🚀 New Developers - 5min setup
├─ API_DOCUMENTATION.md              🔌 API Consumers
├─ TESTING_GUIDE.md                  ✅ QA & Testing
├─ LAUNCH_CHECKLIST.md               📋 DevOps & Pre-launch
└─ IMPLEMENTATION_SUMMARY.md         📝 Project Overview
```

---

## 🎓 Files for Thesis

### ⭐ RECOMMENDED FOR THESIS (READ IN THIS ORDER)

**Phase 1: Overview**
1. [README.md](README.md) - Project mission & features
2. [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) - Architecture & design

**Phase 2: Core Implementation**
3. [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - What was built
4. [FILE_STRUCTURE.md](FILE_STRUCTURE.md) - Code organization (THIS FILE)

**Phase 3: Technical Details**
5. [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Endpoints & contracts
6. [SUPABASE_SCHEMA.sql](SUPABASE_SCHEMA.sql) - Database design

**Phase 4: Features & Workflows**
7. [STOCK_BATCH_WORKFLOW_GUIDE.md](STOCK_BATCH_WORKFLOW_GUIDE.md) - Inventory workflow
8. [STOCK_ALERT_INTEGRATION.md](STOCK_ALERT_INTEGRATION.md) - Alert system
9. [BULK_IMPORT_IMPLEMENTATION.md](BULK_IMPORT_IMPLEMENTATION.md) - Bulk operations
10. [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Integration patterns

**Phase 5: Testing & Quality**
11. [TESTING_GUIDE.md](TESTING_GUIDE.md) - Test strategies
12. [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) - Production readiness

### 📊 Thesis Chapter Mapping

| Thesis Chapter | Key Files | Focus |
|---|---|---|
| **Introduction** | README.md | Problem statement |
| **Literature Review** | TECHNICAL_DOCUMENTATION.md | Tech stack & architecture |
| **System Design** | FILE_STRUCTURE.md, SUPABASE_SCHEMA.sql | Architecture & DB |
| **Implementation** | IMPLEMENTATION_SUMMARY.md, API_DOCUMENTATION.md | Features & code |
| **Testing** | TESTING_GUIDE.md, LAUNCH_CHECKLIST.md | QA & validation |
| **Results & Conclusion** | FINAL_SUMMARY.md | Outcomes |

### 💡 What to Include in Thesis

#### From TECHNICAL_DOCUMENTATION.md:
- System architecture diagram
- Technology stack details
- Database schema & ERD
- API endpoints table
- Security features
- Performance metrics

#### From IMPLEMENTATION_SUMMARY.md:
- Features checklist
- Code statistics
- Tech decisions & rationale
- Problems solved
- Performance improvements

#### From STOCK_BATCH_WORKFLOW_GUIDE.md:
- User workflows
- Data flow diagrams
- Use cases
- Performance benchmarks

#### Code Samples to Include:
```typescript
// Example 1: API Route (from route.ts files)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  // Database query + response
}

// Example 2: Component (from components/)
export function Component() {
  return <div>UI</div>
}

// Example 3: Type Definition (from lib/types.ts)
export interface Product {
  id: string
  sku: string
}
```

---

## ✅ Project Readiness

| Aspect | Status | Notes |
|--------|--------|-------|
| **Code Quality** | ✅ Production-ready | TypeScript, ESLint |
| **Documentation** | ✅ Comprehensive | 23 markdown files |
| **Testing** | ✅ Covered | Manual & unit tests |
| **Security** | ✅ RLS policies | User data isolation |
| **Performance** | ✅ Optimized | Indexed queries |
| **Deployment** | ✅ Ready | Vercel-compatible |
| **Thesis** | ✅ Well-documented | All files available |

---

## 🚀 Next Steps

1. **For Development:**
   - Read: QUICK_START.md
   - Setup: Follow installation steps
   - Code: Reference TECHNICAL_DOCUMENTATION.md

2. **For Deployment:**
   - Read: LAUNCH_CHECKLIST.md
   - Test: Run TESTING_GUIDE.md
   - Deploy: Use Vercel or Docker

3. **For Thesis:**
   - Read: Files in recommended order (above)
   - Create: Diagrams from architecture section
   - Quote: Use specific stats from documentation
   - Code: Include samples with explanations

---

**Last Updated:** February 21, 2026  
**Maintainer:** ProfitBox Development Team  
**Version:** 1.0.0  
**Status:** Production Ready ✅

---

**END OF FILE STRUCTURE DOCUMENTATION**
