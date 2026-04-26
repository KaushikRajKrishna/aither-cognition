# Deployment Guide: Aither Cognition on Vercel

## Part 1: Deploy Frontend on Vercel ✅

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub account with your repo pushed
- Bun package manager

### Steps

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Build Settings**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Installation Command: `npm install` or `bun install`

4. **Set Environment Variables in Vercel**
   - In Vercel Dashboard → Project Settings → Environment Variables
   - Add: `VITE_API_URL` = your backend API URL (e.g., https://your-backend.railway.app)

5. **Deploy**
   - Vercel will auto-deploy on push to main branch
   - Your frontend will be live at `https://your-project.vercel.app`

---

## Part 2: Deploy Backend on Railway (or Render) 🚀

### Why Separate?
- Your Express backend uses cron jobs (every 30 minutes)
- Vercel functions have 10-60 second timeout limits
- Railway/Render supports long-running processes

### Using Railway (Recommended)

1. **Prepare Backend**
   - Ensure `server/index.js` is ready
   - Ensure `package.json` has `"start": "node server/index.js"` script

2. **Create Railway Account**
   - Go to [Railway.app](https://railway.app)
   - Sign up with GitHub

3. **Deploy to Railway**
   - Click "Create New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect Node.js app

4. **Configure Environment Variables**
   - In Railway Dashboard → Variables
   - Add all backend environment variables:
     - `MONGODB_URI` = your MongoDB connection string
     - `PORT` = 5000 (or any port)
     - `NODE_ENV` = production
     - `JWT_SECRET` = (if used)
     - `OPENAI_API_KEY` = (if used)
     - `EMAIL_PASSWORD` = (if used)
     - Any other API keys

5. **Get Your Backend URL**
   - Railway provides: `https://your-backend-*.railway.app`
   - This becomes your `VITE_API_URL` on Vercel

---

## Part 3: Update Frontend API Configuration

### Update your API calls to use environment variable

**File: `src/lib/api.ts`**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = {
  // All your API calls here
  get: (endpoint: string) => fetch(`${API_BASE_URL}${endpoint}`),
  // etc...
};
```

---

## Part 4: Connect Frontend to Backend

### Update CORS in Backend

**File: `server/index.js`** - Update CORS configuration:
```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:8080',
  'http://localhost:8081'
];

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true 
}));
```

### Add to Railway Environment Variables
- `ALLOWED_ORIGINS` = https://your-frontend.vercel.app

---

## Part 5: Database Setup

### MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create a cluster
4. Get connection string
5. Add to Railway environment variables as `MONGODB_URI`

---

## Verification Checklist

- [ ] Frontend deployed on Vercel
- [ ] Backend deployed on Railway
- [ ] MongoDB Atlas cluster created with connection string
- [ ] Environment variables configured on both services
- [ ] CORS origins updated in backend
- [ ] Frontend API URL points to backend
- [ ] Test API calls from frontend
- [ ] Check backend logs for errors

---

## Troubleshooting

### Frontend can't reach backend
- Check VITE_API_URL in Vercel environment variables
- Check CORS origins in backend match your Vercel URL
- Check backend is running on Railway

### Cron jobs not running
- Verify backend is on Railway (not Vercel Functions)
- Check job logs in Railway dashboard

### Database connection fails
- Verify MONGODB_URI in Railway environment
- Check MongoDB Atlas IP whitelist (allow all IPs: 0.0.0.0/0)

---

## Optional: Alternative Backend Hosts

If not using Railway:

### Render.com
- Similar to Railway
- Free tier available
- Go to render.com → create web service

### Heroku (Paid)
- Traditional choice for Node apps
- Paid plans start at $7/month

### AWS/DigitalOcean
- More complex setup
- Full control
- App Platform for managed deployment
