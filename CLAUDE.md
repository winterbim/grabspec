# CLAUDE.md — GrabSpec (Analyse Approfondie)

## 📋 Vue d'ensemble du projet

### Pitch produit
**GrabSpec** : SaaS web app qui automatise la recherche de photos produits HD + fiches techniques PDF à partir d'une liste de références. Inclut :
- 🔍 **Product Finder** : recherche batch temps réel de photos + datasheets
- 📚 **Bibliothèque personnelle** : historique local des recherches
- 🏷️ **Nomenclature configurable** : nommage des fichiers par projet (variables : project, lot, manufacturer, reference, type, etc.)
- 💾 **Export ZIP** : grouper + télécharger tout côté client en seconds
- 🔄 **Convertisseur PDF ↔ Word** : outil SEO gratuit pour friction-less acquisition

### Cible utilisateurs
- **Pros** : architectes, bureaux d'études, installateurs, services achats, facility managers
- **Grand public** : particuliers en rénovation/achat équipement

### Pricing 3 tiers
| Plan | Prix | Limites | Cible |
|------|------|---------|-------|
| **Free** | 0€ | 3 recherches/jour, pas de bibliothèque persistante, convertisseur illimité | Découverte + SEO |
| **Pro** | 7.99€/mois (59.99€/an) | Recherches illimitées, bibliothèque, nomenclature, ZIP | Freelances, indépendants |
| **Business** | 24.99€/mois (199.99€/an) | Tout Pro + multi-projets, Excel récap. + API access | Entreprises |

**Langues** : FR (défaut), EN, ES, DE

---

## 🛠️ Stack technique complet

### Frontend (React 19 + Next.js 16)
```
Framework       : Next.js 16.1.6 (App Router) + TypeScript 5
UI Components   : shadcn/ui (base-ui) + Lucide icons
Styling         : Tailwind CSS 4 + TailwindCSS Animate
State Mgmt      : Zustand 5
Forms           : React Hook Form 7 + Zod 4 (validation)
i18n            : next-intl 4 (routing: /fr, /en, /es, /de)
Dark mode       : next-themes 0.4
Local Storage   : Dexie.js 4 (IndexedDB)
Notifications   : Sonner 2
Icons           : Lucide React 0.577
File handling   : JSZip 3, ExcelJS 4, file-saver 2
PDF handling    : unpdf 1, mammoth 1, docx 9
Dev deps        : Remotion 4 (video generation)
```

### Backend (API Routes Next.js)
```
Runtime         : Next.js API Routes (aucun Express externe)
AI              : Anthropic API (Claude Haiku 4.5) — @anthropic-ai/sdk 0.78
Web Search      : SerpAPI (fallback: Bing HTML scraping, DuckDuckGo)
Rate limiting   : Upstash Redis + @upstash/ratelimit
File storage    : Vercel Blob (@vercel/blob) pour uploads temporaires
Payments        : Stripe (API v20.4.1) + Webhooks
HTTP Client     : fetch natif
```

### Services externes
- **Claude API** : extraction specs + analyse documents
- **SerpAPI** : recherche web + images (fallback: scraping multi-source)
- **Stripe** : checkout + customer portal + webhooks (client_reference_id = sessionId)
- **Upstash KV/Redis** : rate limiting + stockage plan utilisateur
- **Vercel Blob** : stockage fichiers produits

---

## 🏗️ Architecture système : ZERO AUTH (Innovation clé)

### Absence intentionnelle d'authentification
**Pas de User table, pas de login, pas de mot de passe.** Friction 0 = conversion maximale.

**Modèle d'identité** :
```
sessionId = crypto.randomUUID() 
  → stocké en localStorage à la première visite
  → utilisé comme clé pour tout (rate limiting, plan tracking, Stripe)
```

### Persistence des données utilisateur
```
Bibliothèque        → IndexedDB/Dexie (côté client)
  ├── Projects      : nom, date création, nomenclature
  ├── Products      : résultats de recherche, images, PDFs URLs
  └── Settings      : nomenclature custom, préférences

Rate limiting       → Upstash KV (côté serveur)
  ├── Clé           : sessionId
  ├── Free plan     : 3 requêtes/jour
  └── Paid plans    : illimité

Stripe integration  → client_reference_id = sessionId
  ├── À chaque checkout : sessionId envoyé à Stripe
  ├── À chaque webhook : récupération plan depuis KV
  └── Checkout success : stockage plan dans KV
```

