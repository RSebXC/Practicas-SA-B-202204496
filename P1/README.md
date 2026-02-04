# Práctica 1 - API REST para Gestión de Solicitudes Operativas

**Estudiante:** Sebastian
**Sección:** B
**Curso:** Software Avanzado - Universidad de San Carlos de Guatemala

---

## 📋 Descripción

API REST desarrollada en Node.js con TypeScript para gestionar solicitudes operativas de una academia ficticia. El proyecto aplica principios SOLID y buenas prácticas de código limpio.

---

## 🛠️ Tecnologías

- **Node.js** - Runtime
- **TypeScript** - Tipado estático
- **Express** - Framework web
- **PostgreSQL** - Base de datos (Supabase)
- **pg** - Cliente de PostgreSQL

---

## ⚙️ Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo .env (copiar de .env.example)
# Agregar las credenciales de tu base de datos

# 3. Ejecutar en desarrollo
npm run dev
```

---

## 🌐 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/solicitudes` | Obtener todas las solicitudes |
| GET | `/api/solicitudes/:id` | Obtener una solicitud por ID |
| POST | `/api/solicitudes` | Crear nueva solicitud |
| PUT | `/api/solicitudes/:id` | Actualizar solicitud completa |
| DELETE | `/api/solicitudes/:id` | Eliminar solicitud |
| PATCH | `/api/solicitudes/:id/estado` | Actualizar solo el estado |

### Ejemplo - Crear solicitud

```json
POST /api/solicitudes

{
  "titulo": "Solicitud de equipo",
  "area_solicitante": "Tecnología",
  "prioridad": 3,
  "costo_estimado": 5000.00,
  "estado": "registrada"
}
```

### Estados válidos
- `registrada`
- `en_proceso`
- `finalizada`

### Validaciones
- **titulo:** String no vacío
- **area_solicitante:** String no vacío
- **prioridad:** Número entre 1 y 5
- **costo_estimado:** Número mayor o igual a 0
- **estado:** Uno de los estados válidos (por defecto: `registrada`)

---

## 🏗️ Principios SOLID Aplicados

En este proyecto apliqué **dos principios SOLID**: **SRP** y **DIP**. Estos fueron los más relevantes para mantener el código organizado y flexible. A continuación explico cada uno con ejemplos reales del código.

---

### 1️⃣ Single Responsibility Principle (SRP)
**"Una clase debe tener una sola razón para cambiar"**

Este principio significa que cada clase o archivo debe encargarse de UNA SOLA cosa. Si necesito cambiar algo, solo debo modificar el archivo que tiene esa responsabilidad.

#### Evidencia en el código:

**📁 `src/config/database.ts`** — Su única responsabilidad es **gestionar la conexión a PostgreSQL**

```typescript
class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'academia_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || ''
    });
  }

  getPool(): Pool {
    return this.pool;
  }
}
```
- ✅ Solo conecta con la base de datos
- ✅ No hace validaciones ni lógica de negocio
- ✅ Si cambio de base de datos, solo toco este archivo

---

**📁 `src/models/Solicitud.ts`** — Su única responsabilidad es **definir la estructura de datos**

```typescript
export interface SolicitudOperativa {
  id?: number;
  titulo: string;
  area_solicitante: string;
  prioridad: number;
  costo_estimado: number;
  estado: 'registrada' | 'en_proceso' | 'finalizada';
}
```
- ✅ Solo define tipos de datos
- ✅ No tiene lógica ni acceso a base de datos
- ✅ Si cambio el modelo, solo toco este archivo

---

**📁 `src/services/SolicitudService.ts`** — Su única responsabilidad es **la lógica de negocio**

```typescript
export class SolicitudService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async obtenerTodas(): Promise<SolicitudOperativa[]> {
    const result = await this.pool.query(
      'SELECT * FROM solicitudes_operativas ORDER BY id DESC'
    );
    return result.rows;
  }

  async crear(data: CrearSolicitudDTO): Promise<SolicitudOperativa> {
    const query = `
      INSERT INTO solicitudes_operativas 
        (titulo, area_solicitante, prioridad, costo_estimado, estado)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      data.titulo, data.area_solicitante,
      data.prioridad, data.costo_estimado,
      data.estado || 'registrada'
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }
}
```
- ✅ Solo se encarga de las operaciones de datos
- ✅ No maneja HTTP ni respuestas
- ✅ Si cambio la lógica de negocio, solo toco este archivo

---

**📁 `src/controllers/SolicitudController.ts`** — Su única responsabilidad es **manejar peticiones HTTP**

```typescript
export class SolicitudController {
  private service: SolicitudService;

