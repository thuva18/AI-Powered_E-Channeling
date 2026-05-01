"""
AI Doctor Specialization Prediction Service
============================================
Pipeline (matches Colab notebook exactly):

  Step 1 — Anomaly Pre-filter  : Isolation Forest
              → If anomaly detected → return "General Physician"

  Step 2 — Soft Voting Ensemble : LightGBM + SVM (CalibratedSVC) + Logistic Regression
              → Primary probability source

  Step 3 — Deep Neural Network  : optional confidence booster
              → If loaded: ensemble_probs * 0.6 + nn_probs * 0.4

  Step 4 — Confidence Threshold : 40%
              → Below threshold → return "General Physician"

Models loaded from: ai-service/models/
  - tfidf.pkl              TF-IDF vectorizer (max 2311 features, ngram 1-2)
  - ensemble_model.pkl     Soft Voting (LGB + SVM + LR)
  - lgb_model.pkl          LightGBM (standalone)
  - svm_model.pkl          CalibratedClassifierCV(LinearSVC)
  - lr_model.pkl           Logistic Regression
  - isolation_forest.pkl   Anomaly detector
  - label_encoder.pkl      Maps indices → specialist names
  - nn_model.keras         Deep Neural Network (optional)
"""

import os
import numpy as np
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE = os.path.join(os.path.dirname(__file__), "models")

def _load(filename):
    path = os.path.join(BASE, filename)
    print(f"  Loading {filename}...")
    return joblib.load(path)

# ── Load models at startup ─────────────────────────────────────────────────────
print("=" * 55)
print("AI Service — Loading models")
print("=" * 55)

tfidf      = _load("tfidf.pkl")
ensemble   = _load("ensemble_model.pkl")   # Soft Voting: LGB + SVM + LR
lgb_model  = _load("lgb_model.pkl")
svm_model  = _load("svm_model.pkl")
lr_model   = _load("lr_model.pkl")
iso_forest = _load("isolation_forest.pkl")
le         = _load("label_encoder.pkl")

# Neural Network is optional (TF may not be installed in all envs)
nn_model = None
try:
    import tensorflow as tf
    print("  Loading nn_model.keras...")
    nn_model = tf.keras.models.load_model(os.path.join(BASE, "nn_model.keras"))
    print("  Neural Network loaded ✓")
except Exception as e:
    print(f"  [WARNING] NN model skipped — ensemble-only mode: {e}")

print("=" * 55)
print("All models ready.\n")

# ── Constants ──────────────────────────────────────────────────────────────────
CONFIDENCE_THRESHOLD = 0.40   # 40% — matches notebook CONFIDENCE_THRESHOLD

# ── Flask app ──────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)


# ── Core prediction pipeline ───────────────────────────────────────────────────

