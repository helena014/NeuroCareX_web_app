import os
import tempfile
import warnings
import joblib
import numpy as np
import pandas as pd
import librosa
import audioread
import traceback

# Suppress librosa user warnings for clean logs
warnings.filterwarnings('ignore', category=UserWarning)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/acoustic_speech_model.pkl")

artifact = None

def get_speech_artifact():
    """
    Loads the acoustic model artifact containing:
    ['model', 'scaler', 'label_encoder', 'feature_names']
    """
    global artifact
    if artifact is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model file missing at '{MODEL_PATH}'. "
                f"Ensure 'acoustic_speech_model.pkl' is placed inside 'backend/models/'."
            )
        try:
            artifact = joblib.load(MODEL_PATH)
        except Exception as e:
            raise RuntimeError(f"Error unpickling acoustic speech model artifact: {str(e)}")
            
    return artifact


def extract_acoustic_features(audio_bytes: bytes, filename: str) -> tuple[pd.DataFrame, dict]:
    """
    Extracts 35 acoustic, prosodic, temporal, and spectral features from audio bytes using Librosa.
    """
    # Detect extension or default to .webm for raw browser blobs
    ext = os.path.splitext(filename)[1].lower()
    if not ext or ext not in ['.wav', '.mp3', '.ogg', '.flac', '.m4a']:
        ext = '.webm'
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_file:
        tmp_file.write(audio_bytes)
        tmp_file_path = tmp_file.name

    try:
        # 1. Load Audio Stream with explicit audioread/ffmpeg fallback for WebM/Ogg container streams
        try:
            y, sr = librosa.load(tmp_file_path, sr=22050)
        except Exception:
            # Force audioread decoding via FFmpeg
            with audioread.audio_open(tmp_file_path) as afile:
                # Read raw PCM buffers from audioread stream
                audio_data = []
                for buf in afile:
                    audio_data.append(np.frombuffer(buf, dtype=np.int16))
                
                if len(audio_data) > 0:
                    raw_audio = np.concatenate(audio_data).astype(np.float32) / 32768.0
                    # Resample if sample rate differs from 22050
                    if afile.samplerate != 22050:
                        y = librosa.resample(raw_audio, orig_sr=afile.samplerate, target_sr=22050)
                        sr = 22050
                    else:
                        y = raw_audio
                        sr = afile.samplerate
                else:
                    raise ValueError("Audio buffer is empty or unreadable.")

        # 2. Temporal & Pause Metrics
        total_duration = float(librosa.get_duration(y=y, sr=sr))
        
        # Non-silent speech intervals (top_db=25)
        non_silent_intervals = librosa.effects.split(y, top_db=25)
        
        if len(non_silent_intervals) > 0:
            speech_samples = sum([end - start for start, end in non_silent_intervals])
            speech_time = float(speech_samples / sr)
        else:
            speech_time = 0.0

        pause_time = max(0.0, total_duration - speech_time)
        pause_ratio = (pause_time / total_duration) if total_duration > 0 else 0.0
        
        # Pause count (gaps between speech segments)
        pause_count = max(0, len(non_silent_intervals) - 1) if speech_time > 0 else 0

        # 3. Pitch Metrics (F0 via piptrack)
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        pitch_values = []
        for t in range(pitches.shape[1]):
            index = magnitudes[:, t].argmax()
            pitch = pitches[index, t]
            if pitch > 0:
                pitch_values.append(pitch)
        
        if len(pitch_values) > 0:
            mean_pitch = float(np.mean(pitch_values))
            pitch_variance = float(np.var(pitch_values))
        else:
            mean_pitch = 0.0
            pitch_variance = 0.0

        # 4. RMS Energy
        rms = librosa.feature.rms(y=y)
        mean_rms_energy = float(np.mean(rms))

        # 5. 13 MFCC Means and Standard Deviations
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_features = {}
        for i in range(13):
            mfcc_features[f"mfcc_{i+1}_mean"] = float(np.mean(mfccs[i]))
            mfcc_features[f"mfcc_{i+1}_std"] = float(np.std(mfccs[i]))

        # Construct raw feature map matching training schema
        raw_feature_map = {
            "duration": total_duration,
            "speech_time": speech_time,
            "pause_time": pause_time,
            "pause_ratio": pause_ratio,
            "pause_count": pause_count,
            "mean_pitch": mean_pitch,
            "pitch_variance": pitch_variance,
            "mean_rms_energy": mean_rms_energy,
            **mfcc_features
        }

        # UI display metrics
        metrics_summary = {
            "total_duration": round(total_duration, 2),
            "speech_time": round(speech_time, 2),
            "pause_time": round(pause_time, 2),
            "pause_ratio_pct": round(pause_ratio * 100, 1),
            "pause_count": pause_count,
            "mean_pitch_hz": round(mean_pitch, 1)
        }

        return pd.DataFrame([raw_feature_map]), metrics_summary

    finally:
        if os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)


def predict_speech_biomarker(audio_bytes: bytes, filename: str) -> dict:
    """
    Extracts features, scales inputs, predicts probability via RandomForest, and maps output.
    Prints full exception trace to terminal if an error occurs.
    """
    try:
        art = get_speech_artifact()
        rf_model = art['model']
        scaler = art['scaler']
        label_encoder = art['label_encoder']
        feature_names = art['feature_names']

        # Extract acoustic features
        features_df, metrics_summary = extract_acoustic_features(audio_bytes, filename)

        # Align columns to match model's expected feature order
        for col in feature_names:
            if col not in features_df.columns:
                features_df[col] = 0.0
                
        aligned_df = features_df[feature_names]

        # Apply StandardScaler transform
        scaled_features = scaler.transform(aligned_df)

        # Execute Random Forest prediction
        probabilities = rf_model.predict_proba(scaled_features)[0]
        classes = label_encoder.classes_

        # Identify index for 'Impaired' label
        impaired_idx = np.where(classes == 'Impaired')[0][0] if 'Impaired' in classes else 1
        impaired_prob = round(float(probabilities[impaired_idx]) * 100, 2)
        
        predicted_label = "Impaired" if impaired_prob >= 50.0 else "Healthy Control"

        return {
            "status": "success",
            "predicted_label": predicted_label,
            "impaired_probability": impaired_prob,
            "metrics_summary": metrics_summary
        }
    except Exception as e:
        print("\n" + "="*50)
        print("🚨 DETAILED SPEECH PREDICTION ERROR TRACEBACK:")
        traceback.print_exc()
        print("="*50 + "\n")
        raise e