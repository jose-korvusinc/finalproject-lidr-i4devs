---
name: nestjs-backend-dev
description: Desarrolla el backend NestJS 11.1 del proyecto (módulos de dominio, controladores finos, servicios, DTOs con class-validator, acceso a datos con @nestjs/mongoose, contexto multitenant por AsyncLocalStorage, seguridad JWT/helmet/CORS/rate-limit, caché Redis, manejo de errores, observabilidad y tests) siguiendo las rules `nestjs-*` y `mongodb-*` como única fuente de verdad. Úsala cuando el usuario pida crear, generar o modificar código del backend en `code/backend` (módulos, controladores, servicios, DTOs, esquemas Mongoose, guards, interceptors, filtros o tests). NUNCA toca el frontend; delega el diseño del modelo de datos y las migraciones a las skills `mongodb-*`.
---

# Skill: Desarrollo del backend NestJS 11.1

Implementa código de **backend** en `code/backend` (NestJS 11.1, Express 5, Node 24, Mongoose 9 vía
`@nestjs/mongoose`, `migrate-mongo` para migraciones — **NO Prisma**). La skill **no inventa**
convenciones: las toma de las rules `nestjs-*` (capa de aplicación) y `mongodb-*` (capa de datos),
que son la **única fuente de verdad**.

## Fuente de verdad (OBLIGATORIO leer antes de escribir código)

Lee y aplica SIEMPRE estas rules. Si hay conflicto, las rules mandan sobre cualquier suposición:

Capa de aplicación (NestJS):

- `.claude/rules/nestjs-architecture.md` → módulos por dominio, controladores finos, DI/scopes,
  routing/versionado, config validada, ciclo de vida, transversales; inglés y sin comentarios.
- `.claude/rules/nestjs-validation-and-dtos.md` → DTOs, `ValidationPipe` whitelist, anti-inyección
  de operadores, serialización, OpenAPI.
- `.claude/rules/nestjs-data-access-mongoose.md` → cableado `@nestjs/mongoose`, filtro `tenantId`
  transversal, atomicidad/transacciones, `autoIndex` off.
- `.claude/rules/nestjs-security-and-multitenancy.md` → contexto de tenant (AsyncLocalStorage),
  guard de tenant, JWT, helmet, CORS, rate-limit, secretos.
- `.claude/rules/nestjs-performance-and-async.md` → caché Redis por tenant, BullMQ opcional,
  presupuesto <200 ms, paginación keyset.
- `.claude/rules/nestjs-errors-and-observability.md` → exception filter, IntrinsicException, logging
  estructurado (ConsoleLogger json), Terminus health, auditoría.
- `.claude/rules/nestjs-testing-and-quality.md` → Jest/ts-jest + supertest, tests de aislamiento
  entre tenants, lint/prettier.

Capa de datos (fuente de verdad; NO reescribir):

- `.claude/rules/mongodb-multitenancy.md`, `mongodb-security.md`, `mongodb-schema-conventions.md`,
  `mongodb-transactions-and-integrity.md`, `mongodb-indexing-and-performance.md`,
  `mongodb-data-modeling.md`, `mongodb-normalization-fnbc.md`, `mongodb-scalability-and-evolution.md`.

Y `.claude/rules/file-naming.md` para los nombres de fichero.

No copies el contenido de las rules aquí: léelas en tiempo de ejecución (única fuente de verdad).

## Alcance (ESTRICTO)

- Trabaja **solo** en `code/backend`. **NUNCA** toques `code/frontend/`, ficheros `angular-*` ni el
  navegador.
- El **diseño del modelo de datos** (colecciones, tipos, embed/reference, índices, validadores
  `$jsonSchema`) se delega a la skill `mongodb-domain-model`. La **creación/migración en base**
  (colecciones, índices, validadores) se delega a la skill `mongodb-migrations` (`migrate-mongo`).
  Esta skill **consume** esos artefactos e implementa la capa de aplicación que los usa; no crea
  índices ni valida esquema desde el arranque de la app (`autoIndex` off).

## Antes de escribir: reconoce el proyecto real

Lee y respeta la configuración instalada (no asumas):

- `code/backend/package.json` (versiones `@nestjs/*`, qué está instalado y qué falta),
  `nest-cli.json`, `tsconfig.json`, `eslint.config.mjs`, `.env.example`, y la estructura de `src/`.
- Si una capacidad requiere una dependencia **no instalada** (p. ej. `@nestjs/swagger`,
  `@nestjs/terminus`, `helmet`, `@nestjs/throttler`, `@nestjs/jwt`, `@nestjs/cache-manager`,
  `@keyv/redis`, `@nestjs/bullmq`), **decláralo**: indica el `npm install` necesario y no supongas
  que ya existe.
