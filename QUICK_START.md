# 🚀 Quick Start Guide - Government Portal

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║          ⚡ START HERE - FASTEST WAY TO GET RUNNING ⚡           ║
║                                                                   ║
╚══════════════════════════════════════════════════════════════════╝
```

## ⚡ Quick Reference Card

### 📂 Project Structure (Clean!)

```
gov-portal/
├── client/          → React Frontend (Port 5173)
├── server/          → FastAPI Backend (Port 8000)
├── examples/        → Documentation & examples
└── *.md            → Documentation files
```

---

## 🎯 Quick Start (3 Steps)

### Step 1: Install Dependencies

```powershell
# Backend
cd server
pip install -r requirements.txt

# Frontend (new terminal)
cd client
npm install
```

### Step 2: Create Directories

```powershell
# From server directory
mkdir uploads, chroma_db
```

### Step 3: Start Services

```powershell
# Terminal 1 - Backend
cd server
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd client
npm run dev
```

**Done! 🎉**

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🔑 Environment Setup

### server/.env (Already Configured!)

```env
✅ MONGO_URI - MongoDB connection
✅ SMTP credentials - Email notifications
✅ groq_api_key - AI chatbot
✅ fireworks_api_key - AI features
✅ GEMINI_API_KEY - RAG system (NEW!)
✅ admin credentials - Admin account
```

**All keys are configured! Ready to use!** 🎊

---

## 📍 Key Features

### For Citizens:

- 📝 Submit complaints (text or document upload)
- 🔍 See similar complaints (AI-powered)
- 📊 Track complaint status
- 🔔 Get notifications
- 💬 Chat with AI assistant

### For Admins:

- 📈 Dashboard with analytics
- 👥 User management
- 📋 All complaints view
- 🔍 Search similar complaints
- 📊 Reports & statistics
- ⚙️ System settings

---

## 🤖 RAG System Features

### What it does:

1. **Document Upload** - Upload PDF/DOCX/TXT
2. **Text Extraction** - Extract clean text
3. **AI Classification** - Auto-categorize with Gemini
4. **Vector Storage** - Store in ChromaDB
5. **Semantic Search** - Find similar complaints
6. **Duplicate Detection** - Prevent duplicates

### RAG Endpoints:

```
POST   /api/rag/upload          → Upload document
POST   /api/rag/search          → Search similar
POST   /api/rag/analyze-text    → Pre-submit check
GET    /api/rag/stats           → Statistics
GET    /api/rag/health          → Health check
```

---

## 🧪 Quick Tests

### Test Backend:

```powershell
# Health check
curl http://localhost:8000/api/rag/health

# Expected response:
# {"status":"healthy","vector_db":"connected"}
```

### Test Frontend:

1. Open http://localhost:5173
2. Click "Login" or "Register"
3. Submit a complaint
4. Check "My Complaints"

### Test RAG:

1. Go to "Submit Complaint"
2. Switch to "Document Upload" mode
3. Upload a PDF/DOCX file
4. See AI classification results

---

## 📚 Documentation Files

| File                            | Description                  |
| ------------------------------- | ---------------------------- |
| **CLEANUP_SUMMARY.md**          | What we just cleaned up      |
| **PROJECT_STRUCTURE.md**        | Complete structure guide     |
| **SETUP_GUIDE.md**              | Detailed setup instructions  |
| **RAG_ARCHITECTURE.md**         | Visual architecture diagrams |
| **RAG_INTEGRATION_WORKFLOW.md** | Technical workflows          |
| **RAG_INTEGRATION_SUMMARY.md**  | Overview summary             |
| **RAG_CHECKLIST.md**            | Verification checklist       |
| **EMAIL_SETUP_GUIDE.md**        | Email configuration          |
| **README.md**                   | Main project README          |

---

## 🔧 Common Commands

### Backend:

```powershell
cd server

# Start server
uvicorn app.main:app --reload

# Create admin user
python create_admin_from_env.py

# Check Python packages
pip list
```

### Frontend:

```powershell
cd client

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## 🐛 Troubleshooting

### Backend won't start:

```powershell
# Check Python version (need 3.8+)
python --version

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check MongoDB connection
# Verify MONGO_URI in .env
```

### Frontend won't start:

```powershell
# Clear cache
Remove-Item -Path node_modules -Recurse -Force
Remove-Item -Path package-lock.json -Force

# Reinstall
npm install

# Start again
npm run dev
```

### RAG not working:

```powershell
# Check Gemini API key
echo $env:GEMINI_API_KEY

# Verify directories exist
ls server/uploads
ls server/chroma_db

# Check health endpoint
curl http://localhost:8000/api/rag/health
```

---

## 📊 Project Statistics

### Files:

- **React Components**: 20+
- **API Endpoints**: 30+
- **RAG Endpoints**: 7
- **Admin Pages**: 5 (complete)
- **Documentation Files**: 9

### Lines of Code:

- **Frontend**: ~5,000 lines
- **Backend**: ~3,000 lines
- **RAG System**: ~800 lines
- **Documentation**: ~3,000 lines

### Technologies:

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: FastAPI, MongoDB, JWT
- **RAG**: ChromaDB, SentenceTransformers, Gemini
- **AI**: Google Gemini, Groq, Fireworks

---

## 🎓 Learning Path

### New to the project?

1. Read **README.md** - Project overview
2. Read **PROJECT_STRUCTURE.md** - Understand structure
3. Follow **SETUP_GUIDE.md** - Set up environment
4. Read **RAG_ARCHITECTURE.md** - Understand RAG system
5. Check **RAG_CHECKLIST.md** - Test features

### Want to develop?

1. **Frontend**: Start with `client/src/App.jsx`
2. **Backend**: Start with `server/app/main.py`
3. **RAG**: Start with `server/app/rag_routes.py`
4. **API Docs**: Visit http://localhost:8000/docs

---

## 🌟 Key Features Implemented

### ✅ User Features:

- User registration & login
- JWT authentication
- Complaint submission (text/document)
- Similar complaint detection
- Complaint tracking
- Notifications
- AI chatbot

### ✅ Admin Features:

- Admin dashboard with stats
- All complaints management
- User management (CRUD)
- Reports & analytics
- System settings
- Similar complaint search

### ✅ RAG Features:

- Document upload (PDF/DOCX/TXT)
- Text extraction & cleaning
- AI classification (Gemini)
- Vector storage (ChromaDB)
- Semantic search
- Duplicate detection

---

## 🎉 Ready to Code!

Everything is set up and ready to go:

- ✅ **Structure cleaned** - No duplicates
- ✅ **Configuration done** - All API keys added
- ✅ **Documentation complete** - 9 comprehensive guides
- ✅ **Dependencies ready** - Just install & run
- ✅ **Features complete** - Admin pages & RAG system

**Start developing immediately!** 🚀

---

## 💡 Quick Tips

1. **Use API Docs**: http://localhost:8000/docs - Interactive API testing
2. **Check Logs**: Backend prints detailed logs in terminal
3. **Use Dev Tools**: React Dev Tools & Chrome DevTools
4. **Test RAG**: Use RAG_CHECKLIST.md for systematic testing
5. **Read Docs**: All questions answered in documentation files

---

## 📞 Need Help?

1. Check the documentation files (9 guides available)
2. Review the troubleshooting section above
3. Check API docs at http://localhost:8000/docs
4. Review the code comments

---

**Happy Coding! 🎉**

Last Updated: October 6, 2025
