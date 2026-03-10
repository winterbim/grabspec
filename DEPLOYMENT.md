# DEPLOYMENT.md — Guide de Déploiement GrabSpec v2.0

**Date** : 10 mars 2026  
**Version** : 2.0 (Améliorations complètes)

---

## 🚀 Checklist Pré-Déploiement

### Code Quality
- [ ] Tous les linting errors corrigés (`npm run lint`)
- [ ] Tests passent (`npm run test`)
- [ ] Build sans erreurs (`npm run build`)
- [ ] TypeScript strict mode (`npx tsc --noEmit`)

### Features Validées
- [ ] Soft/hard delete produits fonctionne
- [ ] Recherche fuzzy matching validée
- [ ] Auto-categorization ~95% accuracy
- [ ] Excel export multi-sheets testé
- [ ] Integrations Slack/Drive testées
- [ ] Offline mode fonctionnel
- [ ] Vision API image recognition OK
- [ ] PDF OCR extraction OK
- [ ] Affiliate tracking setup
- [ ] RBAC permissions testées
- [ ] Regional pricing calculations validées

### Performance
- [ ] Lighthouse score > 90
- [ ] Build time < 60s
- [ ] Bundle size < 500KB (gzipped)
- [ ] First Contentful Paint < 1.5s
- [ ] Search response < 2s

### Security
- [ ] HTTPS enforced (Vercel default)
- [ ] API keys in .env (never in code)
- [ ] CSP headers configured
- [ ] CORS properly configured
- [ ] SQL injection N/A (no DB)
- [ ] XSS protection (React built-in)

### Database
- [ ] Dexie.js schema v2 migrated
- [ ] Indexes optimized
- [ ] Sample data loaded
- [ ] Backup strategy in place

---

## 📦 Installation & Build

### Prerequisites
```bash
# Node.js 20.x
node --version  # v20.x.x

# npm 10.x
npm --version   # 10.x.x

# Git
git --version
```

### Clone & Install
```bash
git clone https://github.com/winterbim/grabspec.git
cd grabspec

# Install dependencies
npm install

# Verify installation
npm run lint    # Should pass
npm run build   # Should complete successfully
```

### Local Development
```bash
# Start dev server (port 3000)
npm run dev

# In another terminal, monitor build
npm run lint

# Run tests (when ready)
npm run test
```

### Build for Production
```bash
# Optimize build
npm run build

# Check output
ls -la .next/
du -sh .next/

# Start production server locally
npm start
```

---

## 🔑 Environment Configuration

### Development (.env.local)
```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-your-dev-key
CLAUDE_MODEL=claude-3-5-haiku-20241022
SERPAPI_KEY=your-serpapi-dev-key

# Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_test_xxx
STRIPE_PRO_YEARLY_PRICE_ID=price_test_xxx
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_test_xxx
STRIPE_BUSINESS_YEARLY_PRICE_ID=price_test_xxx

# Upstash Redis
KV_REST_API_URL=https://your-project.upstash.io
KV_REST_API_TOKEN=your_upstash_token

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your_blob_token

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=GrabSpec
```

### Production (Vercel Dashboard)
```
All same keys, but with production service credentials
```

### Creating Secrets
```bash
# Add to Vercel project via CLI
vercel env add ANTHROPIC_API_KEY
vercel env add STRIPE_SECRET_KEY
# ... repeat for all keys

# Or via Vercel Dashboard:
# Settings → Environment Variables
```

---

## 🌐 Vercel Deployment

### First Time Setup

#### 1. Connect GitHub Repo
```bash
# From GitHub:
1. Fork https://github.com/winterbim/grabspec
2. Go to https://vercel.com/new
3. Select GitHub account
4. Import repository
5. Select Git scope
```

#### 2. Configure Project
```
Framework: Next.js
Root Directory: ./grabspec
Environment: Node.js 20.x
Build Command: npm run build
Start Command: npm start
```

#### 3. Add Environment Variables
```
In Vercel Dashboard → Settings → Environment Variables
Add all production secrets from .env.production
```

#### 4. Deploy
```
Vercel auto-deploys on git push to main
```

### Continuous Deployment

```
Push Flow:
  git push origin main
    ↓
  GitHub webhook triggers Vercel
    ↓
  Vercel builds (npm run build)
    ↓
  Tests run (if configured)
    ↓
  Deploy to preview URL
    ↓
  Promote to production on approval
```

### Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs
```

---

## ✅ Post-Deployment Validation

### Smoke Tests
```bash
# 1. Health check
curl https://grabspec.com/ | head -20

# 2. API test
curl -X POST https://grabspec.com/api/plan/check \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-123"}'

# 3. Metrics check
# Open Vercel dashboard → Analytics
```

### Feature Validation Checklist
- [ ] Landing page loads
- [ ] i18n routing works (/fr, /en, /es, /de)
- [ ] Converter PDF/Word upload functional
- [ ] Product search returns results
- [ ] Categories auto-assigned
- [ ] Soft delete works
- [ ] Export creates files
- [ ] Stripe checkout redirects properly
- [ ] Service Worker registered (DevTools)
- [ ] Offline mode functional

### Performance Check
```bash
# Use Lighthouse
# 1. Chrome DevTools → Lighthouse
# 2. Run audit → Check scores > 90

# Alternative: PageSpeed Insights
https://pagespeed.web.dev/?url=https://grabspec.com

