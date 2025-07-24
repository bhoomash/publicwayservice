from pydantic import BaseModel
from typing import Optional

class Complaint(BaseModel):
    name: str
    phone: str
    message: str
    language: Optional[str] = "english"
    status: Optional[str] = "pending"
