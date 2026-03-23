# GrabSpec

**Product photos & technical datasheets in 10 seconds.**

![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-Apache_2.0-blue)

🌐 **Live:** [grabspec.com](https://grabspec.com)

---

## What is GrabSpec?

GrabSpec is a SaaS web application for construction professionals. Paste your product references, and get back HD photos and technical datasheets (PDF) in seconds — organized, named, and ready to download as a ZIP.

## Features

### 🔍 Product Finder
- Search by manufacturer + reference
- HD product photo retrieval from the web
- Automatic PDF datasheet discovery (with Google fallback)
- Batch processing for multiple products
- Export as ZIP with embedded Excel summary (photos in cells, PDF hyperlinks)

### 📊 Document Analyzer *(Business)*
- Upload PDF, DOCX, XLSX, CSV, or TXT documents
- AI-powered analysis with 9 chart types: bar, line, area, pie, radar, radial bar, treemap, funnel, and **Sankey** diagrams
- Executive dashboard with KPIs, trends, and insights
- Export dashboard as **PNG** or as a **full HTML presentation** (McKinsey/BCG quality)
- Interactive presentation preview with animations, slide navigation, and progress bar

### 📄 Document Converter *(Free)*
- PDF → Word and Word → PDF
- Image conversion (PNG, JPG, WebP, HEIC)
- Client-side processing — files never leave the browser

### 📚 Standards Library
- Browse construction standards (NF, EN, ISO, SIA, DTU)
- Search by code, title, or category

### 🌍 Internationalization
- Full i18n support: French, English, Spanish, German

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State | Zustand |
| Local Storage | Dexie.js (IndexedDB) |
| AI | Claude Haiku 4.5 (Anthropic) |
| Web Search | SerpAPI |
| Charts | Recharts 3 |
| Export | JSZip, ExcelJS, html-to-image |
| i18n | next-intl |
| Payments | Stripe |
| Rate Limiting | Upstash Redis |
| Deployment | Vercel |

## Quick Start

```bash
git clone https://github.com/winterbim/grabspec.git
cd grabspec
npm install
cp .env.example .env.local   # configure your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> Requires Node.js 20+. A `.nvmrc` is included — run `nvm use` to switch.

## Environment Variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public application URL |
| `NEXT_PUBLIC_APP_NAME` | Application display name |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `CLAUDE_MODEL` | Claude model identifier |
| `SERPAPI_KEY` | SerpAPI key for web search |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Price ID — Pro monthly |
| `STRIPE_PRO_YEARLY_PRICE_ID` | Price ID — Pro yearly |
| `STRIPE_BUSINESS_MONTHLY_PRICE_ID` | Price ID — Business monthly |
| `STRIPE_BUSINESS_YEARLY_PRICE_ID` | Price ID — Business yearly |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token |
| `KV_REST_API_URL` | Upstash KV REST API URL |
| `KV_REST_API_TOKEN` | Upstash KV REST API token |

See `.env.example` for a ready-to-use template.

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/winterbim/grabspec)

Set all environment variables in your Vercel project settings before deploying.

## License

Apache License 2.0 — see [LICENSE](LICENSE) for details.

Copyright 2025 winterbim.
