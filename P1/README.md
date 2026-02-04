# Práctica 1 - API REST para Gestión de Solicitudes Operativas

**Estudiante:** Rodrigo Sebastian Castro Aguilar
**Sección:** B
**Carné** 202204496
**Curso:** Software Avanzado - Universidad de San Carlos de Guatemala

---

## Descripción

API REST desarrollada en Node.js con TypeScript para gestionar solicitudes operativas de una academia ficticia. El proyecto aplica principios SOLID y buenas prácticas de código limpio.

---

## Tecnologías

- **Node.js** - Runtime
- **TypeScript** - Tipado estático
- **Express** - Framework web
- **PostgreSQL** - Base de datos (Supabase)
- **pg** - Cliente de PostgreSQL

---

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo .env
DB_HOST=db.mmkoqfepuvcocqlkrdpz.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=Rodrigo27050421.

# 3. Ejecutar en desarrollo
npm run dev
```

---

## Endpoints

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

## Explicación de los Principios SOLID

Antes de mostrar qué principios usé en mi código, voy a explicar qué significa cada uno de los 5 principios SOLID:

### Single Responsibility Principle (SRP)

Este principio dice que cada clase o módulo debe hacer una sola cosa. Es como si cada empleado en una empresa tuviera un solo trabajo específico. El chef cocina, el mesero atiende, y el cajero cobra. Ninguno hace el trabajo del otro.

En programación, esto significa que si tengo una clase que maneja la base de datos, esa clase solo debe conectarse y hacer consultas. No debería validar datos, ni manejar peticiones HTTP, ni hacer otra cosa que no sea trabajar con la base de datos. Así, si necesito cambiar algo de la base de datos, solo modifico esa clase y no afecto al resto del código.

La ventaja es que el código es más fácil de entender y de mantener. Si algo falla, sé exactamente dónde buscar.

---

### Open/Closed Principle (OCP)

Este principio dice que el código debe estar abierto para extenderse pero cerrado para modificarse. Suena raro, pero la idea es que si quiero agregar una nueva funcionalidad, no debería tener que cambiar el código que ya funciona.

Es como un enchufe eléctrico: puedo conectar diferentes aparatos (teléfono, laptop, lámpara) sin tener que modificar el enchufe cada vez. El enchufe está "cerrado" porque no lo cambio, pero está "abierto" porque acepta diferentes dispositivos.

En programación, esto se logra usando interfaces o clases abstractas. Si mañana quiero cambiar de una base de datos PostgreSQL a MongoDB, debería poder hacerlo sin tocar todo mi código, solo creando una nueva implementación.

---

### Liskov Substitution Principle (LSP)

Este principio dice que si tengo una clase hija que hereda de una clase padre, debería poder usar la clase hija en cualquier lugar donde usaba la clase padre, sin que nada se rompa.

Por ejemplo, si tengo una clase "Vehículo" y una clase "Auto" que hereda de Vehículo, entonces en cualquier lugar de mi código donde espero un Vehículo, debería poder usar un Auto sin problemas. El Auto debe comportarse como un Vehículo en todo momento.

Si la clase hija cambia el comportamiento esperado de la clase padre de forma que rompe el código, entonces estoy violando este principio. Es importante para que la herencia sea útil y no cause errores inesperados.

---

### Interface Segregation Principle (ISP)

Este principio dice que es mejor tener varias interfaces pequeñas y específicas que una interfaz grande con un montón de métodos que quizás no necesites.

Imagina un gimnasio con diferentes tipos de membresías: una solo para pesas, otra solo para clases de yoga, y una completa. No tiene sentido obligar a alguien que solo quiere hacer yoga a pagar por el acceso a las pesas que nunca va a usar.

En programación, si tengo una interfaz con 20 métodos pero un cliente solo necesita 3, estoy forzando a ese cliente a depender de 17 métodos que no le importan. Es mejor dividir esa interfaz en varias más pequeñas, cada una con métodos relacionados entre sí.

---

### Dependency Inversion Principle (DIP)

Este principio dice que las partes importantes del código (alto nivel) no deben depender directamente de las partes de implementación (bajo nivel). En lugar de eso, ambas deben depender de abstracciones.

Por ejemplo, cuando enchufo mi laptop a un tomacorriente, mi laptop no necesita saber si la electricidad viene de una planta solar, hidroeléctrica o nuclear. Solo necesita saber que el tomacorriente le da 110V. La "abstracción" aquí es el tomacorriente estándar.

En programación, esto significa que mi servicio no debería crear su propia conexión a la base de datos internamente. En cambio, debería recibir esa conexión como un parámetro (inyección de dependencias). Así, si mañana quiero cambiar la forma en que me conecto a la base de datos, solo cambio qué le paso al servicio, sin tocar el código del servicio.

Este principio hace que el código sea más flexible y más fácil de probar, porque puedo "inyectar" versiones de prueba de las dependencias.

---

## Principios SOLID Aplicados

En este proyecto apliqué **dos principios SOLID**: **SRP** y **DIP**. Estos fueron los más relevantes para mantener el código organizado y flexible. A continuación explico cada uno con ejemplos reales del código.

---

### 1️⃣ Single Responsibility Principle (SRP)
**"Una clase debe tener una sola razón para cambiar"**

Este principio significa que cada clase o archivo debe encargarse de UNA SOLA cosa. Si necesito cambiar algo, solo debo modificar el archivo que tiene esa responsabilidad.

#### Evidencia en el código:

**`src/config/database.ts`** — Su única responsabilidad es **gestionar la conexión a PostgreSQL**

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
- Solo conecta con la base de datos
- No hace validaciones ni lógica de negocio
- Si cambio de base de datos, solo toco este archivo

---

**`src/models/Solicitud.ts`** — Su única responsabilidad es **definir la estructura de datos**

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
- Solo define tipos de datos
- No tiene lógica ni acceso a base de datos
- Si cambio el modelo, solo toco este archivo

---

**`src/services/SolicitudService.ts`** — Su única responsabilidad es **la lógica de negocio**

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
- Solo se encarga de las operaciones de datos
- No maneja HTTP ni respuestas
- Si cambio la lógica de negocio, solo toco este archivo

---

**`src/controllers/SolicitudController.ts`** — Su única responsabilidad es **manejar peticiones HTTP**

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
- Solo recibe el request y devuelve la respuesta
- No tiene lógica de negocio ni acceso a BD
- Delega toda la lógica al servicio

---

**`src/routes/solicitudRoutes.ts`** — Su única responsabilidad es **definir las rutas**

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
-  Solo mapea URLs a métodos del controlador
-  No tiene lógica ni manipulación de datos

---

### 2️⃣ Dependency Inversion Principle (DIP)
**"Los módulos de alto nivel no deben depender de módulos de bajo nivel. Ambos deben depender de abstracciones."**

Este principio significa que las clases no deben crear sus propias dependencias internamente. En cambio, las dependencias se pasan desde afuera (esto se llama **inyección de dependencias**).

#### Evidencia en el código:

** `src/index.ts`** — Aquí se hace la inyección de dependencias

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

- Todas las dependencias se crean en UN SOLO lugar
- Cada clase recibe lo que necesita desde afuera
- Si cambio la base de datos, solo cambio la inyección aquí

---

** `src/services/SolicitudService.ts`** — Recibe la conexión por inyección

```typescript
export class SolicitudService {
  private pool: Pool;


  constructor(pool: Pool) {
    this.pool = pool;
  }
}
```

- No crea su propia conexión
- Recibe la conexión como parámetro
- Si cambio de base de datos, no toco este archivo

---

**`src/controllers/SolicitudController.ts`** — Recibe el servicio por inyección

```typescript
export class SolicitudController {
  private service: SolicitudService;

  // Recibe servicio desde afuera (inyección)
  // NO hace: this.service = new SolicitudService(...)
  constructor(service: SolicitudService) {
    this.service = service;
  }
}
```

- No crea su propio servicio
- Recibe el servicio como parámetro
- Facilita hacer pruebas (se puede inyectar un mock)

---

### ¿Por qué NO apliqué los otros principios?

- **OCP (Open/Closed):** No lo apliqué porque el proyecto es pequeño y no necesito extender comportamientos sin modificar código existente. Sería forzado agregarlo aquí.
- **LSP (Liskov):** No aplica porque no uso herencia de clases en el proyecto.
- **ISP (Interface Segregation):** No lo apliqué porque no tengo interfaces grandes con métodos innecesarios. Cada clase tiene solo los métodos que necesita.


---

## Pruebas

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