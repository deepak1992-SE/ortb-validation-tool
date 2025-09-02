# 🚀 Deployment Guide

## Deploy to Render.com

### **Option 1: Automatic Deployment (Recommended)**

1. **Fork/Clone the Repository**
   ```bash
   git clone https://github.com/deepak1992-SE/ortb-validation-tool.git
   ```

2. **Connect to Render**
   - Go to [Render.com](https://render.com)
   - Sign up/Login with GitHub
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

3. **Deploy**
   - Click "Apply" to deploy both services
   - Backend API will be deployed as a Web Service
   - Frontend will be deployed as a Static Site
   - Both will be automatically configured

### **Option 2: Manual Deployment**

#### **Deploy Backend API**

1. **Create Web Service**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect GitHub repository
   - Configure:
     - **Name**: `ortb-api`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free

2. **Environment Variables**
   ```
   NODE_ENV=production
   ```

#### **Deploy Frontend**

1. **Create Static Site**
   - Click "New" → "Static Site"
   - Connect same GitHub repository
   - Configure:
     - **Name**: `ortb-frontend`
     - **Build Command**: `cd frontend && npm install && npm run build`
     - **Publish Directory**: `frontend/dist`

2. **Environment Variables**
   ```
   VITE_API_URL=https://your-api-service.onrender.com
   ```

### **URLs After Deployment**

- **API**: `https://ortb-api-[random].onrender.com`
- **Frontend**: `https://ortb-frontend-[random].onrender.com`

### **Custom Domains (Optional)**

1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain (e.g., `ortb-validator.yourdomain.com`)
4. Update DNS records as instructed

## Other Deployment Options

### **Vercel (Frontend Only)**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

### **Heroku (Backend)**

```bash
# Install Heroku CLI
# Create Heroku app
heroku create ortb-api

# Deploy
git push heroku main
```

### **Netlify (Frontend)**

```bash
# Build frontend
cd frontend
npm run build

# Deploy to Netlify (drag & drop dist folder)
```

### **Railway (Full Stack)**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### **DigitalOcean App Platform**

1. Connect GitHub repository
2. Configure build settings
3. Deploy with one click

## Environment Variables Reference

### **Backend**
```bash
NODE_ENV=production
PORT=3000  # Set automatically by hosting provider
```

### **Frontend**
```bash
VITE_API_URL=https://your-api-domain.com
```

## Health Checks

After deployment, verify:

- **API Health**: `GET https://your-api-url/api/health`
- **Frontend**: Visit your frontend URL
- **CORS**: Test API calls from frontend

## Monitoring

### **Render.com Features**
- Automatic SSL certificates
- Custom domains
- Environment variables
- Build & deploy logs
- Service metrics
- Auto-deploy from GitHub

### **Performance**
- **Cold Start**: ~2-3 seconds (free tier)
- **Response Time**: <200ms for API calls
- **Uptime**: 99.9% (paid plans)

## Troubleshooting

### **Common Issues**

1. **CORS Errors**
   - Ensure API URL is correctly set in frontend
   - Check CORS configuration in backend

2. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json

3. **Environment Variables**
   - Ensure VITE_API_URL is set correctly
   - Check that variables are available at build time

### **Logs**
- Check Render dashboard for build and runtime logs
- Use `console.log` for debugging (visible in logs)

## Cost Estimation

### **Render.com Free Tier**
- **Web Services**: 750 hours/month (enough for 1 service)
- **Static Sites**: Unlimited
- **Bandwidth**: 100GB/month
- **Build Minutes**: 500/month

### **Paid Plans** (if needed)
- **Starter**: $7/month per service
- **Standard**: $25/month per service
- **Pro**: $85/month per service

## Security

- All traffic encrypted with SSL
- Environment variables secured
- No sensitive data in repository
- CORS properly configured

---

**🎉 Your ORTB Validation Tool will be live and accessible worldwide!**