  constructor(service: SolicitudService) {
    this.service = service;
  }

  crear = async (req: Request, res: Response) => {
    try {
      const solicitud = await this.service.crear(req.body);
      res.status(201).json({ success: true, data: solicitud });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Error al crear solicitud' });
    }
  };
}
```
- ✅ Solo recibe el request y devuelve la respuesta
- ✅ No tiene lógica de negocio ni acceso a BD
- ✅ Delega toda la lógica al servicio

---

**📁 `src/routes/solicitudRoutes.ts`** — Su única responsabilidad es **definir las rutas**

```typescript
export function crearRutas(controller: SolicitudController): Router {
  const router = Router();

  router.get('/', controller.obtenerTodas);
  router.get('/:id', controller.obtenerPorId);
  router.post('/', controller.crear);
  router.put('/:id', controller.actualizar);
  router.delete('/:id', controller.eliminar);
  router.patch('/:id/estado', controller.actualizarEstado);

  return router;
}
```
- ✅ Solo mapea URLs a métodos del controlador
- ✅ No tiene lógica ni manipulación de datos

---

### 2️⃣ Dependency Inversion Principle (DIP)
**"Los módulos de alto nivel no deben depender de módulos de bajo nivel. Ambos deben depender de abstracciones."**

Este principio significa que las clases no deben crear sus propias dependencias internamente. En cambio, las dependencias se pasan desde afuera (esto se llama **inyección de dependencias**).

#### Evidencia en el código:

**📁 `src/index.ts`** — Aquí se hace la inyección de dependencias

```typescript
// 1. Obtener conexión a BD (nivel bajo)
const pool = database.getPool();

// 2. Inyectar la conexión al servicio
const solicitudService = new SolicitudService(pool);

// 3. Inyectar el servicio al controlador
const solicitudController = new SolicitudController(solicitudService);

// 4. Inyectar el controlador a las rutas
const solicitudRoutes = crearRutas(solicitudController);
```

- ✅ Todas las dependencias se crean en UN SOLO lugar
- ✅ Cada clase recibe lo que necesita desde afuera
- ✅ Si cambio la base de datos, solo cambio la inyección aquí

---

**📁 `src/services/SolicitudService.ts`** — Recibe la conexión por inyección

```typescript
export class SolicitudService {
  private pool: Pool;

  // ✅ Recibe pool desde afuera (inyección)
  // ❌ NO hace: this.pool = new Pool(...)
  constructor(pool: Pool) {
    this.pool = pool;
  }
}
```

- ✅ No crea su propia conexión
- ✅ Recibe la conexión como parámetro
- ✅ Si cambio de base de datos, no toco este archivo

---

**📁 `src/controllers/SolicitudController.ts`** — Recibe el servicio por inyección

```typescript
export class SolicitudController {
  private service: SolicitudService;

  // ✅ Recibe servicio desde afuera (inyección)
  // ❌ NO hace: this.service = new SolicitudService(...)
  constructor(service: SolicitudService) {
    this.service = service;
  }
}
```

- ✅ No crea su propio servicio
- ✅ Recibe el servicio como parámetro
- ✅ Facilita hacer pruebas (se puede inyectar un mock)

---

### ¿Por qué NO apliqué los otros principios?

- **OCP (Open/Closed):** No lo apliqué porque el proyecto es pequeño y no necesito extender comportamientos sin modificar código existente. Sería forzado agregarlo aquí.
- **LSP (Liskov):** No aplica porque no uso herencia de clases en el proyecto.
- **ISP (Interface Segregation):** No lo apliqué porque no tengo interfaces grandes con métodos innecesarios. Cada clase tiene solo los métodos que necesita.

---

## 📂 Estructura del Proyecto

```
Practica1/
├── src/
│   ├── config/
│   │   └── database.ts            → Conexión a BD (SRP)
│   ├── models/
│   │   └── Solicitud.ts           → Tipos de datos (SRP)
│   ├── services/
│   │   └── SolicitudService.ts    → Lógica de negocio (SRP + DIP)
│   ├── controllers/
│   │   └── SolicitudController.ts → Manejo HTTP (SRP + DIP)
│   ├── routes/
│   │   └── solicitudRoutes.ts     → Rutas (SRP)
│   └── index.ts                   → Inyección de dependencias (DIP)
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧪 Pruebas

```bash
# Ejecutar servidor
npm run dev

# Health check
curl http://localhost:3000/health

# Crear solicitud
curl -X POST http://localhost:3000/api/solicitudes \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Test","area_solicitante":"TI","prioridad":3,"costo_estimado":1000}'

# Ver todas las solicitudes
curl http://localhost:3000/api/solicitudes
```