from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# User Models
class UserCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    phone: str
    is_verified: bool
    created_at: datetime

class UserInDB(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    hashed_password: str
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime

# OTP Models
class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    otp_code: str

class OTPInDB(BaseModel):
    email: str
    otp_code: str
    expires_at: datetime
    created_at: datetime

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Password Reset Models
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str = Field(..., min_length=8)

# Complaint Model (keeping existing)
class Complaint(BaseModel):
    name: str
    phone: str
    message: str
    language: Optional[str] = "english"
    status: Optional[str] = "pending"
