# Documento Descriptivo de Microservicios
## Sistema de Planillas - Arquitectura Distribuida

**Estudiante:** Rodrigo Sebastian Castro Aguilar  
**Carné:** 202204496  
**Sección:** B  
**Fecha:** Febrero 2026

---

## Microservicio 1: Auth Service

### Descripción General
Microservicio encargado de la **autenticación y autorización** de usuarios del sistema. Se integra directamente con la **Práctica 2** (Sistema de Autenticación JWT), reutilizando toda la infraestructura de seguridad ya implementada.

### Responsabilidades
- Integración con sistema OAuth corporativo (tokens de 12 horas)
- Generación y validación de JWT propios (15 minutos)
- Gestión de cookies HttpOnly seguras
- Administración de roles y permisos
- Encriptación AES de datos sensibles
- Hash de contraseñas con bcrypt

### Tecnologías
- **Lenguaje:** Node.js + TypeScript
- **Framework:** Express
- **Base de datos:** PostgreSQL (Supabase)
- **Autenticación:** JWT + OAuth 2.0
- **Encriptación:** crypto-js (AES-256)
- **Hash:** bcryptjs (10 rounds)

### Puerto
`4000`

### Endpoints Principales

#### Autenticación
```
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout
POST   /api/auth/refresh
```

#### Autorización
```
GET    /api/auth/validate-token
GET    /api/auth/permissions
POST   /api/auth/check-permission
```

#### Gestión de Usuarios
```
POST   /api/auth/register
GET    /api/auth/users
PUT    /api/auth/users/:id
DELETE /api/auth/users/:id
```

### Modelo de Datos

**Tablas principales:**
- `users`: Información de usuarios (encriptada)
- `roles`: Roles del sistema
- `permissions`: Permisos granulares
- `role_permissions`: Relación roles-permisos
- `user_roles`: Asignación de roles a usuarios
- `oauth_tokens`: Tokens del OAuth corporativo

### Roles del Sistema
| Rol | Descripción | Nivel de Acceso |
|-----|-------------|-----------------|
| `admin` | Administrador del sistema | Total |
| `director_financiero` | Director Financiero | Aprobación Paso 3 |
| `gerente_rrhh` | Gerente de RRHH | Aprobación Paso 2 |
| `supervisor` | Supervisor de área | Aprobación Paso 1 |
| `contador` | Contador/Encargado planillas | Carga de planillas |
| `empleado` | Empleado general | Solo consulta |

### Flujo de Autenticación

```
1. Usuario ingresa credenciales
   ↓
2. Auth Service valida con OAuth Corporativo
   ↓
3. OAuth retorna token de 12h
   ↓
4. Auth Service genera JWT propio de 15min
   ↓
5. JWT se guarda en cookie HttpOnly
   ↓
6. Usuario autenticado
```

### Integración con API Gateway
El API Gateway consulta este servicio en **cada petición** para validar:
- Si el JWT es válido
- Si el usuario tiene permisos para el recurso solicitado
- Si el token necesita renovarse

### Variables de Entorno
```env
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
PORT=4000
JWT_SECRET=secret_super_seguro
JWT_EXPIRES_IN=15m
JWT_REFRESH_WINDOW=5m
AES_SECRET_KEY=clave_aes_32_caracteres
OAUTH_CLIENT_ID=client_id_corporativo
OAUTH_CLIENT_SECRET=client_secret_corporativo
OAUTH_TOKEN_URL=https://oauth.empresa.com/token
```

### Comunicación con Otros Servicios
- **API Gateway:** Valida tokens en cada petición (REST síncrono)
- **Logging Service:** Envía logs de autenticación (Mensajería asíncrona)

---

## Microservicio 2: Payroll Service

### Descripción General
Microservicio core del sistema que gestiona todo el **ciclo de vida de las planillas** desde la carga del CSV hasta su procesamiento final.

### Responsabilidades
- Recibir y parsear archivos CSV de planillas
- Validar formato y datos del CSV
- Aplicar reglas de validación de negocio
- Gestionar estados de las planillas
- Calcular totales (salarios, bonificaciones, deducciones)
- Mantener historial de cambios
- Consultar planillas históricas

### Tecnologías
- **Lenguaje:** Node.js + TypeScript
- **Framework:** Express
- **Base de datos:** PostgreSQL (Supabase)
- **Parser CSV:** Papa Parse
- **Validación:** Joi / Yup

