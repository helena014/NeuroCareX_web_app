import io
import os
import uuid
import json
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from sqlalchemy.orm import Session
from sqlalchemy import text

# 1. Base directory setup for uploaded images
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "mri")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 2. Exact alphabetical class names sorted by torchvision ImageFolder
CLASSES = ['MildDemented', 'ModerateDemented', 'NonDemented', 'VeryMildDemented']

# 3. Re-create ResNet-18 model architecture
device = torch.device("cpu")
model = models.resnet18(weights=None)
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, len(CLASSES))

# 4. Load saved state dict from models/ folder
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "alzheimer_mri_resnet18.pth")

if os.path.exists(MODEL_PATH):
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.eval()
    print("✅ PyTorch MRI model loaded successfully!")
else:
    print(f"⚠️ Model file missing at {MODEL_PATH}. Place 'alzheimer_mri_resnet18.pth' in backend/models/")

# 5. Standard evaluation transform pipeline
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# 6. Database save function
def save_mri_diagnostic(
    db: Session, 
    patient_email: str, 
    mri_image_path: str, 
    mri_result: str, 
    mri_confidence: float, 
    mri_class_probabilities: list
):
    """Inserts a new MRI diagnostic record into pgAdmin with explicit SQL type casts."""
    query = text("""
        INSERT INTO mri_diagnostic_history 
        (patient_email, mri_image_path, mri_result, mri_confidence, mri_class_probabilities)
        VALUES (
            :email, 
            :path, 
            :result, 
            CAST(:confidence AS NUMERIC(5, 2)), 
            CAST(:probs AS JSON)
        )
        RETURNING id;
    """)
    
    result = db.execute(query, {
        "email": patient_email or "guest@neurocarex.com",
        "path": mri_image_path or "uploads/mri/uploaded_mri.jpg",
        "result": mri_result,
        "confidence": float(mri_confidence),
        "probs": json.dumps(mri_class_probabilities)
    })
    
    inserted_id = result.fetchone()[0]
    db.commit()  # Ensure transaction is committed
    return inserted_id

# 7. Main inference and image save function
async def predict_alzheimer_mri(file, db: Session = None, patient_email: str = "guest@neurocarex.com"):
    """Saves image to disk, runs ResNet-18 inference, and logs result to DB."""
    
    # 1. Read file bytes
    contents = await file.read()
    
    # 2. Save physical image to backend/uploads/mri/
    file_extension = os.path.splitext(file.filename)[1] if hasattr(file, "filename") and file.filename else ".jpg"
    if not file_extension:
        file_extension = ".jpg"
        
    unique_filename = f"mri_{uuid.uuid4().hex[:8]}{file_extension}"
    file_save_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_save_path, "wb") as f:
        f.write(contents)
        
    relative_db_path = f"uploads/mri/{unique_filename}"
    
    # 3. Open image for PyTorch inference
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    tensor = transform(image).unsqueeze(0).to(device)
    
    # 4. Run model prediction
    with torch.no_grad():
        outputs = model(tensor)
        probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
        confidence, predicted_idx = torch.max(probabilities, 0)

    prediction_result = CLASSES[predicted_idx.item()]
    confidence_score = round(confidence.item() * 100, 2)

    breakdown = [
        {
            "label": CLASSES[i], 
            "score": round(probabilities[i].item() * 100, 2)
        }
        for i in range(len(CLASSES))
    ]

    # 5. Insert into PostgreSQL safely with explicit print error
    record_id = None
    if db is not None:
        try:
            record_id = save_mri_diagnostic(
                db=db,
                patient_email=patient_email,
                mri_image_path=relative_db_path,
                mri_result=prediction_result,
                mri_confidence=confidence_score,
                mri_class_probabilities=breakdown
            )
            print(f"✅ DB Insert Successful! Created Record ID: {record_id}")
        except Exception as e:
            db.rollback()
            print(f"❌ Database Error during MRI save: {str(e)}")

    return {
        "status": "success",
        "prediction": prediction_result,
        "confidence": confidence_score,
        "breakdown": breakdown,
        "mri_image_path": relative_db_path,
        "db_record_id": record_id
    }