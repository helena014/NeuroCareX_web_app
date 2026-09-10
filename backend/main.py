from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect, Depends
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

# Initialize database tables automatically if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NeuroCareX AI Backend")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== PYDANTIC SCHEMAS ====================

class AppointmentCreateSchema(BaseModel):
    doctor_id: int
    patient_name: str
    patient_email: str
    date: str          # YYYY-MM-DD
    slot: str          # e.g., "09:00 AM"
    reason: Optional[str] = ""
    attach_ai_history: bool = True


# ==================== GENERAL ROUTES ====================

@app.get("/")
def home():
    return {"status": "NeuroCareX FastAPI backend is operational"}


# ==================== AI PREDICTION ENDPOINTS ====================

@app.post("/api/predict")
async def predict_mri(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        return await predict_alzheimer_mri(file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.post("/api/predict-risk")
async def predict_risk(data: dict):
    try:
        return predict_clinical_risk(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk prediction error: {str(e)}")

@app.post("/api/predict-speech")
async def predict_speech(file: UploadFile = File(...)):
    # Validate supported audio formats
    valid_extensions = ('.wav', '.mp3', '.m4a', '.ogg', '.webm')
    if not file.filename.lower().endswith(valid_extensions):
        raise HTTPException(
            status_code=400, 
            detail="Unsupported audio file format. Please upload .wav, .mp3, or .m4a files."
        )
    
    try:
        audio_bytes = await file.read()
        return predict_speech_biomarker(audio_bytes, file.filename)
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