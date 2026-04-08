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

    # ── 3. Soft Voting Ensemble probabilities ──────────────────────────────────
    ensemble_probs = ensemble.predict_proba(user_vector)[0]

    # ── 4. Optional NN blend ───────────────────────────────────────────────────
    nn_confidence = None
    if nn_model is not None:
        user_dense  = user_vector.toarray()
        nn_probs    = nn_model.predict(user_dense, verbose=0)[0]
        final_probs = 0.6 * ensemble_probs + 0.4 * nn_probs
        nn_confidence = float(np.max(nn_probs))
    else:
        final_probs = ensemble_probs

    # ── 5. Confidence threshold ────────────────────────────────────────────────
    max_confidence   = float(np.max(final_probs))
    predicted_index  = int(np.argmax(final_probs))
    model_prediction = le.inverse_transform([predicted_index])[0]

    if max_confidence < CONFIDENCE_THRESHOLD:
        predicted_specialist = "General Physician"
        reason = f"Low confidence ({round(max_confidence * 100, 2)}% < {int(CONFIDENCE_THRESHOLD * 100)}%)"
        below_threshold = True
    else:
        predicted_specialist = model_prediction
        reason = "High confidence prediction"
        below_threshold = False

    # ── 6. Top-3 alternatives ──────────────────────────────────────────────────
    top3_idx = np.argsort(final_probs)[-3:][::-1]
    alternatives = [
        {
            "specialist": le.inverse_transform([int(i)])[0],
            "confidence": round(float(final_probs[i]) * 100, 1),
        }
        for i in top3_idx
    ]

    return {
        "predictedSpecialist": predicted_specialist,
        "modelPrediction":     model_prediction,
        "confidence":          round(max_confidence * 100, 2),
        "reason":              reason,
        "anomaly":             False,
        "belowThreshold":      below_threshold,
        "ensembleUsed":        nn_model is not None,
        "nnConfidence":        round(nn_confidence * 100, 2) if nn_confidence is not None else None,
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
