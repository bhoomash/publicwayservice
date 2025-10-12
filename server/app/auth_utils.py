import bcrypt
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import (
    SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES,
    SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, FROM_EMAIL,
    OTP_EXPIRE_MINUTES, OTP_LENGTH
)
from .utils.identity import normalize_user_document

# Security scheme for JWT tokens
security = HTTPBearer()

# Password hashing
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# JWT token functions
def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Verify JWT token and return email"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return email
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# OTP functions
def generate_otp() -> str:
    """Generate a random OTP"""
    return ''.join([str(secrets.randbelow(10)) for _ in range(OTP_LENGTH)])

def send_otp_email(email: str, otp_code: str, purpose: str = "verification"):
    """Send OTP via email"""
    try:
        # Check if email configuration is available
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            print(f"⚠️  EMAIL NOT CONFIGURED - OTP for {email}: {otp_code}")
            print("📧 To send real emails, configure SMTP settings in .env file")
            print("📋 See EMAIL_SETUP_GUIDE.md for detailed instructions")
            return True
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = email
        
        if purpose == "verification":
            msg['Subject'] = "Email Verification - Government Portal"
            body = f"""
            <html>
                <body>
                    <h2>Email Verification</h2>
                    <p>Thank you for registering with the Government Portal!</p>
                    <p>Your verification code is: <strong style="font-size: 24px; color: #2563eb;">{otp_code}</strong></p>
                    <p>This code will expire in {OTP_EXPIRE_MINUTES} minutes.</p>
                    <p>If you didn't request this verification, please ignore this email.</p>
                    <br>
                    <p>Best regards,<br>Government Portal Team</p>
                </body>
            </html>
            """
        else:  # password reset
            msg['Subject'] = "Password Reset - Government Portal"
            body = f"""
            <html>
                <body>
                    <h2>Password Reset Request</h2>
                    <p>You requested to reset your password for the Government Portal.</p>
                    <p>Your reset code is: <strong style="font-size: 24px; color: #2563eb;">{otp_code}</strong></p>
                    <p>This code will expire in {OTP_EXPIRE_MINUTES} minutes.</p>
                    <p>If you didn't request this reset, please ignore this email.</p>
                    <br>
                    <p>Best regards,<br>Government Portal Team</p>
                </body>
            </html>
            """
        
        msg.attach(MIMEText(body, 'html'))
        
        # Send email
        print(f"📧 Sending email to {email}...")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(FROM_EMAIL, email, text)
        server.quit()
        print(f"✅ Email sent successfully to {email}")
        return True
            
    except Exception as e:
        print(f"❌ Error sending email to {email}: {str(e)}")
        print(f"🔧 Fallback - OTP for {email}: {otp_code}")
        print("📋 Check EMAIL_SETUP_GUIDE.md for email configuration help")
        return True

def get_otp_expiry() -> datetime:
    """Get OTP expiry datetime"""
    return datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        # Extract token from credentials
        token = credentials.credentials
        
        # Verify token and get email
        email = verify_token(token)
        
        # Import here to avoid circular imports
        from .db import get_database
        
        # Get database
        db = get_database()
        
        # Find user in database
        user = db.users.find_one({"email": email})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return normalize_user_document(user)
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