- Testing: el proyecto usa **Jest + ts-jest** (no Vitest); sigue esa configuración.

## Flujo de trabajo

1. **Leer las rules `nestjs-*`, las `mongodb-*` relevantes y `file-naming.md`** antes de nada.
2. **Reconocer el proyecto** (sección anterior): versiones, dependencias presentes/ausentes,
   estructura, dominio real (`sections_readme/`, `system_architecture/`).
3. **Diseñar el cambio** por módulo de dominio: qué controlador (fino), servicio(s), DTOs, esquema
   Mongoose y transversales (guard de tenant, interceptores, filtro) intervienen. Traza cada endpoint
   a una historia de usuario/caso de uso.
4. **Implementar** en inglés y **sin comentarios**, con nombres de fichero `kebab-case` + sufijo:
   - **Controlador fino** versionado (`@Controller({ path, version })`), delega en el servicio.
   - **DTOs** con `class-validator`; confía en el `ValidationPipe` global (whitelist,
     forbidNonWhitelisted, transform) y en `@IsMongoId()` para evitar inyección de operadores `$`.
   - **Servicio de negocio** con la lógica; **servicio/repositorio de datos** con `@InjectModel`,
     proyección mínima, `.lean()` y escritura atómica para invariantes (no doble reserva).
   - **`tenantId` transversal**: plugin de Mongoose que lo inyecta desde el contexto
     (`AsyncLocalStorage`) + guard que valida su presencia (fail-closed). Nunca del body.
   - **Errores** con `HttpException` correctas (duplicado → 409) y forma de error uniforme por el
     exception filter; logging estructurado con `requestId`/`tenantId`.
5. **Cablear en el módulo** (`forFeature`, providers, exports) y en el `AppModule`/bootstrap lo
   global (ValidationPipe, ClassSerializerInterceptor, guard, filtro, versioning, shutdown hooks,
   ConfigModule validado).
6. **Tests** (`nestjs-testing-and-quality.md`): unitarios de la lógica y e2e con supertest,
   **incluido al menos un test de aislamiento entre tenants** (tenant A no ve datos de B) y el
   rechazo de consulta sin tenant.
7. **Verificar calidad**: `npm run lint` y `npm test` (y `test:e2e` si aplica) deben pasar; sin
   `any` en fronteras de entrada; sin comentarios; nombres correctos.
8. **Handoff de datos**: si el cambio necesita una colección/índice/validador nuevos, **no** los
   crees desde la app: entrega la lista a la skill `mongodb-migrations` y, si falta modelar, a
   `mongodb-domain-model`.

## Patrones clave (referencia)

Contexto de tenant por petición (AsyncLocalStorage) + filtro transversal:

```typescript
this.als.run({ tenantId, requestId: randomUUID() }, () => next());
```

Escritura condicional atómica para la invariante de no doble reserva (diseño en
`mongodb-transactions-and-integrity.md`):

```typescript
await this.model.updateOne(
  { tenantId, employeeId, startsAt, status: { $exists: false } },
  { $setOnInsert: { status: "confirmed", createdAt: new Date() } },
  { upsert: true },
);
```

Bootstrap con las globales obligatorias:

```typescript
app.enableVersioning({ type: VersioningType.URI });
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
app.enableShutdownHooks();
```

## Lista de verificación de calidad (antes de terminar)

- [ ] He leído las rules `nestjs-*` y las `mongodb-*` relevantes como fuente de verdad.
- [ ] Solo he tocado `code/backend`; no he tocado el frontend ni la base de datos.
- [ ] Controladores finos; lógica en servicios; acceso a datos aislado.
- [ ] DTOs validados + `ValidationPipe` whitelist; sin construir queries desde el cliente.
- [ ] `tenantId` inyectado transversalmente y validado por guard; ninguna query sin tenant.
- [ ] Invariantes (no doble reserva) con escritura atómica; errores mapeados a HTTP correctos.
- [ ] Serialización a DTOs; no se filtran `_id`/`tenantId`/internos.
- [ ] Caché con clave namespaced por `tenantId`; sin promesas flotantes.
- [ ] Tests unitarios + e2e, **incluido aislamiento entre tenants**; `lint` y `test` pasan.
- [ ] Código en inglés, sin comentarios; nombres de fichero según `file-naming.md`.
- [ ] Colecciones/índices/validadores nuevos delegados a `mongodb-migrations`/`mongodb-domain-model`.

## Ejemplos de invocación

- "Implementa el módulo de reservas (crear/cancelar) con su controlador, servicio, DTOs y tests."
- "Añade el guard de tenant y el plugin de Mongoose que inyecta `tenantId` desde el contexto."
- "Expón health checks con Terminus y logging estructurado JSON."
