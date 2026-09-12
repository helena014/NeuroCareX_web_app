import os
from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect, Depends, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

# Existing services
from services.mri_service import predict_alzheimer_mri
from services.risk_service import predict_clinical_risk
from services.speech_service import predict_speech_biomarker
from services.emotion_service import process_emotion_frame

# Step 3 imports: DB connection & appointment service functions
from db import get_db, engine, Base
from services.appointment_service import (
    fetch_all_doctors, 
    save_appointment, 
    fetch_patient_appointments
)
from services.reminder_service import (
    create_reminder,
    fetch_patient_reminders,
    update_reminder,
    update_reminder_status,
    delete_reminder
)

# 1.Import your new auth routes
from routes.auth_routes import router as auth_router

# 2. IMPORT YOUR DOCTOR ROUTES HERE
from routes.doctor_router import router as doctor_router

# 2. IMPORT YOUR CAREGIVER ROUTES HERE
from routes import caregiver_router

# Initialize database tables automatically if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NeuroCareX AI Backend")

# ==================== MOUNT STATIC FILES FOR MRI & UPLOADS ====================
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
# =============================================================================

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Auth API routes
app.include_router(auth_router)

# INCLUDE DOCTOR API ROUTES HERE
app.include_router(doctor_router)

# INCLUDE CAREGIVER API ROUTES HERE
app.include_router(caregiver_router.router)

# ==================== PYDANTIC SCHEMAS ====================

class AppointmentCreateSchema(BaseModel):
    doctor_id: int
    patient_name: str
    patient_email: str
    date: str          # YYYY-MM-DD
    slot: str          # e.g., "09:00 AM"
    reason: Optional[str] = ""
    attach_ai_history: bool = True


class ReminderCreateSchema(BaseModel):
    patient_email: Optional[str] = "guest@neurocarex.com"
    title: str
    reminder_date: Optional[str] = None
    reminder_time: str
    frequency: Optional[str] = "Daily"
    notes: Optional[str] = ""

class ReminderUpdateSchema(BaseModel):
    title: Optional[str] = None
    reminder_date: Optional[str] = None
    reminder_time: Optional[str] = None
    frequency: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class ReminderStatusSchema(BaseModel):
    status: str


# ==================== GENERAL ROUTES ====================

@app.get("/")
def home():
    return {"status": "NeuroCareX FastAPI backend is operational"}


# ==================== AI PREDICTION ENDPOINTS ====================

