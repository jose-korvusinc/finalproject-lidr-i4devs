# Regla: Manejo de errores y observabilidad en NestJS 11.1

Esta regla define cómo el backend NestJS **gestiona errores**, **registra** lo que ocurre y **expone
su salud**. Complementa `mongodb-security.md` §5 (auditoría sin datos personales en claro) y trabaja
con `nestjs-architecture.md`, `nestjs-security-and-multitenancy.md` y `nestjs-performance-and-async.md`.

## 1. Excepciones de dominio y HTTP

- Lanza las **`HttpException`** de NestJS (`BadRequestException`, `NotFoundException`,
  `ConflictException`, `ForbiddenException`, …) desde los servicios; deja que NestJS mapee el código
  de estado. **No** devuelvas errores como valores ni uses `throw new Error(...)` genérico para
  flujo de negocio.
- Mapea las invariantes de datos a estados HTTP correctos: p. ej. el rechazo de **doble reserva** por
  el índice único (`mongodb-transactions-and-integrity.md` §2) se traduce a **409 Conflict**, no a un
  500. Captura el error de clave duplicada de Mongo y conviértelo.

## 2. Exception filter global y forma de error uniforme

- Registra un **`ExceptionFilter` global** que devuelva una forma de error **estable y sin fugas**:
  `{ statusCode, error, message, requestId, timestamp }`. **Nunca** expongas stack traces, nombres de
  colección, queries ni `tenantId` en la respuesta de error.
- Usa **`IntrinsicException`** (NestJS 11) para las excepciones que gestionas y logueas tú, evitando
  el auto-logging duplicado del framework.
- Correlaciona cada error con el `requestId` del contexto (`nestjs-security-and-multitenancy.md` §1)
  para poder rastrearlo en los logs.

✅ Forma de respuesta de error (sin internos):

```typescript
{ statusCode: 409, error: "Conflict", message: "Slot already booked", requestId: "…", timestamp: "…" }
```

## 3. Logging estructurado

- Usa el **`ConsoleLogger` con `json: true`** (NestJS 11) para logs estructurados en producción
  (mejor ingesta en contenedores); colores solo en desarrollo local. Un nivel de log configurable vía
  `ConfigService`.
- Cada línea de log de una petición incluye `requestId`, `tenantId` y `userId` cuando existan
  (contexto de `AsyncLocalStorage`), **sin** volcar datos personales ni secretos en claro (coherente
  con `mongodb-security.md` §1 y §5).
- Un **interceptor** transversal registra método, ruta, código de estado y **duración**; sirve además
  para vigilar el presupuesto de latencia (<200 ms, ver `nestjs-performance-and-async.md` §1).

## 4. Health checks (Terminus)

- Expón `/health` (liveness) y `/health/ready` (readiness) con **`@nestjs/terminus`** (por instalar):
  readiness comprueba la conexión a **MongoDB** y a **Redis**. Excluye estas rutas del prefijo/versión
  de la API (`nestjs-architecture.md` §4) para que orquestadores y balanceadores las consulten.
- Liveness no debe depender de recursos externos (evita reinicios en cascada); readiness sí, para
  sacar de rotación una instancia cuya dependencia esté caída.

## 5. Auditoría

- Registra los **cambios sensibles** (creación/cancelación de reservas, cambios de rol, accesos a
  datos personales) con quién, qué, cuándo y a qué tenant, coherente con `mongodb-security.md` §5.
- La auditoría no es el log técnico: sepárala y consérvala según la política de retención (ver
  `mongodb-scalability-and-evolution.md` §5). No incluyas datos personales en claro.

## 6. Resiliencia

- Aplica **timeouts** y, donde proceda, reintentos con backoff a las dependencias externas; no dejes
  peticiones colgadas indefinidamente. Combina con el apagado ordenado (`nestjs-architecture.md` §6)
  para no perder trabajo en despliegues.