def predict_specialist(symptom_text: str) -> dict:
    """
    Full prediction pipeline (mirrors the notebook predict_specialist function):

    1. TF-IDF transform input text
    2. Isolation Forest anomaly check  → if anomaly → General Physician
    3. Soft Voting Ensemble prediction (primary probabilities)
    4. Optional NN blend               → weighted average (60/40)
    5. Confidence threshold (40%)      → if low → General Physician
    6. Build top-3 alternatives

    Returns a dict with all prediction details.
    """

    # ── 1. Feature extraction ──────────────────────────────────────────────────
    user_vector = tfidf.transform([symptom_text])

    # ── 2. Anomaly pre-filter (Isolation Forest) ───────────────────────────────
    is_anomaly = iso_forest.predict(user_vector)[0] == -1

    if is_anomaly:
        return {
            "predictedSpecialist": "General Physician",
            "modelPrediction":     "N/A",
            "confidence":          None,
            "reason":              "Unusual / out-of-distribution input detected",
            "anomaly":             True,
            "belowThreshold":      False,
            "ensembleUsed":        False,
            "alternatives":        [],
        }

    # ── 3. Get probabilities from all models ───────────────────────────────────
    all_probs = {
        "Ensemble": ensemble.predict_proba(user_vector)[0],
        "LightGBM": lgb_model.predict_proba(user_vector)[0],
        "SVM": svm_model.predict_proba(user_vector)[0],
        "LogReg": lr_model.predict_proba(user_vector)[0],
    }
    
    if nn_model is not None:
        user_dense = user_vector.toarray()
        all_probs["NeuralNet"] = nn_model.predict(user_dense, verbose=0)[0]
        
    # ── 4. Find the model with the highest confidence ──────────────────────────
    best_model_name = None
    best_max_conf = -1.0
    best_pred_idx = -1
    best_probs = None
    
    for model_name, probs in all_probs.items():
        max_conf = float(np.max(probs))
        if max_conf > best_max_conf:
            best_max_conf = max_conf
            best_pred_idx = int(np.argmax(probs))
            best_model_name = model_name
            best_probs = probs

    # ── 5. Confidence threshold & Selection ────────────────────────────────────
    model_prediction = le.inverse_transform([best_pred_idx])[0]
    
    if best_max_conf < CONFIDENCE_THRESHOLD:
        predicted_specialist = "General Physician"
        reason = f"Low confidence across all models (Best was {best_model_name} at {round(best_max_conf * 100, 2)}% < {int(CONFIDENCE_THRESHOLD * 100)}%)"
        below_threshold = True
    else:
        predicted_specialist = model_prediction
        reason = f"High confidence prediction (Selected from {best_model_name})"
        below_threshold = False
        
    # Extract individual model confidences for the chosen class
    model_confidences = {
        name: round(float(probs[best_pred_idx]) * 100, 2)
        for name, probs in all_probs.items()
    }
    
    # ── 6. Top-3 alternatives from the winning model ───────────────────────────
    top3_idx = np.argsort(best_probs)[-3:][::-1]
    alternatives = [
        {
            "specialist": le.inverse_transform([int(i)])[0],
            "confidence": round(float(best_probs[i]) * 100, 1),
        }
        for i in top3_idx
    ]

    return {
        "predictedSpecialist": predicted_specialist,
        "modelPrediction":     model_prediction,
        "confidence":          round(best_max_conf * 100, 2),
        "reason":              reason,
        "winningModel":        best_model_name,
        "anomaly":             False,
        "belowThreshold":      below_threshold,
        "modelConfidences":    model_confidences,
        "alternatives":        alternatives,
    }


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Service health check — returns loaded model status."""
    return jsonify({
        "status":         "ok",
        "models": {
            "tfidf":         "loaded",
            "ensemble":      "loaded",
            "lgb":           "loaded",
            "isolationForest": "loaded",
            "labelEncoder":  "loaded",
            "nn":            "loaded" if nn_model is not None else "not loaded (TF not available)",
        },
        "confidenceThreshold": f"{int(CONFIDENCE_THRESHOLD * 100)}%",
        "pipeline": "IsolationForest → SoftVotingEnsemble(LGB+SVM+LR) → NN_blend(optional) → threshold",
    })


@app.route("/predict", methods=["POST"])
def predict():
    """
    POST /predict
    Body: { "symptoms": "I have chest pain and shortness of breath" }

    Returns full prediction result including confidence, reason, alternatives.
    """
    body     = request.get_json(silent=True) or {}
    symptoms = (body.get("symptoms") or "").strip()

    if not symptoms:
        return jsonify({"error": "symptoms field is required"}), 400

    if len(symptoms) < 3:
        return jsonify({"error": "Please describe your symptoms in more detail"}), 400

    try:
        result = predict_specialist(symptoms)
        return jsonify(result)
    except Exception as e:
        print(f"[ERROR] Prediction failed: {e}")
        return jsonify({"error": "Prediction failed", "detail": str(e)}), 500


# ── Run ────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("AI_PORT", 5001))
    print(f"Starting AI service on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
