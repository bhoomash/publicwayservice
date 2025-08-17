from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import Optional
from .models import (
    UserCreate, UserLogin, UserResponse, UserInDB,
    OTPRequest, OTPVerify, Token, PasswordResetRequest, PasswordReset,
    ProfileUpdate, PasswordChange, NotificationSettings, PrivacySettings
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
        password=hash_password(user_data.password),
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
    if not verify_password(form_data.password, user["password"]):
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
    if not verify_password(user_data.password, user["password"]):
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
                "password": hash_password(reset_data.new_password),
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

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_verified_user)):
    """Get current user profile"""
    user_data = {
        "id": str(current_user["_id"]),
        "first_name": current_user.get("first_name", ""),
        "last_name": current_user.get("last_name", ""),
        "email": current_user["email"],
        "phone": current_user.get("phone", ""),
        "address": current_user.get("address", {}),
        "profile_picture": current_user.get("profile_picture", ""),
        "bio": current_user.get("bio", ""),
        "is_verified": current_user.get("is_verified", False),
        "created_at": current_user.get("created_at"),
        "updated_at": current_user.get("updated_at")
    }
    return user_data

@router.put("/profile")
async def update_profile(profile_data: ProfileUpdate, current_user: dict = Depends(get_current_verified_user)):
    """Update user profile"""
    # Prepare update data
    update_data = {
        "updated_at": datetime.utcnow()
    }
    
    # Update only provided fields
    profile_dict = profile_data.dict(exclude_unset=True)
    for field, value in profile_dict.items():
        if value is not None:
            if field == "address" and isinstance(value, dict):
                # Convert Address model to dict
                update_data[field] = value
            else:
                update_data[field] = value
    
    # Update user in database
    result = users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No changes made to profile"
        )
    
    return {"message": "Profile updated successfully"}

@router.post("/change-password")
async def change_password(password_data: PasswordChange, current_user: dict = Depends(get_current_verified_user)):
    """Change user password"""
    
    # Verify current password
    if not verify_password(password_data.current_password, current_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    result = users_collection.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "password": hash_password(password_data.new_password),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password"
        )
    
    return {"message": "Password changed successfully"}

@router.get("/settings")
async def get_account_settings(current_user: dict = Depends(get_current_verified_user)):
    """Get user account settings"""
    settings_data = {
        "notifications": {
            "email_notifications": current_user.get("email_notifications", True),
            "sms_notifications": current_user.get("sms_notifications", True),
            "push_notifications": current_user.get("push_notifications", True)
        },
        "privacy": {
            "profile_visibility": current_user.get("profile_visibility", "public"),
            "contact_visibility": current_user.get("contact_visibility", "private"),
            "data_sharing": current_user.get("data_sharing", False)
        },
        "language": current_user.get("language", "en"),
        "timezone": current_user.get("timezone", "UTC")
    }
    return settings_data

@router.put("/settings/notifications")
async def update_notification_settings(notifications: NotificationSettings, current_user: dict = Depends(get_current_verified_user)):
    """Update notification settings"""
    update_data = {
        "email_notifications": notifications.email_notifications,
        "sms_notifications": notifications.sms_notifications,
        "push_notifications": notifications.push_notifications,
        "updated_at": datetime.utcnow()
    }
    
    result = users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No changes made to notification settings"
        )
    
    return {"message": "Notification settings updated successfully"}

@router.put("/settings/privacy")
async def update_privacy_settings(privacy_data: PrivacySettings, current_user: dict = Depends(get_current_verified_user)):
    """Update privacy settings"""
    update_data = {
        "updated_at": datetime.utcnow()
    }
    
    # Update only provided fields
    privacy_dict = privacy_data.dict(exclude_unset=True)
    for field, value in privacy_dict.items():
        if value is not None:
            update_data[field] = value
    
    result = users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No changes made to privacy settings"
        )
    
    return {"message": "Privacy settings updated successfully"}

@router.delete("/account")
async def delete_account(current_user: dict = Depends(get_current_verified_user)):
    """Delete user account"""
    # Delete user from database
    result = users_collection.delete_one({"_id": current_user["_id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account"
        )
    
    # Also delete any OTP records for this user
    otp_collection.delete_many({"email": current_user["email"]})
    
    return {"message": "Account deleted successfully"}

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user (token-based logout - client should discard token)"""
    return {"message": "Logged out successfully"}

@router.post("/admin-login")
async def admin_login(login_data: dict):
    """Admin login with email and password"""
    email = login_data.get("email")
    password = login_data.get("password")
    
    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required"
        )
    
    # Find admin user
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check if user is admin
    if not user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Verify password
    if not verify_password(password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check if verified
    if not user.get("is_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "is_admin": True
        }
    }

@router.post("/admin-otp-request")
async def request_admin_otp(otp_request: dict):
    """Request OTP for admin login"""
    email = otp_request.get("email")
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )
    
    # Check if user exists and is admin
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin user not found"
        )
    
    if not user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Generate and send OTP
    otp_code = generate_otp()
    otp_doc = {
        "email": email,
        "otp_code": otp_code,
        "expires_at": get_otp_expiry(),
        "created_at": datetime.utcnow(),
        "purpose": "admin_login"
    }
    
    # Remove any existing OTP for this email
    otp_collection.delete_many({"email": email, "purpose": "admin_login"})
    otp_collection.insert_one(otp_doc)
    
    # Send OTP email
    if send_otp_email(email, otp_code, "admin_login"):
        return {"message": "OTP sent successfully"}
    else:
        return {"message": "OTP generated but email service unavailable"}

@router.post("/admin-otp-login")
async def admin_otp_login(otp_data: dict):
    """Admin login with OTP"""
    email = otp_data.get("email")
    otp_code = otp_data.get("otp_code")
    
    if not email or not otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and OTP code are required"
        )
    
    # Find OTP record
    otp_record = otp_collection.find_one({
        "email": email,
        "otp_code": otp_code,
        "purpose": "admin_login",
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    # Find admin user
    user = users_collection.find_one({"email": email})
    if not user or not user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Delete used OTP
    otp_collection.delete_many({"email": email, "purpose": "admin_login"})
    
    # Create access token
    access_token = create_access_token(data={"sub": email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "is_admin": True
        }
    }
