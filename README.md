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

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**GrievanceBot** - Making government services more efficient through AI-powered automation.
