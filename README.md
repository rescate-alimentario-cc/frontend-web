# Rescate Alimentario — Frontend

Interfaz web del proyecto parcial de CS2032 (Cloud Computing, UTEC, 2026-2).
Consume los microservicios a traves de AWS API Gateway y se despliega en AWS Amplify.

## Estado actual

Pantalla de organizaciones (MS1), con tres metodos REST:

| Metodo | Endpoint | Donde se usa |
|---|---|---|
| GET | `/organizations` | Listado con filtro por tipo |
| POST | `/organizations` | Formulario de registro |
| GET | `/organizations/{id}/sites` | Sedes al expandir una fila |
| GET | `/health` | Indicador de conexion de la barra superior |

## Correr en local

```bash
npm install
cp .env.example .env.local
npm run dev
```

El laboratorio de AWS debe estar encendido para ver datos reales.

## Desplegar

Push a `main`. Amplify construye con `amplify.yml` y publica automaticamente.
La variable `VITE_API_BASE_URL` se define en la consola de Amplify, no en el repo.