### Puerto
`4001`

### Endpoints Principales

#### Gestión de Planillas
```
POST   /api/payroll/upload
GET    /api/payroll
GET    /api/payroll/:id
PUT    /api/payroll/:id
DELETE /api/payroll/:id
```

#### Empleados de Planilla
```
GET    /api/payroll/:id/employees
GET    /api/payroll/:id/employees/:employeeId
POST   /api/payroll/:id/employees
PUT    /api/payroll/:id/employees/:employeeId
DELETE /api/payroll/:id/employees/:employeeId
```

#### Validación y Procesamiento
```
POST   /api/payroll/:id/validate
GET    /api/payroll/:id/validation-results
POST   /api/payroll/:id/process
```

#### Historial
```
GET    /api/payroll/history
GET    /api/payroll/:id/history
```

### Modelo de Datos

**Tablas principales:**
- `payrolls`: Planillas maestro
- `employees`: Empleados por planilla
- `validation_rules`: Reglas de validación configurables
- `validation_results`: Resultados de validaciones
- `payroll_history`: Auditoría de cambios

### Estados de una Planilla
```
CARGADA
  ↓
VALIDANDO
  ↓
PENDIENTE_PASO_1
  ↓
APROBADO_PASO_1
  ↓
PENDIENTE_PASO_2
  ↓
APROBADO_PASO_2
  ↓
PENDIENTE_PASO_3
  ↓
APROBADA_FINAL
  ↓
ENVIANDO_FINANCIERO
  ↓
NOTIFICANDO
  ↓
COMPLETADA
```

Estados de error:
- `RECHAZADA_VALIDACION`
- `RECHAZADA_PASO_1`
- `RECHAZADA_PASO_2`
- `RECHAZADA_PASO_3`

### Formato del CSV Requerido

```csv
codigo,nombre,email,departamento,salario_base,bonificaciones,deducciones
EMP001,Juan Perez,juan@empresa.com,TI,5000.00,500.00,200.00
EMP002,Maria Garcia,maria@empresa.com,RRHH,4500.00,400.00,180.00
```

**Campos obligatorios:**
- `codigo`: Código único del empleado
- `nombre`: Nombre completo
- `email`: Email válido
- `departamento`: Departamento al que pertenece
- `salario_base`: Salario base (debe ser > 0)
- `bonificaciones`: Bonificaciones (puede ser 0)
- `deducciones`: Deducciones (no puede superar salario_base)

### Reglas de Validación

1. **Formato CSV:**
   - Debe tener exactamente 7 columnas
   - Primera fila debe ser encabezado
   - No puede tener filas vacías

2. **Datos de empleados:**
   - Email debe ser válido (formato email)
   - Código de empleado único dentro de la planilla
   - Salario base > 0
   - Deducciones <= salario_base
   - Todos los montos deben ser numéricos

3. **Reglas de negocio:**
   - No puede haber dos planillas del mismo período activas
   - Total de deducciones no puede exceder salario + bonificaciones
   - Email corporativo (@empresa.com)

### Proceso de Carga de Planilla

```
1. Usuario sube CSV
   ↓
2. Storage Service guarda archivo
   ↓
3. Payroll Service recibe path del archivo
   ↓
4. Parsea el CSV
   ↓
5. Valida formato y datos
   ↓
6. Si válido: Estado = PENDIENTE_PASO_1
   ↓
7. Publica evento "payroll.uploaded" a RabbitMQ
   ↓
8. Approval Service inicia workflow
```

### Comunicación con Otros Servicios
- **Storage Service:** Obtiene archivo CSV (REST)
- **Approval Service:** Inicia flujo de aprobación (Mensajería)
- **Logging Service:** Registra cambios (Mensajería)

### Variables de Entorno
```env
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=payroll_db
PORT=4001
RABBITMQ_URL=amqp://localhost:5672
STORAGE_SERVICE_URL=http://localhost:4003
MAX_CSV_SIZE=10MB
```

---

## Microservicio 3: Approval Service

### Descripción General
Microservicio que gestiona el **flujo de aprobación de 3 pasos** para las planillas. Coordina el proceso de revisión y aprobación por diferentes niveles jerárquicos.

### Responsabilidades
- Crear workflows de aprobación
- Gestionar estados de cada paso
- Asignar aprobadores según roles
- Procesar aprobaciones/rechazos
- Notificar al siguiente aprobador
- Registrar historial completo de decisiones
- Desencadenar acciones al aprobar/rechazar

