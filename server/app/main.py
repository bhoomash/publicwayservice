# from fastapi import FastAPI
# from app import complaint_routes
# from app.routesf.auth import auth_router 

# app = FastAPI(title="GrievanceBot API")
# app.include_router(complaint_routes.router)
# app.include_router(auth_router)
from fastapi import FastAPI
from app.complain_routes import router as complaint_router
from app.routesf.auth import auth_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="GrievanceBot API")

# Allow frontend (React) to access backend (FastAPI)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(complaint_router)
app.include_router(auth_router)
