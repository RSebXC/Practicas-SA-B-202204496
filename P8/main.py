import os
import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# ─── Configuracion ───────────────────────────────────────────────────────────
MODEL_PATH    = os.environ.get("MODEL_PATH", "model/gold_model.pkl")
FEATURES_PATH = os.environ.get("FEATURES_PATH", "model/feature_names.pkl")

app = FastAPI(
    title="Gold Price Prediction API",
    description="Microservicio de prediccion del precio del oro usando Machine Learning",
    version="1.0.0"
)

# ─── Cargar modelo al iniciar ─────────────────────────────────────────────────
model = None
feature_names = None

@app.on_event("startup")
def load_model():
    global model, feature_names
    try:
        model = joblib.load(MODEL_PATH)
        feature_names = joblib.load(FEATURES_PATH)
        print(f"[API] Modelo cargado desde: {MODEL_PATH}")
        print(f"[API] Features esperados: {len(feature_names)}")
    except Exception as e:
        print(f"[API] ERROR cargando modelo: {e}")

# ─── Modelos Pydantic ─────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    """
    Recibe los ultimos precios historicos del oro para generar la prediccion.
    Se necesitan al menos 30 valores para calcular todos los lags y rolling features.
    """
    prices: List[float] = Field(
        ...,
        min_items=30,
        description="Lista de precios historicos del oro (minimo 30 valores, del mas antiguo al mas reciente)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "prices": [
                    1800.0, 1805.5, 1810.2, 1808.7, 1815.3,
                    1820.1, 1818.9, 1825.4, 1830.0, 1828.5,
                    1835.2, 1840.1, 1838.7, 1845.3, 1850.0,
                    1848.5, 1855.2, 1860.1, 1858.7, 1865.3,
                    1870.0, 1868.5, 1875.2, 1880.1, 1878.7,
                    1885.3, 1890.0, 1888.5, 1895.2, 1900.1
                ]
            }
        }

class PredictResponse(BaseModel):
    predicted_price: float
    currency: str = "USD"
    unit: str = "per troy ounce"
    timestamp: str
    model: str = "RandomForest"
    features_used: int

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    features_count: int
    timestamp: str

# ─── Funcion de feature engineering para inferencia ──────────────────────────

def build_features_for_prediction(prices: List[float]) -> pd.DataFrame:
    """
    Reconstruye los mismos features que se usaron en entrenamiento
    a partir de una lista de precios historicos.
    """
    series = pd.Series(prices, name="price")
    df = pd.DataFrame({"price": series})

    # LAG features
    for lag in [1, 2, 3, 5, 7, 14, 21, 30]:
        df[f"lag_{lag}"] = df["price"].shift(lag)

    # ROLLING features
    for window in [7, 14, 30]:
        df[f"rolling_mean_{window}"] = df["price"].shift(1).rolling(window=window).mean()
        df[f"rolling_std_{window}"]  = df["price"].shift(1).rolling(window=window).std()
        df[f"rolling_min_{window}"]  = df["price"].shift(1).rolling(window=window).min()
        df[f"rolling_max_{window}"]  = df["price"].shift(1).rolling(window=window).max()

    # Diferencias
    df["price_diff_1"] = df["price"].diff(1)
    df["price_diff_7"] = df["price"].diff(7)
    df["price_pct_1"]  = df["price"].pct_change(1)

    # Tomar la ultima fila (la que queremos predecir)
    last_row = df.dropna().iloc[[-1]]

    return last_row

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
def health():
    """Verifica el estado del servicio y si el modelo esta cargado."""
    return HealthResponse(
        status="UP",
        model_loaded=model is not None,
        features_count=len(feature_names) if feature_names else 0,
        timestamp=datetime.utcnow().isoformat()
    )

@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    """
    Predice el siguiente precio del oro dado un historial de precios.

    - **prices**: Lista de al menos 30 precios historicos (del mas antiguo al mas reciente)
    - Retorna el precio predicho para el siguiente periodo
    """
    if model is None or feature_names is None:
        raise HTTPException(
            status_code=503,
            detail="Modelo no disponible. Asegurese de que el modelo fue entrenado y el archivo .pkl existe."
        )

    try:
        # Construir features
        features_df = build_features_for_prediction(request.prices)

        # Alinear columnas con las del entrenamiento
        # Solo usar features que el modelo conoce
        available = [f for f in feature_names if f in features_df.columns]
        missing   = [f for f in feature_names if f not in features_df.columns]

        if missing:
            # Rellenar features faltantes con 0
            for f in missing:
                features_df[f] = 0.0

        X = features_df[feature_names]

        # Prediccion
        prediction = model.predict(X)[0]

        return PredictResponse(
            predicted_price=round(float(prediction), 4),
            currency="USD",
            unit="per troy ounce",
            timestamp=datetime.utcnow().isoformat(),
            model="RandomForest",
            features_used=len(feature_names)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en prediccion: {str(e)}")


@app.get("/model/info")
def model_info():
    """Retorna informacion sobre el modelo cargado."""
    if model is None:
        raise HTTPException(status_code=503, detail="Modelo no cargado")

    return {
        "model_type": type(model).__name__,
        "features": feature_names,
        "features_count": len(feature_names),
        "model_path": MODEL_PATH,
        "status": "loaded"
    }


@app.get("/")
def root():
    return {
        "service": "Gold Price Prediction API",
        "version": "1.0.0",
        "student": "202204496",
        "endpoints": {
            "health":  "GET  /health",
            "predict": "POST /predict",
            "info":    "GET  /model/info",
            "docs":    "GET  /docs"
        }
    }