### Tecnologías
- **Lenguaje:** Node.js + TypeScript
- **Framework:** Express
- **Base de datos:** PostgreSQL (Supabase)
- **State Machine:** XState (opcional)

### Puerto
`4002`

### Endpoints Principales

#### Workflows
```
POST   /api/approval/start/:payrollId
GET    /api/approval/workflows
GET    /api/approval/workflows/:workflowId
GET    /api/approval/workflows/:workflowId/status
```

#### Acciones de Aprobación
```
POST   /api/approval/workflows/:workflowId/approve
POST   /api/approval/workflows/:workflowId/reject
POST   /api/approval/workflows/:workflowId/comment
```

#### Consultas
```
GET    /api/approval/pending
GET    /api/approval/my-tasks
GET    /api/approval/history
GET    /api/approval/workflows/:workflowId/history
```

### Modelo de Datos

**Tablas principales:**
- `approval_workflows`: Workflow maestro
- `approval_steps`: Cada paso del workflow (3 pasos)
- `approval_history`: Historial de acciones

### Los 3 Pasos de Aprobación

| Paso | Rol Aprobador | Responsabilidad | Validaciones |
|------|---------------|-----------------|--------------|
| **Paso 1** | Supervisor Directo | Revisión de datos y empleados | Validar montos, nombres correctos |
| **Paso 2** | Gerente de RRHH | Validación de políticas de empresa | Verificar cumplimiento de políticas |
| **Paso 3** | Director Financiero | Aprobación final para pago | Autorizar desembolso |

### Flujo del Workflow

```
Evento: payroll.uploaded
   ↓
1. Crear workflow
   ↓
2. Crear 3 pasos (PENDING)
   ↓
3. Asignar Paso 1 a Supervisor
   ↓
4. Notificar al Supervisor
   ↓
5. Esperar aprobación/rechazo
   ↓
6. Si APRUEBA → Paso 2
   Si RECHAZA → Terminar workflow
```

### Estados del Workflow
- `INITIATED`: Workflow iniciado
- `IN_PROGRESS`: En proceso de aprobación
- `COMPLETED`: Completado exitosamente
- `REJECTED`: Rechazado en algún paso

### Estados de un Paso
- `PENDING`: Esperando aprobación
- `APPROVED`: Aprobado
- `REJECTED`: Rechazado
- `SKIPPED`: Saltado (por rechazo anterior)

### Reglas del Flujo
1. Los pasos deben ejecutarse en orden secuencial
2. No se puede saltar un paso
3. Un usuario no puede aprobar dos veces el mismo paso
4. Al aprobar Paso 3, se desencadena automáticamente:
   - Envío al sistema financiero
   - Notificación a empleados
5. Al rechazar en cualquier paso:
   - Se notifica al creador de la planilla
   - Se termina el workflow
   - Se marca la planilla como RECHAZADA

### Eventos Emitidos (RabbitMQ)

```javascript
// Paso 1 aprobado
{
  "event": "payroll.approved_step1",
  "payroll_id": 42,
  "workflow_id": 15,
  "approved_by": 5,
  "timestamp": "2026-02-16T10:00:00Z"
}

// Paso 3 aprobado (FINAL)
{
  "event": "payroll.approved_final",
  "payroll_id": 42,
  "workflow_id": 15,
  "approved_by": 8,
  "total_employees": 120,
  "total_amount": 450000.00,
  "timestamp": "2026-02-16T14:00:00Z"
}

// Planilla rechazada
{
  "event": "payroll.rejected",
  "payroll_id": 42,
  "workflow_id": 15,
  "rejected_by": 6,
  "rejected_at_step": 2,
  "reason": "Montos no coinciden con presupuesto",
  "timestamp": "2026-02-16T12:00:00Z"
}
```

### Comunicación con Otros Servicios
- **Payroll Service:** Actualiza estado de planilla (REST)
- **Notification Service:** Notifica a aprobadores (Mensajería)
- **Financial Service:** Desencadena envío financiero (Mensajería)
- **Logging Service:** Registra aprobaciones (Mensajería)

### Variables de Entorno
```env
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=approval_db
PORT=4002
RABBITMQ_URL=amqp://localhost:5672
PAYROLL_SERVICE_URL=http://localhost:4001
```

---

