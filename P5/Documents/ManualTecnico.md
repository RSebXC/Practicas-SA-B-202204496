# Documentacion Tecnica — Practica 5
## Despliegue en Kubernetes — Sistema de Gestion de Planillas

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

### 1.1 Que es Kubernetes

Kubernetes es una plataforma de orquestacion de contenedores de codigo abierto desarrollada originalmente por Google. Su funcion principal es automatizar el despliegue, escalado y gestion de aplicaciones que corren dentro de contenedores Docker.

A diferencia de Docker Compose que corre contenedores en una sola maquina, Kubernetes puede gestionar contenedores distribuidos en multiples nodos fisicos o virtuales, garantizando alta disponibilidad, recuperacion automatica ante fallos, y escalado horizontal sin intervencion manual.

Los componentes principales de un cluster de Kubernetes son el plano de control (API Server, etcd, Scheduler, Controller Manager) y los nodos trabajadores donde corren los pods con las aplicaciones.

En esta practica se utiliza Minikube, que es una implementacion local de Kubernetes que crea un cluster de un solo nodo usando Docker como driver, permitiendo simular un entorno de produccion en una maquina de desarrollo.

---

### 1.2 Como funciona un deploy en Kubernetes y cuales son sus partes

Cuando se realiza un despliegue en Kubernetes, el flujo es el siguiente:

1. El desarrollador escribe un archivo YAML que describe el estado deseado del sistema.
2. Se ejecuta `kubectl apply -f archivo.yaml` para enviar esa descripcion al API Server.
3. El Scheduler decide en que nodo del cluster va a correr el pod.
4. El Kubelet del nodo descarga la imagen Docker y arranca el contenedor.
5. El Controller Manager vigila constantemente que el estado real coincida con el estado deseado. Si un pod falla, lo reinicia automaticamente.

Las partes de un despliegue son:

- **Namespace:** Espacio de nombres logico que aísla recursos dentro del cluster.
- **ConfigMap:** Almacena variables de configuracion no sensibles.
- **Secret:** Almacena credenciales y datos sensibles de forma codificada.
- **Deployment:** Define cuantas replicas de un pod deben correr y como deben configurarse.
- **Service:** Expone los pods a traves de una IP estable, ya sea interna o externa.
- **HorizontalPodAutoscaler (HPA):** Escala automaticamente el numero de pods segun la carga de CPU o memoria.

---

### 1.3 Que es un Deployment

Un Deployment es un objeto de Kubernetes que describe el estado deseado de una aplicacion: que imagen Docker usar, cuantas replicas deben estar corriendo, que recursos de CPU y RAM puede usar cada pod, y como deben configurarse las variables de entorno.

El Deployment crea y gestiona un ReplicaSet, que es el responsable de mantener el numero exacto de pods especificados en todo momento. Si un pod se cae, el ReplicaSet crea uno nuevo automaticamente sin intervencion manual.

Ademas, los Deployments permiten actualizaciones sin tiempo de inactividad mediante rolling updates, donde los pods viejos se reemplazan gradualmente por los nuevos.

En esta practica cada microservicio tiene su propio Deployment con los siguientes parametros de recursos:

| Parametro | Valor |
|-----------|-------|
| CPU request | 100m (0.1 vCPU) |
| CPU limit | 250m (0.25 vCPU) |
| RAM request | 128Mi |
| RAM limit | 256Mi |

El campo `requests` es la cantidad minima garantizada, y `limits` es el maximo que el contenedor puede consumir antes de ser limitado o reiniciado.

---

### 1.4 Que es un Service

Un Service es un objeto de Kubernetes que proporciona una IP y un nombre DNS estable para acceder a un conjunto de pods. Esto es necesario porque los pods son efimeros: cada vez que se reinician obtienen una IP diferente. El Service actua como un balanceador de carga interno que distribuye el trafico hacia los pods disponibles.

Existen varios tipos de Service. En esta practica se usan dos:

