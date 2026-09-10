from sqlalchemy import Column, Integer, String, Text, Boolean, Numeric, Date, DateTime, ARRAY, ForeignKey
from sqlalchemy.orm import relationship, Session
from datetime import datetime
from db import Base

# ==================== SQLALCHEMY ORM MODELS ====================

class DoctorModel(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    specialty = Column(String(100), nullable=False)
    experience = Column(String(50), nullable=False)
    rating = Column(Numeric(2, 1), default=4.5)
    hospital = Column(String(150), nullable=False)
    fee = Column(String(20), default="$100")
    available_slots = Column(ARRAY(String), nullable=False)


class AppointmentModel(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    patient_name = Column(String(100), nullable=False)
    patient_email = Column(String(100), nullable=False)
    appointment_date = Column(Date, nullable=False)
    slot_time = Column(String(20), nullable=False)
    reason = Column(Text, nullable=True)
    attach_ai_history = Column(Boolean, default=True)
    status = Column(String(20), default="Confirmed")
    created_at = Column(DateTime, default=datetime.utcnow)

    doctor = relationship("DoctorModel")


# ==================== DATABASE SERVICE FUNCTIONS ====================

def fetch_all_doctors(db: Session):
    """Retrieve list of available doctors from PostgreSQL."""
    return db.query(DoctorModel).all()


def save_appointment(db: Session, data: dict):
    """Create and persist a new appointment in PostgreSQL."""
    new_booking = AppointmentModel(
        doctor_id=data["doctor_id"],
        patient_name=data["patient_name"],
        patient_email=data["patient_email"],
        appointment_date=datetime.strptime(data["date"], "%Y-%m-%d").date(),
        slot_time=data["slot"],
        reason=data.get("reason", ""),
        attach_ai_history=data.get("attach_ai_history", True)
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking


def fetch_patient_appointments(db: Session, email: str):
    """Retrieve all appointments for a given patient email."""
    return db.query(AppointmentModel).filter(AppointmentModel.patient_email == email).all()