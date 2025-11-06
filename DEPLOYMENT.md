# Deployment Guide

This guide covers deploying the DreamUp Games QA system to production using Railway (backend) and Cloudflare Pages (frontend).

## Prerequisites

- [Railway Account](https://railway.app/)
- [Cloudflare Account](https://dash.cloudflare.com/)
- [GitHub Repository](https://github.com/) (connected to both services)
- OpenAI API Key

---

## Part 1: Backend Deployment (Railway)

### 1. Create Railway Project

1. Log in to [Railway](https://railway.app/)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Select your repository
5. Choose **"Add variables later"**

### 2. Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will automatically provision a PostgreSQL database
4. The `DATABASE_URL` environment variable will be automatically set

### 3. Configure Environment Variables

In your Railway project settings, add these environment variables:

\`\`\`env
# Automatically set by Railway
DATABASE_URL=postgresql://...

# Add these manually
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
\`\`\`

### 4. Configure Build Settings

Railway should auto-detect the build settings, but verify:

**Root Directory:** \`backend\`

**Build Command:**
\`\`\`bash
npm install && npx prisma generate && npm run build
\`\`\`

**Start Command:**
\`\`\`bash
npm start
\`\`\`

**Install Command:**
\`\`\`bash
npm install
\`\`\`

### 5. Add Railway Volume (for file storage)

1. In Railway project settings, go to **"Volumes"**
2. Click **"New Volume"**
3. Set mount path: \`/data\`
4. Set size: \`5GB\` (adjust based on needs)

### 6. Run Database Migrations

After first deployment, run migrations:

1. Open Railway project **"Settings"** → **"Service"**
2. Click on your backend service
3. Go to **"Variables"** tab
4. Click **"Railway CLI"** to open terminal
5. Run:
\`\`\`bash
npx prisma migrate deploy
npx prisma db seed
\`\`\`

Or use Railway CLI locally:
\`\`\`bash
railway login
railway link [your-project-id]
railway run npx prisma migrate deploy
\`\`\`

### 7. Get Backend URL

After deployment:
1. Go to **"Settings"** → **"Networking"**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., \`https://dreamup-qa-production.up.railway.app\`)

### 8. Test Backend

\`\`\`bash
curl https://your-backend-url.railway.app/health
\`\`\`

Expected response:
\`\`\`json
{
  "status": "healthy",
  "database": "connected",
  ...
}
\`\`\`

---

## Part 2: Frontend Deployment (Cloudflare Pages)

### 1. Create Cloudflare Pages Project

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **"Pages"** → **"Create a project"**
3. Connect your GitHub repository
4. Configure build settings:

**Project name:** \`dreamup-qa-frontend\`

**Production branch:** \`main\`

**Framework preset:** \`Next.js\`

**Build command:**
\`\`\`bash
cd frontend && npm install && npm run build
\`\`\`

**Build output directory:**
\`\`\`
frontend/out
\`\`\`

**Root directory:** \`/\` (leave as root, we specify frontend in build command)

### 2. Configure Environment Variables

In Cloudflare Pages project settings → **"Environment variables"**:

\`\`\`env
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
NEXT_PUBLIC_WS_URL=https://your-backend-url.railway.app
NODE_VERSION=20.11.0
\`\`\`

### 3. Deploy

1. Click **"Save and Deploy"**
2. Cloudflare will build and deploy your frontend
3. You'll receive a URL like: \`https://dreamup-qa-frontend.pages.dev\`

### 4. Configure Custom Domain (Optional)

1. Go to **"Custom domains"**
2. Click **"Set up a custom domain"**
3. Enter your domain (e.g., \`qa.dreamup.com\`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate (automatic via Cloudflare)

### 5. Update Backend CORS

Update Railway backend environment variable:

Or if using custom domain:

Redeploy backend for changes to take effect.

### 6. Test Frontend

Visit your Cloudflare Pages URL and verify:
- ✅ Dashboard loads
- ✅ Statistics display correctly
- ✅ Can create new test
- ✅ Can view test results

---

## Part 3: Post-Deployment Configuration

### Generate API Keys

1. Use Railway CLI to connect to your backend:
\`\`\`bash
railway login
railway link [your-project-id]
railway run npx prisma studio
\`\`\`

2. In Prisma Studio, manually create API keys in the \`ApiKey\` table

Or use the seed script:
\`\`\`bash
railway run npm run prisma:seed
\`\`\`

### Monitor Application

**Railway:**
- View logs: Railway Dashboard → Your Service → **"Logs"**
- Monitor metrics: **"Metrics"** tab
- Set up alerts: **"Settings"** → **"Alerts"**

**Cloudflare Pages:**
- View deployments: Cloudflare Dashboard → Pages → Your Project
- Check analytics: **"Analytics"** tab
- Review build logs: Click on any deployment

### Enable WebSocket (Railway)

Railway automatically supports WebSocket connections. Ensure:
1. Health check endpoint is responding
2. WebSocket URL in frontend env matches backend URL
3. No proxy/firewall blocking WebSocket connections

---

## Part 4: Continuous Deployment

### Automatic Deployments

Both Railway and Cloudflare Pages will automatically deploy when you push to your main branch.

**Disable auto-deploy** (optional):
- **Railway**: Settings → Deploy → Uncheck "Auto-deploy"
- **Cloudflare**: Settings → Builds & deployments → Disable automatic deployments

### Preview Deployments

**Cloudflare Pages** automatically creates preview deployments for pull requests.

**Railway** requires manual configuration for PR previews.

---

## Part 5: Troubleshooting

### Backend Issues

**Database connection fails:**
\`\`\`bash
# Check DATABASE_URL is set
railway variables

# Test database connection
railway run npx prisma db pull
\`\`\`

**Migrations not applied:**
\`\`\`bash
# Apply migrations
railway run npx prisma migrate deploy

# Reset database (CAUTION: deletes data)
railway run npx prisma migrate reset
\`\`\`

**Build fails:**
- Check Node version matches (\`engines\` in package.json)
- Verify all dependencies are in \`package.json\`, not just \`devDependencies\`
- Review Railway build logs for specific errors

### Frontend Issues

**API calls fail (CORS errors):**
- Check browser console for specific CORS error
- Ensure backend CORS middleware is configured correctly

**Environment variables not working:**
- Cloudflare Pages requires \`NEXT_PUBLIC_\` prefix for client-side vars
- Rebuild after changing environment variables
- Clear Cloudflare cache if changes don't appear

**Build fails:**
- Check build command includes \`cd frontend\`
- Verify Node version is set in environment variables
- Review Cloudflare build logs

### Performance Issues

**Backend slow response:**
- Check Railway metrics for resource usage
- Consider upgrading Railway plan for more resources
- Review database query performance
- Add database indexes if needed

**Database connection pool exhausted:**
- Adjust Prisma connection pool settings in \`schema.prisma\`
- Monitor active connections in Railway metrics

---

## Part 6: Scaling

### Railway

**Vertical Scaling:**
- Upgrade to Railway Pro for more CPU/memory
- Adjust in Settings → Resources

**Horizontal Scaling:**
- Requires Redis for WebSocket adapter
- Configure load balancer
- Multiple Railway services

### Database

**PostgreSQL Scaling:**
- Upgrade Railway database plan
- Add read replicas (Pro plan)
- Optimize queries and add indexes

### Storage

**Railway Volumes:**
- Monitor usage in Railway dashboard
- Increase volume size as needed
- Implement cleanup job for old artifacts (>30 days)

**Alternative: Cloud Storage**
- Migrate to Cloudflare R2 or AWS S3
- Update storage adapter in backend code

---

## Part 7: Backup & Recovery

### Database Backups

Railway automatically backs up PostgreSQL daily. To create manual backup:

\`\`\`bash
# Export database
railway run pg_dump $DATABASE_URL > backup.sql

# Restore database
railway run psql $DATABASE_URL < backup.sql
\`\`\`

### Environment Variables Backup

Export Railway environment variables:

\`\`\`bash
railway variables > railway-env.txt
\`\`\`

Store securely (not in git!).

---

## Cost Estimates

**Railway (Backend + Database):**
- Starter: $5/month (500 hours, 8GB storage)
- Developer: $20/month (shared CPU, 8GB RAM)
- Pro: Custom pricing

**Cloudflare Pages (Frontend):**
- Free: Unlimited requests, 500 builds/month
- Pro: $20/month (additional features)

**Railway Volumes:**
- $0.25/GB/month

**OpenAI API:**
- Pay-per-use (varies by model and usage)

**Estimated Total:** ~$25-50/month for moderate usage

---

## Security Checklist

- [ ] Database credentials secured (use Railway env vars)
- [ ] API keys rotated regularly
- [ ] HTTPS enforced on both frontend and backend
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Environment variables not committed to git
- [ ] Helmet security headers enabled
- [ ] Input validation on all API endpoints
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] Sensitive data not logged

---

## Support

- **Railway Docs:** https://docs.railway.app/
- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/
- **Prisma Docs:** https://www.prisma.io/docs/
- **Next.js Deployment:** https://nextjs.org/docs/deployment

For project-specific issues, open an issue on GitHub.
