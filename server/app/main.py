from fastapi import FastAPI
from app.routes import router


app = FastAPI(title="GrievanceBot API")
app.include_router(router)

