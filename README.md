# RetroVault

Catálogo y colección personal de videojuegos retro. Monorepo con API FastAPI, PostgreSQL y frontend Angular.

## Desarrollo local

Requisitos: Python 3.13, Node.js 24 (probado con 24.14) y Docker Compose o Podman Compose.

Desde la raíz, levantá PostgreSQL:

```powershell
docker compose up -d
```

Prepará la API en una terminal:

```powershell
cd api
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Editá `api/.env` con la conexión local (si ya existe, conservá tu configuración):

```dotenv
DATABASE_URL=postgresql+asyncpg://retrovault:retrovault@localhost:5432/retrovault
```

Luego, desde `api`:

```powershell
.\.venv\Scripts\alembic.exe upgrade head
.\.venv\Scripts\python.exe -m scripts.seed_catalog
.\.venv\Scripts\python.exe -m uvicorn src.main:app --reload --host 127.0.0.1 --port 8000
```

El seed carga 12 juegos y 3 plataformas; es seguro ejecutarlo varias veces. La documentación interactiva de la API queda en `http://127.0.0.1:8000/docs`.

En otra terminal:

```powershell
cd web
npm ci
npm start
```

Abrí `http://127.0.0.1:4200`. El servidor Angular redirige `/api` a FastAPI en el puerto 8000. No necesitás cambiar CORS para este flujo.

## Frontend

- `/catalogo`: grilla, búsqueda normalizada y paginación con filtros en la URL.
- `/juegos/:id`: ficha y acción de agregar al backlog.
- `/coleccion`: estados, filtros, contadores y eliminación con confirmación.
- Diseño adaptable a celular, navegación por teclado, estados vacíos y reintentos ante errores.
- Las portadas ausentes tienen una ilustración CSS identificada como reemplazo.

El frontend usa los endpoints y los nombres camelCase que publica la API. Las escrituras se guardan en el servidor; no se reemplaza la colección con almacenamiento del navegador.

**Autenticación pendiente:** la API todavía usa un usuario fijo compartido. Esta versión es para desarrollo local; el login y el aislamiento real de cuentas deben completarse antes de habilitar la colección públicamente.

## Verificación del frontend

Desde `web`:

```powershell
npm run build
npm test
```

Las pruebas E2E requieren Postman CLI >= 1.70 y Microsoft Edge instalado. En otros equipos se puede usar Chrome:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm test
```

Playwright levanta Angular en el puerto 4300 y una simulación Postman en el 4900. Ambos puertos deben estar libres. Las pruebas recorren el navegador real contra esa API simulada, con datos aislados: búsqueda, paginación, ficha, alta, cambio de estado, recarga, eliminación y recuperación de errores, en escritorio y celular.

La simulación en `postman/` se basa en los routers, schemas y seed locales. Incluye un juego adicional para comprobar acentos. Sus rutas `/__test/*` son controles exclusivos de prueba; no forman parte de FastAPI. Los logs se escriben en `postman/frontend.ndjson` y no se versionan. Esta verificación no reemplaza una prueba de integración contra PostgreSQL.

Desde la raíz, podés contrastar el tráfico registrado con los schemas Pydantic reales (sin acceder a la base):

```powershell
.\api\.venv\Scripts\python.exe -B postman/check_contract.py
```

## Configuración y despliegue

- Desarrollo: `RETROVAULT_API_URL` cambia el destino del proxy, por defecto `http://127.0.0.1:8000`.
- Producción: `npm run build` genera `web/dist/web/browser`. El hosting debe servir `index.html` para rutas Angular y redirigir `/api/*` a la API, o configurarse `web/src/environments/environment.ts` con su URL pública antes de compilar. Para origen separado, configurar `CORS_ORIGINS` en la API.
- El proxy Angular funciona solo durante desarrollo; no se incluye en el build.

El plan completo está en [docs/ROADMAP.md](docs/ROADMAP.md). Deploy, autenticación, CI e ingesta de precios siguen pendientes.

## Próximos pasos (21/10)

Antes de agregar más funciones, probá el flujo completo con la API y PostgreSQL reales. Las pruebas que ejecuté usaron una API simulada.

1. Levantá la base y la API: aplicá las migraciones y ejecutá el seed siguiendo el README (README.md).
2. Abrí el frontend con cd web y npm start.
3. Probá manualmente: buscar un juego, abrir su ficha, agregarlo, cambiar el estado, recargar y quitarlo. Confirmá que los cambios persistan y que la API no registre errores.
4. Revisá el diseño en escritorio y celular para decidir si te gusta esta dirección visual.
5. Guardá esta versión en un commit cuando el recorrido funcione.

Después seguiría con autenticación real, antes de publicar una colección accesible desde internet.