### Avantage de cette architecture
- ✅ Zero friction : aucune page login, utilisation immédiate
- ✅ Zero backend compliance : pas de RGPD sur User table (données clientside)
- ✅ Scalabilité : sessionId simplifie la gestion (pas de DB Users)
- ✅ Conversion rapide : utilisateur engage immédiatement

---

## 📂 Structure du codebase

```
src/
├── app/
│   ├── [locale]/                     # Dynamic routing pour i18n
│   │   ├── layout.tsx                # Root layout par langue
│   │   ├── page.tsx                  # Landing page (Hero + Features)
│   │   ├── contact/page.tsx          # Contact form
│   │   ├── converter/page.tsx        # PDF ↔ Word converter
│   │   ├── finder/page.tsx           # Product finder (main feature)
│   │   ├── library/page.tsx          # Utilisateur's project library
│   │   ├── pricing/page.tsx          # Pricing + checkout
│   │   ├── legal/privacy/page.tsx    # Legal pages
│   │   └── terms/page.tsx
│   │
│   ├── api/
│   │   ├── converter/
│   │   │   ├── pdf-to-word/route.ts  # POST file → Word
│   │   │   └── word-to-pdf/route.ts  # POST file → PDF
│   │   ├── finder/
│   │   │   ├── search/route.ts       # POST batch search
│   │   │   └── extract-specs/route.ts # POST extract specs from URLs
│   │   ├── plan/
│   │   │   └── check/route.ts        # GET user's plan (query sessionId)
│   │   ├── stripe/
│   │   │   ├── create-session/route.ts # POST create checkout session
│   │   │   └── webhook/route.ts      # POST Stripe webhooks
│   │   └── debug/
│   │       └── session/route.ts      # GET debug info
│   │
│   ├── middleware.ts                 # i18n routing middleware
│   ├── globals.css                   # Tailwind + global styles
│   ├── layout.tsx                    # Root layout (themes, fonts)
│   ├── manifest.ts                   # PWA manifest
│   ├── sitemap.ts                    # SEO sitemap
│   └── page.tsx                      # Default page (redirects to [locale])
│
├── components/
│   ├── converter/
│   │   ├── ConversionProgress.tsx    # Progress bar + status
│   │   ├── DownloadResult.tsx        # Download button
│   │   └── DropZone.tsx              # Drag-drop file input
│   ├── finder/
│   │   ├── ProductCard.tsx           # Result card (image + link)
│   │   ├── ProductInput.tsx          # Batch input textarea
│   │   ├── ResultsGrid.tsx           # Grid results display
│   │   └── SearchProgress.tsx        # Progress per product
│   ├── landing/
│   │   ├── CTASection.tsx            # Call-to-action (pricing)
│   │   ├── Features.tsx              # Feature list
│   │   ├── Hero.tsx                  # Main hero section
│   │   └── HowItWorks.tsx            # Step-by-step guide
│   ├── layout/
│   │   ├── Footer.tsx                # Footer
│   │   ├── Header.tsx                # Nav + logo
│   │   └── LanguageSwitcher.tsx      # i18n selector
│   ├── library/
│   │   ├── CompanySettings.tsx       # Edit company settings
│   │   ├── LibraryGrid.tsx           # Projects grid
│   │   ├── NomenclatureConfig.tsx    # Configure file naming
│   │   ├── ProjectDetailsForm.tsx    # Edit project
│   │   ├── ProjectSelector.tsx       # Select project
│   │   └── ZipDownloader.tsx         # Create + download ZIP
│   ├── pricing/
│   │   ├── BusinessExcelPreview.tsx  # Business plan preview
│   │   └── PricingCard.tsx           # Pricing card component
│   └── ui/
│       ├── badge.tsx                 # shadcn Badge
│       ├── button.tsx                # shadcn Button
│       ├── card.tsx                  # shadcn Card
│       ├── checkbox.tsx              # shadcn Checkbox
│       ├── dialog.tsx                # shadcn Dialog (modal)
│       ├── input.tsx                 # shadcn Input
│       ├── tabs.tsx                  # shadcn Tabs
│       ├── toast.tsx                 # shadcn Toast
│       └── [autres...]               # 20+ other UI primitives
│
├── hooks/
│   ├── useConverter.ts               # File conversion logic
│   ├── useFinder.ts                  # Product search logic
│   ├── useLibrary.ts                 # Project library CRUD
│   └── useSession.ts                 # Session management (sessionId)
│
├── stores/
│   ├── finderStore.ts                # Zustand: product search state
│   └── libraryStore.ts               # Zustand: projects state
│
├── lib/
│   ├── anthropic.ts                  # Claude API calls (extraction)
│   ├── converter.ts                  # PDF/Word conversion logic
│   ├── db.ts                         # Dexie.js schema + helpers
│   ├── download.ts                   # File download helpers
│   ├── excel.ts                      # Excel generation (ExcelJS)
│   ├── nomenclature.ts               # File naming template engine
│   ├── ratelimit.ts                  # Upstash rate limiting checks
│   ├── scraper.ts                    # HTML scraping (multi-source)
│   ├── search.ts                     # Web search orchestration
│   ├── storage.ts                    # Vercel Blob uploads/downloads
│   ├── stripe.ts                     # Stripe API helpers
│   └── utils.ts                      # Utility functions (cn, etc.)
│
├── types/
│   └── index.ts                      # Global TypeScript interfaces
│
├── i18n/
│   ├── navigation.ts                 # i18n routing helpers
│   ├── request.ts                    # getRequestConfig
│   └── routing.ts                    # locales + pathnames
│
├── middleware.ts                     # Next.js middleware (i18n routing)
│
└── messages/
    ├── fr.json                       # French translations
    ├── en.json                       # English translations
    ├── es.json                       # Spanish translations
    └── de.json                       # German translations
```

