# 📋 Intelligent Complaint RAG System

An AI-powered Retrieval-Augmented Generation (RAG) pipeline for processing, analyzing, and managing complaints or reports. The system automatically extracts content from documents, classifies urgency levels, detects relevant departments, extracts location information, and provides intelligent search capabilities.

## 🌟 Features

- **Multi-format Document Processing**: Supports PDF, DOCX, and TXT files
- **AI-Powered Analysis**: Uses Google Gemini 2.0 Flash for summarization and classification
- **Smart Classification**: Automatic urgency detection with color-coded priorities
- **Department Detection**: Intelligent routing to relevant departments
- **Location Extraction**: Automatic extraction of addresses, streets, and landmarks
- **Vector Search**: Semantic search using ChromaDB for finding similar complaints
- **Modern UI**: Beautiful Streamlit frontend with interactive dashboards
- **RESTful API**: FastAPI backend with comprehensive endpoints
- **Real-time Processing**: Instant analysis and storage of uploaded documents

## 🎯 System Output

The system provides structured analysis in the following format:

```json
{
  "document_id": "b06e39ac-2142-4df3-8590-36b554445ff6",
  "summary": "Large and dangerous potholes on Main Street between 5th and 7th Avenue causing vehicle damage and accidents",
  "urgency": "High",
  "color": "Red",
  "emoji": "🔴",
  "department": "Transport Department",
  "location": "Main Street between 5th Avenue and 7th Avenue",
  "filename": "road_complaint.txt",
  "upload_date": "2025-10-05T20:45:52.235968"
}
```

### Urgency Classification
- 🔴 **High (Emergency)** - Red: Immediate safety risks, critical failures
- 🟠 **Medium** - Orange: Important issues requiring timely attention
- 🟢 **Low** - Green: Minor issues, routine maintenance, suggestions

### Department Categories
- Transport Department
- Municipality  
- Sanitation Department
- Health Department
- Water Department
- Electricity Department
- Public Works Department
- Environment Department
- Education Department
- Police Department

## 🛠️ Tech Stack

- **LLM**: Google Gemini API for summarization and classification
- **Vector Database**: ChromaDB for embeddings and semantic search
- **Embeddings**: Sentence Transformers (all-MiniLM-L6-v2)
- **Backend**: FastAPI with async support
- **Frontend**: Streamlit with interactive components
- **Document Processing**: PyMuPDF, python-docx for text extraction
- **Visualization**: Plotly for charts and analytics

## 📦 Installation

### Prerequisites
- Python 3.8 or higher
- Google Gemini API key

### Setup Steps

1. **Clone or download the project**
   ```bash
   cd rag-doc
   ```

2. **Create virtual environment (recommended)**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   # For macOS (recommended)
   pip install -r requirements_mac.txt
   
   # For other systems
   pip install -r requirements.txt
   
   # Or install individually without version constraints
   pip install fastapi uvicorn streamlit langchain langchain-google-genai chromadb python-multipart pypdf2 pdfplumber python-docx sentence-transformers google-generativeai python-dotenv pydantic numpy pandas plotly
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your Google API key
   echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
   ```

5. **Get your Google Gemini API key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to your `.env` file

## 🚀 Usage

### Option 1: Quick Start (Recommended)

Start both backend and frontend with the provided scripts:

**Terminal 1 - Start API Server:**
```bash
python start_api.py
```

**Terminal 2 - Start Frontend:**
```bash
python start_frontend.py
```

### Option 2: Manual Start

**Start the FastAPI backend:**
```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

**Start the Streamlit frontend:**
```bash
streamlit run frontend/streamlit_app.py --server.port 8501
```

### Access the Application

- **Frontend UI**: http://localhost:8501
- **API Documentation**: http://localhost:8000/docs
- **API Health Check**: http://localhost:8000/health

## 📱 Using the System

### 1. Upload Complaints
- Navigate to "Upload Complaint" page
- Select a PDF, DOCX, or TXT file
- Click "Process Complaint"
- View the AI-generated analysis

### 2. Search Similar Complaints
- Use the "Search Complaints" page
- Enter keywords to find similar issues
- Filter by department or urgency level
- View similarity scores and details

### 3. Dashboard Analytics
- Monitor complaint statistics
- View department distribution charts
- Track urgency level trends
- Get system health status

### 4. View Detailed Reports
- Access full complaint text
- Review processing metadata
- Export or share complaint details

## 🔧 API Endpoints

### Core Endpoints

- `POST /upload` - Upload and process complaint files
- `GET /search` - Search for similar complaints
- `GET /complaint/{id}` - Get detailed complaint information
- `GET /stats` - Get dashboard statistics
- `GET /departments` - List available departments
- `GET /health` - System health check

### Example API Usage

**Health Check:**
```bash
curl -X GET "http://localhost:8000/health"
```

**Upload a complaint:**
```bash
curl -X POST "http://localhost:8000/upload" \
  -F "file=@/path/to/your/complaint.txt"
```

