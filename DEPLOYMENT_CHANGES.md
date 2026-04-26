# ✅ Deployment Changes Summary

## Files Created
1. **vercel.json** - Vercel build configuration
2. **.env.example** - Environment variables template
3. **DEPLOYMENT_GUIDE.md** - Complete deployment instructions

## Files Modified

### 1. `package.json`
- ✅ Added `"start": "node server/index.js"` script (required by Railway)

### 2. `src/lib/api.ts`
- ✅ Updated BASE URL to use environment variable `VITE_API_URL`
- ✅ Falls back to `http://localhost:5000` for local development

### 3. `server/index.js`
- ✅ Updated CORS to use environment variable `ALLOWED_ORIGINS`
- ✅ Supports both development and production URLs
- ✅ Added Vite dev port (5173) to allowed origins

## Next Steps

### 1. Create `.env` file locally
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

### 2. Push to GitHub
```bash
git add .
git commit -m "Add deployment configuration for Vercel + Railway"
git push origin main
```

### 3. Frontend: Deploy on Vercel
- Go to https://vercel.com
- Import your GitHub repository
- Set `VITE_API_URL` environment variable to your backend URL

### 4. Backend: Deploy on Railway
- Go to https://railway.app
- Create new project from GitHub
- Add environment variables (MONGODB_URI, etc.)
- Get your Railway backend URL

### 5. Final Connection
- Update Vercel `VITE_API_URL` with Railway URL
- Update Railway `ALLOWED_ORIGINS` with Vercel URL (e.g., https://yourapp.vercel.app)
- Redeploy both services

## Environment Variables Checklist

### Vercel (Frontend)
- [ ] `VITE_API_URL` = `https://your-backend.railway.app`

### Railway (Backend)
- [ ] `MONGODB_URI` = Your MongoDB Atlas connection string
- [ ] `PORT` = 5000
- [ ] `NODE_ENV` = production
- [ ] `ALLOWED_ORIGINS` = https://your-project.vercel.app
- [ ] `JWT_SECRET` = (if applicable)
- [ ] `OPENAI_API_KEY` = (if applicable)
- [ ] Any other service API keys

## Testing Locally
```bash
# Terminal 1: Start backend
npm run server

# Terminal 2: Start frontend
npm run dev

# Test: http://localhost:8080 → calls http://localhost:5000/api/*
```

## Production URLs (Example)
- **Frontend**: https://aither-cognition.vercel.app
- **Backend**: https://aither-cognition.railway.app
