# Práctica 3 - Arquitectura de Microservicios: Sistema de Planillas

**Estudiante:** Rodrigo Sebastian Castro Aguilar  
**Carné:** 202204496  
**Sección:** B  
**Curso:** Software Avanzado - Universidad de San Carlos de Guatemala  
**Fecha:** Febrero 2026

---

## 📋 Tabla de Contenidos

1. [Descripción del Problema](#descripción-del-problema)
2. [Solución Propuesta](#solución-propuesta)
3. [Arquitectura General](#arquitectura-general)
4. [Microservicios Definidos](#microservicios-definidos)
5. [Comunicación entre Servicios](#comunicación-entre-servicios)
6. [Flujo de Aprobación](#flujo-de-aprobación)
7. [Almacenamiento de Archivos CSV](#almacenamiento-de-archivos-csv)
8. [Sistema de Logging](#sistema-de-logging)
9. [Integración con Práctica 2](#integración-con-práctica-2)
10. [Diagramas ER por Servicio](#diagramas-er-por-servicio)
11. [Tecnologías y Justificación](#tecnologías-y-justificación)
12. [API Gateway](#api-gateway)

---

## 📖 Descripción del Problema

El sistema de planillas de la empresa funciona bajo un esquema **monolítico**, lo cual provoca:

- Lentitud en épocas de alta demanda (quincenas, fin de mes, aguinaldo)
- Incapacidad de escalar componentes individualmente
- Un fallo en cualquier módulo colapsa todo el sistema
- Dificultad para mantener y actualizar el código
- Cuellos de botella en el procesamiento de planillas masivas

**Solución:** Migrar a una arquitectura de microservicios distribuida.

---

## 💡 Solución Propuesta

Se propone una arquitectura basada en **7 microservicios independientes** que se comunican mediante:
- **REST API** para comunicación síncrona
- **Message Broker (RabbitMQ)** para comunicación asíncrona
- **API Gateway** como punto de entrada único

Cada microservicio tiene:
- Su propia base de datos (PostgreSQL en Supabase)
- Responsabilidad única y bien definida
- Escalabilidad independiente
- Despliegue independiente

---

## 🏗️ Arquitectura General

```mermaid
graph TB
    subgraph CLIENTES["👥 CLIENTES"]
        WEB["🌐 Web App\n(React + Vite)"]
    end

    subgraph GATEWAY["🔀 API GATEWAY\n(Puerto 3000)"]
        AG["API Gateway\n• Rate Limiting\n• Load Balancing\n• Routing\n• JWT Validation"]
    end

    subgraph AUTH["🔐 AUTH SERVICE (P2)\n(Puerto 4000)"]
        AS["Auth Service\n• OAuth 2.0 (12h token)\n• JWT HttpOnly Cookies\n• Roles y Permisos\n• AES Encryption"]
        AuthDB[("🗄️ Auth DB")]
    end

    subgraph PAYROLL["📋 PAYROLL SERVICE\n(Puerto 4001)"]
        PS["Payroll Service\n• Cargar CSV\n• Validar planillas\n• Gestionar estados"]
        PayrollDB[("🗄️ Payroll DB")]
    end

    subgraph APPROVAL["✅ APPROVAL SERVICE\n(Puerto 4002)"]
        APS["Approval Service\n• Flujo 3 pasos\n• Gestión de estados"]
        ApprovalDB[("🗄️ Approval DB")]
    end

    subgraph STORAGE["📁 STORAGE SERVICE\n(Puerto 4003)"]
        SS["Storage Service\n• Upload/Download CSV\n• Supabase Storage"]
        SupabaseStorage[("☁️ Supabase Storage")]
    end

    subgraph NOTIFICATION["📧 NOTIFICATION SERVICE\n(Puerto 4004)"]
        NS["Notification Service\n• Emails masivos\n• Templates"]
        NotifDB[("🗄️ Notif DB")]
    end

    subgraph FINANCIAL["💰 FINANCIAL SERVICE\n(Puerto 4005)"]
        FS["Financial Service\n• Envío al sistema externo"]
        FinDB[("🗄️ Financial DB")]
    end

    subgraph LOGGING["📊 LOGGING SERVICE\n(Puerto 4006)"]
        LS["Logging Service\n• Auditoría centralizada"]
        LogDB[("🗄️ Log DB")]
    end

    subgraph MESSAGING["📨 MESSAGE BROKER"]
        MQ["RabbitMQ"]
    end

    WEB --> AG
    AG --> AS
    AG --> PS
    AG --> APS
    AG --> SS
    AG --> LS

    PS --> MQ
    APS --> MQ
    MQ --> NS
    MQ --> FS
    MQ --> LS

    AS -.->|log| LS
    PS -.->|log| LS
    APS -.->|log| LS
```

Ver imagen completa en: `diagramas/arquitectura-general.png`

---

## 🔧 Microservicios Definidos

### 1. Auth Service (Integración Práctica 2)
**Puerto:** 4000  
**Responsabilidad:** Autenticación y autorización de usuarios

**Funcionalidades:**
- Integración con OAuth corporativo (token 12 horas)
- Sistema complementario de JWT con cookies HttpOnly (de P2)
- Gestión de roles y permisos (Admin, Supervisor, Gerente RRHH, Director Financiero)
- Encriptación AES de datos sensibles
- Hash de contraseñas con bcrypt

**Endpoints principales:**
- `POST /api/auth/login` - Login con OAuth corporativo
- `GET /api/auth/me` - Info del usuario actual
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/permissions` - Permisos del usuario

**Base de datos:** PostgreSQL (Supabase) - Reutiliza la de P2

---

### 2. Payroll Service
**Puerto:** 4001  
**Responsabilidad:** Gestión completa de planillas

**Funcionalidades:**
- Recibir y parsear archivos CSV de planillas
- Validar datos según reglas de negocio internas
- Gestionar ciclo de vida de la planilla (estados)
- Consultar historial de planillas procesadas
- Calcular totales (salarios, deducciones, bonificaciones)

**Endpoints principales:**
- `POST /api/payroll/upload` - Subir CSV de planilla
- `GET /api/payroll` - Listar todas las planillas
- `GET /api/payroll/:id` - Detalle de planilla
- `GET /api/payroll/:id/employees` - Empleados de planilla
- `GET /api/payroll/history` - Historial completo

**Estados de una planilla:**
```
CARGADA → VALIDANDO → PENDIENTE_PASO_1 → APROBADO_PASO_1 
→ PENDIENTE_PASO_2 → APROBADO_PASO_2 → PENDIENTE_PASO_3 
→ APROBADA_FINAL → PROCESADA → COMPLETADA
```

**Reglas de validación del CSV:**
- Formato de columnas obligatorio: `codigo,nombre,email,departamento,salario_base,bonificaciones,deducciones`
- El email debe ser válido
- El salario base debe ser mayor a 0
- No puede haber códigos de empleado duplicados
- La suma de deducciones no puede superar el salario base

**Base de datos:** PostgreSQL (Supabase) - payroll_db

---

### 3. Approval Service
**Puerto:** 4002  
**Responsabilidad:** Gestión del flujo de aprobación en 3 pasos

**Funcionalidades:**
- Crear workflow de aprobación al recibir planilla validada
- Gestionar cada paso de aprobación
- Notificar al siguiente aprobador
- Registrar historial de decisiones
- Manejar rechazos en cualquier paso

**Endpoints principales:**
- `POST /api/approval/start/:payrollId` - Iniciar flujo de aprobación
- `GET /api/approval/:workflowId` - Estado actual del workflow
- `POST /api/approval/:workflowId/approve` - Aprobar paso actual
- `POST /api/approval/:workflowId/reject` - Rechazar planilla
- `GET /api/approval/history` - Historial de aprobaciones

**Los 3 pasos:**

| Paso | Rol | Responsabilidad |
|------|-----|----------------|
| 1 | Supervisor Directo | Revisión inicial y validación de datos |
| 2 | Gerente de RRHH | Validación de políticas de empresa |
| 3 | Director Financiero | Aprobación final y autorización de pago |

**Base de datos:** PostgreSQL (Supabase) - approval_db

---

### 4. Storage Service
**Puerto:** 4003  
**Responsabilidad:** Almacenamiento y recuperación de archivos CSV

**Funcionalidades:**
- Upload de archivos CSV a Supabase Storage
- Download de archivos CSV del historial
- Gestión de metadata de archivos
- Verificación de integridad (checksum)
- Control de acceso a archivos

**Endpoints principales:**
- `POST /api/storage/upload` - Subir archivo CSV
- `GET /api/storage/:fileId/download` - Descargar archivo
- `GET /api/storage/:payrollId/files` - Archivos de una planilla
- `DELETE /api/storage/:fileId` - Eliminar archivo

**Tecnología de almacenamiento:** Supabase Storage
- Bucket: `planillas-csv`
- Organización: `/{año}/{mes}/{payroll_id}/{archivo.csv}`
- Políticas RLS para control de acceso
- URLs firmadas para descarga segura

**Base de datos:** PostgreSQL (Supabase) - storage_db

---

### 5. Notification Service
**Puerto:** 4004  
**Responsabilidad:** Envío de notificaciones por correo electrónico

**Funcionalidades:**
- Envío masivo de correos a todos los empleados de una planilla
- Sistema de cola para manejar grandes volúmenes
- Templates de correo personalizados
- Reintentos automáticos en caso de fallo
- Registro de estado por destinatario

**Endpoints principales:**
- `POST /api/notification/send` - Enviar notificación
- `GET /api/notification/:id/status` - Estado de envío
- `GET /api/notification/history` - Historial de notificaciones

**Template del correo a empleados:**
```
Asunto: Su pago está en proceso de depósito - [Período]

Estimado/a [Nombre del Empleado]:

Le informamos que la planilla correspondiente al período [Período]
ha sido aprobada y su pago está en proceso de depósito.

Detalles:
- Salario Base:      Q [Monto]
- Bonificaciones:    Q [Monto]
- Deducciones:       Q [Monto]
- Total a recibir:   Q [Monto]

El depósito se realizará en un plazo de 24-48 horas hábiles.

Atentamente,
Departamento de Recursos Humanos
```

**Proveedor de email:** Nodemailer con SMTP o SendGrid

**Base de datos:** PostgreSQL (Supabase) - notification_db

---

### 6. Financial Service
**Puerto:** 4005  
**Responsabilidad:** Integración con el sistema financiero externo

**Funcionalidades:**
- Enviar planillas aprobadas al sistema financiero externo
- Manejo de reintentos en caso de fallo (máximo 3 intentos)
- Registro de estado de cada envío
- Confirmar recepción exitosa

**Endpoints principales:**
- `POST /api/financial/submit/:payrollId` - Enviar planilla
- `GET /api/financial/:submissionId/status` - Estado del envío
- `GET /api/financial/history` - Historial de envíos

**Lógica de reintentos:**
```
Intento 1: Inmediato
Intento 2: 5 minutos después
Intento 3: 30 minutos después
Si falla el intento 3: Alerta al administrador
```

**Base de datos:** PostgreSQL (Supabase) - financial_db

---

### 7. Logging Service
**Puerto:** 4006  
**Responsabilidad:** Logging centralizado y auditoría del sistema

**Funcionalidades:**
- Recibir logs de todos los microservicios
- Almacenar eventos de auditoría
- Registrar errores del sistema
- Proveer API para consultar logs
- Alertas por eventos críticos

**Endpoints principales:**
- `POST /api/logs/audit` - Registrar evento de auditoría
- `POST /api/logs/error` - Registrar error
- `GET /api/logs` - Consultar logs con filtros
- `GET /api/logs/audit` - Consultar auditoría
- `GET /api/logs/errors` - Consultar errores

**Tipos de logs:**
- `AUDIT`: Acciones de usuarios (login, aprobaciones, etc.)
- `ERROR`: Errores del sistema
- `SYSTEM`: Eventos del sistema (inicio/parada de servicios)
- `SECURITY`: Intentos de acceso no autorizados

**Base de datos:** PostgreSQL (Supabase) - logging_db

---

## 🔗 Comunicación entre Servicios

### Comunicación Síncrona (REST)
Se usa para operaciones que requieren respuesta inmediata:

```
Cliente → API Gateway → Microservicio específico
```

| Origen | Destino | Tipo | Descripción |
|--------|---------|------|-------------|
| API Gateway | Auth Service | REST | Validar JWT en cada request |
| API Gateway | Payroll Service | REST | CRUD de planillas |
| API Gateway | Approval Service | REST | Gestión de aprobaciones |
| API Gateway | Storage Service | REST | Upload/Download archivos |
| API Gateway | Logging Service | REST | Consultar logs |

### Comunicación Asíncrona (Message Broker - RabbitMQ)
Se usa para operaciones que no requieren respuesta inmediata:

```
Servicio Emisor → RabbitMQ → Servicio Consumidor
```

| Evento | Emisor | Consumidor | Descripción |
|--------|--------|------------|-------------|
| `payroll.uploaded` | Payroll Service | Approval Service | Inicia flujo de aprobación |
| `payroll.approved_step1` | Approval Service | Logging Service | Log de aprobación paso 1 |
| `payroll.approved_step2` | Approval Service | Logging Service | Log de aprobación paso 2 |
| `payroll.approved_final` | Approval Service | Financial Service | Enviar al sistema financiero |
| `payroll.approved_final` | Approval Service | Notification Service | Notificar a empleados |
| `payroll.rejected` | Approval Service | Notification Service | Notificar rechazo |
| `financial.submitted` | Financial Service | Logging Service | Log de envío financiero |
| `notification.sent` | Notification Service | Logging Service | Log de notificación |

### Diagrama de Comunicación:

```mermaid
sequenceDiagram
    participant U as Usuario
    participant GW as API Gateway
    participant PS as Payroll Service
    participant AS as Approval Service
    participant MQ as RabbitMQ
    participant NS as Notification Service
    participant FS as Financial Service
    participant LS as Logging Service

    U->>GW: POST /payroll/upload (CSV)
    GW->>PS: Procesar CSV
    PS->>PS: Validar formato
    PS->>MQ: Publica: payroll.uploaded
    MQ->>AS: Evento: payroll.uploaded
    AS->>AS: Crea workflow de aprobación
    MQ->>LS: Log: planilla cargada

    Note over AS: Paso 1 - Supervisor
    U->>GW: POST /approval/{id}/approve
    GW->>AS: Aprobar paso 1
    AS->>MQ: Publica: payroll.approved_step1

    Note over AS: Paso 2 - Gerente RRHH
    U->>GW: POST /approval/{id}/approve
    GW->>AS: Aprobar paso 2
    AS->>MQ: Publica: payroll.approved_step2

    Note over AS: Paso 3 - Director Financiero
    U->>GW: POST /approval/{id}/approve
    GW->>AS: Aprobar paso 3 (FINAL)
    AS->>MQ: Publica: payroll.approved_final

    MQ->>FS: Evento: payroll.approved_final
    FS->>FS: Enviar al sistema financiero externo

    MQ->>NS: Evento: payroll.approved_final
    NS->>NS: Enviar emails masivos a empleados

    MQ->>LS: Log: planilla completada
```

---

## ✅ Flujo de Aprobación

### Estado de la Planilla:

```mermaid
stateDiagram-v2
    [*] --> CARGADA
    CARGADA --> VALIDANDO
    VALIDANDO --> RECHAZADA_VALIDACION : CSV inválido
    VALIDANDO --> PENDIENTE_PASO_1 : CSV válido
    PENDIENTE_PASO_1 --> APROBADO_PASO_1 : Supervisor aprueba
    PENDIENTE_PASO_1 --> RECHAZADA : Supervisor rechaza
    APROBADO_PASO_1 --> PENDIENTE_PASO_2
    PENDIENTE_PASO_2 --> APROBADO_PASO_2 : Gerente RRHH aprueba
    PENDIENTE_PASO_2 --> RECHAZADA : Gerente RRHH rechaza
    APROBADO_PASO_2 --> PENDIENTE_PASO_3
    PENDIENTE_PASO_3 --> APROBADA_FINAL : Director Financiero aprueba
    PENDIENTE_PASO_3 --> RECHAZADA : Director Financiero rechaza
    APROBADA_FINAL --> ENVIANDO_FINANCIERO
    ENVIANDO_FINANCIERO --> NOTIFICANDO
    NOTIFICANDO --> COMPLETADA
    COMPLETADA --> [*]
    RECHAZADA --> [*]
    RECHAZADA_VALIDACION --> [*]
```

### Reglas del Flujo:
- Cada paso debe ser aprobado por un usuario con el rol específico
- Un usuario no puede aprobar el mismo paso dos veces
- Si se rechaza en cualquier paso, el proceso termina
- El paso 3 desencadena automáticamente el envío financiero y las notificaciones
- Todo el historial queda registrado con usuario, fecha y comentarios

---

## 📁 Almacenamiento de Archivos CSV

### Tecnología: Supabase Storage

Se utiliza **Supabase Storage** como solución de almacenamiento por las siguientes razones:
- Ya está configurado en el proyecto (P2 usa Supabase)
- No requiere configuración adicional de servidores
- Ofrece URLs firmadas para descarga segura
- Tiene políticas RLS (Row Level Security)
- Escalable y con buena integración con PostgreSQL

### Estructura del Bucket:

```
supabase-storage/
└── planillas-csv/              ← Bucket principal
    └── {año}/
        └── {mes}/
            └── {payroll_id}/
                ├── original.csv        ← Archivo original subido
                └── processed.csv       ← Archivo procesado (opcional)
```

### Ejemplo:
```
planillas-csv/2026/02/payroll_001/original.csv
planillas-csv/2026/02/payroll_001/processed.csv
```

### Seguridad:
- Solo usuarios autenticados pueden subir archivos
- URLs firmadas con expiración de 1 hora para descargas
- Políticas RLS basadas en el rol del usuario
- Archivos organizados por período para fácil búsqueda

### Formato del CSV requerido:
```csv
codigo,nombre,email,departamento,salario_base,bonificaciones,deducciones
EMP001,Juan Perez,juan@empresa.com,TI,5000.00,500.00,200.00
EMP002,Maria Garcia,maria@empresa.com,RRHH,4500.00,400.00,180.00
EMP003,Carlos Lopez,carlos@empresa.com,Finanzas,6000.00,600.00,240.00
```

---

## 📊 Sistema de Logging

### Estrategia: Logging Centralizado

Todos los microservicios envían sus logs al **Logging Service** a través de:
- Llamadas directas REST para logs críticos/síncronos
- Message Broker (RabbitMQ) para logs de eventos asíncronos

### Tipos de Logs:

```
AUDIT_LOG
├── ¿Quién? (user_id, ip_address)
├── ¿Qué? (action, resource)
├── ¿Cuándo? (timestamp)
├── ¿Desde dónde? (service_name)
└── ¿Resultado? (status)

ERROR_LOG
├── Servicio afectado
├── Código de error
├── Mensaje descriptivo
├── Stack trace (para debug)
└── Severidad (LOW, MEDIUM, HIGH, CRITICAL)

SYSTEM_EVENT
├── Nombre del evento
├── Servicio origen
├── Payload del evento
└── Correlation ID (para trazar flujos)
```

### Ejemplos de Logs del Sistema:

```json
// Login exitoso
{
  "service": "auth-service",
  "event_type": "AUDIT",
  "user_id": 1,
  "action": "LOGIN",
  "resource": "/api/auth/login",
  "status": "SUCCESS",
  "ip_address": "192.168.1.1",
  "timestamp": "2026-02-16T10:30:00Z"
}

// Planilla aprobada (paso 3)
{
  "service": "approval-service",
  "event_type": "AUDIT",
  "user_id": 5,
  "action": "APPROVE_STEP_3",
  "resource": "payroll/42",
  "details": "Planilla Q15 aprobada para pago",
  "status": "SUCCESS",
  "timestamp": "2026-02-16T14:00:00Z"
}

// Error en envío financiero
{
  "service": "financial-service",
  "event_type": "ERROR",
  "error_code": "FINANCIAL_CONNECTION_ERROR",
  "error_message": "Timeout al conectar con sistema externo",
  "severity": "HIGH",
  "timestamp": "2026-02-16T14:05:00Z"
}
```

### Consulta de Logs:
Los administradores pueden consultar logs por:
- Rango de fechas
- Tipo de log (AUDIT, ERROR, SYSTEM)
- Servicio origen
- Usuario específico
- Nivel de severidad

---

## 🔐 Integración con Práctica 2

La **Práctica 2** (Sistema de Autenticación JWT) se integra directamente como el **Auth Service** de esta arquitectura.

### ¿Cómo se integra?

```
Sistema OAuth Corporativo (12h token)
            ↓
    Auth Service (P2)
    ├── Valida token OAuth
    ├── Genera JWT propio (15min)
    ├── Guarda en Cookie HttpOnly
    └── Maneja roles y permisos
            ↓
    API Gateway
    ├── Extrae JWT de Cookie
    ├── Valida con Auth Service
    └── Permite/deniega acceso
            ↓
    Microservicios específicos
```

### Roles del sistema de planillas:

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `admin` | Administrador del sistema | Acceso completo |
| `supervisor` | Supervisor de área | Aprobación Paso 1 |
| `gerente_rrhh` | Gerente de RRHH | Aprobación Paso 2 |
| `director_financiero` | Director Financiero | Aprobación Paso 3 |
| `contador` | Sube planillas CSV | Carga de planillas |
| `empleado` | Empleado general | Solo consulta su info |

### Endpoints del Auth Service usados por API Gateway:
```
GET /api/auth/validate-token  → Valida si el JWT es válido
GET /api/auth/permissions     → Obtiene permisos del usuario
POST /api/auth/refresh        → Renueva el token
```

---

## 🗄️ Diagramas ER por Servicio

Los diagramas ER completos se encuentran en la carpeta `diagramas/er/`:

### Auth Service DB
Ver: `diagramas/er/auth-service-er.png`

Tablas: `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `oauth_tokens`

### Payroll Service DB
Ver: `diagramas/er/payroll-service-er.png`

Tablas: `payrolls`, `employees`, `validation_rules`, `validation_results`, `payroll_history`

### Approval Service DB
Ver: `diagramas/er/approval-service-er.png`

Tablas: `approval_workflows`, `approval_steps`, `approval_history`

### Storage Service DB
Ver: `diagramas/er/storage-service-er.png`

Tablas: `files`, `file_access_log`

### Notification Service DB
Ver: `diagramas/er/notification-service-er.png`

Tablas: `notifications`, `notification_recipients`, `email_templates`

### Financial Service DB
Ver: `diagramas/er/financial-service-er.png`

Tablas: `financial_submissions`, `financial_logs`

### Logging Service DB
Ver: `diagramas/er/logging-service-er.png`

Tablas: `audit_logs`, `error_logs`, `system_events`

---

## 🛠️ Tecnologías y Justificación

### Backend de Microservicios
**Node.js + Express + TypeScript**

Ventajas:
- Mismo stack que la Práctica 2 (reutilización)
- Alto rendimiento para operaciones I/O
- Gran ecosistema de librerías
- TypeScript previene errores en desarrollo

### Base de Datos
**PostgreSQL (Supabase) - Una por microservicio**

Ventajas:
- Aislamiento de datos por servicio
- Ya configurado en P2
- Panel visual para administración
- Escalable y confiable

### Message Broker
**RabbitMQ**

Ventajas:
- Comunicación asíncrona entre servicios
- Desacoplamiento de servicios
- Reintentos automáticos
- Alta disponibilidad

### Almacenamiento de Archivos
**Supabase Storage**

Ventajas:
- Integrado con el proyecto actual
- Sin configuración de servidor adicional
- URLs firmadas para seguridad
- Escalable automáticamente

### API Gateway
**Express Gateway / Kong / custom Node.js**

Ventajas:
- Punto de entrada único
- Rate limiting centralizado
- Autenticación centralizada
- Load balancing

### Notificaciones Email
**Nodemailer + SMTP / SendGrid**

Ventajas:
- Nodemailer: Open source, sin costo
- SendGrid: Alta deliverability, tracking
- Templates HTML personalizados

### Autenticación
**OAuth 2.0 corporativo + JWT (de P2)**

Ventajas:
- Reutiliza infraestructura existente
- Token 12h del OAuth corporativo
- JWT propio con 15 min para mayor seguridad
- Cookies HttpOnly para protección XSS

---

## 🔀 API Gateway

El API Gateway actúa como punto de entrada único para todos los clientes.

### Responsabilidades:
- **Routing:** Dirige las peticiones al microservicio correcto
- **Autenticación:** Valida el JWT en cada petición
- **Rate Limiting:** Máximo 100 requests/minuto por usuario
- **Load Balancing:** Distribuye carga entre instancias
- **Logging:** Registra todas las peticiones
- **CORS:** Maneja políticas de origen cruzado

### Tabla de Routing:

| Ruta | Microservicio | Puerto |
|------|--------------|--------|
| `/api/auth/*` | Auth Service | 4000 |
| `/api/payroll/*` | Payroll Service | 4001 |
| `/api/approval/*` | Approval Service | 4002 |
| `/api/storage/*` | Storage Service | 4003 |
| `/api/notification/*` | Notification Service | 4004 |
| `/api/financial/*` | Financial Service | 4005 |
| `/api/logs/*` | Logging Service | 4006 |

---

## 📂 Estructura del Repositorio

```
P3/
├── README.md                           ← Este archivo
├── diagramas/
│   ├── arquitectura-general.png        ← Vista general del sistema
│   ├── flujo-aprobacion.png            ← Flujo de los 3 pasos
│   ├── comunicacion-servicios.png      ← Diagrama de secuencia
│   └── er/
│       ├── auth-service-er.png
│       ├── payroll-service-er.png
│       ├── approval-service-er.png
│       ├── storage-service-er.png
│       ├── notification-service-er.png
│       ├── financial-service-er.png
│       └── logging-service-er.png
└── mermaid/
    ├── arquitectura-general.mermaid
    ├── flujo-aprobacion.mermaid
    ├── er-auth-service.mermaid
    ├── er-payroll-service.mermaid
    └── er-otros-servicios.mermaid
```

---

## ✅ Checklist de Requerimientos

- [x] Arquitectura de microservicios (7 servicios)
- [x] API Gateway definido
- [x] Integración con Auth Service (P2)
- [x] Integración con OAuth corporativo (12h)
- [x] Base de datos por microservicio
- [x] Almacenamiento de CSV (Supabase Storage)
- [x] Logging centralizado
- [x] Comunicación REST y Mensajería (RabbitMQ)
- [x] Flujo de aprobación 3 pasos
- [x] Envío de correos al aprobar planilla
- [x] Integración con sistema financiero externo
- [x] Historial consultable de planillas
- [x] Diagrama de arquitectura general
- [x] Diagramas ER por servicio
- [x] Documentación técnica completa

---

## 👨‍💻 Autor

**Rodrigo Sebastian Castro Aguilar**  
Carné: 202204496  
Sección: B  
Universidad de San Carlos de Guatemala

---

## 📅 Fecha de Entrega

18 de Abril de 2026 antes de las 23:59 hrs