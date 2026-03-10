# Documentacion Tecnica — Practica 6
## Analisis Estatico de Codigo con Qodana

**Universidad San Carlos de Guatemala**
Facultad de Ingenieria — ECYS
Software Avanzado — Seccion B

| Campo | Detalle |
|-------|---------|
| Estudiante | Rodrigo Sebastian Castro Aguilar |
| Carne | 202204496 |
| Seccion | B |
| Fecha | Marzo 2026 |

---

## 1. Conceptos Fundamentales

### 1.1 Que es el analisis estatico de codigo

El analisis estatico de codigo es una tecnica que examina el codigo fuente de un programa sin necesidad de ejecutarlo. A diferencia de las pruebas dinamicas que requieren correr la aplicacion, el analisis estatico inspecciona directamente el texto del codigo buscando patrones que correspondan a errores conocidos, malas practicas, vulnerabilidades de seguridad o violaciones de estilo.

Esta tecnica se aplica antes de compilar o desplegar el software, lo que permite detectar problemas en etapas tempranas del desarrollo cuando son menos costosos de corregir. Es una pieza fundamental en los pipelines modernos de CI/CD porque puede ejecutarse automaticamente en cada commit sin intervension humana.

Entre los beneficios principales del analisis estatico se encuentran la deteccion temprana de bugs, la identificacion de vulnerabilidades de seguridad, el cumplimiento de estandares de codigo, y la reduccion de deuda tecnica a lo largo del tiempo.

---

### 1.2 Que es Qodana

Qodana es una plataforma de analisis estatico de codigo desarrollada por JetBrains, la misma empresa que crea los IDEs IntelliJ IDEA, PyCharm y WebStorm. Qodana traslada las capacidades de inspeccion de codigo de estos IDEs a un entorno de linea de comandos y contenedores Docker, permitiendo integrarlo en pipelines de CI/CD.

Qodana analiza proyectos de diferentes lenguajes mediante linters especializados: `qodana-js` para JavaScript y TypeScript, `qodana-python` para Python, `qodana-jvm` para Java y Kotlin, entre otros. Cada linter contiene cientos de reglas de inspeccion organizadas por categoria y severidad.

El resultado del analisis es un reporte detallado que lista cada problema encontrado con su ubicacion exacta en el codigo (archivo, linea, columna), una descripcion del problema, su nivel de severidad y sugerencias de correccion. Este reporte puede visualizarse en el navegador o integrarse con Qodana Cloud para seguimiento historico.

---

### 1.3 Que tipo de problemas puede detectar Qodana

Qodana puede detectar una amplia variedad de problemas organizados en las siguientes categorias:

**Errores de logica:** Codigo que compila correctamente pero tiene comportamiento incorrecto, como uso redundante de `await` en expresiones que no son promesas, comparaciones siempre verdaderas o falsas, y variables que nunca se usan.

**Vulnerabilidades de seguridad:** Uso de funciones criptograficas debiles, inyeccion de dependencias inseguras, exposicion de datos sensibles en logs, y validacion incorrecta de entradas.

**Malas practicas:** Uso de funciones o modulos deprecados, importaciones no utilizadas, codigo duplicado, complejidad ciclomatica excesiva, y violaciones de principios SOLID.

**Problemas de dependencias:** Paquetes requeridos en el codigo pero no declarados en los archivos de requisitos, o paquetes declarados pero no utilizados.

**Problemas de estilo:** Violaciones de convenciones de nombrado, formateo inconsistente, y comentarios desactualizados.

---

## 2. Instalacion y Configuracion

### 2.1 Requisitos previos

Para ejecutar Qodana se necesita unicamente Docker instalado y corriendo. No requiere instalacion adicional de software de JetBrains.

```bash
docker --version
# Docker version 29.2.1, build a5c7197
```

### 2.2 Archivo de configuracion qodana.yaml

El archivo `qodana.yaml` en la carpeta P6 define el perfil de analisis y las inspecciones a incluir o excluir:

```yaml
version: "1.0"

profile:
  name: qodana.starter

include:
  - name: ES6RedundantAwait
  - name: PyDeprecationInspection
  - name: PyPackageRequirementsInspection

exclude:
  - name: All
    paths:
      - node_modules
      - dist
      - .git
```

El perfil `qodana.starter` es el perfil base recomendado para un primer analisis. Las rutas excluidas evitan analizar dependencias externas que no son parte del codigo propio del proyecto.

---

## 3. Ejecucion del Analisis

Se analizaron dos microservicios del repositorio: `auth-service` (TypeScript) y `notification-service` (Python).

### 3.1 Analisis de auth-service (TypeScript)

Se utilizo el linter `qodana-js:2024.3-eap` para analizar el microservicio de autenticacion:

```bash
docker run --rm \
  -v "//c/Users/Sebastian/Documents/Github/Practicas-SA-B-202204496/P5/auth-service:/data/project" \
  -v "//c/Users/Sebastian/Documents/Github/Practicas-SA-B-202204496/P6/reports/auth-service:/data/results" \
  jetbrains/qodana-js:2024.3-eap \
  --save-report
```

**Resultado:** 1 problema detectado — Severidad Moderate

### 3.2 Analisis de notification-service (Python)

Se utilizo el linter `qodana-python-community:2024.3` para analizar el microservicio de notificaciones:

```bash
docker run --rm \
  -v "//c/Users/Sebastian/Documents/Github/Practicas-SA-B-202204496/P5/notification-service:/data/project" \
  -v "//c/Users/Sebastian/Documents/Github/Practicas-SA-B-202204496/P6/reports/notification-service:/data/results" \
  jetbrains/qodana-python-community:2024.3 \
  --save-report
```

**Resultado:** 2 problemas detectados — Severidad High (ambos)

Los reportes se guardan en `P6/reports/<microservicio>/report/results/result-allProblems.json`.

---

## 4. Hallazgos Encontrados

### 4.1 Resumen general

| Microservicio | Lenguaje | Problemas | Severidad maxima |
|---------------|----------|-----------|-----------------|
| auth-service | TypeScript | 1 | Moderate |
| notification-service | Python | 2 | High |
| **Total** | | **3** | |

---

### 4.2 Problemas identificados — auth-service

#### Problema 1: Redundant 'await' expression

| Campo | Detalle |
|-------|---------|
| Herramienta | Code Inspection |
| Categoria | Async code and promises |
| Severidad | Moderate |
| Archivo | `src/services/authService.ts` |
| Linea | 44 |
| Inspeccion | ES6RedundantAwait |

**Descripcion:** Se encontro un uso redundante de `await` sobre una expresion que no retorna una promesa. Especificamente en la llamada a `bcrypt.compare()` dentro de la funcion de validacion de credenciales.

**Codigo afectado:**
```typescript
const valid = await bcrypt.compare(data.password, user.password);
```

**Explicacion del problema:** Aunque `bcrypt.compare()` si retorna una promesa y el `await` es tecnicamente correcto en este caso, Qodana lo marca porque en ciertos contextos el `await` puede ser eliminado en declaraciones `return` para mejorar el rendimiento aprovechando las optimizaciones de async stack traces del motor V8.

**Impacto:** Bajo. El codigo funciona correctamente. Es una sugerencia de optimizacion de rendimiento, no un error critico.

---

### 4.3 Problemas identificados — notification-service

#### Problema 1: Deprecated function, class, or module

| Campo | Detalle |
|-------|---------|
| Herramienta | Code Inspection |
| Categoria | Python |
| Severidad | High |
| Archivo | `main.py` |
| Linea | 37 |
| Inspeccion | PyDeprecationInspection |

**Descripcion:** Se esta utilizando `datetime.utcnow()` que fue marcado como deprecado en Python 3.12. El mensaje de Qodana recomienda usar objetos con informacion de zona horaria (timezone-aware) en lugar de objetos naive.