---

## 🔑 Modules clés et flux données

### 1. **Product Finder** (Module principal)
```
Utilisateur
  ↓
ProductInput (textarea batch)
  ↓
useFinder hook
  ↓
API POST /api/finder/search
  ├─ SerpAPI (ou fallback: Bing/DuckDuckGo scraping)
  ├─ searchProduct() → web results
  ├─ searchProductImages() → image URLs
  └─ fetchPageContent() → extract datasheet URLs
  ↓
Claude Haiku 4.5 (anthropic.ts)
  ├─ ExtractSpecs prompt → identification PDF
  └─ Retour : images[], datasheets[]
  ↓
ResultsGrid affiche ProductCards
  ↓
Utilisateur sélectionne → libraryStore (Zustand)
```

**Flux fichiers** :
- `src/hooks/useFinder.ts` : logique recherche
- `src/components/finder/*.tsx` : UI
- `src/lib/search.ts` : orchestration multi-sources
- `src/lib/anthropic.ts` : Claude extraction
- `src/lib/scraper.ts` : HTML scraping
- `src/app/api/finder/search/route.ts` : endpoint

### 2. **Bibliothèque + Nomenclature + ZIP**
```
Utilisateur crée Project
  ↓
ProjectDetailsForm (name, lot, manufacturer, etc.)
  ↓
Dexie.js IndexedDB
  ├─ projects table : {id, name, nomenclature_template, created_at}
  └─ products table : {id, projectId, query, image_url, datasheet_url}
  ↓
NomenclatureConfig : éditeur template
  Template : "{project}_{lot}_{manufacturer}_{reference}_{type}"
  → Généré en temps réel
  ↓
ZipDownloader
  ├─ Télécharge images/PDFs (fetch → Blob)
  ├─ Génère Excel (ExcelJS)
  ├─ Crée ZIP (JSZip)
  └─ client-side download (file-saver)
```

**Flux fichiers** :
- `src/lib/db.ts` : Dexie schema
- `src/hooks/useLibrary.ts` : CRUD projects
- `src/lib/nomenclature.ts` : template engine
- `src/lib/excel.ts` : Excel generation
- `src/components/library/*.tsx` : UI

