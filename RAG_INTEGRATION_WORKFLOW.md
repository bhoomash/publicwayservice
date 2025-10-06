# RAG Integration - Complete Workflow Documentation

## 🎯 Overview

This document explains the complete workflow of the RAG (Retrieval-Augmented Generation) integration in the Government Portal application.

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│  React Frontend (Port 5173)                                      │
│  - EnhancedComplaintForm.jsx: Text + File upload                │
│  - Admin Pages: Search & Analytics                               │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                             │
│  Server (Port 8000)                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ app/rag_routes.py - RAG Endpoints                       │   │
│  │  - POST /api/rag/upload                                 │   │
│  │  - POST /api/rag/search                                 │   │
│  │  - POST /api/rag/analyze-text                           │   │
│  │  - GET  /api/rag/stats                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ app/rag_modules/pipeline.py - RAG Pipeline             │   │
│  │  - DocumentProcessor: Extract text                      │   │
│  │  - GeminiClient: AI classification                      │   │
│  │  - ChromaVectorStore: Vector storage                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      DATA STORAGE                                │
│  ┌──────────────────────┐  ┌──────────────────────────────┐    │
│  │   MongoDB            │  │   ChromaDB (Vector Store)    │    │
│  │  - Users             │  │  - Complaint embeddings      │    │
│  │  - Complaints        │  │  - Semantic search           │    │
│  │  - Metadata          │  │  - Similarity matching       │    │
│  └──────────────────────┘  └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
│  - Google Gemini API: Text classification & summarization       │
│  - Sentence Transformers: Text embeddings                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Workflow Diagrams

### Workflow 1: Text Complaint Submission with Similar Complaint Detection

```
User fills form
    ↓
[Title + Description entered]
    ↓
Frontend debounces (1 second)
    ↓
POST /api/rag/analyze-text
    ↓
RAG Pipeline searches vector DB
    ↓
Returns similar complaints (if any)
    ↓
Frontend shows alert: "Similar complaints found"
    ↓
User can proceed or check similar ones
    ↓
User clicks "Submit Complaint"
    ↓
POST /api/complaints/submit
    ↓
Complaint saved to MongoDB
    ↓
Background: Add to ChromaDB for future searches
    ↓
Success response with complaint ID
```

### Workflow 2: Document Upload (RAG Processing)

```
User selects file (PDF/DOCX/Image)
    ↓
Frontend validates file type & size
    ↓
User clicks "Submit Complaint"
    ↓
POST /api/rag/upload (multipart/form-data)
    ↓
Server saves file to /uploads
    ↓
RAG Pipeline: DocumentProcessor
    ├─ Extract text from PDF (PyMuPDF)
    ├─ Extract text from DOCX (python-docx)
    └─ Extract text from Image (OCR if implemented)
    ↓
RAG Pipeline: GeminiClient
    ├─ Summarize complaint
    ├─ Classify urgency (High/Medium/Low)
    ├─ Assign department
    └─ Extract location (if mentioned)
    ↓
RAG Pipeline: ChromaVectorStore
    ├─ Generate embeddings (SentenceTransformer)
    └─ Store in ChromaDB with metadata
    ↓
Save to MongoDB
    ├─ User info
    ├─ AI-generated summary
    ├─ Classification results
    └─ Link to vector DB document ID
    ↓
Return success with AI insights
```

### Workflow 3: Admin Searches Similar Complaints

```
Admin views complaint in dashboard
    ↓
Clicks "Find Similar Complaints"
    ↓
GET /api/rag/complaint/{document_id}
    ↓
Fetch complaint details from vector DB
    ↓
POST /api/rag/search
    ├─ Query: complaint description
    ├─ Filters: department, urgency
    └─ n_results: 10
    ↓
ChromaDB performs semantic search
    ├─ Generate query embedding
    ├─ Calculate cosine similarity
    └─ Return top N similar documents
    ↓
Format results with similarity scores
    ↓
Display in admin interface
    ├─ Similarity percentage
    ├─ Complaint summaries
    ├─ Department & urgency tags
    └─ Link to full complaint
```

