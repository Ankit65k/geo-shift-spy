# Geo Shift Spy - Deployment Guide

This guide covers various deployment options for the Geo Shift Spy satellite change detection application.

## 🚀 Quick Deploy Options

### 1. Railway (Recommended for Full-Stack)

Railway is perfect for deploying the complete application with both frontend and backend:

1. **Fork the repository** to your GitHub account

2. **Connect to Railway:**
   - Go to [Railway.app](https://railway.app)
   - Click "Deploy from GitHub repo"
   - Select your forked repository

3. **Configure Environment Variables:**
   ```
   OPENAI_API_KEY=your_openai_api_key
   NODE_ENV=production
   VITE_API_URL=${{ RAILWAY_PUBLIC_DOMAIN }}
   ```

4. **Deploy:** Railway will automatically build and deploy your application

5. **Access:** Your app will be available at the provided Railway domain

### 2. Vercel (Frontend) + Railway (Backend)

For separated frontend/backend deployment:

**Frontend on Vercel:**
1. Fork the repository
2. Connect to [Vercel](https://vercel.com)
3. Set build command: `npm run build`
4. Set environment variable: `VITE_API_URL=https://your-backend-url`

**Backend on Railway:**
1. Create a new Railway project
2. Connect the same repository
3. Set start command: `node backend/server.js`
4. Configure environment variables

### 3. Docker Deployment

**Local Docker:**
```bash
# Build the image
docker build -t geo-shift-spy .

# Run with environment variables
docker run -p 5000:5000 \
  -e OPENAI_API_KEY=your_key \
  -e NODE_ENV=production \
  geo-shift-spy
```

**Docker Compose (Production):**
```bash
# Copy environment file
cp .env.example .env
# Edit .env with your values

# Start all services
docker-compose up -d

# Access at http://localhost:5000
```

### 4. Manual VPS Deployment

For Ubuntu/Debian VPS:

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2 for process management
sudo npm install -g pm2

# 4. Clone and setup
git clone https://github.com/yourusername/geo-shift-spy.git
cd geo-shift-spy
npm install

# 5. Build frontend
npm run build

# 6. Configure environment
cp .env.example .env
# Edit .env with your values

# 7. Start with PM2
pm2 start backend/server.js --name geo-shift-spy
pm2 startup
pm2 save

# 8. Setup Nginx (optional)
sudo apt install nginx
sudo cp nginx.conf /etc/nginx/sites-available/geo-shift-spy
sudo ln -s /etc/nginx/sites-available/geo-shift-spy /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 🔧 Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for AI analysis | `sk-...` |
| `VITE_API_URL` | Backend API URL for frontend | `https://api.example.com` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ML_BACKEND_URL` | External ML service URL | `http://localhost:8001` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `10485760` (10MB) |
| `UPLOAD_DIR` | Upload directory | `./uploads` |

## 🌐 Domain & SSL Setup

### Custom Domain (Vercel)
1. In Vercel dashboard, go to your project
2. Settings > Domains
3. Add your custom domain
4. Update DNS records as shown

### SSL Certificate (VPS)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring & Maintenance

### Health Checks
- **Endpoint:** `GET /` returns server status
- **Docker:** Built-in health check every 30s
- **PM2:** Process monitoring with auto-restart

### Log Management
```bash
# PM2 logs
pm2 logs geo-shift-spy

# Docker logs
docker logs geo-shift-spy

# Nginx logs
sudo tail -f /var/log/nginx/access.log
```

### Backup Strategy
- **Code:** Git repository backup
- **Uploads:** Regular backup of `/uploads` directory
- **Environment:** Secure backup of `.env` file
- **Database:** If using database, regular dumps

## 🔒 Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong environment variables
- [ ] Enable firewall (UFW on Ubuntu)
- [ ] Regular security updates
- [ ] Implement rate limiting
- [ ] Use secure headers (included in nginx.conf)
- [ ] Backup sensitive data securely

## 🛠 Troubleshooting

### Common Issues

1. **Build Failures:**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Canvas/Sharp Issues:**
   ```bash
   # Rebuild native modules
   npm rebuild canvas sharp
   ```

3. **Permission Issues:**
   ```bash
   # Fix upload directory permissions
   chmod 755 uploads/
   chown -R $USER:$USER uploads/
   ```

4. **Memory Issues:**
   ```bash
   # Increase Node.js memory limit
   node --max-old-space-size=4096 backend/server.js
   ```

### Performance Optimization

1. **Enable Gzip:** Already configured in nginx.conf
2. **CDN Setup:** Use CloudFlare or AWS CloudFront
3. **Image Optimization:** Consider WebP format support
4. **Caching:** Redis for session/API caching
5. **Load Balancing:** Multiple instances with load balancer

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      # Deploy to your platform
```

## 📞 Support

For deployment issues:
1. Check the logs first
2. Review environment variables
3. Verify network connectivity
4. Check disk space and memory
5. Review security settings

---

**Note:** Always test deployments in staging environment before production!