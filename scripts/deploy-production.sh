#!/bin/bash

# GrabSpec v2.0 - Production Deployment Script
# Usage: bash scripts/deploy-production.sh

set -e  # Exit on error

echo "🚀 GrabSpec v2.0 - Production Deployment Script"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Verify build
echo -e "${BLUE}Step 1/4: Verifying build...${NC}"
if npm run build > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Build successful"
else
  echo -e "${RED}✗${NC} Build failed"
  exit 1
fi

# Step 2: Check git status
echo ""
echo -e "${BLUE}Step 2/4: Checking git status...${NC}"
if [ -z "$(git status --porcelain)" ]; then
  echo -e "${GREEN}✓${NC} Working directory clean"
else
  CHANGES=$(git status --porcelain | wc -l)
  echo -e "${BLUE}ℹ${NC} $CHANGES files with changes"
  
  # Ask to commit
  read -p "Commit changes? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .
    read -p "Commit message: " COMMIT_MSG
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}✓${NC} Changes committed"
  fi
fi

# Step 3: Deploy to Vercel
echo ""
echo -e "${BLUE}Step 3/4: Deploying to Vercel...${NC}"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo -e "${BLUE}ℹ${NC} Vercel CLI not found. Installing..."
  npm install -g vercel
fi

# Deploy
echo -e "${BLUE}ℹ${NC} Starting Vercel deployment..."
if vercel --prod; then
  echo -e "${GREEN}✓${NC} Deployment initiated"
else
  echo -e "${RED}✗${NC} Deployment failed"
  exit 1
fi

# Step 4: Monitor deployment
echo ""
echo -e "${BLUE}Step 4/4: Monitoring deployment...${NC}"
echo ""
echo -e "${GREEN}✓${NC} Deployment in progress"
echo ""
echo "📊 Monitor your deployment:"
echo "   Vercel Dashboard: https://vercel.com/dashboard"
echo "   Your Project: https://vercel.com/projects"
echo ""
echo "🔍 Check status:"
echo "   vercel logs"
echo "   vercel env"
echo ""
echo "⏱️ Expected deployment time: 2-5 minutes"
echo ""
echo -e "${GREEN}Deployment script complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Check Vercel dashboard for deployment status"
echo "2. Visit your production URL when ready"
echo "3. Verify all features working"
echo "4. Monitor error logs for first 24 hours"
echo ""
echo "Support: See DEPLOYMENT_READY.md for troubleshooting"
