import os
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from jose import jwt, JWTError

JWT_SECRET = os.getenv("JWT_SECRET", "secret")

# ── Modelos ──────────────────────────────────────────────────────────────────
class NotificationRequest(BaseModel):
    to: str
    subject: str
    body: str
    notification_type: str = "INFO"

class BulkRequest(BaseModel):
    recipients: List[str]
    subject: str
    body: str
    notification_type: str = "INFO"

# ── Estado en memoria ─────────────────────────────────────────────────────────
log: List[dict] = []
counter = 0

def verify(authorization: str) -> dict:
    token = authorization.replace("Bearer ", "")
    try:    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except JWTError: raise HTTPException(401, "Token inválido")

def send(to: str, subject: str, body: str, ntype: str) -> dict:
    global counter
    counter += 1
    entry = {"id": counter, "to": to, "subject": subject,
             "body": body, "type": ntype, "status": "SENT",
             "sent_at": datetime.utcnow().isoformat()}
    log.append(entry)
    print(f"[Notification] EMAIL → {to} | {subject}")
    return entry

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="Notification Service")

@app.get("/health")
def health():
    return {"status": "UP", "service": "Notification Service", "total_sent": len(log)}

@app.post("/api/notifications/send")
def send_one(payload: NotificationRequest, authorization: str = Header(...)):
    verify(authorization)
    return {"message": "Notificación enviada", "notification": send(payload.to, payload.subject, payload.body, payload.notification_type)}

@app.post("/api/notifications/bulk")
def send_bulk(payload: BulkRequest, authorization: str = Header(...)):
    verify(authorization)
    sent = [send(r, payload.subject, payload.body, payload.notification_type) for r in payload.recipients]
    return {"message": f"{len(sent)} notificaciones enviadas", "total": len(sent), "notifications": sent}

@app.get("/api/notifications")
def list_notifications(authorization: str = Header(...)):
    verify(authorization)
    return {"total": len(log), "notifications": log}

@app.post("/api/notifications/payroll-approved")
def payroll_approved(payroll_id: int, recipients: List[str], authorization: str = Header(...)):
    verify(authorization)
    sent = [send(e, f"Planilla #{payroll_id} Aprobada",
                 f"La planilla #{payroll_id} fue aprobada exitosamente.", "APPROVAL") for e in recipients]
    return {"message": "Notificaciones enviadas", "total": len(sent)}

@app.post("/api/notifications/payroll-rejected")
def payroll_rejected(payroll_id: int, recipients: List[str],
                     reason: Optional[str] = "Sin motivo", authorization: str = Header(...)):
    verify(authorization)
    sent = [send(e, f"Planilla #{payroll_id} Rechazada",
                 f"La planilla #{payroll_id} fue rechazada. Motivo: {reason}", "REJECTION") for e in recipients]
    return {"message": "Notificaciones enviadas", "total": len(sent)}
