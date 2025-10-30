from datetime import datetime, date
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field

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
    role: str = "citizen"
    is_admin: bool = False
    created_at: datetime

class UserInDB(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    password: str
    is_verified: bool = False
    role: str = "citizen"
    is_admin: bool = False
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

# User model for database operations
class User(BaseModel):
    id: Optional[str] = None
    first_name: str
    last_name: str
    email: str
    phone: str
    is_verified: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# Password Reset Models
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str = Field(..., min_length=8)

class AttachmentMeta(BaseModel):
    filename: str
    content_type: Optional[str] = None
    path: Optional[str] = None
    size: Optional[int] = None


class ComplaintBase(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    location: str
    urgency: Optional[str] = "medium"
    date_occurred: Optional[date] = None


class ComplaintCreate(ComplaintBase):
    contact_phone: Optional[str] = Field(None, min_length=7, max_length=20)
    contact_email: Optional[EmailStr] = None


class ComplaintInDB(ComplaintBase):
    id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    priority: Optional[str] = "medium"
    priority_score: Optional[int] = 50
    status: str = "pending"
    assigned_department: Optional[str] = None
    ai_response: Optional[str] = None
    ai_category: Optional[str] = None
    ai_department: Optional[str] = None
    estimated_resolution: Optional[str] = None
    submitted_date: Optional[datetime] = None
    last_updated: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    attachments: List[AttachmentMeta] = Field(default_factory=list)
    vector_db_id: Optional[str] = None
    rag_summary: Optional[str] = None
    rag_department: Optional[str] = None
    rag_urgency: Optional[str] = None
    rag_location: Optional[str] = None
    rag_color: Optional[str] = None
    rag_emoji: Optional[str] = None
    rag_text_length: Optional[int] = None
    rag_metadata: Optional[Dict[str, Any]] = None
    status_history: List[Dict[str, Any]] = Field(default_factory=list)


class ComplaintResponse(ComplaintInDB):
    pass

# Profile Update Models
class Address(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

class ProfileUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    address: Optional[Address] = None
    profile_picture: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)

class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)

class NotificationSettings(BaseModel):
    email_notifications: Optional[bool] = True
    sms_notifications: Optional[bool] = True
    push_notifications: Optional[bool] = True

class PrivacySettings(BaseModel):
    profile_visibility: Optional[str] = Field("public", pattern="^(public|private|friends)$")
    contact_visibility: Optional[str] = Field("private", pattern="^(public|private|friends)$")
    data_sharing: Optional[bool] = False
