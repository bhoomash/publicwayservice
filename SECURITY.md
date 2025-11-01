# 🔒 Security & Deployment Guide

## ⚠️ CRITICAL: Before Deployment

### 1. **NEVER Commit Sensitive Information**

Your `.env` file contains sensitive credentials. **DO NOT** commit it to GitHub!

#### ✅ What's Protected (Already in .gitignore):
- `.env` files
- API keys
- Database credentials
- SMTP passwords

#### ❌ What You Must NEVER Share:
- MongoDB connection strings
- Email passwords
- API keys (Groq, Fireworks, Gemini)
- JWT secrets

---

## 🛡️ Security Checklist

### Already Implemented:
- ✅ `.env` in `.gitignore`
- ✅ `.env.example` template created
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ CORS configuration
- ✅ Error boundary for React
- ✅ API timeout (30s)
- ✅ Improved error handling

### Still Need to Do:
- ⚠️ Generate strong JWT secret
- ⚠️ Use environment-specific URLs
- ⚠️ Enable HTTPS in production
- ⚠️ Set up rate limiting
- ⚠️ Add input validation
- ⚠️ Implement request logging

---

## 🚀 Deployment Steps

### 1. **Environment Setup**

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cd server
cp .env.example .env
# Edit .env with your actual credentials
```

### 2. **Frontend Environment Variables**

Create `client/.env`:

```env
VITE_API_URL=https://your-production-api.com
VITE_APP_NAME=Government Portal
```

### 3. **Build for Production**

```bash
# Frontend
cd client
npm run build

# Backend
cd server
# No build needed for Python
```

### 4. **Deploy Backend**

Options:
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repo
- **DigitalOcean**: Use App Platform
- **AWS**: Use Elastic Beanstalk

### 5. **Deploy Frontend**

Options:
- **Vercel**: `vercel deploy`
- **Netlify**: Connect GitHub repo
- **AWS S3 + CloudFront**

---

## 🔐 Environment Variables Guide

### Backend (.env)

```env
# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
DB_NAME=your_database_name

# Email (Use App-Specific Password for Gmail)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com

# API Keys
groq_api_key=gsk_xxxxx
fireworks_api_key=fw_xxxxx
GEMINI_API_KEY=AIzaSyxxxxx

# Security
JWT_SECRET=generate-random-string-here
SECRET_KEY=another-random-string
```

### Frontend (.env)

```env
# API URL (Change for production)
VITE_API_URL=http://localhost:8000

# App Config
VITE_APP_NAME=Government Portal
VITE_APP_VERSION=1.0.0
```

---

## 🔑 Generate Secure Keys

### JWT Secret:

```python
import secrets
print(secrets.token_urlsafe(32))
```

Or use online: https://generate-secret.vercel.app/32

---

## 🌐 Production URLs

Update these before deploying:

1. **Backend URL**: Change in `client/.env`
   ```env
   VITE_API_URL=https://api.yourapp.com
   ```

2. **CORS Settings**: Update `server/app/main.py`
   ```python
   allow_origins=[
       "https://yourapp.com",
       "https://www.yourapp.com"
   ]
   ```

3. **MongoDB**: Use production cluster
4. **Email**: Use professional SMTP service (SendGrid, AWS SES)

---

## 📊 Current Setup Status

### ✅ Fixed Issues:
1. Backend server running on port 8000
2. Environment variables configured
3. Hard-coded URLs replaced with env vars
4. Error boundary added
5. API timeout configured
6. Better error handling
7. .env protected in .gitignore

### ⚠️ Before Going Live:
1. Change all default passwords
2. Generate new API keys for production
3. Use production MongoDB cluster
4. Set up proper email service
5. Configure SSL/HTTPS
6. Add rate limiting
7. Set up monitoring (e.g., Sentry)
8. Enable security headers

---

## 🧪 Testing

```bash
# Backend
cd server
python -m pytest  # (need to add tests)

# Frontend
cd client
npm test  # (need to add tests)
```

---

## 📝 Quick Reference

### Start Development:

```bash
# Backend
cd server
python -m uvicorn app.main:app --reload

# Frontend
cd client
npm run dev
```

### Environment Files:

- `server/.env` - Backend secrets (NEVER commit)
- `server/.env.example` - Template (safe to commit)
- `client/.env` - Frontend config (NEVER commit)
- `client/.env.example` - Template (safe to commit)

---

## 🆘 If Credentials Are Leaked

1. **Immediately revoke** all API keys
2. **Change** all passwords
3. **Rotate** JWT secrets
4. **Update** MongoDB credentials
5. **Remove** from git history:
   ```bash
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch .env" \
   --prune-empty --tag-name-filter cat -- --all
   ```
6. **Force push**: `git push --force --all`

---

## 📞 Support

For security concerns, contact your team lead immediately.

**Never** share credentials via:
- Email
- Chat
- Code comments
- Screenshots
- Git commits
