# Roadmap - Retrovault
Ocho fases, una a dos semanas cada una. Cada fase termina con algo deployado y visible, no con código en una rama.

## Fase 0 — Esqueleto y deploy (semana 1)

Objetivo: que exista una URL pública antes de escribir lógica de negocio.

- Repo con monorepo simple: /api (FastAPI), /web (Angular), /docs.
- Postgres en Neon, migraciones con Alembic desde el minuto cero.
- Endpoint /health, front con una pantalla vacía y el tema synthwave aplicado.
- Deploy: API en Render, front en Vercel. CI mínimo en GitHub Actions (lint + tests).

Hecho cuando: entrás a la URL desde el celular y ves el layout con el tema.

Por qué primero: deployar al final es la forma número uno de que un side project muera al 80%.

## Fase 1 — Catálogo y backlog (semanas 2–3)

Objetivo: el CRUD que hace que la app sirva para algo aunque no haya precios.

- Tablas platform, game, app_user, collection_item.
- Semilla de catálogo: arrancá con 2 o 3 plataformas que te interesen (N64, PS1, SNES). 200 juegos alcanzan y sobran para el MVP.
- Endpoints de listado con búsqueda y paginación.
- Front: grilla de juegos, ficha, agregar al backlog, cambiar estado.
- Auth: usá algo llave en mano. No escribas tu propio manejo de sesiones.

Hecho cuando: podés cargar tu backlog real y usarlo vos.

## Fase 2 — Ingesta (semanas 4–5)

Objetivo: traer datos crudos del mundo real y guardarlos sin procesar.

- Crear la aplicación en el portal de developers de Mercado Libre, guardar Client Id / Secret.
- Worker separado del request path (arq + Redis, o APScheduler si querés empezar simple).
- Tablas marketplace, listing, listing_price_snapshot, ingestion_run.
- Por ahora: guardar todo tal cual viene, sin matchear. listing.game_id queda en NULL.
- Rate limiting y reintentos con backoff. Loguear cada corrida en ingestion_run.

Hecho cuando: tenés miles de publicaciones crudas en la base y podés ver el historial de corridas.

Trampa a evitar: no dispares la ingesta desde un endpoint HTTP. Proceso aparte, siempre.

## Fase 3 — Matching (semana 6)

Objetivo: la parte interesante. Convertir títulos caóticos en entidades del catálogo.

- Normalización: minúsculas, sin acentos, sacar ruido conocido (original, funcionando, leer descripcion, envio gratis, emojis).
- Detección de plataforma y región desde el título.
- Matcheo por similitud: arrancá con pg_trgm de Postgres, que es sorprendentemente bueno y no requiere infra extra.
- Guardar match_confidence y match_method. Por debajo de un umbral, la publicación queda sin matchear.
- Pantalla de admin para revisar la cola de no matcheadas y corregir a mano. Cada corrección es dato de entrenamiento para ajustar reglas.

Hecho cuando: más del 70% de las publicaciones matchean con confianza alta y tenés una pantalla para auditar el resto.

## Fase 4 — Agregados y precio estimado (semana 7)

Objetivo: convertir publicaciones sueltas en una señal de precio confiable.

- Tablas fx_rate y game_price_daily.
- Job diario que calcula, por juego + condición + marketplace: mediana, p25, p75 y tamaño de muestra.
- Mediana, no promedio. En retro los outliers son brutales: repros, lotes de 20 juegos, y gente pidiendo delirios.
- Descartar agregados con menos de N observaciones (empezá con N=3) para no publicar ruido.
- Normalizar a USD usando el tipo de cambio del día. Sin esto, un histórico en pesos argentinos no dice nada.

Hecho cuando: la ficha de un juego muestra un precio estimado que te parece razonable a ojo.

## Fase 5 — Histórico y alertas (semana 8)

- Gráfico de evolución de precio en la ficha del juego.
- Tablas price_alert y alert_notification.
- Envío de mails con Resend (tiene free tier decente).
- Deduplicación: no mandar la misma alerta dos veces en 24 hs.

## Fase 6 — Presentación (semana 9)

Esta fase es la que la mayoría se saltea y es la que más rinde en un portfolio.

- README con capturas, decisiones de arquitectura y cómo levantarlo local.
- Video de 90 segundos mostrando el flujo completo.
- Un docs/case-study.md explicando los tres o cuatro problemas difíciles y cómo los resolviste.
- Datos de demo cargados para que quien entre vea algo, no una app vacía.
