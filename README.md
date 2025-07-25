# Government Portal - Authentication System

A complete authentication system with email OTP verification built with React (frontend) and FastAPI + MongoDB (backend).

## Features

### 🔐 Authentication

- **User Registration** with email verification
- **Email OTP Verification** for account activation
- **Login/Logout** with JWT tokens
- **Password Reset** with OTP verification
- **Secure password hashing** with bcrypt

### 🎨 Frontend Features

- **Modern UI** with Tailwind CSS
- **Responsive design** for mobile and desktop
- **Form validation** with real-time feedback
- **Loading states** and error handling
- **Email verification flow** with resend functionality
- **Password strength requirements**

### 🛠 Backend Features

- **FastAPI** for high-performance API
- **MongoDB** for data storage
- **JWT authentication** with secure tokens
- **Email service** with SMTP support
- **OTP generation** and expiration
- **Input validation** with Pydantic
- **CORS support** for frontend integration

## Tech Stack

### Frontend

- React 18+ with Hooks
- React Router for navigation
- Tailwind CSS for styling
- Axios for API calls
- Lucide React for icons

### Backend

- FastAPI (Python)
- MongoDB with PyMongo
- JWT authentication
- Bcrypt for password hashing
- Email service with SMTP
- Pydantic for data validation

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- MongoDB (local or cloud)

### Backend Setup

1. **Navigate to server directory:**

   ```bash
   cd server
   ```

2. **Create virtual environment:**

   ```bash
   python -m venv venv

   # Windows
   venv\\Scripts\\activate

   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Create environment file:**

   ```bash
   cp .env.example .env
   ```

5. **Configure environment variables in .env:**

   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017
   DB_NAME=gov_portal

   # JWT
   SECRET_KEY=your-super-secret-key-change-this-in-production

   # Email (Gmail example)
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   FROM_EMAIL=your-email@gmail.com
   ```

6. **Start the backend server:**

   ```bash
   uvicorn app.main:app --reload
   ```

   Server will run on `http://localhost:8000`
   API docs available at `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to client directory:**

   ```bash
   cd client
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:5173`

## Email Configuration

### For Gmail:

1. Enable 2-factor authentication
2. Generate an "App Password"
3. Use the app password in `SMTP_PASSWORD`

### For Development:

- If no email config is provided, OTP codes will be printed to console
- Check the backend terminal for OTP codes during development

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/verify-email` - Verify email with OTP
- `POST /auth/resend-otp` - Resend verification OTP
- `POST /auth/login-json` - Login with email/password
- `GET /auth/me` - Get current user info
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with OTP
- `POST /auth/logout` - Logout user

## Usage Flow

1. **Registration:**

   - User fills registration form
   - System sends OTP to email
   - User verifies email with OTP
   - Account is activated

2. **Login:**

   - User enters email/password
   - System validates credentials
   - JWT token is returned
   - User is redirected to dashboard

3. **Password Reset:**
   - User requests password reset
   - System sends OTP to email
   - User enters OTP and new password
   - Password is updated

## Security Features

- Password hashing with bcrypt
- JWT tokens with expiration
- OTP expiration (10 minutes default)
- Input validation and sanitization
- CORS configuration
- Secure HTTP headers

## Database Schema

### Users Collection

```javascript
{
  first_name: String,
  last_name: String,
  email: String (unique),
  phone: String,
  hashed_password: String,
  is_verified: Boolean,
  created_at: DateTime,
  updated_at: DateTime
}
```

### OTP Collection

```javascript
{
  email: String,
  otp_code: String,
  expires_at: DateTime,
  created_at: DateTime
}
```

## Development Notes

- Backend runs on port 8000
- Frontend runs on port 5173
- MongoDB default port 27017
- OTP codes are 6 digits
- JWT tokens expire in 30 minutes
- OTP codes expire in 10 minutes

## Production Deployment

### Backend

- Set strong `SECRET_KEY`
- Configure proper SMTP settings
- Use environment variables for all secrets
- Set up proper MongoDB cluster
- Enable HTTPS
- Configure proper CORS origins

### Frontend

- Build production bundle: `npm run build`
- Serve static files with nginx/Apache
- Update API base URL for production
- Enable HTTPS

## Troubleshooting

### Common Issues

1. **CORS errors:** Check backend CORS configuration
2. **Email not sending:** Verify SMTP credentials
3. **Database connection:** Check MongoDB URI
4. **Token errors:** Verify JWT secret key

### Development Tips

- Check browser console for frontend errors
- Check backend terminal for API errors
- Use API docs at `/docs` for testing
- OTP codes printed to console in development

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests if applicable
5. Submit pull request

## License

This project is licensed under the MIT License.
