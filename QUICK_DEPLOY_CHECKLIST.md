# 🚀 Quick Deployment Checklist

## Pre-Deployment (Do Locally)
- [ ] Run `npm install` or `bun install`
- [ ] Test locally: `npm run dev:full`
- [ ] Verify no build errors: `npm run build`
- [ ] Copy `.env.example` to `.env` with your local values
- [ ] Commit and push to GitHub

## Step 1: Set Up MongoDB (5 min)
- [ ] Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [ ] Create free account
- [ ] Create a cluster
- [ ] Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/dbname`
- [ ] Save this as `MONGODB_URI`

## Step 2: Deploy Backend on Railway (10 min)
- [ ] Go to [Railway.app](https://railway.app)
- [ ] Sign up with GitHub
- [ ] Click "Create New Project" → "Deploy from GitHub repo"
- [ ] Select your repository → Railway auto-detects Node.js
- [ ] In Railway Dashboard → Variables tab, add:
  ```
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
  NODE_ENV=production
  PORT=5000
  ALLOWED_ORIGINS=https://yourapp.vercel.app  (add later)
  ```
- [ ] Deploy (Railway will auto-deploy from main branch)
- [ ] Copy your Railway URL: `https://your-project-*.railway.app`
- [ ] ✅ Backend is live!

## Step 3: Deploy Frontend on Vercel (10 min)
- [ ] Go to [Vercel](https://vercel.com)
- [ ] Sign up/Login with GitHub
- [ ] Click "Add New Project"
- [ ] Select your GitHub repository
- [ ] Framework: Vite (should auto-detect)
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] In Environment Variables section, add:
  ```
  VITE_API_URL=https://your-project-*.railway.app
  ```
- [ ] Click Deploy
- [ ] ✅ Frontend is live at `https://your-project.vercel.app`!

## Step 4: Finalize CORS (5 min)
- [ ] Go back to Railway Dashboard
- [ ] Update `ALLOWED_ORIGINS` variable with your Vercel URL:
  ```
  ALLOWED_ORIGINS=https://yourapp.vercel.app
  ```
- [ ] Railway will auto-redeploy

## Step 5: Test Your Deployment (5 min)
- [ ] Visit: `https://yourapp.vercel.app`
- [ ] Try authentication (login/signup)
- [ ] Test API calls (mood tracker, appointments, etc.)
- [ ] Check browser console for errors
- [ ] Check Railway dashboard logs for backend errors

## Troubleshooting

### "Cannot reach the server"
- [ ] Check VITE_API_URL in Vercel is correct
- [ ] Check Backend URL in Railway works (visit it in browser)
- [ ] Check ALLOWED_ORIGINS in Railway includes your Vercel URL

### "CORS error"
- [ ] Verify ALLOWED_ORIGINS in Railway matches your Vercel URL exactly
- [ ] Wait 30 seconds for Railway to redeploy

### Database connection fails
- [ ] Check MONGODB_URI is correct
- [ ] In MongoDB Atlas → Network Access → Allow all IPs (0.0.0.0/0)

### Cron jobs not running
- [ ] Check in Railway logs every 30 minutes
- [ ] Verify backend is running (check health: `https://your-backend.railway.app/api/health`)

## Environment Variables Reference

### Vercel (Frontend) - Project Settings → Environment Variables
```
VITE_API_URL=https://your-project-*.railway.app
```

### Railway (Backend) - Variables Tab
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://yourapp.vercel.app
JWT_SECRET=(if you have one)
OPENAI_API_KEY=(if you use ChatBot)
EMAIL_PASSWORD=(if you have email service)
```

## Success Indicators ✅
- [ ] Frontend loads without 404s
- [ ] Can log in/sign up
- [ ] API calls complete successfully
- [ ] No red errors in browser console
- [ ] Backend health check passes: `/api/health` returns `{"status":"ok"}`
- [ ] Cron jobs run (check logs)

## Key URLs
- Vercel Dashboard: https://vercel.com/dashboard
- Railway Dashboard: https://railway.app/dashboard
- MongoDB Atlas: https://account.mongodb.com/account/login
- Your Frontend: https://yourapp.vercel.app
- Your Backend: https://your-project-*.railway.app
- Backend Health: https://your-project-*.railway.app/api/health
