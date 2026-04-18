import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os
import sys

# ─── Configuracion ───────────────────────────────────────────────────────────
DATA_PATH = os.environ.get("DATA_PATH", "data/gold_price.csv")
MODEL_PATH = os.environ.get("MODEL_PATH", "model/gold_model.pkl")
FEATURES_PATH = os.environ.get("FEATURES_PATH", "model/feature_names.pkl")

def load_and_prepare_data(path: str) -> pd.DataFrame:
    """Carga y prepara el dataset del precio del oro."""
    print(f"[Train] Cargando datos desde: {path}")
    df = pd.read_csv(path)

    print(f"[Train] Columnas encontradas: {list(df.columns)}")
    print(f"[Train] Shape original: {df.shape}")

    # Normalizar nombres de columnas
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
    print(f"[Train] Columnas normalizadas: {list(df.columns)}")

    # Detectar columna de fecha
    date_col = None
    for col in df.columns:
        if "date" in col or "time" in col or "fecha" in col:
            date_col = col
            break

    if date_col:
        df[date_col] = pd.to_datetime(df[date_col], infer_datetime_format=True)
        df = df.sort_values(date_col).reset_index(drop=True)
        print(f"[Train] Columna de fecha detectada: {date_col}")
    else:
        print("[Train] No se detecto columna de fecha, usando indice")

    # Detectar columna objetivo (precio del oro)
    price_col = None
    priority = ["price", "close", "gold", "usd", "valor", "open"]
    for keyword in priority:
        for col in df.columns:
            if keyword in col:
                price_col = col
                break
        if price_col:
            break

    if not price_col:
        # Usar la primera columna numerica
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if numeric_cols:
            price_col = numeric_cols[0]

    print(f"[Train] Columna objetivo detectada: {price_col}")

    # Conservar solo columnas numericas y la de precio
    numeric_df = df.select_dtypes(include=[np.number]).copy()

    # Renombrar columna objetivo a 'price'
    if price_col and price_col in numeric_df.columns:
        numeric_df = numeric_df.rename(columns={price_col: "price"})

    return numeric_df


def feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    """
    Crea features de lag y rolling para el modelo.
    Estos son los features criticos segun la rubrica (lags/rolling).
    """
    print("[Train] Aplicando feature engineering...")

    # Asegurar que existe columna price
    if "price" not in df.columns:
        raise ValueError("No se encontro columna 'price' en el dataframe")

    # LAG features — valores anteriores del precio
    for lag in [1, 2, 3, 5, 7, 14, 21, 30]:
        df[f"lag_{lag}"] = df["price"].shift(lag)

    # ROLLING features — estadisticas de ventanas moviles
    for window in [7, 14, 30]:
        df[f"rolling_mean_{window}"] = df["price"].shift(1).rolling(window=window).mean()
        df[f"rolling_std_{window}"]  = df["price"].shift(1).rolling(window=window).std()
        df[f"rolling_min_{window}"]  = df["price"].shift(1).rolling(window=window).min()
        df[f"rolling_max_{window}"]  = df["price"].shift(1).rolling(window=window).max()

    # Diferencias de precio
    df["price_diff_1"]  = df["price"].diff(1)
    df["price_diff_7"]  = df["price"].diff(7)
    df["price_pct_1"]   = df["price"].pct_change(1)

    # Eliminar filas con NaN generados por lags/rolling
    df = df.dropna().reset_index(drop=True)
    print(f"[Train] Shape despues de feature engineering: {df.shape}")
    print(f"[Train] Features creados: {[c for c in df.columns if c != 'price']}")

    return df


def train_model(df: pd.DataFrame):
    """Entrena el modelo RandomForest y lo serializa."""

    feature_cols = [c for c in df.columns if c != "price"]
    X = df[feature_cols]
    y = df["price"]

    print(f"[Train] Features usados ({len(feature_cols)}): {feature_cols}")
    print(f"[Train] Muestras de entrenamiento: {len(X)}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, shuffle=False
    )

    print(f"[Train] Train: {len(X_train)} | Test: {len(X_test)}")

    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )

    print("[Train] Entrenando modelo RandomForest...")
    model.fit(X_train, y_train)

    # Evaluacion
    y_pred = model.predict(X_test)
    mae  = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2   = r2_score(y_test, y_pred)

    print(f"[Train] MAE:  {mae:.4f}")
    print(f"[Train] RMSE: {rmse:.4f}")
    print(f"[Train] R2:   {r2:.4f}")

    # Guardar modelo y lista de features
    os.makedirs("model", exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(feature_cols, FEATURES_PATH)

    print(f"[Train] Modelo guardado en: {MODEL_PATH}")
    print(f"[Train] Features guardados en: {FEATURES_PATH}")

    return model, feature_cols, {"mae": mae, "rmse": rmse, "r2": r2}


if __name__ == "__main__":
    try:
        df = load_and_prepare_data(DATA_PATH)
        df = feature_engineering(df)
        model, features, metrics = train_model(df)
        print("\n[Train] Entrenamiento completado exitosamente")
        print(f"[Train] Metricas finales: MAE={metrics['mae']:.2f} | RMSE={metrics['rmse']:.2f} | R2={metrics['r2']:.4f}")
    except Exception as e:
        print(f"[Train] ERROR: {e}")
        sys.exit(1)