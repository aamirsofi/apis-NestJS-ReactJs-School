# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the Fee Management System.

## Prerequisites

- Kubernetes cluster (local: minikube, kind, or Docker Desktop Kubernetes)
- kubectl configured
- Docker images built and pushed to a registry (or use local registry)

## Structure

```
k8s/
├── namespace.yaml           # Namespace for the application
├── postgres/                # PostgreSQL database
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── pvc.yaml
│   └── secret.yaml
├── backend/                 # NestJS backend
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── secret.yaml
└── frontend/                # React frontend
    ├── deployment.yaml
    ├── service.yaml
    └── ingress.yaml
```

## Quick Start

### 1. Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Deploy PostgreSQL

```bash
kubectl apply -f k8s/postgres/
```

### 3. Deploy Backend

```bash
kubectl apply -f k8s/backend/
```

### 4. Deploy Frontend

```bash
kubectl apply -f k8s/frontend/
```

### 5. Deploy Everything at Once

```bash
kubectl apply -f k8s/
```

## Building and Pushing Docker Images

Before deploying, build and push your images:

```bash
# Build backend
cd backend
docker build -t fee-management-backend:latest .
docker tag fee-management-backend:latest your-registry/fee-management-backend:latest
docker push your-registry/fee-management-backend:latest

# Build frontend
cd frontend
docker build -t fee-management-frontend:latest .
docker tag fee-management-frontend:latest your-registry/fee-management-frontend:latest
docker push your-registry/fee-management-frontend:latest
```

For local development with minikube:

```bash
# Use minikube's Docker daemon
eval $(minikube docker-env)

# Build images locally
cd backend && docker build -t fee-management-backend:latest .
cd ../frontend && docker build -t fee-management-frontend:latest .
```

## Updating Image References

Edit the deployment files to use your registry:

```yaml
# In k8s/backend/deployment.yaml and k8s/frontend/deployment.yaml
image: your-registry/fee-management-backend:latest
```

## Ingress Setup

For ingress to work, you need an ingress controller:

```bash
# NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# For minikube
minikube addons enable ingress
```

## Accessing the Application

### Port Forwarding (Development)

```bash
# Backend
kubectl port-forward -n fee-management svc/backend 3000:3000

# Frontend
kubectl port-forward -n fee-management svc/frontend 5173:80

# PostgreSQL
kubectl port-forward -n fee-management svc/postgres 5432:5432
```

### Using Ingress

Add to `/etc/hosts`:
```
127.0.0.1 fee-management.local
127.0.0.1 api.fee-management.local
```

Access:
- Frontend: http://fee-management.local
- Backend API: http://api.fee-management.local/api

## Scaling

Scale deployments:

```bash
# Scale backend to 3 replicas
kubectl scale deployment backend -n fee-management --replicas=3

# Scale frontend to 3 replicas
kubectl scale deployment frontend -n fee-management --replicas=3
```

## Monitoring

Check pod status:

```bash
kubectl get pods -n fee-management
kubectl get services -n fee-management
kubectl get ingress -n fee-management
```

View logs:

```bash
kubectl logs -n fee-management deployment/backend
kubectl logs -n fee-management deployment/frontend
kubectl logs -n fee-management deployment/postgres
```

## Secrets Management

Update secrets:

```bash
# Update PostgreSQL password
kubectl create secret generic postgres-secret \
  --from-literal=username=postgres \
  --from-literal=password=newpassword \
  -n fee-management \
  --dry-run=client -o yaml | kubectl apply -f -

# Update JWT secret
kubectl create secret generic backend-secret \
  --from-literal=jwt-secret=new-secret \
  -n fee-management \
  --dry-run=client -o yaml | kubectl apply -f -
```

## Cleanup

Remove everything:

```bash
kubectl delete namespace fee-management
```

## Production Considerations

1. **Use managed database**: Consider using a managed PostgreSQL service instead of deploying in Kubernetes
2. **Use secrets management**: Use external secrets operator or Vault
3. **Configure resource limits**: Adjust CPU/memory based on your needs
4. **Set up monitoring**: Add Prometheus and Grafana
5. **Configure autoscaling**: Use HorizontalPodAutoscaler
6. **Use ConfigMaps**: Move environment variables to ConfigMaps
7. **Set up TLS**: Configure SSL certificates for ingress
8. **Backup strategy**: Set up database backups

