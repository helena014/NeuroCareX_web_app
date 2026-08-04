import io
import os
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

# 1. Exact alphabetical class names sorted by torchvision ImageFolder
CLASSES = ['MildDemented', 'ModerateDemented', 'NonDemented', 'VeryMildDemented']

# 2. Re-create ResNet-18 model architecture
device = torch.device("cpu")
model = models.resnet18(weights=None)
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, len(CLASSES))

# 3. Load saved state dict from models/ folder
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "alzheimer_mri_resnet18.pth")

if os.path.exists(MODEL_PATH):
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.eval()
    print("✅ PyTorch MRI model loaded successfully!")
else:
    print(f"⚠️ Model file missing at {MODEL_PATH}. Place 'alzheimer_mri_resnet18.pth' in backend/models/")

# 4. Standard evaluation transform pipeline
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

async def predict_alzheimer_mri(file):
    """Reads image file bytes and runs ResNet-18 inference."""
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    
    # Preprocess image tensor
    tensor = transform(image).unsqueeze(0).to(device)
    
    # Perform inference
    with torch.no_grad():
        outputs = model(tensor)
        probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
        confidence, predicted_idx = torch.max(probabilities, 0)

    # Class scores breakdown
    breakdown = [
        {
            "label": CLASSES[i], 
            "score": round(probabilities[i].item() * 100, 2)
        }
        for i in range(len(CLASSES))
    ]

    return {
        "status": "success",
        "prediction": CLASSES[predicted_idx.item()],
        "confidence": round(confidence.item() * 100, 2),
        "breakdown": breakdown
    }