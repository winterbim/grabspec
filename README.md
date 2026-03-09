# GrabSpec

**Product photos & technical datasheets in 10 seconds**

![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-Apache_2.0-blue)

---

## What is GrabSpec?

GrabSpec is a SaaS web application that automatically finds product photos and technical datasheets (PDF) from a product list. Paste your product references, get HD images and spec sheets back in seconds, organized and ready to download as a ZIP archive.

## Key Features

- **Product Search** -- Search by manufacturer and reference to find product data instantly.
- **HD Photos** -- Automatically retrieves high-resolution product images from the web.
- **PDF Datasheets** -- Finds and downloads official technical datasheets.
- **ZIP Export** -- Download all photos and datasheets as a single ZIP with Excel summary, generated entirely client-side.
- **Custom Nomenclature** -- Configure file naming templates with variables (project, lot, manufacturer, reference, type, etc.).
- **PDF/Word Converter** -- Free built-in converter for PDF to Word and Word to PDF.
- **4 Languages** -- Full i18n support for French, English, Spanish, and German.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 + shadcn/ui (base-ui) |
| Local Storage | Dexie.js (IndexedDB) |
| State Management | Zustand |
| AI Extraction | Claude Haiku 4.5 (Anthropic) |
| Web Search | SerpAPI |
| Payments | Stripe |
| Rate Limiting | Upstash KV |
| File Storage | Vercel Blob |
| Client-side Export | JSZip + ExcelJS + file-saver |
| i18n | next-intl |
| Deployment | Vercel |

## Quick Start

```bash
# Clone the repository
git clone https://github.com/winterbim/grabspec.git
cd grabspec

# Install dependencies (requires Node.js 20)
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

> **Note:** Node.js v20 is required. A `.nvmrc` file is included -- run `nvm use` to switch automatically.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Public application URL |
| `NEXT_PUBLIC_APP_NAME` | Application display name |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `CLAUDE_MODEL` | Claude model identifier |
| `SERPAPI_KEY` | SerpAPI key for web search |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (client-side) |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Stripe price ID for Pro monthly plan |
| `STRIPE_PRO_YEARLY_PRICE_ID` | Stripe price ID for Pro yearly plan |
| `STRIPE_BUSINESS_MONTHLY_PRICE_ID` | Stripe price ID for Business monthly plan |
| `STRIPE_BUSINESS_YEARLY_PRICE_ID` | Stripe price ID for Business yearly plan |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage read/write token |
| `KV_REST_API_URL` | Upstash KV REST API URL |
| `KV_REST_API_TOKEN` | Upstash KV REST API token |

See `.env.example` for a ready-to-use template.

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/winterbim/grabspec)

Set all environment variables in your Vercel project settings before deploying.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

Copyright 2026 winterbim.
