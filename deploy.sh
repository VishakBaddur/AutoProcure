#!/bin/bash

# AutoProcure Deployment Script
# This script helps deploy AutoProcure to Railway and Vercel for Product Hunt launch

set -e

echo "🚀 AutoProcure Deployment Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install git first."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository. Please run this script from your AutoProcure project directory."
    exit 1
fi

# Check if all changes are committed
if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes. Please commit them before deploying."
    echo "Run: git add . && git commit -m 'Prepare for deployment'"
    exit 1
fi

print_status "Checking deployment prerequisites..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_warning "Railway CLI not found. You'll need to deploy manually via Railway dashboard."
    print_status "Install Railway CLI: npm install -g @railway/cli"
else
    print_success "Railway CLI found"
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. You'll need to deploy manually via Vercel dashboard."
    print_status "Install Vercel CLI: npm install -g vercel"
else
    print_success "Vercel CLI found"
fi

echo ""
print_status "Deployment Steps:"
echo "===================="
echo ""
echo "1. ${GREEN}Backend Deployment (Railway):${NC}"
echo "   - Go to https://railway.app/"
echo "   - Sign up/Login with GitHub"
echo "   - Click 'New Project' → 'Deploy from GitHub repo'"
echo "   - Select your repository"
echo "   - Set root directory to 'backend/'"
echo "   - Add environment variables (see below)"
echo ""
echo "2. ${GREEN}Frontend Deployment (Vercel):${NC}"
echo "   - Go to https://vercel.com/"
echo "   - Sign up/Login with GitHub"
echo "   - Click 'New Project'"
echo "   - Import your GitHub repository"
echo "   - Set root directory to 'frontend/'"
echo "   - Add environment variables (see below)"
echo ""

echo "Environment Variables:"
echo "====================="
echo ""
echo "${YELLOW}Railway (Backend):${NC}"
echo "DATABASE_URL=your_supabase_database_url"
echo "SUPABASE_URL=your_supabase_project_url"
echo "SUPABASE_ANON_KEY=your_supabase_anon_key"
echo "SUPABASE_SERVICE_KEY=your_supabase_service_key"
echo "AI_PROVIDER=ollama"
echo "AI_MODEL=mistral"
echo "OLLAMA_URL=http://localhost:11434"
echo "SLACK_WEBHOOK_URL=your_slack_webhook_url (optional)"
echo ""
echo "${YELLOW}Vercel (Frontend):${NC}"
echo "NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app"
echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
echo ""

print_status "Testing deployment..."
echo ""

# Test if backend is accessible (if URL is provided)
if [ ! -z "$BACKEND_URL" ]; then
    print_status "Testing backend health..."
    if curl -s "$BACKEND_URL/health" > /dev/null; then
        print_success "Backend is accessible"
    else
        print_warning "Backend is not accessible. Check your deployment."
    fi
fi

# Test if frontend is accessible (if URL is provided)
if [ ! -z "$FRONTEND_URL" ]; then
    print_status "Testing frontend accessibility..."
    if curl -s "$FRONTEND_URL" > /dev/null; then
        print_success "Frontend is accessible"
    else
        print_warning "Frontend is not accessible. Check your deployment."
    fi
fi

echo ""
print_success "Deployment guide completed!"
echo ""
echo "Next steps:"
echo "1. Deploy backend to Railway"
echo "2. Deploy frontend to Vercel"
echo "3. Test the complete application"
echo "4. Prepare Product Hunt assets"
echo "5. Launch on Product Hunt!"
echo ""
echo "For Product Hunt launch, you'll need:"
echo "- Logo (400x400px PNG)"
echo "- Screenshots (1280x800px PNG)"
echo "- Video demo (30-60 seconds)"
echo "- Compelling description"
echo "- Tagline"
echo ""
print_success "Good luck with your Product Hunt launch! 🎉" 