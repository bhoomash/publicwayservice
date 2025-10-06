<<<<<<< HEAD
# GrievanceBot - AI-Powered Government Complaint Management System

## Overview

GrievanceBot is a modern, AI-powered complaint management system designed for government services. It automatically categorizes, prioritizes, and assigns complaints to appropriate departments using artificial intelligence, streamlining the grievance resolution process.

## Features

### 🤖 AI-Powered Processing

- **Automatic Categorization**: AI analyzes complaint content and assigns appropriate categories
- **Smart Prioritization**: Priority scoring based on urgency, impact, and resource availability
- **Department Assignment**: Intelligent routing to the most appropriate government department
- **Suggested Responses**: AI-generated response templates for faster resolution

### 👥 User Roles

#### **Citizens (Users)**

- Submit complaints with attachments
- Track complaint status in real-time
- Receive AI-powered insights and estimates
- Access help and FAQs
- Get notifications on status updates

#### **Collectors/Admins**

- View all complaints with AI-generated priority scores
- Filter and sort by category, urgency, and status
- Update complaint status (Pending → Assigned → In Progress → Resolved)
- Access detailed AI analysis and recommendations
- Monitor system-wide statistics and trends

### 🎨 Modern UI/UX

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Clean Interface**: Light theme with blue accents for professional appearance
- **Status Badges**: Color-coded status indicators (Green: Resolved, Blue: In Progress, Orange: Pending)
- **Card Layout**: Mobile-friendly card-based design for complaint listings
- **Real-time Updates**: Live status updates without page refresh

## System Architecture

### Frontend (React.js)

```
client/
├── src/
│   ├── components/
│   │   ├── Layout.jsx          # Main layout with sidebar and header
│   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   ├── Footer.jsx          # Application footer
│   │   └── ChatBot.jsx         # AI chat assistant
│   ├── pages/
│   │   ├── Login.jsx           # User authentication
│   │   ├── Register.jsx        # Account creation
│   │   ├── Dashboard.jsx       # User dashboard
│   │   ├── CollectorDashboard.jsx  # Admin dashboard
│   │   ├── SubmitComplaint.jsx # Complaint submission form
│   │   ├── MyComplaints.jsx    # User's complaint list
│   │   ├── Notifications.jsx   # System notifications
│   │   └── Help.jsx            # Help and FAQs
│   └── utils/
│       └── api.js              # API client and utilities
```

### Backend (FastAPI + Python)

```
server/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── routes/
│   │   └── auth.py             # Authentication endpoints
│   ├── complaint_routes.py     # Complaint management APIs
│   ├── notifications.py        # Notification system
│   ├── chat_routes.py          # AI chat endpoints
│   ├── ai_service.py           # AI processing module
│   ├── models.py               # Data models
│   ├── db.py                   # Database connection
│   └── config.py               # Configuration settings
```

## API Endpoints

### Authentication

- `POST /auth/register` - User registration with email verification
- `POST /auth/login` - User login with JWT token
- `POST /auth/verify-email` - Email verification with OTP
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset with OTP

### Complaints

- `POST /complaints/new` - Submit new complaint (triggers AI processing)
- `GET /complaints/user` - Get user's complaints
- `GET /complaints/{id}` - Get complaint details
- `PUT /complaints/{id}` - Update complaint
- `DELETE /complaints/{id}` - Delete complaint
- `GET /complaints/all` - Get all complaints (admin only)
- `PUT /complaints/{id}/status` - Update complaint status (admin)

### Notifications

- `GET /notifications` - Get user notifications
- `PUT /notifications/{id}/read` - Mark notification as read
- `POST /notifications/send` - Send notification (system)

### AI Chat

- `POST /chat` - Send message to AI assistant
- `GET /chat/history` - Get chat history

## AI Pipeline

When a complaint is submitted, the system automatically:

1. **Content Analysis**: Analyzes complaint text for keywords and context
2. **Category Assignment**: Assigns to appropriate category (Infrastructure, Utilities, etc.)
3. **Priority Scoring**: Calculates priority score (0-100) based on:
   - Urgency level specified by user
   - Impact assessment from content analysis
   - Historical data and patterns
   - Current department workload
4. **Department Routing**: Assigns to most appropriate department
5. **Response Generation**: Creates suggested response template
6. **Timeline Estimation**: Provides estimated resolution time

## Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- MongoDB 4.4+

### Backend Setup

```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB connection string and other settings

# Start the server
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

### Environment Variables

Create a `.env` file in the server directory:

```env
MONGODB_URL=mongodb://localhost:27017/grievancebot
JWT_SECRET_KEY=your-secret-key-here
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
```

## Usage

### For Citizens

1. **Register/Login**: Create account or sign in
2. **Submit Complaint**:
   - Fill out the complaint form with title, description, location
   - Select category and urgency level
   - Attach supporting documents/images
   - Submit and receive AI analysis
3. **Track Progress**: Monitor status updates and AI insights
4. **Get Help**: Access FAQs and contact support

### For Administrators/Collectors

1. **Access Admin Dashboard**: View all complaints with AI prioritization
2. **Review AI Analysis**: See automatic categorization and recommendations
3. **Manage Workload**: Filter by priority, department, or status
4. **Update Status**: Move complaints through workflow stages
5. **Monitor Metrics**: Track resolution times and system performance

## AI Features

### Automatic Categorization

The system recognizes keywords and context to categorize complaints into:

- Infrastructure (roads, bridges, public buildings)
- Utilities (water, electricity, gas)
- Public Safety (crime, emergency services)
- Environmental (pollution, waste management)
- Healthcare (hospital services, medical facilities)
- Transportation (public transport, traffic)

### Smart Priority Scoring

Priority scores (0-100) are calculated using:

- **Urgency Weight (40%)**: User-specified urgency level
- **Impact Assessment (30%)**: Number of people affected
- **Safety Concerns (20%)**: Risk to public safety
- **Resource Availability (10%)**: Department capacity

### Predictive Analytics

- Estimated resolution times based on historical data
- Department workload balancing
- Trend analysis for proactive planning
- Performance metrics and insights

## Status Workflow

```
Pending → Assigned → In Progress → Resolved
```

- **Pending**: New complaint awaiting assignment
- **Assigned**: Complaint assigned to department
- **In Progress**: Department actively working on resolution
- **Resolved**: Complaint successfully closed

## Security Features

- JWT-based authentication
- Email verification for account creation
- Password reset with OTP verification
- Role-based access control
- Data encryption in transit and at rest
- Input validation and sanitization

## Performance Optimization

- Database indexing for fast queries
- Caching for frequently accessed data
- Lazy loading for large datasets
- Responsive image optimization
- API rate limiting
- Background job processing for AI analysis

## Future Enhancements

- Mobile app development
- Multi-language support
- Advanced analytics dashboard
- Integration with external government systems
- Voice-to-text complaint submission
- Real-time chat with officials
- SMS notifications
- API for third-party integrations

## Support

For technical support or questions:

- Email: support@grievancebot.gov
- Phone: +1-800-GOV-HELP (468-4357)
- Office Hours: Monday-Friday, 9:00 AM - 5:00 PM
- Emergency Support: 24/7 available

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing
=======
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
>>>>>>> origin/Gokul

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

<<<<<<< HEAD
---

**GrievanceBot** - Making government services more efficient through AI-powered automation.
=======
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
>>>>>>> origin/Gokul