### 3. **Convertisseur PDF ↔ Word**
```
Utilisateur upload file
  ↓
DropZone (drag-drop)
  ↓
useConverter hook
  ↓
API POST /api/converter/(pdf-to-word | word-to-pdf)
  ├─ PDF → Word : pdf-parse + docx lib (npm)
  └─ Word → PDF : puppeteer-core + @vercel/og ou libreoffice API
  ↓
ConversionProgress (loading)
  ↓
DownloadResult (Blob → download)
```

**Flux fichiers** :
- `src/lib/converter.ts` : conversion logic
- `src/hooks/useConverter.ts` : state management
- `src/app/api/converter/*.ts` : endpoints

### 4. **Stripe + Pricing**
```
Utilisateur clique "Upgrade Pro/Business"
  ↓
PricingCard → button "Subscribe"
  ↓
API POST /api/stripe/create-session
  └─ Input : { sessionId, priceId }
  └─ Stripe.checkout.sessions.create({
       client_reference_id: sessionId,
       line_items: [{price: priceId, quantity: 1}],
       success_url, cancel_url
     })
  └─ Retour : session.url
  ↓
Redirect Stripe Checkout
  ↓
Utilisateur paye
  ↓
Stripe webhook POST /api/stripe/webhook
  ├─ Event: checkout.session.completed
  ├─ Extract client_reference_id (sessionId)
  ├─ Upstash KV : SET {sessionId} = {plan: 'pro', expires_at: ...}
  └─ Email confirmation (facultatif)
  ↓
Frontend /api/plan/check?sessionId
  └─ Récupère plan depuis Upstash KV
  └─ Masque/démasque features
```

**Flux fichiers** :
- `src/components/pricing/*.tsx` : UI
- `src/lib/stripe.ts` : helpers
- `src/app/api/stripe/*.ts` : endpoints

### 5. **Rate Limiting & Plan Tracking**
```
À chaque requête API (finder, converter, etc.)
  ↓
checkRateLimit(sessionId)
  ├─ Récupère plan depuis KV
  ├─ Si free : max 3/jour
  ├─ Si pro/business : illimité
  └─ Incrémente counter Redis
  ↓
Si limité → return 429
Sinon → proceed API call
```

**Flux fichiers** :
- `src/lib/ratelimit.ts` : rate limiting logic
- `src/app/api/plan/check/route.ts` : plan endpoint

---

## 🔧 Services clés (lib/*.ts)

### `lib/anthropic.ts`
```typescript
export async function extractSpecsFromUrls(
  urls: string[], 
  query: string
): Promise<{ images: string[], datasheets: string[] }>
```
- Appelle Claude Haiku avec prompt de reconnaissance PDF/images
- Filtre résultats (confiance > 0.7)
- Retour : structured data

### `lib/search.ts`
```typescript
export async function searchProduct(query: string): Promise<SearchResult[]>
export async function searchProductImages(query: string): Promise<ImageResult[]>
export async function formatSearchResults(...): SearchResult[]
```
- Multi-source fallback : SerpAPI → Bing scraping → DuckDuckGo
- Déduplication résultats
- Format standardisé

### `lib/ratelimit.ts`
```typescript
export async function checkRateLimit(sessionId: string): Promise<{allowed, remaining}>
export async function getPlanFromKV(sessionId: string): Promise<{plan, expiresAt}>
```
- Redis Upstash pour comptage requests
- KV pour stockage plan/expiration

### `lib/excel.ts`
```typescript
export async function generateExcel({
  projects,
  settings,
  locale
}): Promise<Buffer>
```
- ExcelJS : création workbook
- Images intégrées dans Excel (Business plan)
- Hyperliens vers PDFs

### `lib/nomenclature.ts`
```typescript
export function applyNomenclatureTemplate(
  template: string,
  variables: {project?, lot?, manufacturer?, reference?, type?}
): string
```
- Template engine simple : remplace {variable} par valeurs
- Validation caractères interdits

---

## 📡 API Routes (Backend)

