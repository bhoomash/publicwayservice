from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .auth_routes import router as auth_router
from .complaint_routes import router as complaint_router
from .notification_routes import router as notification_router
from .chat_routes import router as chat_router
from .admin_routes import router as admin_router

app = FastAPI(
    title="GrievanceBot API", 
    description="AI-powered Government Complaint Management System",
    version="2.0.0"
)

# CORS middleware - Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all route modules
app.include_router(auth_router)
app.include_router(complaint_router)
app.include_router(notification_router)
app.include_router(chat_router)
app.include_router(admin_router)

@app.get("/")
async def root():
    return {
        "message": "Government Portal API",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