---

## 🛠️ Technical Components

### Backend Files

| File                               | Purpose                   | Key Functions                                                 |
| ---------------------------------- | ------------------------- | ------------------------------------------------------------- |
| `app/rag_routes.py`                | FastAPI endpoints for RAG | `upload_document()`, `search_similar()`, `analyze_text()`     |
| `app/rag_modules/pipeline.py`      | Main RAG orchestration    | `process_uploaded_file()`, `search_similar_complaints()`      |
| `app/utils/document_processor.py`  | Text extraction           | `extract_text()`, `extract_from_pdf()`, `extract_from_docx()` |
| `app/llm/gemini_client.py`         | Google Gemini integration | `process_complaint()`, `summarize()`, `classify_urgency()`    |
| `app/vector_store/chroma_store.py` | Vector database ops       | `add_document()`, `search_similar()`, `get_document()`        |
| `app/rag_config.py`                | Configuration             | API keys, paths, model settings                               |

### Frontend Files

| File                                   | Purpose                    | Key Features                                                     |
| -------------------------------------- | -------------------------- | ---------------------------------------------------------------- |
| `components/EnhancedComplaintForm.jsx` | New complaint form         | Text/File toggle, Similar complaint detection, Upload progress   |
| `utils/api.js` (ragAPI section)        | API client functions       | `uploadDocument()`, `searchSimilarComplaints()`, `analyzeText()` |
| `pages/admin/AllComplaints.jsx`        | Admin complaint management | Can integrate similar complaint search                           |

---

## 🔌 API Endpoints

### RAG Endpoints

#### 1. Upload Document

```http
POST /api/rag/upload
Content-Type: multipart/form-data

Body: { file: File }

Response: {
  "success": true,
  "complaint_id": "65abc...",
  "vector_db_id": "uuid-1234...",
  "summary": "Road repair needed at Main St...",
  "urgency": "High",
  "department": "Infrastructure",
  "location": "Main St, Downtown",
  "color": "Red",
  "emoji": "🔴"
}
```

#### 2. Search Similar Complaints

```http
POST /api/rag/search
Content-Type: application/json

Body: {
  "query": "pothole on main street",
  "n_results": 5,
  "department_filter": "Infrastructure",
  "urgency_filter": "High"
}

Response: [
  {
    "document_id": "uuid-...",
    "similarity_score": 0.89,
    "summary": "Large pothole causing damage...",
    "urgency": "High",
    "department": "Infrastructure",
    "location": "Main St",
    "filename": "complaint_123.pdf",
    "upload_date": "2025-10-05T..."
  },
  ...
]
```

#### 3. Analyze Text (Find Similar Before Submit)

```http
POST /api/rag/analyze-text
Content-Type: application/json

Body: {
  "title": "Pothole on Main Street",
  "description": "Large pothole causing damage to vehicles...",
  "category": "Infrastructure",
  "urgency": "High"
}

Response: {
  "similar_complaints": [...],
  "count": 3,
  "query": "Pothole on Main Street"
}
```

#### 4. Get RAG Statistics

```http
GET /api/rag/stats

Response: {
  "total_complaints": 150,
  "department_distribution": {
    "Infrastructure": 45,
    "Healthcare": 30,
    ...
  },
  "urgency_distribution": {
    "High": 20,
    "Medium": 80,
    "Low": 50
  },
  "collection_name": "complaints"
}
```

---

## 🎨 Frontend Integration Examples

### 1. Using EnhancedComplaintForm Component

```jsx
import EnhancedComplaintForm from "./components/EnhancedComplaintForm";

function SubmitComplaintPage() {
  const handleSuccess = (response) => {
    console.log("Complaint submitted:", response);
    // Navigate to complaint details or show success message
  };

  return (
    <div>
      <EnhancedComplaintForm onSubmitSuccess={handleSuccess} />
    </div>
  );
}
```

### 2. Searching Similar Complaints in Admin Panel