# Monitor Vercel Analytics
https://vercel.com/dashboard/grabspec/analytics
```

### Error Monitoring
```
1. Vercel Logs
   Dashboard → Functions → Logs
   
2. Sentry (optional setup)
   npm install @sentry/nextjs
   Configure in next.config.ts
   
3. Custom error tracking
   API endpoints should log errors to KV
```

---

## 🔄 Zero-Downtime Updates

### Strategy
```
1. Feature branch from main
2. Add new feature
3. Create PR with staging tests
4. Merge to staging branch
5. Deploy to staging environment
6. Validate features
7. Merge to main
8. Auto-deploy to production
```

### Backward Compatibility
```
API Changes:
- Always support v1 endpoints
- Add v2 endpoints for new features
- Gradual migration (3 months)

Database Migrations:
- Use Dexie.js schema versioning
- Migrations auto-run in browser
- Backward compatible always
```

### Rollback Procedure
```bash
# If deployment fails:
1. Vercel auto-promotes previous good build
2. Or manually:
   vercel rollback

# Check Vercel Dashboard:
Deployments → Previous → Promote
```

---

## 📊 Monitoring & Maintenance

### Daily Checks
```
1. Vercel Dashboard → Overview
2. Check uptime/error rates
3. Monitor API response times
```

### Weekly Tasks
```
1. Review Vercel Analytics
2. Check Stripe webhook logs
3. Monitor Upstash KV usage
4. Review error logs in Functions
```

### Monthly Tasks
```
1. Analyze user metrics
2. Review plan upgrades/cancellations
3. Check database growth
4. Performance optimization review
```

### Quarterly Tasks
```
1. Security audit
2. Dependency updates (npm)
3. TypeScript strict mode review
4. Infrastructure optimization
```

---

## 🔐 Security Best Practices

### API Keys Management
```bash
# ✅ DO
- Store in Vercel environment variables
- Rotate keys every 90 days
- Use separate keys per environment

# ❌ DON'T
- Commit .env files
- Share keys via email/Slack
- Use same key across environments
```

### HTTPS & Certificates
```
Vercel auto-configures SSL/TLS
- Certificate auto-renews
- HSTS headers enabled
- 301 redirects HTTP → HTTPS
```

### Rate Limiting
```
Configured via Upstash KV:
- Free: 3 searches/day
- Pro: unlimited
- Business: unlimited + API access

Monitor: KV dashboard → Monitor tab
```

### CORS Configuration
```typescript
// In API routes:
res.setHeader('Access-Control-Allow-Origin', 'https://grabspec.com');
res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

---

## 🆘 Troubleshooting

### Build Failures
```bash
# Clear cache & rebuild
vercel pull       # Pull env from Vercel
npm ci --legacy-peer-deps
npm run build     # Test locally first

# Check logs
vercel logs --follow
```

### Runtime Errors
```
1. Check Vercel Functions logs
   Dashboard → Functions → Logs
   
2. Check browser console (F12)
   
3. Check IndexedDB
   DevTools → Application → IndexedDB
   
4. Check Service Worker
   DevTools → Application → Service Workers
```

### Performance Issues
```
1. Check Network tab (slow API)
2. Check Performance tab (rendering)
3. Check bundle size (npm run build)
4. Check database queries (KV latency)
```

### Integration Failures
```
1. Verify OAuth token not expired
2. Check rate limits (API provider)
3. Validate webhook URL accessible
4. Check API credentials in env
```

---

## 📝 Release Notes Template

```markdown
# GrabSpec v2.0 Release — [Date]

## ✨ New Features
- Smart product categorization (17 categories)
- Advanced search with fuzzy matching
- Integrations: Slack, Google Drive, Dropbox, Notion, Airtable
- Offline mode with smart caching
- Vision API for image recognition
- PDF OCR with table extraction
- Analytics dashboard (Business plan)
- RBAC with admin/editor/viewer roles
- Regional pricing + white label support

## 🐛 Bug Fixes
- Fixed soft delete not updating stats
- Fixed category detection timeout
- Fixed Excel export formatting

## ⚡ Performance
- Reduced bundle size 15%
- Improved search speed 30%
- Optimized IndexedDB indexes

## 🔒 Security
- Added CSRF protection
- Updated dependencies
- Security audit passed

## 📚 Documentation
- [IMPLEMENTATION_UPDATES.md](./IMPLEMENTATION_UPDATES.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [API_REFERENCE.md](./API_REFERENCE.md)

## 🎯 Breaking Changes
None - fully backward compatible
```

---

## 🎓 Team Onboarding

### New Developers
1. Clone repo
2. `npm install`
3. `npm run dev`
4. Read [ARCHITECTURE.md](./ARCHITECTURE.md)
5. Read [CLAUDE.md](./CLAUDE.md)

### Deployers
1. Understand Git flow
2. Have Vercel access
3. Know how to rollback
4. Can access environment vars

### Support Team
1. Know key features
2. Know how to check status
3. Know how to escalate

---

## 📞 Emergency Contacts

```
- Production Issue: Alert via Slack
- Database Issue: Check Vercel KV dashboard
- Payment Issue: Check Stripe dashboard
- API Issue: Check Vercel Functions logs
```

---

**Last Updated** : 10 mars 2026  
**Next Review** : 31 mars 2026  
**Owner** : Claude / DevOps Team
