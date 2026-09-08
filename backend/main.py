from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from services.mri_service import predict_alzheimer_mri
from services.risk_service import predict_clinical_risk
from services.speech_service import predict_speech_biomarker
from services.emotion_service import process_emotion_frame

app = FastAPI(title="NeuroCareX AI Backend")

# Enable CORS for React frontend (localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "NeuroCareX FastAPI backend is operational"}

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