@app.post("/api/predict")
async def predict_mri(
    file: UploadFile = File(...),
    patient_email: Optional[str] = Form("guest@neurocarex.com"),
    db: Session = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        return await predict_alzheimer_mri(file, db=db, patient_email=patient_email)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.post("/api/predict-risk")
async def predict_risk(data: dict):
    try:
        return predict_clinical_risk(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk prediction error: {str(e)}")

@app.post("/api/predict-speech")
async def predict_speech(
    file: UploadFile = File(...),
    patient_email: Optional[str] = Form("guest@neurocarex.com"),
    db: Session = Depends(get_db)
):
    # Validate supported audio formats
    valid_extensions = ('.wav', '.mp3', '.m4a', '.ogg', '.webm')
    if not file.filename.lower().endswith(valid_extensions):
        raise HTTPException(
            status_code=400, 
            detail="Unsupported audio file format. Please upload .wav, .mp3, or .m4a files."
        )
    
    try:
        audio_bytes = await file.read()
        return predict_speech_biomarker(audio_bytes, file.filename, db=db, patient_email=patient_email)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech analysis error: {str(e)}")

@app.post("/api/predict-emotion")
async def predict_emotion(file: UploadFile = File(...)):
    """HTTP endpoint for single image frame analysis."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
    try:
        contents = await file.read()
        return process_emotion_frame(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotion analysis error: {str(e)}")

@app.websocket("/api/ws/patient-emotion")
async def websocket_emotion_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time video stream frame analysis."""
    await websocket.accept()
    try:
        while True:
            # Receive raw binary JPEG bytes from client React canvas
            data = await websocket.receive_bytes()
            result = process_emotion_frame(data)
            await websocket.send_json(result)
    except WebSocketDisconnect:
        pass


# ==================== DOCTOR APPOINTMENT ENDPOINTS ====================

@app.get("/api/doctors")
def get_doctors(db: Session = Depends(get_db)):
    """Fetch all available doctors and their time slots from PostgreSQL."""
    doctors = fetch_all_doctors(db)
    return [
        {
            "id": doc.id,
            "name": doc.name,
            "specialty": doc.specialty,
            "experience": doc.experience,
            "rating": float(doc.rating),
            "hospital": doc.hospital,
            "fee": doc.fee,
            "available_slots": doc.available_slots
        } for doc in doctors
    ]


@app.post("/api/appointments/book")
def book_appointment(payload: AppointmentCreateSchema, db: Session = Depends(get_db)):
    """Save a new doctor appointment into PostgreSQL."""
    try:
        booking = save_appointment(db, payload.dict())
        return {
            "status": "success",
            "booking": {
                "id": booking.id,
                "doctor_id": booking.doctor_id,
                "patient_name": booking.patient_name,
                "patient_email": booking.patient_email,
                "date": str(booking.appointment_date),
                "slot": booking.slot_time,
                "status": booking.status,
                "attach_ai_history": booking.attach_ai_history
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database booking failed: {str(e)}")


@app.get("/api/appointments/patient/{email}")
def get_appointments_by_patient(email: str, db: Session = Depends(get_db)):
    """Fetch appointment history for a patient by email address."""
    bookings = fetch_patient_appointments(db, email)
    return [
        {
            "id": b.id,
            "doctor_name": b.doctor.name if b.doctor else "Unknown Doctor",
            "specialty": b.doctor.specialty if b.doctor else "",
            "date": str(b.appointment_date),
            "slot": b.slot_time,
            "reason": b.reason,
            "status": b.status
        } for b in bookings
    ]


# ==================== PATIENT REMINDER ENDPOINTS ====================

def serialize_reminder(rem):
    return {
        "id": rem.id,
        "patient_email": rem.patient_email,
        "title": rem.title,
        "reminder_date": str(rem.reminder_date) if rem.reminder_date else None,
        "reminder_time": str(rem.reminder_time)[:5] if rem.reminder_time else "00:00",
        "frequency": rem.frequency,
        "notes": rem.notes,
        "status": rem.status,
        "is_active": rem.is_active,
        "created_at": rem.created_at.isoformat() if rem.created_at else None
    }

@app.post("/api/reminders")
def add_reminder(payload: ReminderCreateSchema, db: Session = Depends(get_db)):
    """Create a new patient reminder in PostgreSQL."""
    try:
        reminder = create_reminder(db, payload.dict())
        return {
            "status": "success",
            "reminder": serialize_reminder(reminder)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create reminder: {str(e)}")

@app.get("/api/reminders/{patient_email}")
def get_reminders(patient_email: str, db: Session = Depends(get_db)):
    """Fetch all active reminders for a patient."""
    reminders = fetch_patient_reminders(db, patient_email)
    return [serialize_reminder(r) for r in reminders]

@app.put("/api/reminders/{reminder_id}")
def edit_reminder(reminder_id: int, payload: ReminderUpdateSchema, db: Session = Depends(get_db)):
    """Update reminder details."""
    updated = update_reminder(db, reminder_id, payload.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Reminder not found.")
    return {"status": "success", "reminder": serialize_reminder(updated)}

@app.patch("/api/reminders/{reminder_id}/status")
def patch_reminder_status(reminder_id: int, payload: ReminderStatusSchema, db: Session = Depends(get_db)):
    """Update reminder status to 'taken' or 'missed'."""
    updated = update_reminder_status(db, reminder_id, payload.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Reminder not found.")
    return {"status": "success", "reminder": serialize_reminder(updated)}

@app.delete("/api/reminders/{reminder_id}")
def remove_reminder(reminder_id: int, db: Session = Depends(get_db)):
    """Soft delete/Deactivate a reminder."""
    success = delete_reminder(db, reminder_id)
    if not success:
        raise HTTPException(status_code=404, detail="Reminder not found.")
    return {"status": "success", "message": "Reminder deleted successfully."}