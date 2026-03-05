import psycopg2
from datetime import datetime
import pytz
import os

DATABASE_URL = os.environ.get("DATABASE_URL")
CARNE = "202204496"

# Zona horaria GMT-6 (Guatemala)
tz = pytz.timezone("America/Guatemala")
now = datetime.now(tz)

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Crear tabla si no existe
cur.execute("""
    CREATE TABLE IF NOT EXISTS cronjob_log (
        id SERIAL PRIMARY KEY,
        fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
        carne VARCHAR(20) NOT NULL,
        zona_horaria VARCHAR(50) NOT NULL
    )
""")

# Insertar registro
cur.execute(
    "INSERT INTO cronjob_log (fecha_hora, carne, zona_horaria) VALUES (%s, %s, %s)",
    (now, CARNE, "GMT-6 America/Guatemala")
)

conn.commit()
cur.close()
conn.close()

print(f"[CronJob] Registro insertado: {now} | Carné: {CARNE}")