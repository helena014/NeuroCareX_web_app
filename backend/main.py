from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.mri_service import predict_alzheimer_mri

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