## Microservicio 4: Storage Service

### Descripción General
Microservicio dedicado al **almacenamiento y recuperación** de archivos CSV de planillas utilizando Supabase Storage.

### Responsabilidades
- Upload de archivos CSV
- Download de archivos históricos
- Gestión de metadata de archivos
- Verificación de integridad (checksum)
- Control de acceso a archivos
- Generación de URLs firmadas

### Tecnologías
- **Lenguaje:** Node.js + TypeScript
- **Framework:** Express
- **Base de datos:** PostgreSQL (Supabase)
- **Almacenamiento:** Supabase Storage
- **Validación:** File type validation

### Puerto
`4003`

### Endpoints Principales

#### Upload/Download
```
POST   /api/storage/upload
GET    /api/storage/:fileId/download
GET    /api/storage/:fileId/url
DELETE /api/storage/:fileId
```

#### Gestión de Archivos
```
GET    /api/storage/files
GET    /api/storage/payroll/:payrollId/files
GET    /api/storage/:fileId/metadata
```

#### Auditoría
```
GET    /api/storage/:fileId/access-log
POST   /api/storage/:fileId/verify-integrity
```

### Modelo de Datos

**Tablas principales:**
- `files`: Metadata de archivos almacenados
- `file_access_log`: Registro de accesos a archivos

### Estructura de Supabase Storage

**Bucket:** `planillas-csv`

**Organización de carpetas:**
```
planillas-csv/
├── 2026/
│   ├── 01/
│   │   ├── payroll_001/
│   │   │   ├── original.csv
│   │   │   └── processed.csv
│   │   ├── payroll_002/
│   │   │   └── original.csv
│   ├── 02/
│   │   ├── payroll_003/
│   │   │   └── original.csv
```

**Nomenclatura:**
```
{año}/{mes}/payroll_{id}/{tipo}.csv
```

### Proceso de Upload

```
1. Usuario sube archivo (POST /upload)
   ↓
2. Storage Service valida:
   - Tipo de archivo (.csv)
   - Tamaño (máximo 10MB)
   - Formato del CSV
   ↓
3. Genera checksum MD5
   ↓
4. Sube a Supabase Storage
   ↓
5. Guarda metadata en DB
   ↓
6. Retorna file_id y storage_path
```

### Proceso de Download

```
1. Usuario solicita descarga (GET /download)
   ↓
2. Storage Service valida permisos
   ↓
3. Genera URL firmada (expira en 1h)
   ↓
4. Registra acceso en access_log
   ↓
5. Retorna URL firmada
```

### Seguridad

**Políticas RLS (Row Level Security):**
```sql
-- Solo el creador y admins pueden acceder
CREATE POLICY "Users can access own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'planillas-csv' 
  AND auth.uid() = owner
  OR 
  auth.role() = 'admin'
);
```

**URLs Firmadas:**
- Expiran en 1 hora
- No son reutilizables
- Incluyen token de verificación

### Validaciones

1. **Tipo de archivo:**
   - Solo archivos `.csv`
   - MIME type: `text/csv`

2. **Tamaño:**
   - Máximo: 10MB
   - Mínimo: 1KB

3. **Contenido:**
   - Debe tener al menos 2 filas (header + 1 empleado)
   - Formato CSV válido

### Comunicación con Otros Servicios
- **Payroll Service:** Provee path de archivo (REST)
- **Logging Service:** Registra accesos (Mensajería)

### Variables de Entorno
```env
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=storage_db
PORT=4003
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_BUCKET=planillas-csv
MAX_FILE_SIZE=10MB
SIGNED_URL_EXPIRATION=3600
```

---

## Microservicio 5: Notification Service

### Descripción General
Microservicio especializado en el **envío de notificaciones por email** a empleados y usuarios del sistema.

### Responsabilidades
- Envío de correos individuales y masivos
- Gestión de cola de notificaciones
- Templates de correo personalizados
- Reintentos automáticos en fallos
- Tracking de estado de envío por destinatario
- Notificaciones de eventos del sistema

### Tecnologías
- **Lenguaje:** Node.js + TypeScript
- **Framework:** Express
- **Base de datos:** PostgreSQL (Supabase)
- **Email:** Nodemailer + SMTP / SendGrid
- **Templates:** Handlebars / EJS
- **Cola:** Bull (Redis)

### Puerto
`4004`

### Endpoints Principales

