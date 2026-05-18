# Tugas Pertemuan 11 — Python ML Microservice

## Dataset & Model
- **Dataset**: Iris Dataset (built-in scikit-learn, 150 data, 4 fitur)
- **Fitur**: sepal_length, sepal_width, petal_length, petal_width
- **Target**: setosa (0), versicolor (1), virginica (2)
- **Model**: Random Forest Classifier (100 trees)
- **Accuracy**: 100% pada test set

## Arsitektur
Client → Express Gateway (3112) → Python ML Service (3111)

## Cara Menjalankan

### Terminal 1 — Python ML Service
```bash
cd python-ml
venv\Scripts\activate
python train_model.py
python app.py
```

### Terminal 2 — Express Gateway
```bash
cd express-gateway
node index.js
```

## Endpoints

| Method | URL | Keterangan |
|--------|-----|------------|
| GET | http://localhost:3111/health | Health check ML service |
| POST | http://localhost:3111/predict | Prediksi 1 data |
| POST | http://localhost:3111/batch-predict | Prediksi banyak data |
| GET | http://localhost:3112/health | Health check gateway |
| GET | http://localhost:3112/api/info | Info model dan dataset |
| POST | http://localhost:3112/api/classify | Klasifikasi via gateway |
| POST | http://localhost:3112/api/batch-classify | Batch klasifikasi via gateway |

## Contoh Request & Response

### POST /api/classify
**Request:**
```json
{
  "features": [5.1, 3.5, 1.4, 0.2],
  "user": "mahasiswa"
}
```
**Response:**
```json
{
  "gateway": "express-gateway",
  "user": "mahasiswa",
  "result": {
    "prediction": 0,
    "label": "setosa",
    "confidence": 1.0,
    "probabilities": {
      "setosa": 1.0,
      "versicolor": 0.0,
      "virginica": 0.0
    }
  },
  "timestamp": "2026-05-18T..."
}
```

## Fitur Bonus
- `/batch-predict` dan `/batch-classify` untuk prediksi multiple data sekaligus
- Circuit Breaker di Express: otomatis open setelah 3 kegagalan, reset setelah 30 detik