### POST `/api/finder/search`
```
Body: {
  products: [
    { query: "supplier SKU", manufacturer: "Bosch", reference: "ABC123" },
    ...
  ],
  sessionId: string
}

Retour: {
  results: [
    { query, images: [], datasheets: [], status: 'done'|'error' },
    ...
  ]
}
```

### POST `/api/converter/pdf-to-word`
```
Content-Type: multipart/form-data
File: PDF binary

Retour: binary (Word .docx)
```

### POST `/api/stripe/create-session`
```
Body: {
  sessionId: string,
  priceId: "price_xxx"
}

Retour: {
  data: { url: "https://checkout.stripe.com/..." }
}
```

### POST `/api/stripe/webhook`
```
Header: stripe-signature
Body: Stripe event

Traitement:
  - Event: checkout.session.completed
  - Extract client_reference_id (sessionId)
  - Store plan in Upstash KV
  - Send email (optionnel)
```

### GET `/api/plan/check?sessionId=xxx`
```
Retour: {
  plan: 'free'|'pro'|'business',
  expiresAt: timestamp,
  requestsRemaining: number
}
```

---

## 💾 IndexedDB Schema (Dexie.js)

```typescript
projects: {
  id: string (PK),
  name: string,
  nomenclature_template: string,
  companyName?: string,
  created_at: timestamp
}

products: {
  id: string (PK),
  projectId: string (FK),
  query: string,
  manufacturer?: string,
  reference?: string,
  images_url: string[],
  datasheets_url: string[],
  created_at: timestamp
}

settings: {
  sessionId: string (PK),
  dark_mode: boolean,
  locale: string
}
```

---

## 🎨 UI/UX Patterns

### Shadcn/ui Components utilisés
- **Button** : CTA, submit
- **Input** : text fields
- **Card** : containers
- **Dialog/Modal** : forms
- **Tabs** : navigation
- **Badge** : tags/status
- **Progress** : conversion/search progress
- **Checkbox** : multi-select
- **Toast** (Sonner) : notifications

### Responsive design
- Mobile-first Tailwind (sm:, md:, lg:)
- Touch-friendly buttons (min 44px)
- Dark mode support (next-themes)

### Animations
- Tailwind Animate
- Lucide icon fade-ins
- Progress bar smooth transitions

---

## 🌍 i18n Implementation (next-intl)

### Routing structure
```
/ → redirect /fr (default)
/fr/* → French
/en/* → English
/es/* → Spanish
/de/* → German
```

### Translation files
```json
// messages/fr.json
{
  "common": { "loading": "Chargement...", "error": "Erreur" },
  "finder": { "search": "Chercher", "results": "Résultats" },
  "pricing": { "pro": "Plan Pro", "business": "Plan Business" }
}
```

### Usage dans composants
```typescript
'use client';
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('finder');
  return <h1>{t('search')}</h1>;
}
```

---

## 📝 Conventions de code

### TypeScript
- ✅ Strict mode obligatoire
- ✅ Jamais de `any` (utiliser `unknown` si nécessaire)
- ✅ Interfaces pour les données structures (pas type aliases)
- ✅ Types globales dans `src/types/index.ts`

### Composants React
- ✅ Functional components
- ✅ `'use client'` au top des client components
- ✅ Props interface : `interface ComponentProps { ... }`
- ✅ Export default
- ✅ Max 200 lignes par fichier

### API Routes
```typescript
export async function POST(req: Request) {
  try {
    // validation
    // logic
    return Response.json({ data: ... });
  } catch (error) {
    return Response.json({ error: '...' }, { status: 500 });
  }
}
```

### Nommage
- **Composants** : PascalCase (ProductCard.tsx)
- **Fichiers** : camelCase sauf composants (useConverter.ts)
- **Fonctions** : camelCase (searchProduct)
- **Types/Interfaces** : PascalCase (ProductResult)
- **Constants** : UPPER_SNAKE_CASE

### Styling
- ✅ Tailwind CSS uniquement
- ✅ Pas de CSS modules
- ✅ Pas de CSS inline
- ✅ Dark mode via className="dark:..."
- ✅ Spacing: scale 4px (p-1 = 4px, p-2 = 8px, etc.)

---

## 🚀 Déploiement & Environment