#### Envío de Notificaciones
```
POST   /api/notification/send
POST   /api/notification/send-bulk
GET    /api/notification/:id
GET    /api/notification/:id/status
```

#### Templates
```
GET    /api/notification/templates
GET    /api/notification/templates/:id
POST   /api/notification/templates
PUT    /api/notification/templates/:id
```

#### Historial
```
GET    /api/notification/history
GET    /api/notification/payroll/:payrollId/notifications
```

### Modelo de Datos

**Tablas principales:**
- `notifications`: Notificaciones maestro
- `notification_recipients`: Destinatarios individuales
- `email_templates`: Templates de correo

### Templates de Correo

#### 1. Planilla Aprobada (Envío Masivo)
```html
Asunto: Su pago está en proceso - Período {{period}}

Estimado/a {{employee_name}}:

Le informamos que la planilla del período {{period}} ha sido
aprobada y su pago está en proceso de depósito.

Detalles de su pago:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Salario Base:      Q {{salary_base}}
Bonificaciones:    Q {{bonuses}}
Deducciones:      -Q {{deductions}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL A RECIBIR:   Q {{net_salary}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

El depósito se realizará en las próximas 24-48 horas hábiles.

Atentamente,
Departamento de Recursos Humanos
```

#### 2. Planilla Rechazada
```html
Asunto: Planilla Rechazada - Período {{period}}

Estimado/a {{approver_name}}:

La planilla del período {{period}} ha sido RECHAZADA
en el paso {{step_number}}.

Motivo: {{rejection_reason}}

Deberá crear una nueva planilla corrigiendo los errores.

Atentamente,
Sistema de Planillas
```

#### 3. Notificación a Aprobador
```html
Asunto: Planilla Pendiente de Aprobación - {{period}}

Estimado/a {{approver_name}}:

Tiene una planilla pendiente de aprobación.

Período: {{period}}
Total empleados: {{employee_count}}
Monto total: Q {{total_amount}}

Por favor ingrese al sistema para revisarla.

Link: {{approval_link}}

Atentamente,
Sistema de Planillas
```

### Proceso de Envío Masivo

```
1. Recibe evento "payroll.approved_final"
   ↓
2. Obtiene lista de empleados de la planilla
   ↓
3. Crea registro en "notifications"
   ↓
4. Crea registro por cada empleado en "notification_recipients"
   ↓
5. Agrega a cola de envío (Bull)
   ↓
6. Procesa cola (10 emails por segundo)
   ↓
7. Actualiza estado de cada destinatario
   ↓
8. Si falla: Reintenta hasta 3 veces
```

### Estados de Notificación
- `QUEUED`: En cola de envío
- `SENDING`: Enviando
- `SENT`: Enviado exitosamente
- `FAILED`: Falló después de reintentos
- `BOUNCED`: Email rebotó

### Lógica de Reintentos
```
Intento 1: Inmediato
Intento 2: 1 minuto después
Intento 3: 5 minutos después

Si falla el intento 3:
→ Estado = FAILED
→ Notificar al administrador
```

### Eventos que Generan Notificaciones

| Evento | Destinatarios | Template |
|--------|---------------|----------|
| `payroll.approved_final` | Todos los empleados | Planilla aprobada |
| `payroll.rejected` | Creador de planilla | Planilla rechazada |
| `approval.pending_step1` | Supervisor | Pendiente aprobación |
| `approval.pending_step2` | Gerente RRHH | Pendiente aprobación |
| `approval.pending_step3` | Director Financiero | Pendiente aprobación |

### Comunicación con Otros Servicios
- **Approval Service:** Recibe eventos de aprobación (Mensajería)
- **Payroll Service:** Obtiene datos de empleados (REST)
- **Logging Service:** Registra envíos (Mensajería)

### Variables de Entorno
```env
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=notification_db
PORT=4004
RABBITMQ_URL=amqp://localhost:5672
REDIS_URL=redis://localhost:6379

# SMTP Config
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@empresa.com
SMTP_PASSWORD=password_smtp
SMTP_FROM=Recursos Humanos <noreply@empresa.com>

# SendGrid (alternativa)
SENDGRID_API_KEY=SG.xxxxxxxx

# Rate Limiting
EMAIL_RATE_LIMIT=10
EMAIL_RATE_WINDOW=1000
MAX_RETRIES=3
```

---

## Microservicio 6: Financial Service

