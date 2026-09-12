from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from db import get_db
from services import caregiver_service

router = APIRouter(prefix="/api/caregiver", tags=["Caregiver"])

class LinkPatientSchema(BaseModel):
    caregiver_email: str
    patient_email: str

class ReminderCreateSchema(BaseModel):
    title: str
    time: str
    dosage: Optional[str] = "1 dose"
    created_by: Optional[str] = "Caregiver"
    patient_email: str

@router.post("/link-patient")
def link_patient(data: LinkPatientSchema, db: Session = Depends(get_db)):
    try:
        caregiver_service.link_patient_to_caregiver(db, data.caregiver_email, data.patient_email)
        return {"message": "Patient linked successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to link patient.")

@router.get("/linked-patients")
def get_linked_patients(caregiver_email: str = Query(...), db: Session = Depends(get_db)):
    return caregiver_service.fetch_linked_patients(db, caregiver_email)

@router.get("/dashboard-stats")
def get_dashboard_stats(patient_email: str = Query(""), db: Session = Depends(get_db)):
    return caregiver_service.fetch_dashboard_stats(db, patient_email)

@router.get("/reminders")
def get_reminders(patient_email: str = Query(""), db: Session = Depends(get_db)):
    return caregiver_service.fetch_all_reminders(db, patient_email)

@router.post("/reminders")
def add_reminder(data: ReminderCreateSchema, db: Session = Depends(get_db)):
    try:
        caregiver_service.create_patient_reminder(
            db=db, 
            title=data.title, 
            time_str=data.time, 
            dosage=data.dosage,
            patient_email=data.patient_email,
            created_by=data.created_by
        )
        return {"message": "Reminder added and synced to patient device."}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save reminder.")

@router.get("/appointments")
def get_appointments(patient_email: str = Query(""), db: Session = Depends(get_db)):
    return caregiver_service.fetch_patient_appointments(db, patient_email)