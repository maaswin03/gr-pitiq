# GR PitIQ Backend - Production Deployment Guide

## 🚀 Quick Start

### Development
```bash
cd backend
python app.py
```

### Production
```bash
cd backend
gunicorn -c gunicorn.conf.py wsgi:app
```

## 📋 Prerequisites

1. **Python 3.10+**
2. **PostgreSQL** (via Supabase)
3. **Environment Variables** (see `.env.example`)

## 🔧 Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

Required variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SECRET_KEY`: Flask secret key (generate with `python -c "import os; print(os.urandom(32).hex())"`)
- `CORS_ORIGINS`: Allowed frontend origins (comma-separated)

### 3. Run Server

**Development:**
```bash
python app.py
```

**Production:**
```bash
gunicorn -c gunicorn.conf.py wsgi:app
```

## 🏗️ Production Features

### ✅ Implemented

- **Logging**: File and console logging with rotation
- **Rate Limiting**: Per-IP request throttling
- **CORS**: Configurable cross-origin resource sharing
- **Error Handling**: Comprehensive error handlers with logging
- **Health Checks**: `/health` endpoint for monitoring
- **Security Headers**: Proxy fix for reverse proxies
- **Environment Config**: All settings via environment variables
- **Gunicorn Ready**: WSGI entry point with optimized worker config

### 🔒 Security

1. **Secret Key**: Always set `SECRET_KEY` in production
2. **CORS**: Restrict `CORS_ORIGINS` to your frontend domains only
3. **Rate Limiting**: Adjust `RATELIMIT_DEFAULT` based on your needs
4. **Supabase Keys**: Never commit `.env` to version control
5. **HTTPS**: Always use HTTPS in production (configure at reverse proxy level)

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "service": "GR PitIQ API",
  "timestamp": "2025-11-22T12:00:00",
  "checks": {
    "supabase": "configured"
  }
}
```

### Logs

Logs are stored in `backend/logs/`:
- `app.log`: Application logs
- `access.log`: HTTP access logs (gunicorn)
- `error.log`: Error logs (gunicorn)

View logs:
```bash
tail -f logs/app.log
tail -f logs/access.log
```

## 🐳 Docker Deployment (Optional)

### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 8000

# Run with gunicorn
CMD ["gunicorn", "-c", "gunicorn.conf.py", "wsgi:app"]
```

### Build and Run
```bash
docker build -t gr-pitiq-backend .
docker run -p 8000:8000 --env-file .env gr-pitiq-backend
```

## 🔄 Deployment Checklist

- [ ] Set all environment variables in `.env`
- [ ] Generate and set `SECRET_KEY`
- [ ] Configure `CORS_ORIGINS` with production domains
- [ ] Set `FLASK_ENV=production`
- [ ] Test health endpoint
- [ ] Configure log rotation
- [ ] Set up monitoring/alerting
- [ ] Enable HTTPS at reverse proxy
- [ ] Test rate limiting
- [ ] Verify database connectivity

## 🌐 Reverse Proxy (Nginx Example)

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📚 API Documentation

### Endpoints

**Root**
- `GET /` - API information

**Health**
- `GET /health` - Health check

**Simulation**
- `POST /api/simulation/start` - Start simulation
- `POST /api/simulation/stop` - Stop simulation
- `POST /api/simulation/update` - Update configuration
- `POST /api/simulation/pit-stop` - Execute pit stop
- `GET /api/simulation/state` - Get current state
- `GET /api/simulation/laps` - Get lap history

**Models**
- `GET /api/model-metadata` - List all models
- `GET /api/model-metadata/<name>` - Get model details
- `GET /api/model-metadata/<name>/download` - Download metadata

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port 8000
lsof -ti:8000 | xargs kill -9
```

### Supabase Connection Issues
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Check firewall/network settings
- Test connection: `curl $SUPABASE_URL/rest/v1/`

### Rate Limit Errors
- Increase `RATELIMIT_DEFAULT` in `.env`
- Or switch to Redis: `RATELIMIT_STORAGE_URL=redis://localhost:6379`

## 📝 Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `FLASK_ENV` | `production` | Flask environment |
| `SECRET_KEY` | Random | Flask secret key |
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `RATELIMIT_DEFAULT` | `100 per minute` | Default rate limit |
| `RATELIMIT_STORAGE_URL` | `memory://` | Rate limit storage |
| `LOG_LEVEL` | `INFO` | Logging level |
| `SUPABASE_URL` | Required | Supabase project URL |
| `SUPABASE_ANON_KEY` | Required | Supabase anon key |