**ClusterIP (por defecto):** La IP del servicio solo es accesible desde dentro del cluster. Se usa para la comunicacion interna entre microservicios. Auth, Payroll, Approval y Notification usan este tipo porque no deben ser accedidos directamente desde el exterior.

**NodePort:** Expone el servicio en un puerto fijo del nodo host, permitiendo acceso desde fuera del cluster. Solo el API Gateway usa este tipo, en el puerto 30080, porque es el unico punto de entrada autorizado del sistema.

---

### 1.5 Que es un CronJob

Un CronJob es un objeto de Kubernetes que programa la ejecucion automatica de tareas en intervalos de tiempo definidos mediante expresiones cron, el mismo formato que se usa en sistemas Linux.

Cuando llega el momento programado, Kubernetes crea un Job, y el Job crea un Pod que ejecuta el contenedor una vez y luego termina. Si la tarea falla, el Job puede reintentar la ejecucion segun la politica configurada (`restartPolicy: OnFailure`).

En esta practica el CronJob `cronjob-log` se ejecuta cada 2 minutos con la expresion `*/2 * * * *`. Cada ejecucion levanta un pod temporal con un script de Python que inserta un registro en la base de datos Neon PostgreSQL con la fecha y hora actual en zona horaria GMT-6 (America/Guatemala) y el numero de carne del estudiante.

---

## 2. Comandos Utilizados

### 2.1 Preparacion del entorno

```bash
minikube start --driver=docker
```
Inicia el cluster de Kubernetes local usando Docker como hypervisor. Crea una maquina virtual con un nodo unico que actua como master y worker al mismo tiempo.

```bash
minikube addons enable metrics-server
```
Habilita el addon metrics-server dentro del cluster. Este componente recolecta metricas de uso de CPU y memoria de los pods, lo cual es necesario para que el HorizontalPodAutoscaler pueda tomar decisiones de escalado.

```bash
minikube addons enable ingress
```
Habilita el controlador de Ingress NGINX dentro del cluster, permitiendo gestionar el enrutamiento HTTP externo si se necesita en el futuro.

```bash
eval $(minikube -p minikube docker-env)
```
Configura las variables de entorno del shell para que el comando `docker` apunte al daemon de Docker que corre dentro de Minikube, en lugar del Docker del sistema host. Esto es necesario para que las imagenes construidas localmente sean visibles para el cluster sin necesidad de subirlas a un registry externo.

---

### 2.2 Construccion de imagenes Docker

```bash
docker build -t api-gateway:v1 ./api-gateway
docker build -t auth-service:v1 ./auth-service
docker build -t payroll-service:v1 ./payroll-service
docker build -t approval-service:v1 ./approval-service
docker build -t notification-service:v1 ./notification-service
docker build -t cronjob-script:v1 ./k8s/cronjob
```
Construye las imagenes Docker de cada microservicio dentro del contexto de Minikube. El flag `-t` asigna un nombre y etiqueta a la imagen. Al usar `imagePullPolicy: Never` en los manifiestos, Kubernetes usa estas imagenes locales directamente sin intentar descargarlas de Docker Hub.

---

### 2.3 Despliegue de recursos en Kubernetes

```bash
kubectl apply -f k8s/namespace.yaml
```
Crea el namespace `sa-p5` en el cluster. Todos los recursos posteriores se crean dentro de este namespace para mantenerlos aislados del resto del cluster.

```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
```
Crea el ConfigMap con las variables de configuracion de la base de datos (host, puerto, nombre, usuario) y el Secret con las credenciales sensibles (password, JWT secret, AES key). Los pods los referencian en sus variables de entorno mediante `valueFrom`.

```bash
kubectl apply -f k8s/auth-service/
kubectl apply -f k8s/payroll-service/
kubectl apply -f k8s/approval-service/
kubectl apply -f k8s/notification-service/
```
Aplica todos los archivos YAML dentro de cada carpeta de microservicio: el Deployment, el Service ClusterIP y el HPA. Kubernetes crea los pods y los mantiene en ejecucion.

