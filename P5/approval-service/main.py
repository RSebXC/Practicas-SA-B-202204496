import os
import asyncpg
import strawberry
from fastapi import FastAPI, Request, HTTPException
from strawberry.fastapi import GraphQLRouter
from typing import Optional, List
from datetime import datetime
from jose import jwt, JWTError

DB_DSN     = dict(host=os.getenv("DB_HOST","localhost"), port=int(os.getenv("DB_PORT",5432)),
                  database=os.getenv("DB_NAME","postgres"), user=os.getenv("DB_USER","postgres"),
                  password=os.getenv("DB_PASSWORD",""))
JWT_SECRET = os.getenv("JWT_SECRET","secret")

pool: asyncpg.Pool = None  # type: ignore

# ── Auth helper ──────────────────────────────────────────────────────────────
def get_user(request: Request):
    token = request.headers.get("Authorization","").replace("Bearer ","")
    if not token: raise HTTPException(401, "Token requerido")
    try:    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except JWTError: raise HTTPException(401, "Token inválido")

# ── Strawberry types ─────────────────────────────────────────────────────────
@strawberry.type
class Approval:
    id: int
    payroll_id: int
    step: int
    status: str
    approver_id: Optional[int]
    approver_role: Optional[str]
    comments: Optional[str]
    created_at: str
    updated_at: str

@strawberry.type
class ApprovalResult:
    success: bool
    message: str
    approval: Optional[Approval]

def to_approval(r) -> Approval:
    return Approval(id=r["id"], payroll_id=r["payroll_id"], step=r["step"],
                    status=r["status"], approver_id=r.get("approver_id"),
                    approver_role=r.get("approver_role"), comments=r.get("comments"),
                    created_at=str(r["created_at"]), updated_at=str(r["updated_at"]))

# ── Queries ──────────────────────────────────────────────────────────────────
@strawberry.type
class Query:
    @strawberry.field
    async def approvals(self, info: strawberry.types.Info) -> List[Approval]:
        rows = await info.context["db"].fetch("SELECT * FROM approvals ORDER BY created_at DESC")
        return [to_approval(r) for r in rows]

    @strawberry.field
    async def approval(self, info: strawberry.types.Info, payroll_id: int) -> Optional[Approval]:
        r = await info.context["db"].fetchrow(
            "SELECT * FROM approvals WHERE payroll_id=$1 ORDER BY step DESC LIMIT 1", payroll_id)
        return to_approval(r) if r else None

    @strawberry.field
    async def approvals_by_status(self, info: strawberry.types.Info, status: str) -> List[Approval]:
        rows = await info.context["db"].fetch("SELECT * FROM approvals WHERE status=$1", status)
        return [to_approval(r) for r in rows]

# ── Mutations ────────────────────────────────────────────────────────────────
@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_approval(self, info: strawberry.types.Info, payroll_id: int) -> ApprovalResult:
        db = info.context["db"]
        ex = await db.fetchrow("SELECT id FROM approvals WHERE payroll_id=$1", payroll_id)
        if ex: return ApprovalResult(success=False, message="Ya existe un flujo para esta planilla", approval=None)
        r = await db.fetchrow(
            "INSERT INTO approvals (payroll_id,step,status) VALUES ($1,1,'PENDIENTE') RETURNING *", payroll_id)
        return ApprovalResult(success=True, message="Flujo creado — Paso 1 pendiente", approval=to_approval(r))

    @strawberry.mutation
    async def approve_step(self, info: strawberry.types.Info, payroll_id: int,
                           approver_id: int, approver_role: str,
                           comments: Optional[str] = None) -> ApprovalResult:
        db  = info.context["db"]
        row = await db.fetchrow(
            "SELECT * FROM approvals WHERE payroll_id=$1 AND status='PENDIENTE' ORDER BY step DESC LIMIT 1", payroll_id)
        if not row: return ApprovalResult(success=False, message="Sin pasos pendientes", approval=None)

        now = datetime.utcnow()
        if row["step"] >= 3:
            r = await db.fetchrow(
                "UPDATE approvals SET status='APROBADA_FINAL',approver_id=$1,approver_role=$2,comments=$3,updated_at=$4 WHERE id=$5 RETURNING *",
                approver_id, approver_role, comments, now, row["id"])
            return ApprovalResult(success=True, message="Planilla aprobada definitivamente", approval=to_approval(r))

        await db.execute(
            "UPDATE approvals SET status='APROBADO',approver_id=$1,approver_role=$2,comments=$3,updated_at=$4 WHERE id=$5",
            approver_id, approver_role, comments, now, row["id"])
        nxt = await db.fetchrow(
            "INSERT INTO approvals (payroll_id,step,status) VALUES ($1,$2,'PENDIENTE') RETURNING *",
            payroll_id, row["step"] + 1)
        return ApprovalResult(success=True, message=f"Paso {row['step']} aprobado. Ahora en paso {row['step']+1}", approval=to_approval(nxt))

    @strawberry.mutation
    async def reject_approval(self, info: strawberry.types.Info, payroll_id: int,
                              approver_id: int, comments: str) -> ApprovalResult:
        db  = info.context["db"]
        row = await db.fetchrow(
            "SELECT * FROM approvals WHERE payroll_id=$1 AND status='PENDIENTE' ORDER BY step DESC LIMIT 1", payroll_id)
        if not row: return ApprovalResult(success=False, message="Sin pasos pendientes", approval=None)
        r = await db.fetchrow(
            "UPDATE approvals SET status='RECHAZADA',approver_id=$1,comments=$2,updated_at=$3 WHERE id=$4 RETURNING *",
            approver_id, comments, datetime.utcnow(), row["id"])
        return ApprovalResult(success=True, message="Planilla rechazada", approval=to_approval(r))

# ── App ──────────────────────────────────────────────────────────────────────
schema = strawberry.Schema(query=Query, mutation=Mutation)

async def get_context(request: Request):
    return {"db": pool, "request": request}

graphql_router = GraphQLRouter(schema, context_getter=get_context)

app = FastAPI(title="Approval Service")

@app.on_event("startup")
async def startup():
    global pool
    pool = await asyncpg.create_pool(**DB_DSN)
    await pool.execute("""
        CREATE TABLE IF NOT EXISTS approvals (
            id            SERIAL PRIMARY KEY,
            payroll_id    INT NOT NULL,
            step          INT NOT NULL DEFAULT 1,
            status        VARCHAR(50) DEFAULT 'PENDIENTE',
            approver_id   INT,
            approver_role VARCHAR(50),
            comments      TEXT,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""")
    print(f"[Approval Service] puerto {os.getenv('PORT',4002)}")

@app.on_event("shutdown")
async def shutdown():
    await pool.close()

@app.get("/health")
def health():
    return {"status": "UP", "service": "Approval Service"}

app.include_router(graphql_router, prefix="/graphql")
