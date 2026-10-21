# RetroVault Web

Frontend Angular 21 con componentes standalone, signals, rutas diferidas y HttpClient. Se usa Angular 21 por compatibilidad con el Node.js 24.14 disponible.

```powershell
npm ci
npm start
```

Abrí `http://127.0.0.1:4200` con la API en el puerto 8000. Para instalación completa, variables, pruebas y despliegue, consultá el [README del repositorio](../README.md).

```powershell
npm run build
npm test
```

Las pruebas requieren Postman CLI >= 1.70 y Edge (o `PLAYWRIGHT_CHANNEL=chrome`). Inician su propia API simulada y nunca escriben en la colección real.