### Environment variables requises
```bash
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-haiku-20241022

# SerpAPI (web search)
SERPAPI_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_...
STRIPE_BUSINESS_YEARLY_PRICE_ID=price_...

# Upstash
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...

# Vercel Blob
BLOB_READ_WRITE_TOKEN=...

# App config
NEXT_PUBLIC_APP_URL=https://grabspec.com
NEXT_PUBLIC_APP_NAME=GrabSpec
```

### Deployment Vercel
```bash
# 1. Push to GitHub
git push origin main

# 2. Import sur Vercel dashboard
# 3. Set env variables
# 4. Deploy

# Vercel auto-builds + deploys sur git push
```

### Scripts NPM
```bash
npm run dev        # Local dev (port 3000)
npm run build      # Build production
npm start          # Start production server
npm run lint       # ESLint check
```

---

## 🐛 Debugging & Monitoring

### VSCode debugging
- Ajouter `.vscode/launch.json` pour Next.js debugger
- `npm run dev` + F5 pour attach debugger

### Vercel Analytics
- Intégré par défaut (Web Vitals)
- Dashboard sur Vercel console

### Error handling
- Try/catch dans toutes API routes
- Sonner toast pour user feedback
- Console.error pour server logs

---

## 📊 Key Metrics & Future Features

### Current MVP
- ✅ Product Finder (batch search)
- ✅ Converter PDF ↔ Word
- ✅ Library + Projects
- ✅ Nomenclature template
- ✅ ZIP export
- ✅ 3-tier pricing
- ✅ i18n (4 langues)

### Roadmap potentielle
- [ ] API endpoints (Business plan)
- [ ] Intégration n8n workflows (voir `/n8n-workflows/`)
- [ ] Multi-project collaboration
- [ ] Advanced filters (color, size, etc.)
- [ ] Bulk operations (edit nomenclature batch)
- [ ] Analytics dashboard (Business plan)
- [ ] Webhook integrations

---

## 🔗 Fichiers clés à mémoriser

**Frontend** :
- `src/components/finder/ProductInput.tsx` : UI saisie batch
- `src/components/library/ZipDownloader.tsx` : export logic
- `src/components/pricing/PricingCard.tsx` : checkout button

**Backend** :
- `src/app/api/finder/search/route.ts` : main search endpoint
- `src/lib/anthropic.ts` : Claude integration
- `src/lib/search.ts` : multi-source search

**Config** :
- `next.config.ts` : Next.js config
- `tsconfig.json` : TypeScript config
- `tailwind.config.ts` : Tailwind config
- `.env.example` : environment template

---

## ⚡ Performance & Optimization

### Client-side
- ✅ Dexie.js IndexedDB pour caching local (0 DB request)
- ✅ Zustand pour state management (lightweight)
- ✅ Code splitting auto via Next.js

### Server-side
- ✅ API routes lightweight (pas de ORM lourd)
- ✅ Rate limiting Upstash (fast KV)
- ✅ Vercel edge functions (optional future)

### SEO
- ✅ next-intl canonical links (hreflang)
- ✅ Sitemap généré (sitemap.ts)
- ✅ Manifest PWA (manifest.ts)
- ✅ Open Graph tags (layout.tsx)

---

**Document généré** : 10 mars 2026
**Dernière mise à jour** : Architecture complète, modules, services, conventions

## Règles métier
- Convertisseur PDF/Word = GRATUIT pour tous, pas d'auth requise
- Finder = 3 recherches/jour FREE, illimité PRO/BUSINESS
- ZIP et Excel générés 100% côté client (JSZip + ExcelJS dans le navigateur)
- Claude Haiku 4.5 pour l'extraction (pas Sonnet — trop cher pour du batch)
- Toujours valider les entrées avec Zod avant de toucher l'API Claude

## Nomenclature
Template par défaut : {PROJET}_{LOT}_{FABRICANT}_{REF}_{TYPE}
Variables disponibles : PROJET, LOT, FABRICANT, REF, NOM, TYPE, NUM, DATE
TYPE = PHOTO ou FT (fiche technique)
Sanitization : uppercase, pas d'accents, pas de caractères spéciaux
