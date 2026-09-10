from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from db import get_db
from services.auth_service import authenticate_user, register_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Pydantic Schemas
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str # Sent based on active tab ('patient', 'doctor', 'caregiver')

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str # Sent based on active tab ('patient', 'doctor', 'caregiver')

@router.post("/signup")
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    """Handles new user registration based on the active tab role."""
    user, error = register_user(
        db=db,
        name=payload.name,
        email=payload.email,
        password=payload.password,
        role=payload.role
    )
    if error:
        raise HTTPException(status_code=400, detail=error)

    return {
        "status": "success",
        "message": f"{payload.role.capitalize()} account created successfully.",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Validates login credentials against the selected role tab."""
    user = authenticate_user(
        db=db,
        email=payload.email,
        password=payload.password,
        role=payload.role
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid credentials for {payload.role.capitalize()} login."
        )

    return {
        "status": "success",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }