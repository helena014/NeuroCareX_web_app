from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List
from pydantic import BaseModel
from db import get_db

router = APIRouter(prefix="/api/doctor", tags=["Doctor Portal"])

class DoctorProfileSchema(BaseModel):
    name: str
    email: str
    specialty: str
    experience: str
    rating: float = 4.8
    hospital: str
    fee: str
    available_slots: List[str]

@router.post("/profile")
def save_or_update_doctor_profile(payload: DoctorProfileSchema, db: Session = Depends(get_db)):
    """Save or update a doctor profile including email and rating."""
    try:
        # Check if doctor exists by email
        existing_doc = db.execute(
            text("SELECT id FROM doctors WHERE email = :email LIMIT 1;"),
            {"email": payload.email}
        ).fetchone()

        if existing_doc:
            doc_id = existing_doc[0]
            update_query = text("""
                UPDATE doctors 
                SET name = :name, specialty = :specialty, experience = :experience,
                    rating = :rating, hospital = :hospital, fee = :fee, 
                    available_slots = :slots
                WHERE id = :id;
            """)
            db.execute(update_query, {
                "name": payload.name,
                "specialty": payload.specialty,
                "experience": payload.experience,
                "rating": payload.rating,
                "hospital": payload.hospital,
                "fee": payload.fee,
                "slots": payload.available_slots,
                "id": doc_id
            })
        else:
            insert_query = text("""
                INSERT INTO doctors (name, email, specialty, experience, rating, hospital, fee, available_slots)
                VALUES (:name, :email, :specialty, :experience, :rating, :hospital, :fee, :slots)
                RETURNING id;
            """)
            result = db.execute(insert_query, {
                "name": payload.name,
                "email": payload.email,
                "specialty": payload.specialty,
                "experience": payload.experience,
                "rating": payload.rating,
                "hospital": payload.hospital,
                "fee": payload.fee,
                "slots": payload.available_slots
            })
            doc_id = result.fetchone()[0]

        db.commit()
        return {"status": "success", "doctor_id": doc_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/profile/{email}")
def get_doctor_profile_by_email(email: str, db: Session = Depends(get_db)):
    """Fetch doctor profile by email to fix the 404 error."""
    doc = db.execute(
        text("SELECT id, name, email, specialty, experience, rating, hospital, fee, available_slots FROM doctors WHERE email = :email LIMIT 1;"),
        {"email": email}
    ).fetchone()

    if not doc:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    return {
        "status": "success",
        "doctor": {
            "id": doc[0],
            "name": doc[1],
            "email": doc[2],
            "specialty": doc[3],
            "experience": doc[4],
            "rating": float(doc[5]) if doc[5] else 4.8,
            "hospital": doc[6],
            "fee": doc[7],
            "available_slots": doc[8]
        }
    }

@router.get("/appointments")
def get_doctor_appointments(
    doctor_id: Optional[int] = Query(None),
    email: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Fetch appointments for a doctor using doctor_id OR doctor email to fix the 422 error."""
    try:
        if not doctor_id and not email:
            # Fallback: get all appointments if no parameters are passed
            query = text("""
                SELECT a.id, a.patient_name, a.patient_email, a.appointment_date, a.slot_time, a.reason, a.status
                FROM appointments a ORDER BY a.created_at DESC;
            """)
            rows = db.execute(query).fetchall()
        elif email:
            query = text("""
                SELECT a.id, a.patient_name, a.patient_email, a.appointment_date, a.slot_time, a.reason, a.status
                FROM appointments a 
                JOIN doctors d ON a.doctor_id = d.id
                WHERE d.email = :email ORDER BY a.created_at DESC;
            """)
            rows = db.execute(query, {"email": email}).fetchall()
        else:
            query = text("""
                SELECT id, patient_name, patient_email, appointment_date, slot_time, reason, status
                FROM appointments WHERE doctor_id = :doc_id ORDER BY created_at DESC;
            """)
            rows = db.execute(query, {"doc_id": doctor_id}).fetchall()

        return [
            {
                "id": r[0],
                "patient_name": r[1],
                "patient_email": r[2],
                "appointment_date": str(r[3]),
                "slot_time": r[4],
                "reason": r[5],
                "status": r[6]
            } for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching appointments: {str(e)}")

@router.get("/patient-history")
def get_patient_history(patient_email: str, db: Session = Depends(get_db)):
    """Fetch last scanned MRI (with image path), last speech result, and missed reminders."""
    latest_mri = None
    latest_speech = None
    missed_reminders = []

    # 1. Fetch Latest MRI
    try:
        mri_row = db.execute(
            text("""
                SELECT mri_result, mri_confidence, mri_image_path, created_at 
                FROM mri_diagnostic_history 
                WHERE patient_email = :email 
                ORDER BY created_at DESC LIMIT 1;
            """),
            {"email": patient_email}
        ).fetchone()
        if mri_row:
            latest_mri = {
                "result": mri_row[0],
                "confidence": float(mri_row[1]) if mri_row[1] is not None else 0.0,
                "image_path": mri_row[2],
                "date": str(mri_row[3])
            }
    except Exception as e:
        print(f"MRI lookup error: {e}")

    # 2. Fetch Latest Speech Biomarker
    try:
        speech_row = db.execute(
            text("""
                SELECT speech_result, speech_confidence, created_at 
                FROM speech_diagnostic_history 
                WHERE patient_email = :email 
                ORDER BY created_at DESC LIMIT 1;
            """),
            {"email": patient_email}
        ).fetchone()
        if speech_row:
            latest_speech = {
                "result": speech_row[0],
                "confidence": float(speech_row[1]) if speech_row[1] is not None else 0.0,
                "date": str(speech_row[2])
            }
    except Exception as e:
        print(f"Speech lookup error: {e}")

    # 3. Fetch Missed Reminders
    try:
        reminders_rows = db.execute(
            text("""
                SELECT title, reminder_time, status, reminder_date, created_at 
                FROM patient_reminders 
                WHERE patient_email = :email AND status ILIKE 'missed' 
                ORDER BY created_at DESC;
            """),
            {"email": patient_email}
        ).fetchall()
        missed_reminders = [
            {
                "title": r[0],
                "time": str(r[1]),
                "status": r[2],
                "date": str(r[3] or r[4])
            } for r in reminders_rows
        ]
    except Exception as e:
        print(f"Reminders lookup error: {e}")

    return {
        "latest_mri": latest_mri,
        "latest_speech": latest_speech,
        "missed_reminders": missed_reminders
    }

@router.delete("/appointments/{appointment_id}")
def delete_appointment(appointment_id: str, db: Session = Depends(get_db)):
    """Delete an appointment by ID."""
    try:
        target_id = int(appointment_id)
        
        
        result = db.execute(
            text("DELETE FROM appointments WHERE id = :id"),
            {"id": target_id}
        )
        db.commit()
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Appointment not found in database")
            
        return {"message": "Appointment deleted successfully"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid appointment ID format")
    except Exception as e:
        db.rollback()
        print("Delete Error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))