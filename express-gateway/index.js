const express = require("express");
const axios   = require("axios");

const app            = express();
const ML_SERVICE_URL = "http://localhost:3111";

app.use(express.json());

// Circuit Breaker sederhana
let mlServiceDown    = false;
let failCount        = 0;
const FAIL_THRESHOLD = 3;

async function callMLService(endpoint, payload) {
    if (mlServiceDown) {
        throw new Error("CIRCUIT_OPEN");
    }
    try {
        const response = await axios.post(`${ML_SERVICE_URL}${endpoint}`, payload, { timeout: 5000 });
        failCount     = 0;
        mlServiceDown = false;
        return response.data;
    } catch (err) {
        failCount++;
        if (failCount >= FAIL_THRESHOLD) {
            mlServiceDown = true;
            console.warn(`[Circuit Breaker] ML Service DOWN setelah ${FAIL_THRESHOLD} kegagalan`);
            setTimeout(() => {
                mlServiceDown = false;
                failCount     = 0;
                console.log("[Circuit Breaker] Mencoba reconnect ke ML Service...");
            }, 30000);
        }
        throw err;
    }
}

// GET /health
app.get("/health", (req, res) => {
    res.json({
        status:          "ok",
        service:         "express-gateway",
        port:            3112,
        ml_circuit_open: mlServiceDown
    });
});

// GET /api/info
app.get("/api/info", (req, res) => {
    res.json({
        dataset:      "Iris Dataset",
        model:        "Random Forest Classifier",
        classes:      ["setosa", "versicolor", "virginica"],
        input_format: {
            features: "[sepal_length, sepal_width, petal_length, petal_width]",
            example:  [5.1, 3.5, 1.4, 0.2]
        }
    });
});

// POST /api/classify
app.post("/api/classify", async (req, res) => {
    const { features, user } = req.body;

    if (!features) {
        return res.status(400).json({ error: "Field 'features' wajib ada" });
    }

    try {
        const mlResult = await callMLService("/predict", { features });
        res.json({
            gateway:   "express-gateway",
            user:      user || "anonymous",
            result:    mlResult,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        if (error.message === "CIRCUIT_OPEN") {
            return res.status(503).json({
                error:       "ML Service tidak tersedia (circuit breaker aktif)",
                retry_after: "30 detik"
            });
        }
        if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
            return res.status(503).json({
                error: "ML Service tidak tersedia. Pastikan Python service berjalan di port 3111."
            });
        }
        res.status(500).json({ error: error.message });
    }
});

// POST /api/batch-classify
app.post("/api/batch-classify", async (req, res) => {
    const { data, user } = req.body;

    if (!data || !Array.isArray(data)) {
        return res.status(400).json({ error: "Field 'data' wajib ada berupa array" });
    }

    try {
        const mlResult = await callMLService("/batch-predict", { data });
        res.json({
            gateway:   "express-gateway",
            user:      user || "anonymous",
            result:    mlResult,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        if (error.message === "CIRCUIT_OPEN") {
            return res.status(503).json({ error: "ML Service tidak tersedia (circuit breaker aktif)" });
        }
        res.status(503).json({ error: "ML Service tidak tersedia." });
    }
});

app.listen(3112, () => {
    console.log("Express Gateway running  → http://localhost:3112");
    console.log("ML Service target        → http://localhost:3111");
});