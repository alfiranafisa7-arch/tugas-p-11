from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

model  = joblib.load("model.pkl")
scaler = joblib.load("scaler.pkl")

LABELS = {0: "setosa", 1: "versicolor", 2: "virginica"}

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":  "ok",
        "service": "python-ml-flask",
        "model":   "RandomForestClassifier",
        "dataset": "Iris Dataset",
        "port":    3111
    })

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    if not data or "features" not in data:
        return jsonify({"error": "Field 'features' wajib ada"}), 400

    if len(data["features"]) != 4:
        return jsonify({
            "error": "Features harus 4 nilai",
            "format": ["sepal_length", "sepal_width", "petal_length", "petal_width"]
        }), 400

    X        = np.array(data["features"]).reshape(1, -1)
    X_scaled = scaler.transform(X)

    prediction = int(model.predict(X_scaled)[0])
    proba      = model.predict_proba(X_scaled)[0]

    return jsonify({
        "prediction": prediction,
        "label":      LABELS[prediction],
        "confidence": round(float(proba.max()), 4),
        "probabilities": {
            "setosa":     round(float(proba[0]), 4),
            "versicolor": round(float(proba[1]), 4),
            "virginica":  round(float(proba[2]), 4)
        },
        "service": "python-ml-flask"
    })

@app.route("/batch-predict", methods=["POST"])
def batch_predict():
    data = request.get_json()

    if not data or "data" not in data:
        return jsonify({"error": "Field 'data' wajib ada, berisi list of features"}), 400

    results = []
    for i, features in enumerate(data["data"]):
        if len(features) != 4:
            results.append({"index": i, "error": "Features harus 4 nilai"})
            continue

        X        = np.array(features).reshape(1, -1)
        X_scaled = scaler.transform(X)

        prediction = int(model.predict(X_scaled)[0])
        proba      = model.predict_proba(X_scaled)[0]

        results.append({
            "index":      i,
            "features":   features,
            "prediction": prediction,
            "label":      LABELS[prediction],
            "confidence": round(float(proba.max()), 4)
        })

    return jsonify({
        "total":   len(results),
        "results": results,
        "service": "python-ml-flask"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3111, debug=True)