**Codigo afectado:**
```python
"sent_at": datetime.utcnow().isoformat()
```

**Correccion recomendada:**
```python
from datetime import datetime, timezone
"sent_at": datetime.now(timezone.utc).isoformat()
```

**Impacto:** Medio-Alto. Aunque el codigo funciona en versiones actuales de Python, en versiones futuras este metodo sera eliminado completamente. Ademas, usar objetos sin zona horaria puede causar inconsistencias en sistemas distribuidos donde los servidores estan en diferentes zonas horarias.

---

#### Problema 2: Unsatisfied package requirements

| Campo | Detalle |
|-------|---------|
| Herramienta | Code Inspection |
| Categoria | Python |
| Severidad | High |
| Archivo | `main.py` |
| Linea | 1 |
| Inspeccion | PyPackageRequirementsInspection |

**Descripcion:** Qodana detecto que los paquetes `fastapi==0.109.0`, `uvicorn==0.27.0`, `python-jose[cryptography]==3.3.0` y `pydantic==2.5.3` estan declarados en `requirements.txt` pero no se encuentran instalados en el entorno de analisis del contenedor.

**Explicacion:** Este problema ocurre porque Qodana corre dentro de un contenedor Docker limpio sin las dependencias del proyecto instaladas. No es un error del codigo sino una limitacion del entorno de analisis estatico — en un pipeline de CI/CD real se configura un paso previo para instalar las dependencias antes del analisis.

**Impacto:** Informativo en este contexto. En un entorno de produccion este tipo de alerta si seria critica porque indicaria que el archivo `requirements.txt` esta desactualizado respecto al codigo.

---

## 5. Clasificacion de Problemas

| # | Microservicio | Tipo | Categoria | Severidad | Requiere correccion |
|---|---------------|------|-----------|-----------|---------------------|
| 1 | auth-service | Redundant await | Async/Promises | Moderate | Opcional |
| 2 | notification-service | Funcion deprecada | Deprecacion | High | Si, antes de Python 3.13 |
| 3 | notification-service | Paquetes no instalados | Dependencias | High | Informativo en CI/CD |

---

## 6. Analisis de Resultados

### 6.1 Estado general de la calidad del codigo

El codigo analizado presenta un estado de calidad aceptable para un entorno de desarrollo y aprendizaje. Se encontraron 3 problemas en total sobre 2 microservicios, lo cual es un numero bajo considerando el tamano del proyecto.

Ninguno de los problemas encontrados es de severidad Critical o Blocker, lo que indica que el codigo no tiene errores graves de seguridad ni fallas de logica evidentes que impidan su funcionamiento.

### 6.2 Problema mas critico a corregir

El problema prioritario es el uso de `datetime.utcnow()` en el notification-service. Este metodo fue deprecado oficialmente en Python 3.12 y su eliminacion esta planificada en versiones futuras. La correccion es simple y no requiere cambios en la logica del sistema, solo reemplazar la llamada por `datetime.now(timezone.utc)`.

En sistemas distribuidos como el que se construyo en estas practicas, manejar fechas sin informacion de zona horaria es una fuente comun de bugs dificiles de diagnosticar, especialmente cuando los servidores estan en diferentes regiones geograficas.

### 6.3 Valor del analisis estatico en el proyecto

Aplicar Qodana sobre el repositorio de microservicios demuestra como el analisis estatico puede integrarse en el flujo de trabajo de desarrollo para mantener la calidad del codigo de forma automatizada. En un pipeline de CI/CD real, Qodana correria en cada pull request bloqueando merges que introduzcan problemas de severidad High o Critical, garantizando que el codigo que llega a produccion cumpla con los estandares definidos.

La combinacion de Kubernetes (P5) para el despliegue y Qodana (P6) para la calidad del codigo representa un flujo de DevOps completo: el codigo se analiza estaticamente antes de construir las imagenes Docker, se conteneirza, y se despliega en el cluster de forma automatizada y escalable.

---
