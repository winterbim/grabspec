# ARCHITECTURE.md — GrabSpec Amélioré

**Version** : 2.0 - Advanced Features  
**Date** : 10 mars 2026  
**Statut** : Production

---

## 📐 Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer (React 19)                   │
├──────────────────┬──────────────────┬──────────────────────────┤
│  UI Components   │   Hooks/Stores   │   Service Workers        │
│  - ProductCard  │   - useLibrary   │   - Offline Sync         │
│  - SearchUI     │   - useConverter │   - Cache Strategy       │
│  - Integrations │   - useFinder    │   - Prefetch             │
└──────────────────┴──────────────────┴──────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Local Storage Layer (IndexedDB)                 │
├──────────────────┬──────────────────┬──────────────────────────┤
│   Products       │   Projects       │   Settings               │
│   - Categorized  │   - Metadata     │   - SessionId            │
│   - Soft Delete  │   - Templates    │   - Preferences          │
│   - Tags/Notes   │   - Company      │   - Integration Keys     │
└──────────────────┴──────────────────┴──────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js Routes)                    │
├──────────────────┬──────────────────┬──────────────────────────┤
│  /api/finder/    │  /api/converter/ │  /api/analytics/         │
│  /api/stripe/    │  /api/export/    │  /api/integrations/      │
└──────────────────┴──────────────────┴──────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                  External Services Integration                   │
├──────────────────┬──────────────────┬──────────────────────────┤
│  AI/Vision       │   File Storage   │   Infrastructure         │
│  - Anthropic     │   - Vercel Blob  │   - Upstash KV          │
│  - Claude 3.5    │   - Drive/Box    │   - Stripe              │
│  - Vision API    │   - Dropbox      │   - Webhooks            │
│                  │   - Notion       │   - SSE Streaming       │
└──────────────────┴──────────────────┴──────────────────────────┘
```

---

## 🗂️ Nouvelle Structure des Fichiers

```
src/lib/
├── smart-categories.ts       ✨ NEW — Auto-categorization engine
├── library-search.ts         ✨ NEW — Advanced search + filtering
├── advanced-features.ts      ✨ NEW — Streaming, offline, vision
├── integrations.ts           ✨ NEW — Slack, Drive, Dropbox, Notion, Airtable
├── business-features.ts      ✨ NEW — Analytics, RBAC, SLA, regional pricing
├── advanced-export.ts        ✨ NEW — Smart Excel/CSV/JSON exports
│
├── anthropic.ts              (existing) — Claude API
├── converter.ts              (existing) — PDF/Word conversion
├── db.ts                     (updated) — Enhanced schema with soft delete
├── nomenclature.ts           (existing) — Template engine
├── ratelimit.ts              (existing) — Upstash rate limiting
├── search.ts                 (existing) — Web search orchestration
├── stripe.ts                 (existing) — Payment processing
└── utils.ts                  (existing) — Utilities

src/hooks/
├── useLibrary.ts             (updated) — Delete, search, categorization
├── useConverter.ts           (existing)
├── useFinder.ts              (existing)
└── useSession.ts             (existing)

src/components/library/
├── ProductCardAdvanced.tsx   ✨ NEW — Enhanced product card
├── LibraryAdvancedSearch.tsx ✨ NEW — Advanced search dialog
└── (existing components)

src/components/integrations/
├── SlackIntegrationSetup.tsx ✨ NEW
├── GoogleDriveSync.tsx       ✨ NEW
├── NotionSync.tsx            ✨ NEW
├── AirtableSync.tsx          ✨ NEW
└── DropboxSync.tsx           ✨ NEW

src/app/api/
├── /analytics/               ✨ NEW ROUTES
│   ├── dashboard/route.ts
│   ├── affiliate-click/route.ts
│   └── export/route.ts
├── /integrations/            ✨ NEW ROUTES
│   ├── slack/webhook/route.ts
│   ├── oauth/callback/route.ts
│   └── status/route.ts
├── /export/                  ✨ NEW ROUTES
│   ├── excel/route.ts
│   ├── csv/route.ts
│   └── json/route.ts
└── (existing routes)
```

---

## 🔄 Data Flow Patterns

### Pattern 1: Search → Categorize → Export
```
User Input
  ↓
useFinder hook
  ↓
API /api/finder/search
  ↓
SerpAPI/Claude extraction
  ↓
Results → Store in IndexedDB
  ↓
Auto-detect category (smart-categories.ts)
  ↓
Update in Dexie
  ↓
Display in ProductCardAdvanced
  ↓
Search/Filter via library-search.ts
  ↓
Generate export (advanced-export.ts)
  ↓
Stream to integrations (Slack, Drive, Notion)
```

### Pattern 2: Offline Operation
```
User offline
  ↓
Service Worker active
  ↓
Cache-first strategy for products
  ↓
Search offline via searchOfflineResults()
  ↓
Store pending operations in queue
  ↓
User comes online
  ↓
syncPendingSearches() triggered
  ↓
Sync with server via SSE stream
  ↓
IndexedDB updated
```

### Pattern 3: Integration Flow
```
Search completed
  ↓
Event emitted
  ↓
Integration check (if enabled)
  ↓
Get config from IndexedDB
  ↓
Call appropriate integration handler
  ├── SlackIntegration.notifySearchComplete()
  ├── GoogleDriveIntegration.saveExport()
  ├── NotionIntegration.saveSearchResult()
  ├── AirtableIntegration.saveSearchResult()
  └── DropboxIntegration.saveExport()
  ↓
Success notification
  ↓
