import os
import json
import cv2
import numpy as np
import tensorflow as tf

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/patient_emotion_model.h5")
JSON_PATH = os.path.join(os.path.dirname(__file__), "../models/class_indices.json")

model = None
labels = None
face_cascade = None

def load_emotion_artifacts():
    global model, labels, face_cascade
    if model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model missing: {MODEL_PATH}")
        
        model = tf.keras.models.load_model(MODEL_PATH)
        
        if os.path.exists(JSON_PATH):
            with open(JSON_PATH, 'r') as f:
                class_indices = json.load(f)
            labels = {int(v): k for k, v in class_indices.items()}
        else:
            labels = {0: "angry", 1: "disgust", 2: "fear", 3: "happy", 4: "neutral", 5: "sad", 6: "surprise"}
            
        # Robust Haar Cascade Initialization
        cascade_path = None
        if hasattr(cv2, 'data') and hasattr(cv2.data, 'haarcascades'):
            cascade_path = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
        
        if cascade_path and os.path.exists(cascade_path):
            face_cascade = cv2.CascadeClassifier(cascade_path)
        else:
            # Fallback to OpenCV built-in classifier search
            face_cascade = cv2.CascadeClassifier(cv2.samples.findFile('haarcascades/haarcascade_frontalface_default.xml'))

def process_emotion_frame(image_bytes: bytes) -> dict:
    load_emotion_artifacts()
    
    np_arr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    
    if frame is None:
        return {"status": "error", "message": "Invalid image format"}

    if face_cascade is None or face_cascade.empty():
        return {"status": "error", "message": "Failed to load face cascade classifier"}

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

    if len(faces) == 0:
        return {
            "status": "no_face",
            "detected": False,
            "message": "No face detected"
        }

    # Extract largest detected face
    (x, y, w, h) = max(faces, key=lambda f: f[2] * f[3])
    face_roi = frame[y:y+h, x:x+w]

    # Preprocess ROI for MobileNetV2
    face_rgb = cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(face_rgb, (224, 224))
    normalized = resized / 255.0
    batched = np.expand_dims(normalized, axis=0)

    # Model inference
    predictions = model.predict(batched, verbose=0)[0]
    class_id = int(np.argmax(predictions))
    emotion = labels.get(class_id, "Unknown")
    confidence = float(predictions[class_id])

    # Assess distress
    distress_emotions = ['angry', 'disgust', 'fear', 'sad']
    is_distressed = emotion.lower() in distress_emotions and confidence >= 0.40

    return {
        "status": "success",
        "detected": True,
        "emotion": emotion.capitalize(),
        "confidence": round(confidence * 100, 1),
        "is_distressed": is_distressed,
        "bbox": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
    }