from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import Optional
from .models import (
    UserCreate, UserLogin, UserResponse, UserInDB,
    OTPRequest, OTPVerify, Token, PasswordResetRequest, PasswordReset
)
from .db import users_collection, otp_collection
from .auth_utils import (
    hash_password, verify_password, create_access_token, verify_token,
    generate_otp, send_otp_email, get_otp_expiry
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current authenticated user"""
    email = verify_token(token)
    user = users_collection.find_one({"email": email})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

def get_current_verified_user(current_user: dict = Depends(get_current_user)):
    """Get current verified user"""
    if not current_user.get("is_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
        )
    return current_user

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document
    user_doc = UserInDB(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        phone=user_data.phone,
        hashed_password=hash_password(user_data.password),
        is_verified=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    # Insert user
    result = users_collection.insert_one(user_doc.dict())
    
    # Generate and send OTP
    otp_code = generate_otp()
    otp_doc = {
        "email": user_data.email,
        "otp_code": otp_code,
        "expires_at": get_otp_expiry(),
        "created_at": datetime.utcnow()
    }
    
    # Remove any existing OTP for this email
    otp_collection.delete_many({"email": user_data.email})
    otp_collection.insert_one(otp_doc)
    
    # Send OTP email
    if send_otp_email(user_data.email, otp_code, "verification"):
        return {
            "message": "User registered successfully. Please check your email for verification code.",
            "email": user_data.email
        }
    else:
        # If email fails, still return success but mention the issue
        return {
            "message": "User registered successfully. Email service unavailable - please contact support.",
            "email": user_data.email
        }

@router.post("/verify-email")
async def verify_email(otp_data: OTPVerify):
    """Verify email using OTP"""
    # Find OTP record
    otp_record = otp_collection.find_one({
        "email": otp_data.email,
        "otp_code": otp_data.otp_code,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    # Update user verification status
    result = users_collection.update_one(
        {"email": otp_data.email},
        {
            "$set": {
                "is_verified": True,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Delete used OTP
    otp_collection.delete_many({"email": otp_data.email})
    
    return {"message": "Email verified successfully"}

@router.post("/resend-otp")
async def resend_otp(otp_request: OTPRequest):
    """Resend OTP for email verification"""
    # Check if user exists
    user = users_collection.find_one({"email": otp_request.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.get("is_verified", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )
    
    # Generate new OTP
    otp_code = generate_otp()
    otp_doc = {
        "email": otp_request.email,
        "otp_code": otp_code,
        "expires_at": get_otp_expiry(),
        "created_at": datetime.utcnow()
    }
    
    # Replace existing OTP
    otp_collection.delete_many({"email": otp_request.email})
    otp_collection.insert_one(otp_doc)
    
    # Send OTP email
    if send_otp_email(otp_request.email, otp_code, "verification"):
        return {"message": "OTP sent successfully"}
    else:
        return {"message": "Email service unavailable - please try again later"}

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login user and return access token"""
    # Find user
    user = users_collection.find_one({"email": form_data.username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if email is verified
    if not user.get("is_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email first."
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user["email"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/login-json", response_model=Token)
async def login_json(user_data: UserLogin):
    """Login user with JSON data and return access token"""
    # Find user
    user = users_collection.find_one({"email": user_data.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if email is verified
    if not user.get("is_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email first."
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user["email"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_verified_user)):
    """Get current user information"""
    return UserResponse(
        id=str(current_user["_id"]),
        first_name=current_user["first_name"],
        last_name=current_user["last_name"],
        email=current_user["email"],
        phone=current_user["phone"],
        is_verified=current_user["is_verified"],
        created_at=current_user["created_at"]
    )

@router.post("/forgot-password")
async def forgot_password(password_request: PasswordResetRequest):
    """Request password reset"""
    # Check if user exists
    user = users_collection.find_one({"email": password_request.email})
    if not user:
        # Don't reveal that user doesn't exist for security
        return {"message": "If the email exists, a reset code has been sent"}
    
    # Generate OTP for password reset
    otp_code = generate_otp()
    otp_doc = {
        "email": password_request.email,
        "otp_code": otp_code,
        "expires_at": get_otp_expiry(),
        "created_at": datetime.utcnow()
    }
    
    # Replace existing OTP
    otp_collection.delete_many({"email": password_request.email})
    otp_collection.insert_one(otp_doc)
    
    # Send OTP email
    send_otp_email(password_request.email, otp_code, "reset")
    
    return {"message": "If the email exists, a reset code has been sent"}

@router.post("/reset-password")
async def reset_password(reset_data: PasswordReset):
    """Reset password using OTP"""
    # Verify OTP
    otp_record = otp_collection.find_one({
        "email": reset_data.email,
        "otp_code": reset_data.otp_code,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    # Update password
    result = users_collection.update_one(
        {"email": reset_data.email},
        {
            "$set": {
                "hashed_password": hash_password(reset_data.new_password),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Delete used OTP
    otp_collection.delete_many({"email": reset_data.email})
    
    return {"message": "Password reset successfully"}

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user (token-based logout - client should discard token)"""
    return {"message": "Logged out successfully"}
