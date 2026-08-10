import os
import joblib
import pandas as pd
import numpy as np

# Path to the pkl file downloaded from your Colab notebook
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/alzheimer_clinical_risk_model.pkl")

# Cached artifact container
artifact = None

def get_artifact():
    """
    Lazy-loads the model artifact dictionary containing:
    ['model', 'feature_names', 'ordinal_maps', 'binary_cols', 'nominal_cols', 'target_classes']
    """
    global artifact
    if artifact is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model file missing at '{MODEL_PATH}'. "
                f"Ensure 'alzheimer_clinical_risk_model.pkl' is placed inside 'backend/models/'."
            )
        try:
            artifact = joblib.load(MODEL_PATH)
            if not isinstance(artifact, dict) or 'model' not in artifact:
                raise ValueError("Loaded file is not the expected model_artifact dictionary.")
        except Exception as e:
            print(f"\n❌ FAILED TO LOAD MODEL ARTIFACT: {str(e)}")
            raise RuntimeError(f"Error unpickling model file: {str(e)}")
            
    return artifact


def transform_payload_to_df(raw_payload: dict, artifact: dict) -> pd.DataFrame:
    """
    Replicates the exact feature pre-processing steps from your Colab training script:
    1. Direct numeric assignment
    2. Ordinal mapping (ordinal_maps)
    3. Binary column mapping (binary_cols)
    4. One-hot encoding (nominal_cols)
    5. Re-indexing to match exact trained feature_names order
    """
    feature_names = artifact['feature_names']
    ordinal_maps = artifact['ordinal_maps']
    binary_cols = artifact['binary_cols']
    nominal_cols = artifact['nominal_cols']

    # Step 1: Create single-row DataFrame from raw incoming frontend dictionary
    df = pd.DataFrame([raw_payload])

    # Step 2: Map Ordinal features
    for col, mapping in ordinal_maps.items():
        if col in df.columns:
            # Map string value or fallback to numeric if already mapped
            val = df[col].values[0]
            if isinstance(val, str) and val in mapping:
                df[col] = mapping[val]
            else:
                try:
                    df[col] = float(val)
                except (ValueError, TypeError):
                    df[col] = 0

    # Step 3: Map Binary columns ('No' -> 0, 'Yes' -> 1)
    for col in binary_cols:
        if col in df.columns:
            val = df[col].values[0]
            if isinstance(val, str):
                df[col] = 1 if val.strip().lower() == 'yes' else 0
            else:
                df[col] = int(val)

    # Step 4: Apply One-Hot Encoding matching training (pd.get_dummies)
    existing_nominal = [c for c in nominal_cols if c in df.columns]
    if existing_nominal:
        df = pd.get_dummies(df, columns=existing_nominal, drop_first=True)

    # Step 5: Align columns with exact trained model features (fill missing One-Hot cols with 0)
    for col in feature_names:
        if col not in df.columns:
            df[col] = 0.0

    # Re-order columns strictly according to training feature_names
    df_final = df[feature_names].astype(float)
    return df_final


def predict_clinical_risk(input_data: dict) -> dict:
    """
    Predicts Alzheimer's disease probability using the trained XGBoost model.
    """
    art = get_artifact()
    model = art['model']
    feature_names = art['feature_names']

    # Preprocess incoming JSON payload
    df_processed = transform_payload_to_df(input_data, art)

    try:
        # Run prediction
        probabilities = model.predict_proba(df_processed)[0]
    except Exception as e:
        print(f"\n❌ XGBOOST PREDICTION FAILED AT RUNTIME: {str(e)}")
        raise RuntimeError(f"Model prediction failed: {str(e)}")

    risk_probability = round(float(probabilities[1]) * 100, 2)
    classification = "High Risk" if risk_probability >= 50.0 else "Low Risk"

    # Extract dynamic feature contributions based on model importances
    importances = model.feature_importances_
    sample_values = df_processed.iloc[0].to_dict()

    # Combine feature names, current patient input values, and XGBoost importance scores
    feature_drivers = []
    for feat, imp in zip(feature_names, importances):
        val = sample_values.get(feat, 0)
        feature_drivers.append({
            "feature": feat,
            "value": val,
            "importance": float(imp)
        })

    # Sort by highest model importance score
    feature_drivers.sort(key=lambda x: x['importance'], reverse=True)

    # Format top 4 drivers for UI presentation
    top_drivers = []
    for item in feature_drivers[:4]:
        feat_name = item['feature']
        feat_val = item['value']
        
        # Friendly display formatting
        if "Age" in feat_name:
            impact_desc = "Elevated Age Factor" if feat_val >= 65 else "Low Age Factor"
            display_val = f"{int(feat_val)} yrs"
        elif "Cognitive" in feat_name:
            impact_desc = "Decline Indicator" if feat_val < 60 else "Normal Range"
            display_val = f"{int(feat_val)} pts"
        elif "APOE" in feat_name or "Genetic" in feat_name:
            impact_desc = "High Genetic Link" if feat_val == 1 else "No Genetic Marker"
            display_val = "Positive" if feat_val == 1 else "Negative"
        else:
            impact_desc = f"Impact Weight: {round(item['importance'] * 100, 1)}%"
            display_val = f"{feat_val:.1f}" if isinstance(feat_val, float) else str(feat_val)

        top_drivers.append({
            "feature": feat_name,
            "value": display_val,
            "impact": impact_desc
        })

    return {
        "status": "success",
        "risk_probability": risk_probability,
        "classification": classification,
        "top_feature_contributors": top_drivers
    }