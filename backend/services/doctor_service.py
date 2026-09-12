import json
from sqlalchemy.orm import Session
from sqlalchemy import text

def upsert_doctor_profile(db: Session, email: str, profile_data: dict):
    """Inserts a new doctor profile into the doctors table and links it to user email."""
    query = text("""
        INSERT INTO doctors (name, specialty, experience, hospital, fee, available_slots)
        VALUES (:name, :specialty, :experience, :hospital, :fee, :slots)
        RETURNING id;
    """)
    result = db.execute(query, {
        "name": profile_data.get("name"),
        "specialty": profile_data.get("specialty"),
        "experience": profile_data.get("experience"),
        "hospital": profile_data.get("hospital"),
        "fee": profile_data.get("fee", "$100"),
        "slots": profile_data.get("available_slots", ["09:00 AM", "11:00 AM", "02:00 PM"])
    })
    db.commit()
    return result.fetchone()[0]


def get_doctor_appointments(db: Session, doctor_id: int):
    """Fetches all booked appointments for a given doctor ID."""
    query = text("""
        SELECT id, patient_name, patient_email, appointment_date, slot_time, reason, status
        FROM appointments
        WHERE doctor_id = :doc_id
        ORDER BY appointment_date ASC, slot_time ASC;
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
        }
        for r in rows
    ]


def get_patient_full_history(db: Session, patient_email: str):
    """Aggregates MRI history, Speech history, and Missed Reminders for a patient."""
    
    # 1. MRI Diagnostics
    mri_query = text("""
        SELECT id, mri_image_path, mri_result, mri_confidence, mri_class_probabilities, created_at
        FROM mri_diagnostic_history
        WHERE patient_email = :email
        ORDER BY created_at DESC;
    """)
    mri_records = db.execute(mri_query, {"email": patient_email}).fetchall()
    
    # 2. Speech Diagnostics
    speech_query = text("""
        SELECT id, speech_result, speech_confidence, speech_metrics, created_at
        FROM speech_diagnostic_history
        WHERE patient_email = :email
        ORDER BY created_at DESC;
    """)
    speech_records = db.execute(speech_query, {"email": patient_email}).fetchall()

    # 3. Missed Reminders
    reminder_query = text("""
        SELECT id, title, reminder_date, reminder_time, created_at
        FROM patient_reminders
        WHERE patient_email = :email AND status = 'missed'
        ORDER BY created_at DESC;
    """)
    missed_reminders = db.execute(reminder_query, {"email": patient_email}).fetchall()

    return {
        "mri_history": [
            {
                "id": r[0],
                "mri_image_path": r[1],
                "mri_result": r[2],
                "mri_confidence": float(r[3]) if r[3] is not None else None,
                "mri_class_probabilities": r[4],
                "created_at": str(r[5])
            } for r in mri_records
        ],
        "speech_history": [
            {
                "id": r[0],
                "speech_result": r[1],
                "speech_confidence": float(r[2]) if r[2] is not None else None,
                "speech_metrics": r[3],
                "created_at": str(r[4])
            } for r in speech_records
        ],
        "missed_reminders": [
            {
                "id": r[0],
                "title": r[1],
                "date": str(r[2]) if r[2] else "Daily",
                "time": str(r[3]),
                "created_at": str(r[4])
            } for r in missed_reminders
        ]
    }