Track event in analytics
```

---

## 🎯 Feature Matrix

| Feature | Free | Pro | Business |
|---------|------|-----|----------|
| **Search** | 3/day | Unlimited | Unlimited |
| **Soft Delete** | ✅ | ✅ | ✅ |
| **Categories** | Auto | Auto | Auto |
| **Search Filters** | Basic | Advanced | Advanced |
| **Offline Mode** | ✅ | ✅ | ✅ |
| **Integrations** | - | 1 | 5 |
| **Streaming Results** | - | ✅ | ✅ |
| **Vision API** | - | ✅ | ✅ |
| **PDF OCR** | - | ✅ | ✅ |
| **Advanced Export** | CSV | Excel | Excel+JSON |
| **Analytics** | - | - | Dashboard |
| **Affiliate Tracking** | - | - | ✅ |
| **API Access** | - | - | ✅ |
| **RBAC/Teams** | - | - | ✅ |
| **White Label** | - | - | ✅ |
| **Regional Pricing** | - | - | ✅ |
| **SLA Support** | Email | Email/Chat | Phone |

---

## 🔐 Security Architecture

### Authentication
- Zero-auth model
- sessionId = UUID stored in localStorage
- Rate limiting via Upstash + sessionId

### Authorization
- RBAC policies (admin, editor, viewer)
- Feature flags per plan
- API key for Business tier

### Data Protection
- IndexedDB encryption at rest (browser-level)
- HTTPS only for API calls
- Stripe PCI compliance
- GDPR: No User table = zero compliance overhead

---

## ⚡ Performance Optimization

### Frontend
- Code splitting per route
- Image lazy loading
- Service Worker caching
- Smart prefetch by manufacturer

### Backend
- Vercel Edge Functions for rate limiting
- Upstash Redis for KV (sub-ms latency)
- Streaming SSE for long operations
- Batch processing for categorization

### Database
- Dexie.js IndexedDB (local-first)
- Indexes on frequently queried fields
- Soft deletes (no full deletes)

### Network
- Gzip compression
- Brotli for large payloads
- Cache-Control headers
- CDN for static assets (Vercel)

---

## 📊 Scalability

### Horizontal Scaling
- Stateless API routes
- No session storage on server (sessionId in client)
- Vercel serverless auto-scaling

### Data Volume
- Can handle 100k+ products per user
- IndexedDB limit: ~50MB per origin
- Implement data archival for old products

### Concurrency
- Optimistic updates in UI
- Conflict resolution via timestamps
- Queue system for batch operations

---

## 🧪 Testing Strategy

### Unit Tests
- `smart-categories.ts` : 50+ test cases for categorization
- `library-search.ts` : Fuzzy search, filtering, sorting
- `advanced-export.ts` : Excel/CSV/JSON generation

### Integration Tests
- Search + Categorization + Export flow
- Offline sync + online merge
- Integration handlers (Slack, Drive, etc.)

### E2E Tests
- Full user journey: Search → Category → Export
- Integration workflows
- Offline scenarios

---

## 📈 Monitoring & Analytics

### Metrics Tracked
- Search completion time
- Export generation time
- Integration success rate
- Category accuracy
- Offline sync queue size
- Cache hit ratio

### Error Tracking
- API error rates by endpoint
- Integration failures
- Offline sync failures
- User error reports

### User Analytics
- Conversion funnel (free → pro)
- Feature usage (export, integrations)
- Regional adoption
- Plan retention

---

## 🚀 Deployment Pipeline

```
Local Dev (npm run dev)
  ↓
Test Suite (npm run test)
  ↓
Lint (npm run lint)
  ↓
Build (npm run build)
  ↓
Vercel Preview Deploy
  ↓
Manual QA (staging)
  ↓
Production Deploy (vercel.com)
  ↓
Monitor (Vercel Analytics + Custom)
```

### Environment Variables

**Development**
```
ANTHROPIC_API_KEY=sk-ant-...
SERPAPI_KEY=...
STRIPE_PUBLISHABLE_KEY=pk_test_...
KV_REST_API_URL=... (dev)
BLOB_READ_WRITE_TOKEN=... (dev)
```

**Production**
```
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
KV_REST_API_URL=... (prod)
BLOB_READ_WRITE_TOKEN=... (prod)
NEXT_PUBLIC_APP_URL=https://grabspec.com
```

---

## 🔗 API Endpoints Reference

### Search & Products
- `POST /api/finder/search` — Batch search
- `POST /api/finder/search-stream` — SSE streaming
- `POST /api/finder/extract-from-image` — Vision API
- `POST /api/finder/extract-pdf-text` — OCR

### Export
- `POST /api/export/excel` — Generate Excel
- `POST /api/export/csv` — Generate CSV
- `POST /api/export/json` — Generate JSON

### Integrations
- `POST /api/integrations/oauth/callback` — OAuth handler
- `POST /api/integrations/slack/webhook` — Slack events
- `GET /api/integrations/status` — Check integration status

### Analytics
- `GET /api/analytics/dashboard` — Dashboard metrics
- `POST /api/analytics/conversion-funnel` — Track conversion
- `POST /api/analytics/affiliate-click` — Track affiliate
- `GET /api/analytics/export` — Export to BI

### Payments
- `POST /api/stripe/create-session` — Checkout
- `POST /api/stripe/webhook` — Webhook handler

---

## 📚 Documentation Links

- Feature Docs: [IMPLEMENTATION_UPDATES.md](./IMPLEMENTATION_UPDATES.md)
- API Specs: [API_REFERENCE.md](./API_REFERENCE.md) (TODO)
- Component Library: [COMPONENTS.md](./COMPONENTS.md) (TODO)
- Deployment: [DEPLOYMENT.md](./DEPLOYMENT.md) (TODO)

---

**Last Updated** : 10 mars 2026  
**Architecture Version** : 2.0  
**Status** : ✅ Production Ready