### Descripción General
Microservicio que gestiona la **integración con el sistema financiero externo** de la empresa para el envío de planillas aprobadas.

### Responsabilidades
- Enviar planillas aprobadas al sistema financiero externo
- Manejar autenticación con sistema externo
- Implementar lógica de reintentos
- Registrar estado de cada envío
- Manejar respuestas y errores del sistema externo
- Confirmar recepción exitosa

### Tecnologías
- **Lenguaje:** Node.js + TypeScript
- **Framework:** Express
- **Base de datos:** PostgreSQL (Supabase)
- **HTTP Client:** Axios con retry
- **Queue:** Bull (para reintentos)

### Puerto
`4005`

### Endpoints Principales

#### Envíos Financieros
```
POST   /api/financial/submit/:payrollId
GET    /api/financial/submissions
GET    /api/financial/submissions/:id
GET    /api/financial/submissions/:id/status
```

#### Reintentos
```
POST   /api/financial/submissions/:id/retry
GET    /api/financial/failed
```

#### Auditoría
```
GET    /api/financial/logs
GET    /api/financial/submissions/:id/logs
```

### Modelo de Datos

**Tablas principales:**
- `financial_submissions`: Envíos al sistema financiero
- `financial_logs`: Log detallado de cada intento

### Integración con Sistema Externo

**Endpoint del sistema financiero:**
```
POST https://financiero.empresa.com/api/v1/planillas
```

**Formato del payload:**
```json
{
  "planilla_id": "P-2026-02-001",
  "periodo": "2026-02",
  "fecha_pago": "2026-02-28",
  "total_empleados": 120,
  "monto_total": 450000.00,
  "empleados": [
    {
      "codigo": "EMP001",
      "nombre": "Juan Perez",
      "cuenta_bancaria": "1234567890",
      "monto": 5300.00
    }
  ]
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "reference_id": "FIN-2026-0245",
  "status": "ACCEPTED",
  "estimated_processing_time": "24h"
}
```

### Proceso de Envío

```
1. Recibe evento "payroll.approved_final"
   ↓
2. Consulta datos completos de planilla (Payroll Service)
   ↓
3. Transforma datos al formato del sistema financiero
   ↓
4. Realiza POST al endpoint externo
   ↓
5. Si exitoso:
   - Guarda reference_id
   - Estado = CONFIRMED
   ↓
6. Si falla:
   - Registra error
   - Agrega a cola de reintentos
```

### Lógica de Reintentos

```
Intento 1: Inmediato
Intento 2: 5 minutos después
Intento 3: 30 minutos después

Si falla el intento 3:
→ Estado = FAILED
→ Notificar a administrador
→ Crear ticket en sistema de soporte
```

### Estados de Envío
- `PENDING`: Pendiente de envío
- `SENDING`: Enviando
- `CONFIRMED`: Confirmado por sistema externo
- `FAILED`: Falló después de reintentos
- `RETRYING`: En proceso de reintento

### Manejo de Errores del Sistema Externo

| Código HTTP | Descripción | Acción |
|-------------|-------------|--------|
| 200/201 | Éxito | Marcar como CONFIRMED |
| 400 | Datos inválidos | NO reintentar, notificar admin |
| 401 | No autorizado | Renovar token, reintentar |
| 500 | Error del servidor | Reintentar con backoff |
| Timeout | Sin respuesta | Reintentar |

### Autenticación con Sistema Externo

El sistema financiero usa **OAuth 2.0 Client Credentials**:

```javascript
// Obtener token de acceso
POST https://financiero.empresa.com/oauth/token
{
  "grant_type": "client_credentials",
  "client_id": "payroll_system",
  "client_secret": "secret_financiero"
}

// Response
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
  "token_type": "Bearer",
  "expires_in": 3600
}

// Usar en requests
Headers: {
  "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI..."
}
```

### Validaciones Antes de Enviar
1. Planilla debe estar en estado `APROBADA_FINAL`
2. Todos los empleados deben tener cuenta bancaria
3. Monto total debe ser mayor a 0
4. No debe existir envío previo exitoso

### Comunicación con Otros Servicios
- **Payroll Service:** Obtiene datos de planilla (REST)
- **Approval Service:** Recibe evento de aprobación final (Mensajería)
- **Notification Service:** Notifica resultado de envío (Mensajería)
- **Logging Service:** Registra intentos y resultados (Mensajería)

