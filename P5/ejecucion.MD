# REACTIVAR CRONJOB
* kubectl patch cronjob cronjob-log -n sa-p5 -p '{"spec":{"suspend":true}}' // Para suspender el cronjob
* kubectl get cronjobs -n sa-p5 // Para verificar el estado del cronjob
* kubectl patch cronjob cronjob-log -n sa-p5 -p '{"spec":{"suspend":false}}' // Para reactivar el cronjob

# Levantar Minikube
 * minikube start --driver=docker
# Verificar el estado de Minikube
 * minikube status
# Apuntar Docker a Minikube
 * eval $(minikube -p minikube docker-env)

 # Reconstruir la imagen de la aplicación
 * docker build -t api-gateway:v1 ./api-gateway
 * docker build -t auth-service:v1 ./auth-service
 * docker build -t payroll-service:v1 ./payroll-service
 * docker build -t approval-service:v1 ./approval-service
 * docker build -t notification-service:v1 ./notification-service
 * docker build -t cronjob-script:v1 ./k8s/cronjob

 # Verificar que las imágenes se hayan construido correctamente
    * docker images

# Desplegar en orden 
* kubectl apply -f k8s/namespace.yaml
* kubectl apply -f k8s/configmap.yaml
* kubectl apply -f k8s/secret.yaml
* kubectl apply -f k8s/auth-service/
* kubectl apply -f k8s/payroll-service/
* kubectl apply -f k8s/approval-service/
* kubectl apply -f k8s/notification-service/
* kubectl apply -f k8s/api-gateway/
* kubectl apply -f k8s/cronjob/cronjob.yaml

# Verificar que los pods estén corriendo
* kubectl get pods -n sa-p5

# Obtener la URL del API Gateway
* minikube service api-gateway-service -n sa-p5 --url

# Demostrar Kubernetes corriendo en Minikube
* kubectl get all -n sa-p5

# Demostrar el Namespace
* kubectl get namespaces

# Demostar los Deployments
* kubectl get deployments -n sa-p5

# Demostrar los Services
* kubectl get services -n sa-p5

# Demostrar los CronJobs
* kubectl get cronjobs -n sa-p5

# Demostrar los recursos (CPU, RAM)
kubectl describe pod -n sa-p5 -l app=auth-service

# Demostar los HPA
* kubectl get hpa -n sa-p5

# Demostar que se creo un Job
* kubectl get jobs -n sa-p5
