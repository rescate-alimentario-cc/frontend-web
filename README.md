# Rescate Alimentario — Frontend

Interfaz web del proyecto parcial de CS2032 (Cloud Computing, UTEC, 2026-2).
React 18 + Vite + TypeScript. Consume los 5 microservicios a través de AWS API Gateway (HTTPS) y se despliega en AWS Amplify.

## Pantallas y métodos REST

| Pantalla | Microservicio | Métodos que invoca |
|---|---|---|
| **Panel** (`/`) | MS5 · MS4 | `GET /analytics/summary` · `GET /analytics/waste-by-district` · `GET /analytics/expiry-risk` · `GET /traceability/deliveries` |
| **Catálogo** (`/catalogo`) | MS2 Inventario | `GET /inventory/lots` · `GET /inventory/lots/{id}` · `GET /inventory/products` · `POST /inventory/lots` · `PATCH /inventory/lots/{id}/reserve` |
| **Organizaciones** (`/organizaciones`) | MS1 Organizaciones | `GET /organizations` · `GET /organizations/{id}` · `POST /organizations` · `GET /organizations/{id}/sites` · `POST /organizations/{id}/sites` |
| **Solicitudes** (`/solicitudes`) | MS3 Solicitudes | `GET /requests` · `GET /requests/{id}` · `POST /requests` · `PATCH /requests/{id}/status` |
| **Trazabilidad** (`/trazabilidad`) | MS4 Orquestador | `GET /traceability/lots/{id}` · `GET /traceability/deliveries` |
| **Analítica** (`/analitica`) | MS5 Analítica | `GET /analytics/summary` · `/waste-by-district` · `/expiry-risk` · `/logistics-times` · `/top-donors` |
| Barra lateral | Todos | `GET /health` (indicador de conexión) |

Los listados de MS1, MS2 y MS3 son paginados en el servidor (`limit`, `page`) y devuelven el total en la cabecera `X-Total-Count`.

## Características

- Modo claro y oscuro (respeta la preferencia del sistema y recuerda la elección).
- Gráficos con Recharts (barras, donut, apiladas) y exportación a CSV en Analítica.
- Búsqueda de organizaciones por nombre o RUC con paginación del lado del servidor (más de 20 000 registros).
- Flujo completo de solicitud: reservar lote → aprobar → en ruta → entregar con evidencia, con historial de auditoría.
- Carga bajo demanda de cada pantalla, estados de carga y error con reintento, y navegación por teclado.

## Correr en local

```bash
npm install
cp .env.example .env.local   # define VITE_API_BASE_URL con la URL del API Gateway
npm run dev
```

El laboratorio de AWS debe estar encendido para ver datos reales.

## Desplegar

Push a `main`. Amplify construye con `amplify.yml` y publica automáticamente.
La variable `VITE_API_BASE_URL` se define en la consola de Amplify, no en el repo.
Como la app usa rutas del lado del cliente (`/catalogo`, `/analitica`…), Amplify necesita la regla de reescritura
`/<*>` → `/index.html` (código 404-200), que ya está configurada.