### Variables de Entorno
```env
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=financial_db
PORT=4005
RABBITMQ_URL=amqp://localhost:5672
REDIS_URL=redis://localhost:6379

# Sistema Financiero Externo
FINANCIAL_API_URL=https://financiero.empresa.com/api/v1
FINANCIAL_CLIENT_ID=payroll_system
FINANCIAL_CLIENT_SECRET=secret_financiero
FINANCIAL_TIMEOUT=30000

# Reintentos
MAX_RETRIES=3
RETRY_DELAY_1=300000
RETRY_DELAY_2=1800000
```

---

## Microservicio 7: Logging Service

### Descripción General
Microservicio centralizado para **logging, auditoría y monitoreo** de todos los eventos del sistema.

### Responsabilidades
- Recibir logs de todos los microservicios
- Almacenar eventos de auditoría
- Registrar errores del sistema
- Proveer API para consultar logs
- Generar alertas por eventos críticos
- Mantener trazabilidad completa del sistema

### Tecnologías
- **Lenguaje:** Node.js + TypeScript
- **Framework:** Express
- **Base de datos:** PostgreSQL (Supabase)
- **Logging:** Winston
- **Búsqueda:** ElasticSearch (opcional)

### Puerto
`4006`

### Endpoints Principales

#### Registro de Logs
```
POST   /api/logs/audit
POST   /api/logs/error
POST   /api/logs/system
```

#### Consulta de Logs
```
GET    /api/logs
GET    /api/logs/audit
GET    /api/logs/errors
GET    /api/logs/search
```

#### Auditoría
```
GET    /api/logs/user/:userId
GET    /api/logs/payroll/:payrollId
GET    /api/logs/service/:serviceName
```

#### Alertas
```
GET    /api/logs/alerts
POST   /api/logs/alerts/configure
```

### Modelo de Datos

**Tablas principales:**
- `audit_logs`: Logs de auditoría (acciones de usuarios)
- `error_logs`: Logs de errores del sistema
- `system_events`: Eventos del sistema

### Tipos de Logs

#### 1. AUDIT_LOG (Auditoría)
Registra acciones de usuarios en el sistema.

```json
{
  "service_name": "auth-service",
  "event_type": "AUDIT",
  "user_id": 1,
  "action": "LOGIN",
  "resource": "/api/auth/login",
  "details": "Login exitoso",
  "ip_address": "192.168.1.1",
  "status": "SUCCESS",
  "timestamp": "2026-02-16T10:30:00Z"
}
```

**Acciones auditadas:**
- LOGIN/LOGOUT
- CREATE/UPDATE/DELETE de planillas
- APPROVE/REJECT de pasos
- UPLOAD/DOWNLOAD de archivos
- SEND de notificaciones
- SUBMIT al sistema financiero

#### 2. ERROR_LOG (Errores)
Registra errores del sistema.

```json
{
  "service_name": "financial-service",
  "event_type": "ERROR",
  "error_code": "FINANCIAL_CONNECTION_ERROR",
  "error_message": "Timeout al conectar con sistema externo",
  "stack_trace": "Error: connect ETIMEDOUT...",
  "severity": "HIGH",
  "correlation_id": "req-123-456",
  "timestamp": "2026-02-16T14:05:00Z"
}
```

**Niveles de severidad:**
- `LOW`: Error recoverable, no afecta funcionalidad
- `MEDIUM`: Error que afecta funcionalidad parcialmente
- `HIGH`: Error que afecta funcionalidad crítica
- `CRITICAL`: Sistema comprometido, requiere acción inmediata

#### 3. SYSTEM_EVENT (Eventos del Sistema)
Registra eventos importantes del sistema.

```json
{
  "service_name": "approval-service",
  "event_name": "payroll.approved_final",
  "payload": {
    "payroll_id": 42,
    "total_amount": 450000.00
  },
  "correlation_id": "workflow-15",
  "timestamp": "2026-02-16T14:00:00Z"
}
```

### Trazabilidad con Correlation ID

Cada flujo de negocio tiene un `correlation_id` que permite trazar todo el proceso:

```
correlation_id: "payroll-42-20260216"

1. [AUDIT] Usuario sube planilla
2. [SYSTEM] payroll.uploaded
3. [SYSTEM] approval.workflow_created
4. [AUDIT] Supervisor aprueba paso 1
5. [SYSTEM] payroll.approved_step1
6. [AUDIT] Gerente RRHH aprueba paso 2
7. [SYSTEM] payroll.approved_step2
8. [AUDIT] Director aprueba paso 3
9. [SYSTEM] payroll.approved_final
10. [SYSTEM] financial.submitted
11. [SYSTEM] notification.sent
12. [AUDIT] Planilla completada
```

