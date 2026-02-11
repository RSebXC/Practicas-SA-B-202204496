# Práctica 2 - Sistema de Autenticación con JWT

**Estudiante:** Rodrigo Sebastian Castro Aguilar  
**Carné:** 202204496  
**Sección:** B  
**Curso:** Software Avanzado - Universidad de San Carlos de Guatemala  
**Fecha:** Febrero 2026

---

## 📋 Tabla de Contenidos

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Tecnologías Utilizadas](#tecnologías-utilizadas)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Uso del Sistema](#uso-del-sistema)
5. [Explicación de Tecnologías](#explicación-de-tecnologías)
6. [Diagrama de Secuencia](#diagrama-de-secuencia)
7. [Características de Seguridad](#características-de-seguridad)
8. [Estructura del Proyecto](#estructura-del-proyecto)
9. [Endpoints de la API](#endpoints-de-la-api)

---

## 📖 Descripción del Proyecto

Sistema completo de autenticación y autorización implementando JSON Web Tokens (JWT) con las siguientes características de seguridad:

- Autenticación segura con JWT almacenado en cookies HttpOnly
- Encriptación AES-256 para datos sensibles del usuario
- Sistema de roles (Admin y Cliente) con autorización diferenciada
- Renovación automática de tokens dentro de ventana de tiempo configurable
- Hash de contraseñas con bcrypt para máxima seguridad
- API REST con arquitectura cliente-servidor separada

---

## 🛠️ Tecnologías Utilizadas

### Backend

#### Node.js + Express + TypeScript

**¿Qué es?**
- **Node.js:** Runtime de JavaScript que permite ejecutar código JavaScript en el servidor
- **Express:** Framework minimalista para crear APIs y aplicaciones web
- **TypeScript:** Superset de JavaScript que agrega tipado estático

**Ventajas:**
- Alto rendimiento y escalabilidad
- Gran ecosistema de paquetes (npm)
- Código asíncrono eficiente (promesas, async/await)
- TypeScript previene errores en tiempo de desarrollo
- Amplia comunidad y documentación

**Desventajas:**
- Callback hell si no se maneja bien el código asíncrono
- Menos estructurado que frameworks como NestJS
- Requiere configuración manual de TypeScript

---

#### PostgreSQL (Supabase)

**¿Qué es?**
PostgreSQL es una base de datos relacional de código abierto. Supabase es una alternativa a Firebase que proporciona PostgreSQL como servicio.

**Ventajas:**
- Base de datos relacional robusta y madura
- Soporte completo de SQL y ACID
- Supabase ofrece hosting gratuito con panel web
- Escalable para aplicaciones grandes
- Integridad referencial y transacciones

**Desventajas:**
- Más complejo que bases de datos NoSQL para estructuras simples
- Requiere diseño de esquema previo
- Supabase gratuito tiene límites de almacenamiento

---

### Frontend

#### React + TypeScript + Vite

**¿Qué es?**
- **React:** Librería de JavaScript para construir interfaces de usuario
- **Vite:** Build tool moderna y rápida para desarrollo frontend
- **TypeScript:** Tipado estático para código más seguro

**Ventajas:**
- Componentes reutilizables y mantenibles
- Virtual DOM para rendimiento óptimo
- Vite es extremadamente rápido (HMR instantáneo)
- Gran ecosistema de librerías (React Router, Context API)
- TypeScript previene errores

**Desventajas:**
- Curva de aprendizaje inicial para React
- Requiere configuración de herramientas adicionales
- SEO limitado sin Server-Side Rendering

---

#### Axios

**¿Qué es?**
Cliente HTTP basado en promesas para hacer peticiones al backend.

**Ventajas:**
- API simple y clara
- Interceptores para manejar requests/responses
- Soporte automático de cookies
- Manejo de errores mejorado

**Desventajas:**
- Librería adicional (alternativa nativa: fetch)
- Peso extra en el bundle

---

## ⚙️ Instalación y Configuración

### Prerrequisitos

- Node.js v18 o superior
- npm o yarn
- Cuenta en Supabase (o PostgreSQL local)
- Git

---

### Paso 1: Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd P2
```

---

### Paso 2: Configurar Backend

```bash
# Ir a la carpeta backend
cd backend

# Instalar dependencias
npm install
```

#### Configurar variables de entorno

Crear archivo `.env` en la carpeta `backend`:

```env
# Base de datos PostgreSQL
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu_password_supabase

# Servidor
PORT=4000

# JWT
JWT_SECRET=tu_secreto_super_seguro_cambialo_en_produccion
JWT_EXPIRES_IN=15m
JWT_REFRESH_WINDOW=5m

# AES Encriptación
AES_SECRET_KEY=tu_clave_aes_de_32_caracteres_minimo

# CORS
FRONTEND_URL=http://localhost:5173
```

**Importante:** Cambia los valores de `JWT_SECRET` y `AES_SECRET_KEY` por valores seguros.

#### Obtener credenciales de Supabase:

1. Crear cuenta en https://supabase.com
2. Crear nuevo proyecto
3. Ir a Settings → Database
4. Copiar los datos de Connection String

#### Ejecutar backend:

```bash
npm run dev
```

Debería mostrar:
```
Tabla users creada
Servidor Backend Iniciado
Puerto: 4000
```

---

### Paso 3: Configurar Frontend

```bash
# Ir a la carpeta frontend (desde la raíz de P2)
cd frontend

# Instalar dependencias
npm install

# Ejecutar frontend
npm run dev
```

Debería mostrar:
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

---

### Paso 4: Verificar funcionamiento

1. Abrir navegador en `http://localhost:5173`
2. Deberías ver la página principal del sistema
3. Click en "Registrarse"
4. Crear un usuario de prueba
5. Iniciar sesión
6. Acceder al dashboard

---

## 🎯 Uso del Sistema

### Registro de Usuario

1. Ir a `http://localhost:5173/register`
2. Llenar el formulario:
   - Username
   - Nombre completo
   - Email
   - Contraseña (mínimo 6 caracteres)
   - Rol (Admin o Cliente)
3. Click en "Registrarse"
4. Serás redirigido al login

### Inicio de Sesión

1. Ir a `http://localhost:5173/login`
2. Ingresar email y contraseña
3. Click en "Iniciar Sesión"
4. Serás redirigido al Dashboard

### Dashboard

- Muestra información del usuario autenticado
- Muestra permisos según el rol
- Si eres Admin, verás botón para acceder al Panel de Administración

### Panel de Administración

- Solo accesible para usuarios con rol Admin
- Muestra funcionalidades administrativas
- Los clientes NO pueden acceder (verán error 403)

### Cerrar Sesión

- Click en el botón "Cerrar Sesión" en cualquier página protegida
- La cookie JWT será eliminada
- Serás redirigido al login

---

## 📚 Explicación de Tecnologías

### 1. JSON Web Token (JWT)

#### ¿Qué es JWT?

JSON Web Token (JWT) es un estándar abierto (RFC 7519) que define una forma compacta y autónoma de transmitir información de manera segura entre dos partes como un objeto JSON. Esta información puede ser verificada y confiable porque está firmada digitalmente.

#### Estructura de un JWT

Un JWT consta de tres partes separadas por puntos:

```
header.payload.signature
```

**Ejemplo:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20iLCJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Partes:**

1. **Header (Encabezado):**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```
Define el algoritmo de firma (HS256) y el tipo de token.

2. **Payload (Carga útil):**
```json
{
  "userId": 1,
  "email": "admin@test.com",
  "role": "admin",
  "iat": 1675123456,
  "exp": 1675124356
}
```
Contiene los datos del usuario y metadata (cuando fue emitido, cuando expira).

3. **Signature (Firma):**
```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret
)
```
Firma criptográfica que verifica que el token no ha sido modificado.

#### ¿Cómo se usa JWT para autenticación?

**Flujo de autenticación:**

1. **Usuario hace login** → Envía email y contraseña
2. **Backend valida credenciales** → Si son correctas, genera un JWT
3. **Backend firma el JWT** → Usando una clave secreta
4. **JWT se envía al cliente** → En una cookie HttpOnly
5. **Cliente guarda el JWT** → Automáticamente en cookies
6. **En cada petición** → La cookie se envía automáticamente
7. **Backend verifica el JWT** → Valida la firma y expiración
8. **Si es válido** → Permite acceso al recurso protegido

#### Ventajas de JWT:

- **Stateless:** No requiere almacenar sesiones en el servidor
- **Escalable:** Funciona bien en arquitecturas distribuidas
- **Seguro:** Firmado criptográficamente
- **Portable:** Funciona en web, mobile, APIs
- **Auto-contenido:** Toda la información necesaria está en el token

#### Desventajas de JWT:

- **No se puede revocar fácilmente:** Una vez emitido, es válido hasta que expire
- **Tamaño:** Más grande que un ID de sesión simple
- **Información visible:** El payload es visible (solo codificado, no encriptado)

#### Implementación en este proyecto:

```typescript
// Generación del token (backend)
const token = jwt.sign(
  { userId: 1, email: "admin@test.com", role: "admin" },
  "secreto",
  { expiresIn: "15m" }
);

// Verificación del token
const decoded = jwt.verify(token, "secreto");
```

---

### 2. Cookies HttpOnly

#### ¿Qué son las Cookies?

Las cookies son pequeños archivos de texto que los sitios web almacenan en el navegador del usuario. Sirven para recordar información entre peticiones HTTP (que son stateless).

#### ¿Qué es HttpOnly?

**HttpOnly** es una bandera de seguridad que se aplica a las cookies para hacerlas **inaccesibles desde JavaScript**.

#### Cookies normales vs HttpOnly:

**Cookie normal:**
```javascript
// JavaScript PUEDE acceder
document.cookie = "token=abc123";
console.log(document.cookie); // "token=abc123"
```
Vulnerable a ataques XSS (Cross-Site Scripting)

**Cookie HttpOnly:**
```javascript
// JavaScript NO puede acceder
document.cookie; // No muestra la cookie HttpOnly
```
Protegida contra XSS

#### Configuración de cookies seguras:

```typescript
res.cookie('auth_token', token, {
  httpOnly: true,      // No accesible desde JavaScript
  secure: true,        // Solo se envía por HTTPS
  sameSite: 'strict',  // Protección contra CSRF
  maxAge: 900000       // 15 minutos en milisegundos
});
```

**Atributos de seguridad:**

- **httpOnly:** Previene acceso desde JavaScript (protege contra XSS)
- **secure:** Solo se envía en conexiones HTTPS (protege en tránsito)
- **sameSite:** Previene envío en peticiones cross-site (protege contra CSRF)
- **maxAge:** Define cuánto tiempo vive la cookie

#### ¿Por qué usar cookies HttpOnly para JWT?

- **Más seguro que localStorage:** LocalStorage es vulnerable a XSS
- **Automático:** El navegador envía la cookie en cada petición
- **No requiere código extra:** No hay que adjuntar manualmente headers
- **Protección incorporada:** HttpOnly + Secure + SameSite = muy seguro

#### Flujo con cookies HttpOnly:

1. Usuario hace login
2. Backend genera JWT
3. Backend lo guarda en cookie HttpOnly
4. Navegador guarda la cookie (no visible en JS)
5. En cada petición, navegador envía automáticamente la cookie
6. Backend lee la cookie y verifica el JWT
7. Usuario cierra sesión → Cookie se elimina

---

### 3. Algoritmo de Encriptación AES

#### ¿Qué es AES?

**AES (Advanced Encryption Standard)** es un algoritmo de encriptación simétrica adoptado como estándar por el gobierno de Estados Unidos en 2001. Es el algoritmo de encriptación más utilizado y confiable del mundo.

#### Características:

- **Simétrico:** Usa la misma clave para encriptar y desencriptar
- **Block cipher:** Encripta bloques de 128 bits
- **Tamaños de clave:** 128, 192 o 256 bits (usamos AES-256)
- **Rápido:** Muy eficiente en hardware y software
- **Seguro:** No se conocen ataques prácticos efectivos

#### ¿Cómo funciona AES?

**Encriptación:**
```
Texto plano + Clave secreta → AES → Texto encriptado
```

**Desencriptación:**
```
Texto encriptado + Clave secreta → AES → Texto plano
```

#### Ejemplo visual:

```
Texto original: "admin@test.com"
Clave secreta:  "mi_clave_super_secreta_de_32_caracteres"
                         ↓ AES Encrypt
Texto encriptado: "U2FsdGVkX1/GTjQTmZGnhMB..."
                         ↓ AES Decrypt
Texto original: "admin@test.com"
```

#### Implementación en el proyecto:

```typescript
import CryptoJS from 'crypto-js';

const AES_SECRET = "mi_clave_secreta";

// Encriptar
const encrypted = CryptoJS.AES.encrypt("texto", AES_SECRET).toString();
// Resultado: "U2FsdGVkX1/..."

// Desencriptar
const bytes = CryptoJS.AES.decrypt(encrypted, AES_SECRET);
const decrypted = bytes.toString(CryptoJS.enc.Utf8);
// Resultado: "texto"
```

#### ¿Por qué usamos AES en este proyecto?

Encriptamos datos sensibles en la base de datos:
- Username: Información personal del usuario
- Nombre completo: Dato sensible
- Email: NO encriptado (necesario para búsquedas)
- Contraseña: Hasheada con bcrypt (no encriptada)

#### Diferencia entre Encriptación y Hash:

**Encriptación (AES):**
- Es reversible (se puede desencriptar)
- Usa una clave
- Mismo texto → mismo resultado encriptado (con misma clave e IV)
- Uso: Proteger datos que necesitamos leer después

**Hash (bcrypt para contraseñas):**
- NO es reversible (one-way)
- No usa clave (usa salt)
- Mismo texto → diferente resultado (salt aleatorio)
- Uso: Contraseñas (nunca necesitamos desencriptarlas)

#### Ventajas de AES:

- Extremadamente seguro (usado por gobiernos)
- Muy rápido
- Estándar de la industria
- Bien soportado en todas las plataformas

#### Desventajas de AES:

- Simétrico (misma clave para encriptar/desencriptar)
- Si la clave se compromete, todo está comprometido
- Requiere manejo seguro de claves

---

## 📊 Diagrama de Secuencia

### Flujo Completo de Autenticación con JWT

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend (React)
    participant B as Backend (Express)
    participant DB as PostgreSQL
    participant JWT as JWT Service
    participant AES as AES Service

    Note over U,AES: 1. REGISTRO DE USUARIO
    U->>F: Completa formulario de registro
    F->>B: POST /api/auth/register {username, email, password, full_name, role}
    B->>AES: Encripta username y full_name
    AES-->>B: Datos encriptados
    B->>B: Hash password con bcrypt
    B->>DB: INSERT INTO users (datos encriptados)
    DB-->>B: Usuario creado (id, datos)
    B->>AES: Desencripta datos para respuesta
    AES-->>B: Datos desencriptados
    B-->>F: 201 Created {user data}
    F-->>U: Muestra "Registro exitoso"
    F->>F: Redirect a /login

    Note over U,AES: 2. LOGIN
    U->>F: Ingresa email y password
    F->>B: POST /api/auth/login {email, password}
    B->>DB: SELECT * FROM users WHERE email = ?
    DB-->>B: Usuario encontrado (datos encriptados)
    B->>B: Compara password con bcrypt.compare()
    alt Password correcta
        B->>JWT: Genera token con {userId, email, role}
        JWT-->>B: Token firmado
        B->>B: Crea cookie HttpOnly con el token
        B-->>F: 200 OK + Set-Cookie: auth_token=JWT (HttpOnly)
        F->>F: Guarda usuario en Context
        F-->>U: Redirect a /dashboard
    else Password incorrecta
        B-->>F: 401 Unauthorized
        F-->>U: Muestra "Credenciales inválidas"
    end

    Note over U,AES: 3. ACCESO A RUTA PROTEGIDA
    U->>F: Navega a /dashboard
    F->>F: ProtectedRoute verifica si hay usuario en Context
    F->>B: GET /api/protected/dashboard (cookie enviada automáticamente)
    B->>B: Lee cookie 'auth_token'
    B->>JWT: Verifica token
    alt Token válido
        JWT-->>B: Payload {userId, email, role}
        B->>B: Verifica rol permitido
        alt Rol permitido
            B->>DB: Consulta datos según necesidad
            DB-->>B: Datos
            B-->>F: 200 OK {data, permissions}
            F-->>U: Muestra Dashboard
        else Rol no permitido
            B-->>F: 403 Forbidden
            F-->>U: Muestra "No autorizado"
        end
    else Token inválido/expirado
        B-->>F: 401 Unauthorized
        F->>F: Intenta renovar token
        F->>B: POST /api/auth/refresh
        alt Token expiró hace menos de 5 min
            B->>JWT: Genera nuevo token
            JWT-->>B: Nuevo token
            B-->>F: 200 OK + Set-Cookie: nuevo token
            F->>B: Reintenta petición original
        else Token expiró hace más de 5 min
            B-->>F: 401 Token expirado definitivamente
            F->>F: Limpia Context
            F-->>U: Redirect a /login
        end
    end

    Note over U,AES: 4. LOGOUT
    U->>F: Click en "Cerrar Sesión"
    F->>B: POST /api/auth/logout
    B->>B: Elimina cookie (res.clearCookie)
    B-->>F: 200 OK
    F->>F: Limpia Context (user = null)
    F-->>U: Redirect a /login
```

### Explicación del Diagrama:

#### Fase 1: Registro
1. Usuario llena formulario
2. Frontend envía datos al backend
3. Backend encripta username y full_name con AES
4. Backend hashea la contraseña con bcrypt
5. Guarda todo en PostgreSQL
6. Retorna éxito y redirige a login

#### Fase 2: Login
1. Usuario ingresa credenciales
2. Backend busca usuario por email
3. Compara hash de contraseña
4. Si es correcta, genera JWT con datos del usuario
5. Guarda JWT en cookie HttpOnly
6. Frontend guarda usuario en Context
7. Redirige a dashboard

#### Fase 3: Acceso a Rutas Protegidas
1. Usuario navega a ruta protegida
2. Cookie se envía automáticamente
3. Backend verifica JWT
4. Si es válido y el rol es correcto, permite acceso
5. Si expiró pero está en ventana de renovación, renueva
6. Si expiró completamente, redirige a login

#### Fase 4: Logout
1. Usuario hace logout
2. Backend elimina la cookie
3. Frontend limpia el Context
4. Redirige a login

---

## 🔐 Características de Seguridad

### 1. Autenticación JWT
- Token firmado criptográficamente
- Tiempo de expiración de 15 minutos
- Renovación automática en ventana de 5 minutos

### 2. Cookies HttpOnly
- Token no accesible desde JavaScript
- Protección contra XSS (Cross-Site Scripting)
- Atributo `secure` para HTTPS en producción
- Atributo `sameSite: strict` contra CSRF

### 3. Encriptación de Datos
- Username encriptado con AES-256
- Nombre completo encriptado con AES-256
- Contraseñas hasheadas con bcrypt (10 rounds)
- Email en texto plano para búsquedas

### 4. Autorización por Roles
- Middleware de verificación de roles
- Rutas protegidas según permisos
- Admin: Acceso completo
- Cliente: Acceso limitado

### 5. Validación de Datos
- Validación de email format
- Contraseña mínima de 6 caracteres
- Validación de roles permitidos
- Sanitización de inputs

### 6. CORS Configurado
- Solo permite origen del frontend
- Credentials habilitado para cookies
- Previene peticiones de orígenes no autorizados

### 7. Variables de Entorno
- Secretos no hard-coded
- Configuración flexible
- Diferente por ambiente (dev/prod)

---

## 📂 Estructura del Proyecto

```
P2/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts          # Conexión PostgreSQL
│   │   ├── models/
│   │   │   └── User.ts              # Interfaces de usuario
│   │   ├── services/
│   │   │   ├── authService.ts       # Lógica de autenticación
│   │   │   └── encryptionService.ts # Encriptación AES
│   │   ├── controllers/
│   │   │   └── authController.ts    # Controladores HTTP
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts    # Verificación JWT y roles
│   │   ├── routes/
│   │   │   ├── authRoutes.ts        # Rutas de auth
│   │   │   └── protectedRoutes.ts   # Rutas protegidas
│   │   ├── utils/
│   │   │   └── jwt.ts               # Utilidades JWT
│   │   └── index.ts                 # Entrada del servidor
│   ├── .env                         # Variables de entorno
│   ├── .env.example                 # Ejemplo de variables
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.tsx   # HOC para rutas protegidas
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx      # Estado global de auth
│   │   ├── pages/
│   │   │   ├── Home.tsx             # Landing page
│   │   │   ├── Login.tsx            # Página de login
│   │   │   ├── Register.tsx         # Página de registro
│   │   │   ├── Dashboard.tsx        # Dashboard
│   │   │   └── Admin.tsx            # Panel admin
│   │   ├── services/
│   │   │   └── api.ts               # Cliente HTTP
│   │   ├── types/
│   │   │   └── User.ts              # Tipos de usuario
│   │   ├── App.tsx                  # Rutas principales
│   │   ├── main.tsx                 # Entrada de React
│   │   └── index.css                # Estilos globales
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
└── README.md                        # Este archivo
```

---

## 🧪 Endpoints de la API

### Autenticación (Públicos)

#### POST /api/auth/register
Registrar nuevo usuario

**Body:**
```json
{
  "username": "usuario",
  "email": "usuario@email.com",
  "password": "123456",
  "full_name": "Nombre Completo",
  "role": "cliente"
}
```

**Respuesta 201:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": 1,
    "username": "usuario",
    "email": "usuario@email.com",
    "full_name": "Nombre Completo",
    "role": "cliente"
  }
}
```

---

#### POST /api/auth/login
Iniciar sesión

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "123456"
}
```

**Respuesta 200:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "id": 1,
    "username": "usuario",
    "email": "usuario@email.com",
    "full_name": "Nombre Completo",
    "role": "cliente"
  }
}
```

---

### Autenticación (Protegidos)

#### GET /api/auth/me
Obtener información del usuario actual

**Headers:** Cookie con JWT

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "usuario",
    "email": "usuario@email.com",
    "full_name": "Nombre Completo",
    "role": "cliente"
  }
}
```

---

#### POST /api/auth/logout
Cerrar sesión

**Headers:** Cookie con JWT

**Respuesta 200:**
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

---

#### POST /api/auth/refresh
Renovar token JWT

**Headers:** Cookie con JWT expirado (dentro de ventana de 5 min)

**Respuesta 200:**
```json
{
  "success": true,
  "message": "Token renovado exitosamente"
}
```

---

### Rutas Protegidas con Autorización

#### GET /api/protected/admin
Panel de administración (solo admin)

**Headers:** Cookie con JWT de admin

**Respuesta 200:**
```json
{
  "success": true,
  "message": "Bienvenido al panel de administración",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@test.com",
      "role": "admin"
    },
    "accessLevel": "admin",
    "permissions": ["read", "write", "delete", "manage_users"]
  }
}
```

**Respuesta 403 (si eres cliente):**
```json
{
  "success": false,
  "error": "No tiene permisos para acceder a este recurso"
}
```

---

#### GET /api/protected/dashboard
Dashboard (admin y cliente)

**Headers:** Cookie con JWT

**Respuesta 200:**
```json
{
  "success": true,
  "message": "Bienvenido al dashboard",
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@email.com",
      "role": "cliente"
    },
    "accessLevel": "cliente",
    "permissions": ["read"]
  }
}
```

---

## ✅ Checklist de Requerimientos Cumplidos

- [x] API REST entre frontend y backend
- [x] Autenticación con JWT
- [x] Token almacenado en cookies HttpOnly
- [x] Tiempo de vida del JWT configurable (variable de entorno)
- [x] Renovación automática de JWT
- [x] Encriptación AES de datos sensibles
- [x] Sistema de roles (Admin y Cliente)
- [x] Ruta solo para Admin
- [x] Ruta para Admin y Cliente
- [x] Documentación completa
- [x] Diagrama de secuencia
- [x] Explicación de tecnologías

---

## 👨‍💻 Autor

**Rodrigo Sebastian Castro Aguilar**  
Carné: 202204496  
Sección: B  
Universidad de San Carlos de Guatemala  
Facultad de Ingeniería  
Escuela de Ciencias y Sistemas

---

## 📅 Fecha de Entrega

11 de Febrero de 2026 antes de las 23:59 hrs