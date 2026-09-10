from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from db import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False) # 'patient', 'doctor', or 'caregiver'
    created_at = Column(DateTime, default=datetime.utcnow)

def register_user(db, name: str, email: str, password: str, role: str):
    """Create a new user account linked to the selected role tab."""
    existing_user = db.query(UserModel).filter(UserModel.email == email).first()
    if existing_user:
        return None, "An account with this email already exists."

    new_user = UserModel(
        name=name,
        email=email,
        password=password, # In production, hash passwords using passlib/bcrypt
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user, None

def authenticate_user(db, email: str, password: str, role: str):
    """Authenticate user matching email, password, and active role tab."""
    user = db.query(UserModel).filter(
        UserModel.email == email,
        UserModel.password == password,
        UserModel.role == role
    ).first()
    return user