```bash
kubectl apply -f k8s/api-gateway/
```
Despliega el API Gateway al final, una vez que los demas servicios ya estan corriendo. Incluye el Deployment, el Service NodePort en el puerto 30080 y el HPA.

```bash
kubectl apply -f k8s/cronjob/cronjob.yaml
```
Crea el CronJob que ejecuta el script Python cada 2 minutos para insertar registros en la base de datos.

---

### 2.4 Comandos de verificacion y monitoreo

```bash
kubectl get all -n sa-p5
```
Muestra todos los recursos dentro del namespace sa-p5: pods, services, deployments, replicasets, HPAs y cronjobs con su estado actual.

```bash
kubectl get pods -n sa-p5
```
Lista solo los pods con su estado (Running, Pending, CrashLoopBackOff), numero de reinicios y tiempo de vida.

```bash
kubectl get services -n sa-p5
```
Muestra los services con su tipo (ClusterIP / NodePort), IP interna asignada y puertos expuestos.

```bash
kubectl get hpa -n sa-p5
```
Muestra el estado de los HorizontalPodAutoscalers: uso actual de CPU, replicas deseadas y replicas actuales.

```bash
kubectl get cronjobs -n sa-p5
```
Muestra los cronjobs con su schedule, si estan suspendidos y la ultima vez que se ejecutaron.

```bash
kubectl get jobs -n sa-p5
```
Lista los Jobs creados por el CronJob en cada ejecucion, con su estado de completado o fallido.

```bash
kubectl logs -n sa-p5 <nombre-del-pod>
```
Muestra los logs de stdout/stderr de un pod especifico. Util para diagnosticar errores de arranque o comportamiento inesperado.

```bash
kubectl logs job/<nombre-del-job> -n sa-p5
```
Muestra los logs de una ejecucion especifica del CronJob, permitiendo verificar que el script inserto el registro correctamente.

```bash
kubectl describe pod <nombre> -n sa-p5
```
Muestra informacion detallada de un pod: eventos de scheduling, imagenes usadas, variables de entorno, estado de los health checks y errores de contenedor.

```bash
minikube service api-gateway -n sa-p5 --url
```
Obtiene la URL publica del servicio NodePort del API Gateway en el formato `http://IP:30080`. Esta URL se usa en Postman para hacer las pruebas.

---

### 2.5 Comandos de limpieza

```bash
kubectl delete namespace sa-p5
```
Elimina el namespace y todos los recursos que contiene (pods, services, deployments, HPAs, cronjobs) en un solo comando.

```bash
minikube stop
```
Detiene el cluster de Minikube liberando los recursos del sistema, sin eliminar la configuracion ni las imagenes.

```bash
minikube delete
```
Elimina completamente el cluster de Minikube incluyendo todas las imagenes, configuraciones y datos almacenados.

---

## 3. Estructura del Repositorio

```
P5/
├── api-gateway/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── auth-service/
│   ├── Dockerfile
│   └── src/
├── payroll-service/
│   ├── Dockerfile
│   └── src/
├── approval-service/
│   ├── Dockerfile
│   └── main.py
├── notification-service/
│   ├── Dockerfile
│   └── main.py
└── k8s/
    ├── namespace.yaml
    ├── configmap.yaml
    ├── secret.yaml
    ├── api-gateway/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   └── hpa.yaml
    ├── auth-service/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   └── hpa.yaml
    ├── payroll-service/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   └── hpa.yaml
    ├── approval-service/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   └── hpa.yaml
    ├── notification-service/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   └── hpa.yaml
    └── cronjob/
        ├── cronjob.yaml
        ├── Dockerfile
        └── script.py
```

---

*Rodrigo Sebastian Castro Aguilar — 202204496 — Software Avanzado Seccion B — USAC 2026*