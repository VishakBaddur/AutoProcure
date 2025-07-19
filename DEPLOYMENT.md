# AutoProcure Deployment Guide

## 🚀 Launch on Product Hunt & Other Platforms (Zero Ongoing Costs)

This guide shows you how to deploy AutoProcure to the cloud with **zero ongoing AI costs** using Ollama + Mistral.

---

## 📋 Prerequisites

- GitHub repository with your AutoProcure code
- Supabase account (free tier)
- Railway account (free tier)
- Vercel account (free tier)

---

## 🎯 Deployment Strategy

### **Architecture:**
- **Frontend:** Vercel (Next.js) - Free
- **Backend:** Railway (FastAPI + Ollama) - Free tier available
- **Database:** Supabase (PostgreSQL) - Free tier
- **AI:** Ollama + Mistral (runs on Railway) - Zero API costs

### **Cost Breakdown:**
- ✅ **Vercel:** Free tier (unlimited)
- ✅ **Railway:** Free tier (limited hours, but sufficient for MVP)
- ✅ **Supabase:** Free tier (500MB database, 50K monthly active users)
- ✅ **AI Processing:** Zero cost (Ollama + Mistral)

---

## 🛠️ Step-by-Step Deployment

### **Step 1: Prepare Your Repository**

1. **Ensure your code is in a GitHub repository**
2. **Verify all files are committed:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

### **Step 2: Deploy Backend to Railway**

1. **Go to [Railway.app](https://railway.app/)**
2. **Sign up/Login with GitHub**
3. **Click "New Project" → "Deploy from GitHub repo"**
4. **Select your repository**
5. **Set the root directory to `backend/`**
6. **Railway will automatically detect the Dockerfile**

#### **Environment Variables (Railway Dashboard):**
```
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
AI_PROVIDER=ollama
AI_MODEL=mistral
OLLAMA_URL=http://localhost:11434
SLACK_WEBHOOK_URL=your_slack_webhook_url (optional)
```

7. **Deploy and wait for build to complete**
8. **Copy the Railway URL** (e.g., `https://your-app.railway.app`)

### **Step 3: Deploy Frontend to Vercel**

1. **Go to [Vercel.com](https://vercel.com/)**
2. **Sign up/Login with GitHub**
3. **Click "New Project"**
4. **Import your GitHub repository**
5. **Set the root directory to `frontend/`**
6. **Configure build settings:**
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

#### **Environment Variables (Vercel Dashboard):**
```
NEXT_PUBLIC_API_URL=https://your-app.railway.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

7. **Deploy**
8. **Copy the Vercel URL** (e.g., `https://your-app.vercel.app`)

### **Step 4: Test Your Deployment**

1. **Visit your Vercel URL**
2. **Sign up for a test account**
3. **Upload a sample quote**
4. **Verify AI analysis works**
5. **Check quote history and analytics**

---

## 🎉 Launch on Product Hunt

### **Before Launch:**

1. **Create Product Hunt Assets:**
   - **Logo:** 400x400px PNG
   - **Screenshots:** 1280x800px PNG (3-5 images)
   - **Video Demo:** 30-60 seconds (optional but recommended)

2. **Prepare Launch Content:**
   - **Tagline:** "AI-powered vendor quote analysis for procurement teams"
   - **Description:** Write compelling copy about the problem you solve
   - **Features:** List key benefits and features

3. **Set up Analytics:**
   - **Google Analytics** (optional)
   - **Product Hunt tracking** (built-in)

### **Launch Day:**

1. **Submit to Product Hunt** (midnight PST)
2. **Share on social media**
3. **Engage with comments and questions**
4. **Monitor performance and user feedback**

---

## 🔧 Alternative Deployment Options

### **Option A: Render (Alternative to Railway)**
- Similar to Railway
- Free tier available
- Good for Python/FastAPI apps

### **Option B: Heroku (Paid)**
- More expensive but very reliable
- Good for scaling later

### **Option C: AWS/GCP (Advanced)**
- More complex setup
- Better for enterprise customers
- More control and scalability

---

## 💰 Cost Optimization Tips

### **Railway Free Tier Limits:**
- **500 hours/month** (about 20 days)
- **1GB RAM, 1 vCPU**
- **Sufficient for MVP and early users**

### **Supabase Free Tier Limits:**
- **500MB database**
- **50K monthly active users**
- **2GB bandwidth**

### **Scaling Strategy:**
1. **Start with free tiers**
2. **Monitor usage**
3. **Upgrade only when needed**
4. **Consider paid plans for growth**

---

## 🚨 Troubleshooting

### **Common Issues:**

1. **Ollama not starting:**
   - Check Railway logs
   - Ensure Dockerfile is correct
   - Verify model download

2. **Database connection errors:**
   - Check DATABASE_URL format
   - Verify Supabase credentials
   - Test connection locally

3. **Frontend can't connect to backend:**
   - Check CORS settings
   - Verify API URL in environment variables
   - Test API endpoints directly

### **Getting Help:**
- Check Railway/Vercel logs
- Test locally first
- Use browser developer tools
- Check Supabase dashboard

---

## 🎯 Success Metrics

### **Track These for Your Launch:**
- **Sign-ups per day**
- **Quote uploads per user**
- **User retention (7-day, 30-day)**
- **Support requests**
- **Feature requests**

### **Product Hunt Success Indicators:**
- **Top 5 in category**
- **100+ upvotes**
- **Positive comments**
- **Press coverage**

---

## 🚀 Next Steps After Launch

1. **Monitor and respond to user feedback**
2. **Fix bugs quickly**
3. **Add requested features**
4. **Scale infrastructure as needed**
5. **Consider paid plans for growth**

---

**Good luck with your Product Hunt launch! 🎉** 