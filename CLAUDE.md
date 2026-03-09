# CLAUDE.md — GrabSpec

## Projet
GrabSpec : web app Next.js qui recherche automatiquement photos produit + fiches techniques PDF à partir d'une liste. Bibliothèque personnelle, nomenclature configurable, export ZIP. Convertisseur PDF/Word gratuit inclus.

## Stack
- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Dexie.js (IndexedDB) — stockage local : bibliothèque, projets, nomenclature, settings
- PAS DE SYSTÈME D'AUTH — sessionId anonyme en localStorage
- Claude API (Haiku 4.5) pour extraction de specs
- SerpAPI pour la recherche web
- Vercel Blob pour le stockage fichiers temporaires
- Stripe pour les paiements (client_reference_id = sessionId)
- Upstash KV pour rate limiting + plan tracking
- next-intl pour i18n (FR, EN, ES, DE)
- Zustand pour le state management React
- ExcelJS + JSZip + file-saver pour génération ZIP/Excel côté client
- Déploiement Vercel

## Commandes
- `npm run dev` → lance Next.js dev (port 3000)

## Structure
- src/app/[locale]/ → Pages avec routing i18n
- src/app/api/ → API Routes (backend)
- src/components/ → Composants organisés par feature
- src/lib/ → Services (anthropic, search, scraper, stripe, storage, etc.)
- src/hooks/ → Custom hooks React
- src/stores/ → Zustand stores
- messages/ → Fichiers i18n (fr.json, en.json, es.json, de.json)

## Conventions
- TypeScript strict, jamais de `any`
- Imports avec alias `@/` (= src/)
- PascalCase composants, camelCase fonctions
- API routes : try/catch systématique, retour { data } ou { error }
- Fichiers max 200 lignes
- Tous les textes UI via next-intl `useTranslations()`, jamais de texte en dur
- shadcn/ui pour tous les composants de base
- Tailwind uniquement, pas de CSS custom
- Mobile-first responsive

## Architecture clé : ZERO AUTH
- PAS de table User, PAS de login, PAS de mot de passe
- sessionId = crypto.randomUUID() stocké en localStorage à la première visite
- Bibliothèque, projets, nomenclature = IndexedDB via Dexie.js (tout côté client)
- Rate limiting = Upstash KV avec sessionId comme clé (3/jour free)
- Stripe = client_reference_id = sessionId, plan stocké dans Upstash KV
- L'utilisateur utilise l'app immédiatement sans aucune friction

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
