# Regla: Rendimiento, caché y trabajo asíncrono en NestJS 11.1

Esta regla define cómo cumplir el **objetivo de latencia** (motor de disponibilidad **<200 ms**
percibida) y cómo mover trabajo pesado fuera del camino de la petición. La eficiencia de las
**consultas e índices** es competencia de `mongodb-indexing-and-performance.md` (única fuente de
verdad para el modelo de datos); esta regla cubre la **capa de aplicación**. Trabaja con
`nestjs-data-access-mongoose.md` y `nestjs-errors-and-observability.md`.

## 1. Presupuesto de latencia (<200 ms)

- El endpoint de disponibilidad y los caminos calientes deben responder por debajo de **200 ms**
  percibidos. Consíguelo con: índices adecuados (delegado a `mongodb-indexing-and-performance.md`),
  proyección mínima, `.lean()` en lecturas, caché de lo repetido y evitando `$lookup` en caliente
  (replantea el modelo con Extended Reference, ver `mongodb-data-modeling.md`).
- Aplica un **interceptor de timeout** en los caminos sensibles para acotar la cola de peticiones
  colgadas, y mide con logging de duración (ver `nestjs-errors-and-observability.md`).

## 2. Caché con Redis (CacheModule)

- Usa el `CacheModule` de `@nestjs/cache-manager`. En NestJS 11 se apoya en **cache-manager v6 sobre
  Keyv**; usa el store de **Redis** (`@keyv/redis`, dependencias por instalar) para caché
  distribuida entre instancias.
- **Cachea por tenant**: la clave de caché **debe** incluir el `tenantId` (y demás discriminantes)
  para no servir datos de un tenant a otro. Una clave de caché sin `tenantId` es el mismo defecto de
  fuga que una query sin `tenantId` (ver `mongodb-multitenancy.md`).
- Cachea catálogo y disponibilidad (lecturas frecuentes y poco cambiantes) con **TTL** corto;
  **invalida** en la escritura que cambia el dato. No caches datos personales sensibles sin
  justificarlo.

✅ Clave de caché namespaced por tenant:

```typescript
const cacheKey = `availability:${tenantId}:${employeeId}:${day}`;
```

## 3. Trabajo diferido con colas (BullMQ, opcional)

- Saca del camino de la petición el trabajo lento o con reintentos: envío de emails/SMS de
  confirmación, recordatorios, webhooks. Usa **BullMQ** sobre Redis (`@nestjs/bullmq`, opcional y por
  instalar) con productores/consumidores tipados.
- Los jobs son **idempotentes** y llevan el `tenantId` en su payload para reconstruir el contexto en
  el worker (no hay `AsyncLocalStorage` de la petición HTTP en el consumidor). Define reintentos con
  backoff y una cola de fallidos (DLQ) para lo no recuperable.
- No metas trabajo lento ni llamadas externas dentro de una transacción de Mongo (ver
  `mongodb-transactions-and-integrity.md` §3): publica el job tras confirmar la escritura.

## 4. Paginación y streaming

- Pagina con **keyset/rango** sobre un campo indexado, **no** con `skip` grande (ver
  `mongodb-indexing-and-performance.md` §3). Expón cursores estables en la API, no offsets.
- Para respuestas grandes, prefiere proyección + paginación antes que devolver colecciones enteras.

## 5. Programación asíncrona correcta

- No dejes **promesas flotantes**: `await` o gestión explícita (el proyecto marca
  `@typescript-eslint/no-floating-promises`). Paraleliza llamadas independientes con `Promise.all`;
  no serialices `await` innecesariamente en caminos calientes.
- NestJS 11 sobre **Express 5** y Node 24 admite `async`/`await` y top-level await; mantén los
  handlers no bloqueantes (nada de CPU pesada síncrona en el event loop: derívala a un worker/cola).
