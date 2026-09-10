import os
import datetime
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Text, Boolean, Date, Time, DateTime
from db import Base

class ReminderModel(Base):
    __tablename__ = "patient_reminders"

    id = Column(Integer, primary_key=True, index=True)
    patient_email = Column(String(100), nullable=False, default="guest@neurocarex.com")
    title = Column(String(150), nullable=False)
    reminder_date = Column(Date, nullable=True)
    reminder_time = Column(Time, nullable=False)
    frequency = Column(String(50), default="Daily")
    notes = Column(Text, nullable=True)
    status = Column(String(20), default="pending")  # 'pending', 'taken', 'missed'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

def create_reminder(db: Session, data: dict) -> ReminderModel:
    """Creates a new patient reminder in PostgreSQL."""
    reminder_date = None
    if data.get("reminder_date"):
        if isinstance(data["reminder_date"], str):
            reminder_date = datetime.datetime.strptime(data["reminder_date"], "%Y-%m-%d").date()
        else:
            reminder_date = data["reminder_date"]

    reminder_time = None
    if data.get("reminder_time"):
        if isinstance(data["reminder_time"], str):
            # Supports HH:MM or HH:MM:SS
            time_str = data["reminder_time"]
            parts = time_str.split(":")
            reminder_time = datetime.time(int(parts[0]), int(parts[1]))
        else:
            reminder_time = data["reminder_time"]

    new_reminder = ReminderModel(
        patient_email=data.get("patient_email", "guest@neurocarex.com"),
        title=data["title"],
        reminder_date=reminder_date,
        reminder_time=reminder_time,
        frequency=data.get("frequency", "Daily"),
        notes=data.get("notes", ""),
        status="pending",
        is_active=True
    )
    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)
    return new_reminder

def fetch_patient_reminders(db: Session, patient_email: str):
    """Fetches all active reminders for a patient, ordered by time."""
    return db.query(ReminderModel).filter(
        ReminderModel.patient_email == patient_email,
        ReminderModel.is_active == True
    ).order_by(ReminderModel.reminder_time.asc()).all()

def update_reminder(db: Session, reminder_id: int, data: dict):
    """Updates an existing reminder."""
    reminder = db.query(ReminderModel).filter(ReminderModel.id == reminder_id).first()
    if not reminder:
        return None

    if "title" in data:
        reminder.title = data["title"]
    if "frequency" in data:
        reminder.frequency = data["frequency"]
    if "notes" in data:
        reminder.notes = data["notes"]
    if "reminder_date" in data and data["reminder_date"]:
        if isinstance(data["reminder_date"], str):
            reminder.reminder_date = datetime.datetime.strptime(data["reminder_date"], "%Y-%m-%d").date()
        else:
            reminder.reminder_date = data["reminder_date"]
    if "reminder_time" in data and data["reminder_time"]:
        if isinstance(data["reminder_time"], str):
            parts = data["reminder_time"].split(":")
            reminder.reminder_time = datetime.time(int(parts[0]), int(parts[1]))
        else:
            reminder.reminder_time = data["reminder_time"]
    if "status" in data:
        reminder.status = data["status"]

    db.commit()
    db.refresh(reminder)
    return reminder

def update_reminder_status(db: Session, reminder_id: int, status: str):
    """Updates reminder status to 'taken' or 'missed'."""
    reminder = db.query(ReminderModel).filter(ReminderModel.id == reminder_id).first()
    if reminder:
        reminder.status = status
        db.commit()
        db.refresh(reminder)
    return reminder

def delete_reminder(db: Session, reminder_id: int):
    """Deletes a reminder permanently from DB table patient_reminders."""
    reminder = db.query(ReminderModel).filter(ReminderModel.id == reminder_id).first()
    if reminder:
        db.delete(reminder)
        db.commit()
        return True
    return False