**Search complaints:**
```bash
# Basic search
curl -X GET "http://localhost:8000/search?query=road%20potholes&n_results=5"

# Search with filters
curl -X GET "http://localhost:8000/search?query=road%20repair&department=Transport%20Department&urgency=High"
```

**Get complaint details:**
```bash
curl -X GET "http://localhost:8000/complaint/{document_id}"
```

**Get dashboard statistics:**
```bash
curl -X GET "http://localhost:8000/stats"
```

**Get available departments:**
```bash
curl -X GET "http://localhost:8000/departments"
```

## 📁 Project Structure

```
rag-doc/
├── api/                    # FastAPI backend
│   ├── main.py            # API routes and endpoints
│   └── __init__.py
├── frontend/              # Streamlit frontend
│   ├── streamlit_app.py   # Main UI application
│   └── __init__.py
├── llm/                   # LLM integration
│   ├── gemini_client.py   # Google Gemini API client
│   └── __init__.py
├── rag/                   # RAG pipeline
│   ├── pipeline.py        # Main processing pipeline
│   └── __init__.py
├── utils/                 # Utility functions
│   ├── document_processor.py  # Document text extraction
│   └── __init__.py
├── vector_store/          # Vector database
│   ├── chroma_store.py    # ChromaDB integration
│   └── __init__.py
├── examples/              # Sample complaint files
│   └── sample_complaints/
├── config.py              # Configuration settings
├── requirements.txt       # Python dependencies
├── start_api.py          # API startup script
├── start_frontend.py     # Frontend startup script
├── .env.example          # Environment variables template
└── README.md             # This file
```

## 🧪 Testing with Sample Data

The project includes sample complaint files in `examples/sample_complaints/`:

- `road_complaint.txt` - Road damage report (High urgency)
- `waste_complaint.txt` - Garbage collection issue (Medium urgency)  
- `water_emergency.txt` - Water main break (High urgency)

### Quick Test with Curl

Test the system using the provided sample complaint:

```bash
# 1. Check API health
curl -X GET "http://localhost:8000/health"

# 2. Upload sample complaint
curl -X POST "http://localhost:8000/upload" \
  -F "file=@examples/sample_complaints/road_complaint.txt"

# 3. Search for similar complaints
curl -X GET "http://localhost:8000/search?query=road%20potholes&n_results=3"

# 4. Get system statistics
curl -X GET "http://localhost:8000/stats"
```

Expected output includes automatic extraction of:
- **Summary**: Concise description of the issue
- **Urgency**: High/Medium/Low classification
- **Department**: Transport Department (for road issues)
- **Location**: "Main Street between 5th Avenue and 7th Avenue"

## ⚙️ Configuration

Key configuration options in `config.py`:

- **EMBEDDING_MODEL**: `all-MiniLM-L6-v2` - Sentence transformer model for embeddings
- **GEMINI_MODEL**: `gemini-2.0-flash` - Google Gemini model version (updated)
- **CHROMA_DB_PATH**: `./chroma_db` - ChromaDB storage location
- **UPLOAD_DIR**: `./uploads` - File upload directory
- **DEPARTMENTS**: List of 10 available departments for classification
- **URGENCY_LEVELS**: Color-coded urgency classification mapping

### Current System Statistics
Based on your test data:
- **Total Complaints**: 6 processed documents
- **Department Distribution**: Transport (4), Sanitation (1), Public Works (1)
- **Urgency Distribution**: High (5), Medium (1)

## 🔍 Troubleshooting

### Common Issues

1. **API Key Error**
   - Ensure your Google Gemini API key is correctly set as `GEMINI_API_KEY` in `.env`
   - Verify the API key has proper permissions
   - Test with: `curl -X GET "http://localhost:8000/health"`

2. **Installation Issues**
   - Use `requirements_mac.txt` for macOS to avoid PyMuPDF compilation issues
   - Install packages individually if batch installation fails
   - Ensure Python 3.8+ is being used

3. **ChromaDB Issues**
   - Delete the `chroma_db` folder to reset the database
   - Ensure sufficient disk space for embeddings
   - Check write permissions in project directory

4. **File Upload Errors**
   - Check file format (PDF, DOCX, TXT only)
   - Verify file is not corrupted
   - Ensure sufficient disk space in upload directory
   - Test with provided sample files first

5. **Port Conflicts**
   - Change ports in startup scripts if 8000/8501 are in use
   - Update API_BASE_URL in Streamlit app if needed
   - Use `lsof -i :8000` to check if port is in use

### Performance Optimization

- For large deployments, consider using a production ASGI server
- Implement caching for frequently accessed complaints
- Use batch processing for multiple file uploads
- Consider GPU acceleration for embedding generation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Google Gemini for AI capabilities
- ChromaDB for vector storage
- Streamlit for the beautiful UI framework
- FastAPI for the robust backend framework
- The open-source community for the amazing tools and libraries

---

**Built with ❤️ for better complaint management and citizen services**

For questions or support, please open an issue in the repository.
