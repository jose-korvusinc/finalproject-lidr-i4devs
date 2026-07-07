[<- Volver al README principal](../readme.md)

## 8. Pull Requests

Cada entrega se desarrolla en una rama de feature y se integra mediante Pull Request, con los
commits organizados en **orden TDD** (tests antes que producción, ver `.claude/rules/tdd-workflow.md`)
y mensajes trazables a la historia de usuario y su issue de GitHub.

### Pull Request 1 — HU1 #3: modelo de datos de la colección `businesses`

| Campo | Valor |
| :--- | :--- |
| **Historia de usuario** | HU1 — Registro de Negocio y Creación de Espacio Aislado (Tenant) |
| **Issue** | [#3](https://github.com/jose-korvusinc/finalproject-lidr-i4devs/issues/3) — `[HU1][BE] Model businesses collection: $jsonSchema, unique subdomain & status indexes (migration)` |
| **Milestone** | HU1: Tenant registration |
| **Rama** | `feature-entrega2-JMPA` |
| **Capa** | Backend (NestJS) · datos (MongoDB) |
| **Metodología** | TDD estricto (red → green → refactor) orquestado con `/tdd` |

**Objetivo.** Crear la colección `businesses` (registro de tenants), cimiento del onboarding de HU1:
validador `$jsonSchema`, unicidad global de subdominio e índices. Desbloquea los tickets de DTOs (#4),
check de subdominio (#5), endpoint de alta (#6) y aislamiento multitenant (#7).

**Commits (orden TDD).**

| Orden | Hash | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| 1º (RED) | `e7882c9` | `test(tenants)` | Specs *failing-first* del contrato de la migración (índice único `uq_subdomain`, `idx_status`, `up`/`down` reversible con `db` mockeado) y del esquema Mongoose (`validateSync`: `status` enum, requeridos, `owner` embebido) |
| 2º (GREEN + REFACTOR) | `13c120b` | `feat(tenants)` | Enum `TenantStatus [active, suspended]` en el validador `$jsonSchema` de la migración + esquema Mongoose `business.schema.ts` alineado (owner embebido, `timestamps`, sin `autoIndex`) |

**Alcance de ficheros.**

- Tests: `code/backend/src/tenants/migrations/create-businesses-collection.spec.ts`,
  `code/backend/src/tenants/schemas/business.schema.spec.ts`.
- Producción: `code/backend/migrations/20260706120100-create-businesses-collection.js` (validador con
  enum), `code/backend/src/tenants/schemas/business.schema.ts` (nuevo).

**Estado de los tests y calidad.**

- `npm test` (Jest): **17/17 passing** (3 suites). Verde probado por **mutación** (quitar el enum ⇒ el
  test se pone en rojo).
- `npm run lint`: **0 errores** (1 *warning* preexistente en `src/main.ts`, ajeno al ticket).

**Verificación contra MongoDB en vivo (DoD).**

- Migración **reversible** e idempotente: `down` limpia validador e índices; `up` los restaura con el
  enum.
- **Unicidad de subdominio**: inserción duplicada rechazada (código `11000`, índice único).
- **Validación de estado**: `status` fuera del enum rechazado (código `121`, `$jsonSchema`).
- **`explain()`**: la consulta por `subdomain` usa `uq_subdomain` (**IXSCAN**, sin `COLLSCAN`).

**Trazabilidad.** HU1 · modelo de datos `businesses` (`sections_readme/04-data-model.md`), issue #3.

### Pull Request 2 — HU1 #4: DTOs de registro de tenant y `ValidationPipe` global

| Campo | Valor |
| :--- | :--- |
| **Historia de usuario** | HU1 — Registro de Negocio y Creación de Espacio Aislado (Tenant) |
| **Issue** | [#4](https://github.com/jose-korvusinc/finalproject-lidr-i4devs/issues/4) — `[HU1][BE] Add tenant registration DTOs with validation (Create + Response)` |
| **Milestone** | HU1: Tenant registration |
| **Rama** | `feature-entrega2-JMPA` |
| **Capa** | Backend (NestJS) · contrato HTTP |
| **Metodología** | TDD estricto (red → green → refactor) orquestado con `/tdd` |

**Objetivo.** Definir la frontera de entrada/salida del alta de tenant: DTOs validados como primera
línea de defensa (anti-inyección de operadores) y exposición mínima en la respuesta. Depende de #3;
desbloquea el check de subdominio (#5) y el endpoint de alta (#6).

**Commits (orden TDD).**

| Orden | Hash | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| 1º (RED) | `5d3fc86` | `test(tenants)` | Specs *failing-first*: validación de `CreateTenantDto` (email, slug de subdominio, whitelist rechaza props no declaradas y claves `$`) y exposición mínima de `TenantResponseDto` |
| 2º (GREEN + REFACTOR) | `cf29cff` | `feat(tenants)` | `CreateTenantDto` (`@IsEmail`, `@Matches` slug) + `TenantResponseDto` (`@Exclude`/`@Expose`, `_id`→`id`) + `ValidationPipe` global y `ClassSerializerInterceptor` en `main.ts` |

**Alcance de ficheros.**

- Tests: `code/backend/src/tenants/dto/create-tenant.dto.spec.ts`,
  `code/backend/src/tenants/dto/tenant-response.dto.spec.ts`.
- Producción: `code/backend/src/tenants/dto/create-tenant.dto.ts`,
  `code/backend/src/tenants/dto/tenant-response.dto.ts`, `code/backend/src/main.ts` (`ValidationPipe`
  global `whitelist`/`forbidNonWhitelisted`/`transform` + `ClassSerializerInterceptor`).

**Estado de los tests y calidad.**

- `npm test` (Jest): **38/38 passing** (5 suites; incluye las 17 de #3). Verde probado por **mutación**
  (debilitar el regex del subdominio ⇒ los 5 tests de rechazo se ponen en rojo).
- `npm run lint`: **0 errores** (se corrigió también el *warning* de `main.ts` con `void bootstrap()`).

**Notas de diseño.**

- El DTO de entrada usa `ownerEmail` plano; el servicio (#6) lo mapeará a `owner {name,email}`.
- `TenantResponseDto` mapea la identidad `_id → id` (mediante `@Expose` + `@Transform`) y oculta
  `_id`, `tenantId`, `owner`, `schemaVersion`, `createdAt`, `updatedAt` con `excludeExtraneousValues`.
- No se usa `@nestjs/swagger` (no instalado); no se crearon controladores/servicios (fuera de alcance).

**Trazabilidad.** HU1 · contrato de entrada/salida del alta de tenant
(`nestjs-validation-and-dtos.md`, `mongodb-security.md` §3/§4), issue #4.

### Pull Request 3