```jsx
import { ragAPI } from "../utils/api";

const AdminComplaintView = ({ complaint }) => {
  const [similarComplaints, setSimilarComplaints] = useState([]);

  const findSimilar = async () => {
    const results = await ragAPI.searchSimilarComplaints(
      complaint.description,
      {
        n_results: 5,
        department: complaint.category,
      }
    );
    setSimilarComplaints(results);
  };

  return (
    <div>
      <button onClick={findSimilar}>Find Similar Complaints</button>
      {similarComplaints.map((sim) => (
        <div key={sim.document_id}>
          <p>{sim.summary}</p>
          <span>Similarity: {Math.round(sim.similarity_score * 100)}%</span>
        </div>
      ))}
    </div>
  );
};
```

---

## 📦 Dependencies Installation

### Backend

```bash
cd server
pip install -r requirements.txt
```

### Required Packages:

- `chromadb`: Vector database
- `sentence-transformers`: Text embeddings
- `google-generativeai`: Gemini API
- `python-docx`: DOCX processing
- `PyMuPDF`: PDF processing
- `pillow`: Image processing

### Environment Variables

Add to `.env` file:

```env
# Gemini API Key (for RAG)
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_API_KEY=your_gemini_api_key_here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=gov_portal

# JWT Secret
SECRET_KEY=your_secret_key_here
```

---

## 🚀 Running the System

### 1. Start MongoDB

```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongodb
```

### 2. Start Backend

```bash
cd server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Start Frontend

```bash
cd client
npm run dev
```

### 4. Test RAG Endpoints

Visit: `http://localhost:8000/docs` for Swagger UI

---

## 🧪 Testing Workflow

### Test 1: Document Upload

1. Go to Submit Complaint page
2. Click "Upload Document" tab
3. Upload a PDF complaint document
4. Submit and check response
5. Verify in MongoDB and ChromaDB

### Test 2: Similar Complaint Detection

1. Click "Text Complaint" tab
2. Type: "Pothole on Main Street needs repair"
3. Add description (20+ chars)
4. Wait 1 second - should see similar complaints alert
5. Proceed to submit

### Test 3: Admin Search

1. Login as admin
2. View any complaint
3. Click "Find Similar" (when implemented)
4. See related complaints with similarity scores

---

## 🔍 Monitoring & Debugging

### Check RAG Health

```bash
curl http://localhost:8000/api/rag/health
```

### View Logs

Backend logs show:

- Document processing steps
- AI classification results
- Vector DB operations
- Search queries and results

### Common Issues

1. **ChromaDB not initializing**

   - Check if `chroma_db` directory exists
   - Verify write permissions

2. **Gemini API errors**

   - Verify API key in .env
   - Check API quota/limits

3. **File upload fails**
   - Check `uploads` directory exists
   - Verify file size limits (10MB)

---

## 📈 Performance Optimization

1. **Vector Search**: Pre-computed embeddings enable fast semantic search
2. **Debouncing**: Prevents excessive API calls while typing
3. **Batch Processing**: Can add multiple complaints to vector DB at once
4. **Caching**: Consider caching frequent searches

---

## 🔐 Security Considerations

1. **File Upload Validation**: Only allow specific file types
2. **File Size Limits**: Max 10MB per file
3. **Authentication**: All RAG endpoints require valid JWT token
4. **Rate Limiting**: Consider adding rate limits for uploads
5. **Input Sanitization**: Clean user input before processing

---

## 🎯 Future Enhancements

1. **OCR Integration**: Extract text from images using Tesseract
2. **Multi-language Support**: Process complaints in regional languages
3. **Clustering**: Automatic complaint clustering by topic
4. **Real-time Notifications**: Alert admins when similar complaints spike
5. **Analytics Dashboard**: Visualize complaint patterns and trends
6. **Automated Responses**: Generate suggested responses using AI
7. **Priority Ranking**: Machine learning for better priority assignment

---

## 📞 Support

For issues or questions:

- Check logs in `server/app/*.log`
- Review API documentation at `/docs`
- Test individual components separately

---

**Last Updated**: October 6, 2025  
**Version**: 1.0.0  
**Status**: ✅ Fully Integrated & Operational
