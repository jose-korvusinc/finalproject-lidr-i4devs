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

### Pull Request 3 — HU1 #5: endpoint GET de disponibilidad de subdominio

| Campo | Valor |
| :--- | :--- |
| **Historia de usuario** | HU1 — Registro de Negocio y Creación de Espacio Aislado (Tenant) |
| **Issue** | [#5](https://github.com/jose-korvusinc/finalproject-lidr-i4devs/issues/5) — `[HU1][BE] Expose subdomain availability check endpoint (GET)` |
| **Milestone** | HU1: Tenant registration |
| **Rama** | `feature-entrega2-JMPA` |
| **Capa** | Backend (NestJS) · API |
| **Metodología** | TDD estricto (red → green → refactor) orquestado con `/tdd` |

**Objetivo.** Exponer `GET /api/v1/tenants/subdomain-availability?subdomain=<slug>` → `{ available }`
para dar feedback temprano de disponibilidad (estado VALIDATING_SUBDOMAIN) antes del alta. Primer
endpoint del backend: habilita también el versionado URI y el prefijo global `api`. Depende de #3 y
#4; desbloquea el servicio de API del frontend (#10).

**Commits (orden TDD).**

| Orden | Hash | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| 1º (RED) | `8914c8e` | `test(tenants)` | Spec unitaria del servicio (`isSubdomainAvailable` con `model.exists` mínimo) + e2e del contrato HTTP (200 `{available}`, 400 en query ausente/inválida/whitelist/`$`), con modelo Mongoose mockeado y stack HTTP real |
| 2º (GREEN + REFACTOR) | `d070c02` | `feat(tenants)` | `TenantsController` fino + `TenantsService` + `SubdomainAvailabilityQueryDto` + `TenantsModule` (`forFeature`), cableado en `AppModule` y versionado URI/prefijo `api` en `main.ts`; refactor: patrón slug compartido (`SUBDOMAIN_PATTERN`) |

**Alcance de ficheros.**

- Tests: `code/backend/src/tenants/tenants.service.spec.ts`, `code/backend/test/tenants.e2e-spec.ts`.
- Producción: `tenants.controller.ts`, `tenants.service.ts`, `tenants.module.ts`,
  `dto/subdomain-availability-query.dto.ts`, `dto/subdomain.constants.ts`, `app.module.ts`, `main.ts`
  (versionado + prefijo); refactor de `dto/create-tenant.dto.ts` (reusa el patrón compartido).

**Estado de los tests y calidad.**

- `npm test` (unit): **41/41 passing** (6 suites). `npm run test:e2e`: **7/7 passing** (2 suites, sin
  regresión en el e2e existente). Verde probado por **mutación** (forzar disponibilidad siempre ⇒ los
  tests de "subdominio ocupado" se ponen en rojo).
- `npm run lint`: **0 errores**.

**Notas de diseño.**

- e2e **determinista sin DB**: se monta la app con el modelo Mongoose *mockeado* por token
  (`getModelToken`), replicando prefijo/versionado/`ValidationPipe` de producción (no hay
  `mongodb-memory-server`).
- Acceso a datos mínimo con `model.exists({ subdomain })` sobre el índice único `uq_subdomain` (no
  hidrata el documento). El endpoint es previo al tenant (no aplica aislamiento entre tenants); la
  garantía dura de unicidad la da el índice único en la escritura (#6).

**Trazabilidad.** HU1 · VALIDATING_SUBDOMAIN (`nestjs-architecture.md` §2/§4,
`nestjs-data-access-mongoose.md` §2), issue #5.

### Pull Request 4 — HU1 #6: endpoint POST de alta de tenant (409 en conflicto)

| Campo | Valor |
| :--- | :--- |
| **Historia de usuario** | HU1 — Registro de Negocio y Creación de Espacio Aislado (Tenant) |
| **Issue** | [#6](https://github.com/jose-korvusinc/finalproject-lidr-i4devs/issues/6) — `[HU1][BE] Create tenant registration endpoint with unique subdomain (409 on conflict)` |
| **Milestone** | HU1: Tenant registration |
| **Rama** | `feature-entrega2-JMPA` |
| **Capa** | Backend (NestJS) · API |
| **Metodología** | TDD estricto (red → green → refactor) orquestado con `/tdd` |

**Objetivo.** Exponer `POST /api/v1/tenants` que da de alta el tenant garantizando subdominio único
global: alta atómica en `businesses` con `owner` embebido y `status: active`, traducción del duplicado
a **409 Conflict** sin registro parcial, y respuesta con exposición mínima. Cierra el flujo de alta de
HU1 en el backend (estados TENANT_CREATED / REGISTRATION_REJECTED). Depende de #3 y #4; desbloquea la
escritura del frontend (#10).

**Commits (orden TDD).**

| Orden | Hash | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| 1º (RED) | `f3646fe` | `test(tenants)` | Unit de `TenantsService.create` (mapeo dto→doc, `status active`, `owner` embebido, `portalUrl` derivado, `11000`→`ConflictException`) + e2e (201 con body mínimo, 409 en duplicado, 400 en payload inválido/whitelist), con modelo mockeado |
| 2º (GREEN + REFACTOR) | `5ef7683` | `feat(tenants)` | `@Post()` fino + `TenantsService.create` (alta atómica, guard tipado del `code 11000`→409, mapeo a `TenantResponseDto`) + constante `TENANT_BASE_DOMAIN` para `portalUrl` |

**Alcance de ficheros.**

- Tests: `code/backend/src/tenants/tenants.service.spec.ts` (bloque `create`),
  `code/backend/test/tenants.e2e-spec.ts` (bloque `POST /api/v1/tenants`).
- Producción: `tenants.controller.ts` (`@Post`), `tenants.service.ts` (`create` + helpers),
  `tenants.constants.ts` (`TENANT_BASE_DOMAIN`).

**Estado de los tests y calidad.**

- `npm test` (unit): **45/45 passing** (6 suites). `npm run test:e2e`: **13/13 passing** (2 suites).
- `npm run lint`: **0 errores**.

**Notas de diseño.**

- **409 en conflicto**: el error de clave duplicada de Mongo (`code 11000`, índice único
  `uq_subdomain`) se traduce a `ConflictException`; el resto de errores se re-lanzan. La atomicidad de
  documento + índice único garantizan que no queda registro parcial (`mongodb-transactions-and-integrity.md`
  §2).
- **Exposición mínima**: `TenantResponseDto` (`@Exclude` clase + `@Expose`) vía
  `excludeExtraneousValues`; nunca se filtran `_id`, `tenantId`, `owner`, `schemaVersion`.
- **Decisiones MVP**: `owner.name = dto.name` (el formulario HU1 no capta nombre de dueño por
  separado) y `portalUrl = https://<subdomain>.yourplatform.com` (constante `TENANT_BASE_DOMAIN`;
  candidata a variable de entorno por entorno).

**Trazabilidad.** HU1 · TENANT_CREATED / REGISTRATION_REJECTED (`nestjs-architecture.md` §2/§4,
`nestjs-errors-and-observability.md` §1, `mongodb-multitenancy.md` §4), issue #6.

### Pull Request 5 — HU1 #8: formulario de registro (Signal Forms + accesibilidad)

| Campo | Valor |
| :--- | :--- |
| **Historia de usuario** | HU1 — Registro de Negocio y Creación de Espacio Aislado (Tenant) |
| **Issue** | [#8](https://github.com/jose-korvusinc/finalproject-lidr-i4devs/issues/8) — `[HU1][FE] Build tenant registration form (Signal Forms + a11y + i18n)` |
| **Milestone** | HU1: Tenant registration |
| **Rama** | `feature-entrega2-JMPA` |
| **Capa** | Frontend (Angular 22) |
| **Metodología** | TDD estricto (red → green → refactor) orquestado con `/tdd` |

**Objetivo.** Construir la pieza de entrada del onboarding: el formulario de alta del negocio (estado
`AWAITING_DATA`) con **Signal Forms**, validación accesible e i18n. Bloquea el feedback en vivo (#11),
el resultado (#12) y la ruta (#13).

**Commits (orden TDD).**

| Orden | Hash | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| 1º (RED) | `d926e15` | `test(tenant-registration)` | Specs *failing-first* (Vitest): render de los 3 campos con labels accesibles, Create deshabilitado hasta validez, error de email con `aria-invalid`/`aria-describedby`, subdominio inválido, sufijo `.yourplatform.com` |
| 2º (GREEN + REFACTOR) | `588fb46` | `feat(tenant-registration)` | Componente `TenantRegistration` (Signal Forms: `required`/`email`/`pattern` slug), plantilla accesible con live region, SCSS mobile-first e i18n |

**Alcance de ficheros.**

- Tests: `code/frontend/src/app/features/tenant-registration/tenant-registration.spec.ts`.
- Producción: `tenant-registration.ts` / `.html` / `.scss`; infraestructura de test
  `src/test-setup.ts` (shim de `$localize`/`CSS.escape`) y su registro en `angular.json` /
  `tsconfig.spec.json`.

**Estado de los tests y calidad.**

- `ng test` (Vitest): **7/7 passing**. Verde probado por **mutación** (romper `[disabled]` del botón
  Create ⇒ 2 tests en rojo). `ng build`: OK.
- Sin `standalone: true`/`OnPush` explícitos; signals y control de flujo nativo; Prettier aplicado (el
  frontend no define script de lint).

**Notas de diseño.**

- Campos `name` / `ownerEmail` / `subdomain` (coherentes con el `CreateTenantDto` del backend).
  Errores enlazados con `aria-describedby` + `aria-invalid` y anunciados por live region (WCAG AA).
- **i18n**: textos externalizados con IDs `@@`; como `@angular/localize` no está instalado, el runtime
  de test usa un shim de `$localize` (los atributos `i18n` son reales; instalar `@angular/localize`
  queda como tarea de setup del proyecto).

**Trazabilidad.** HU1 · `AWAITING_DATA` (`angular-forms-and-accessibility.md`,
`angular-components-and-signals.md`), issue #8.

### Pull Request 6 — HU1 #12: resultado del alta (éxito y conflicto de subdominio)

| Campo | Valor |
| :--- | :--- |
| **Historia de usuario** | HU1 — Registro de Negocio y Creación de Espacio Aislado (Tenant) |
| **Issue** | [#12](https://github.com/jose-korvusinc/finalproject-lidr-i4devs/issues/12) — `[HU1][FE] Handle registration outcome: success view + subdomain conflict` |
| **Milestone** | HU1: Tenant registration |
| **Rama** | `feature-entrega2-JMPA` |
| **Capa** | Frontend (Angular 22) |
| **Metodología** | TDD estricto (red → green → refactor) orquestado con `/tdd` |

**Objetivo.** Gestionar el envío del formulario y sus dos salidas: éxito (estado `TENANT_CREATED`, con
enlace al `portalUrl`) y conflicto de subdominio (estado `REGISTRATION_REJECTED`, mensaje accesible sin
perder los datos). Depende de #8 (formulario) y #10 (servicio de API).

**Commits (orden TDD).**

| Orden | Hash | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| 1º (RED) | `d993411` | `test(tenant-registration)` | Specs *failing-first* (Vitest, `TenantRegistrationApi` mockeado): éxito ⇒ `registrationState='created'` + enlace `portalUrl`; `HttpErrorResponse` 409 ⇒ `conflict`, alerta accesible, datos conservados; el mensaje no es el error crudo del backend |
| 2º (GREEN + REFACTOR) | `672f6b6` | `feat(tenant-registration)` | `create()` envía con `api.register`, signals `registrationState`/`createdTenant`; vista de confirmación con `portalUrl`; alerta i18n de conflicto; baja con `takeUntilDestroyed` |

**Alcance de ficheros.**

- Tests: `code/frontend/src/app/features/tenant-registration/tenant-registration.outcome.spec.ts`.
- Producción: `tenant-registration.ts` / `.html` / `.scss`.

**Estado de los tests y calidad.**

- `ng test` (Vitest): **24/24 passing** (incluye toda la suite previa). `ng build`: OK.
- Errores de la API mapeados a texto de UI i18n (nunca el cuerpo crudo del backend), coherente con
  `angular-api-and-multitenancy.md` §3.

**Notas de diseño.**

- Estado de envío modelado con un signal `registrationState`
  (`editing`/`submitting`/`created`/`conflict`/`error`); `createdTenant` guarda la respuesta con el
  `portalUrl`. En conflicto se conservan los datos del formulario para corregir el subdominio.
- La gestión de foco al cambiar de estado quedó como mejora a11y opcional (no requerida por los tests).

**Trazabilidad.** HU1 · TENANT_CREATED / REGISTRATION_REJECTED (`angular-forms-and-accessibility.md`
§1/§3, `angular-api-and-multitenancy.md` §3), issue #12.
