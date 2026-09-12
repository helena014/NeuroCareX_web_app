from sqlalchemy.orm import Session
from sqlalchemy import text

def link_patient_to_caregiver(db: Session, caregiver_email: str, patient_email: str):
    """Link a patient to a caregiver."""
    try:
        db.execute(
            text("""
                INSERT INTO caregiver_patient_links (caregiver_email, patient_email)
                VALUES (:caregiver_email, :patient_email)
                ON CONFLICT (caregiver_email, patient_email) DO NOTHING
            """),
            {"caregiver_email": caregiver_email, "patient_email": patient_email}
        )
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print("Error linking patient:", str(e))
        raise e

def fetch_linked_patients(db: Session, caregiver_email: str):
    """Get all patient emails linked to a caregiver."""
    try:
        result = db.execute(
            text("SELECT patient_email FROM caregiver_patient_links WHERE caregiver_email = :email ORDER BY id ASC"),
            {"email": caregiver_email}
        ).fetchall()
        return [row[0] for row in result]
    except Exception as e:
        print("Error fetching linked patients:", str(e))
        return []

def fetch_dashboard_stats(db: Session, patient_email: str):
    try:
        # Count reminders from patient_reminders table
        total_reminders = db.execute(
            text("SELECT COUNT(*) FROM patient_reminders WHERE patient_email = :email AND is_active = TRUE"),
            {"email": patient_email}
        ).scalar() or 0
        
        # Count missed reminders from patient_reminders table
        missed_reminders = db.execute(
            text("SELECT COUNT(*) FROM patient_reminders WHERE patient_email = :email AND status = 'missed' AND is_active = TRUE"),
            {"email": patient_email}
        ).scalar() or 0

        # Count appointments from appointments table
        total_appointments = db.execute(
            text("SELECT COUNT(*) FROM appointments WHERE patient_email = :email"),
            {"email": patient_email}
        ).scalar() or 0

        return {
            "totalReminders": total_reminders,
            "missedReminders": missed_reminders,
            "upcomingAppointments": total_appointments,
            "patientStatus": "Safe (Home Zone)" if patient_email else "No Patient Selected"
        }
    except Exception as e:
        print("Error fetching stats:", str(e))
        return {"totalReminders": 0, "missedReminders": 0, "upcomingAppointments": 0, "patientStatus": "N/A"}

def fetch_all_reminders(db: Session, patient_email: str):
    if not patient_email:
        return []
    try:
        # Fetch from patient_reminders and cast TIME to string to prevent JSON serialization errors
        result = db.execute(
            text("""
                SELECT 
                    id, 
                    title, 
                    CAST(reminder_time AS VARCHAR) as time, 
                    notes as dosage, 
                    'Caregiver' as created_by 
                FROM patient_reminders 
                WHERE patient_email = :email AND is_active = TRUE 
                ORDER BY id DESC
            """),
            {"email": patient_email}
        ).fetchall()
        return [dict(row._mapping) for row in result]
    except Exception as e:
        print("Error fetching reminders:", str(e))
        return []

def create_patient_reminder(db: Session, title: str, time_str: str, dosage: str, patient_email: str, created_by: str = "Caregiver"):
    try:
        # Insert into patient_reminders table using TIME format
        db.execute(
            text("""
                INSERT INTO patient_reminders (patient_email, title, reminder_time, notes, status, is_active)
                VALUES (:patient_email, :title, CAST(:reminder_time AS TIME), :notes, 'pending', TRUE)
            """),
            {
                "patient_email": patient_email, 
                "title": title, 
                "reminder_time": time_str, 
                "notes": dosage
            }
        )
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print("Error creating reminder:", str(e))
        raise e

def fetch_patient_appointments(db: Session, patient_email: str):
    if not patient_email:
        return []
    try:
        # Fetch from appointments table and cast DATE to string for JSON serialization
        result = db.execute(
            text("""
                SELECT 
                    id, 
                    patient_name, 
                    patient_email, 
                    CAST(appointment_date AS VARCHAR) as appointment_date, 
                    slot_time, 
                    reason, 
                    status 
                FROM appointments 
                WHERE patient_email = :email
                ORDER BY id DESC
            """),
            {"email": patient_email}
        ).fetchall()
        return [dict(row._mapping) for row in result]
    except Exception as e:
        print("Error fetching appointments:", str(e))
        return []