### Consultas de Logs

**Por rango de fechas:**
```
GET /api/logs?from=2026-02-01&to=2026-02-28
```

**Por servicio:**
```
GET /api/logs/service/payroll-service
```

**Por usuario:**
```
GET /api/logs/user/5
```

**Por planilla (traza completa):**
```
GET /api/logs/payroll/42
```

**Por severidad:**
```
GET /api/logs/errors?severity=CRITICAL
```

### Alertas Automáticas

El sistema genera alertas cuando:
- Más de 3 errores CRITICAL en 5 minutos
- Más de 5 intentos de login fallidos del mismo usuario
- Sistema financiero falla más de 2 veces
- Cola de notificaciones supera 1000 pendientes
- Servicio no responde por más de 1 minuto

### Comunicación con Otros Servicios
**Todos los microservicios** envían logs a este servicio mediante:
- REST (para logs síncronos/críticos)
- RabbitMQ (para logs asíncronos/volumen alto)

### Variables de Entorno
```env
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=logging_db
PORT=4006
RABBITMQ_URL=amqp://localhost:5672

# Alertas
ALERT_EMAIL=admin@empresa.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# Retención
LOG_RETENTION_DAYS=90
AUDIT_RETENTION_DAYS=365
```

---

## API Gateway

### Descripción General
Punto de entrada único para todas las peticiones de clientes al sistema de microservicios.

### Responsabilidades
- Enrutar peticiones al microservicio correcto
- Validar JWT en cada petición
- Rate limiting por usuario/IP
- Load balancing entre instancias
- Logging de todas las peticiones
- Manejo de CORS
- Compresión de respuestas
- Cache de respuestas frecuentes

### Tecnologías
- **Express Gateway** / **Kong** / **Custom Node.js**
- **Rate Limiting:** express-rate-limit
- **Load Balancing:** Round Robin
- **Cache:** Redis

### Puerto
`3000`

### Tabla de Routing

| Path | Microservicio | Puerto | Auth Requerida |
|------|--------------|--------|----------------|
| `/api/auth/*` | Auth Service | 4000 | No (excepto /me) |
| `/api/payroll/*` | Payroll Service | 4001 | Sí |
| `/api/approval/*` | Approval Service | 4002 | Sí |
| `/api/storage/*` | Storage Service | 4003 | Sí |
| `/api/notification/*` | Notification Service | 4004 | Sí |
| `/api/financial/*` | Financial Service | 4005 | Sí (Admin) |
| `/api/logs/*` | Logging Service | 4006 | Sí (Admin) |

### Proceso de una Petición

```
1. Cliente → API Gateway (port 3000)
   ↓
2. Verificar rate limiting
   ↓
3. Extraer JWT de cookie
   ↓
4. Validar JWT con Auth Service
   ↓
5. Verificar permisos para el recurso
   ↓
6. Enrutar a microservicio correspondiente
   ↓
7. Microservicio procesa
   ↓
8. Respuesta → API Gateway
   ↓
9. Agregar headers CORS
   ↓
10. Comprimir respuesta
   ↓
11. Retornar al cliente
```

### Rate Limiting

**Por usuario autenticado:**
- 100 requests por minuto
- 1000 requests por hora

**Por IP (no autenticado):**
- 20 requests por minuto
- 100 requests por hora

### CORS Configuration
```javascript
{
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

---

## Comunicación entre Microservicios

### REST (Síncrono)
Usado para operaciones que requieren respuesta inmediata.

**Características:**
- HTTP/HTTPS
- Request-Response
- Timeout de 30 segundos
- Retry automático (máx 3 intentos)

### RabbitMQ (Asíncrono)
Usado para eventos y notificaciones que no requieren respuesta inmediata.

**Características:**
- Pub/Sub pattern
- Garantía de entrega
- Reintentos automáticos
- Dead letter queue para mensajes fallidos

**Exchanges:**
- `payroll.events` - Eventos de planillas
- `approval.events` - Eventos de aprobaciones
- `notification.events` - Eventos de notificaciones
- `system.logs` - Logs del sistema

---