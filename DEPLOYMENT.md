# Deployment Guide

This guide covers deploying the DreamUp Games QA backend to production using Railway.

## Prerequisites

- [Railway Account](https://railway.app/)
- [GitHub Repository](https://github.com/) (connected to Railway)
- OpenAI API Key

---

## Part 1: Backend Deployment (Railway)

### 1. Create Railway Project

1. Log in to [Railway](https://railway.app/)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Select your repository
5. Choose **"Add variables later"**

### 2. Configure Environment Variables

In your Railway project settings, add these environment variables:

```env
# Add these manually
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Configure Build Settings

Railway should auto-detect the build settings, but verify:

**Root Directory:** `backend`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Install Command:**
```bash
npm install
```

### 4. Add Railway Volume (for file storage)

1. In Railway project settings, go to **"Volumes"**
2. Click **"New Volume"**
3. Set mount path: `/data`
4. Set size: `5GB` (adjust based on needs)

### 5. Get Backend URL

After deployment:
1. Go to **"Settings"** → **"Networking"**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://dreamup-qa-production.up.railway.app`)

### 6. Test Backend

```bash
curl https://your-backend-url.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": 123.45
}
```

---

## Part 2: Post-Deployment Configuration

### Monitor Application

**Railway:**
- View logs: Railway Dashboard → Your Service → **"Logs"**
- Monitor metrics: **"Metrics"** tab
- Set up alerts: **"Settings"** → **"Alerts"**

### Enable WebSocket (Railway)

Railway automatically supports WebSocket connections. Ensure:
1. Health check endpoint is responding
2. WebSocket URL in frontend env matches backend URL
3. No proxy/firewall blocking WebSocket connections

---

## Part 3: Continuous Deployment

### Automatic Deployments

Railway will automatically deploy when you push to your main branch.

**Disable auto-deploy** (optional):
- **Railway**: Settings → Deploy → Uncheck "Auto-deploy"

---

## Part 4: Troubleshooting

### Backend Issues

**Build fails:**
- Check Node version matches (`engines` in package.json)
- Verify all dependencies are in `package.json`, not just `devDependencies`
- Review Railway build logs for specific errors

### Frontend Issues

**API calls fail (CORS errors):**
- Check browser console for specific CORS error
- Ensure backend CORS middleware is configured correctly

**Environment variables not working:**
- Rebuild after changing environment variables
- Verify all required environment variables are set in Railway

### Performance Issues

**Backend slow response:**
- Check Railway metrics for resource usage
- Consider upgrading Railway plan for more resources
- Optimize test execution logic

---

## Part 5: Scaling

### Railway

**Vertical Scaling:**
- Upgrade to Railway Pro for more CPU/memory
- Adjust in Settings → Resources

**Horizontal Scaling:**
- Requires Redis for WebSocket adapter
- Configure load balancer
- Multiple Railway services

### Storage

**Railway Volumes:**
- Monitor usage in Railway dashboard
- Increase volume size as needed
- Implement cleanup job for old artifacts (>30 days)

**Alternative: Cloud Storage**
- Migrate to AWS S3 or other cloud storage
- Update storage adapter in backend code

---

## Part 6: Backup & Recovery

### Environment Variables Backup

Export Railway environment variables:

```bash
railway variables > railway-env.txt
```

Store securely (not in git!).

---

## Cost Estimates

**Railway (Backend):**
- Starter: $5/month (500 hours, 8GB storage)
- Developer: $20/month (shared CPU, 8GB RAM)
- Pro: Custom pricing

**Railway Volumes:**
- $0.25/GB/month

**OpenAI API:**
- Pay-per-use (varies by model and usage)

**Estimated Total:** ~$25-50/month for moderate usage

---

## Security Checklist

- [ ] API keys secured (use Railway env vars)
- [ ] HTTPS enforced on both frontend and backend
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Environment variables not committed to git
- [ ] Helmet security headers enabled
- [ ] Input validation on all API endpoints
- [ ] Sensitive data not logged

---

## Support

- **Railway Docs:** https://docs.railway.app/

For project-specific issues, open an issue on GitHub.
