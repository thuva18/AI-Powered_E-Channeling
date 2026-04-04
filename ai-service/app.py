"""
AI Doctor Specialization Prediction Service
============================================
Models used:
  - TF-IDF vectorizer (tfidf.pkl)            — shared feature extractor
  - LightGBM  (lightgbm_model.pkl)           — primary fast ML classifier
  - Deep Neural Network (nn_model.keras)     — secondary confidence booster
  - Label Encoder (label_encoder.pkl)        — maps indices to specialist names

Ensemble strategy:
  - Both models predict probabilities using TF-IDF features
  - Final confidence = average of LGB + NN probabilities
  - If final confidence < 60% → fallback to "General Physician"
"""

import os
import numpy as np
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Load models at startup ─────────────────────────────────────────────────────
BASE = os.path.join(os.path.dirname(__file__), "models")

print("Loading TF-IDF vectorizer...")
tfidf = joblib.load(os.path.join(BASE, "tfidf.pkl"))

print("Loading LightGBM model...")
lgb_model = joblib.load(os.path.join(BASE, "lightgbm_model.pkl"))

print("Loading Label Encoder...")
le = joblib.load(os.path.join(BASE, "label_encoder.pkl"))

# Try loading NN model (optional — TF may not be installed)
nn_model = None
try:
    import tensorflow as tf
    print("Loading Neural Network model...")
    nn_model = tf.keras.models.load_model(os.path.join(BASE, "nn_model.keras"))
    print("Neural Network loaded successfully.")
except Exception as e:
    print(f"[WARNING] NN model not loaded (will use LightGBM only): {e}")

print("All models ready.\n")

# ── Constants ──────────────────────────────────────────────────────────────────
CONFIDENCE_THRESHOLD = 0.60   # 60% — below this → General Physician

# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)


def predict_with_ensemble(symptom_text: str) -> dict:
    """
    Run symptom_text through TF-IDF → LightGBM + (optional) NN ensemble.
    Returns: { predictedSpecialist, modelPrediction, confidence, lgbConfidence, nnConfidence }
    """
    # 1. Feature extraction — same TF-IDF pipeline used during training
    user_vector = tfidf.transform([symptom_text])

    # 2. LightGBM probabilities
    lgb_probs = lgb_model.predict_proba(user_vector)[0]

    # 3. NN probabilities (if available)
    if nn_model is not None:
        user_dense = user_vector.toarray()
        nn_probs = nn_model.predict(user_dense, verbose=0)[0]
        # Ensemble: weighted average (LGB 60%, NN 40%)
        final_probs = 0.6 * lgb_probs + 0.4 * nn_probs
        nn_confidence = float(np.max(nn_probs))
    else:
        final_probs = lgb_probs
        nn_confidence = None

    # 4. Pick winner
    lgb_confidence  = float(np.max(lgb_probs))
    best_idx        = int(np.argmax(final_probs))
    final_conf      = float(final_probs[best_idx])

    model_prediction    = le.inverse_transform([best_idx])[0]
    predicted_specialist = model_prediction if final_conf >= CONFIDENCE_THRESHOLD else "General Physician"

    # 5. Top-3 alternatives
    top3_idx   = np.argsort(final_probs)[-3:][::-1]
    alternatives = [
        {
            "specialist": le.inverse_transform([int(i)])[0],
            "confidence": round(float(final_probs[i]) * 100, 1)
        }
        for i in top3_idx
    ]

    return {
        "predictedSpecialist": predicted_specialist,
        "modelPrediction":     model_prediction,
        "confidence":          round(final_conf * 100, 2),
        "lgbConfidence":       round(lgb_confidence * 100, 2),
        "nnConfidence":        round(nn_confidence * 100, 2) if nn_confidence is not None else None,
        "ensembleUsed":        nn_model is not None,
        "alternatives":        alternatives,
        "belowThreshold":      final_conf < CONFIDENCE_THRESHOLD,
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "lgb":    "loaded",
        "nn":     "loaded" if nn_model is not None else "not loaded",
        "tfidf":  "loaded",
    })


@app.route("/predict", methods=["POST"])
def predict():
    body = request.get_json(silent=True) or {}
    symptoms = (body.get("symptoms") or "").strip()

    if not symptoms:
        return jsonify({"error": "symptoms field is required"}), 400

    try:
        result = predict_with_ensemble(symptoms)
        return jsonify(result)
    except Exception as e:
        print(f"[ERROR] Prediction failed: {e}")
        return jsonify({"error": "Prediction failed", "detail": str(e)}), 500


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("AI_PORT", 5001))
    print(f"Starting AI service on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
