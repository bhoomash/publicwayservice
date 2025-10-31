from dotenv import load_dotenv
import os

load_dotenv()

# Database Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "gov_portal")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Email Configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USERNAME)

# AI API Keys
GROQ_API_KEY = os.getenv("groq_api_key")
FIREWORKS_API_KEY = os.getenv("fireworks_api_key")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# OTP Configuration
OTP_EXPIRE_MINUTES = 10
OTP_LENGTH = 6

# Admin Configuration
ADMIN_EMAIL = os.getenv("admin_email")
ADMIN_PASSWORD = os.getenv("admin_password")

# AI API Configuration  
GROQ_API_KEY = os.getenv("groq_api_key")
FIREWORKS_API_KEY = os.getenv("fireworks_api_key")
