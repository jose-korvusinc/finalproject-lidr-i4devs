[<- Volver al README principal](../readme.md)

## 7. Tickets de Trabajo

Los tickets de trabajo se generan descomponiendo cada **historia de usuario** en issues pequeñas,
verticales y trazables (estilo JIRA), separadas por capa (**frontend** Angular / **backend** NestJS)
y creadas en GitHub con la skill `github-issue-breakdown` (comando `/tickets`). Cada ticket es
*Small* (≤ 1–2 días), se implementa en **TDD** (`/tdd`) y cita la HU y el/los escenario(s) BDD que
satisface (ver `02-user-stories.md`).

La primera historia descompuesta es **HU1 — Registro de Negocio y Creación de Espacio Aislado
(Tenant)**, con **11 issues** (5 backend + 6 frontend) bajo el milestone `HU1: Tenant registration`.
A continuación se documentan **los 4 tickets principales** con el detalle necesario para
desarrollarlos de inicio a fin: uno de **base de datos**, uno de **backend**, uno de **seguridad
multitenant** y uno de **frontend**.

> Endpoints propuestos para HU1 (el contrato de `05-api-specification.md` se materializa aquí,
> coherente con `nestjs-architecture.md` §4):
> - `GET /api/v1/tenants/subdomain-availability?subdomain=<slug>` → `{ available: boolean }`
> - `POST /api/v1/tenants` → `201 { id, name, subdomain, status, portalUrl }` · `409` conflicto · `400` validación

### Índice de issues de HU1

| # | Título | Capa | Labels | Depende de |
| :--- | :--- | :--- | :--- | :--- |
| [#3](https://github.com/jose-korvusinc/finalproject-lidr-i4devs/issues/3) | Model businesses collection ($jsonSchema, unique subdomain & status indexes) | BE · datos | `area:backend` `type:data-model` | — |
| [#4](https://github.com/jose-korvusinc/finalproject-lidr-i4devs/issues/4) | Add tenant registration DTOs with validation | BE | `area:backend` `type:feature` | #3 |
| [#5](https://github.com/jose-korvusinc/finalproject-lidr-i4devs/issues/5) | Expose subdomain availability check endpoint (GET) | BE | `area:backend` `type:feature` | #3, #4 |
| [#6](https://github.com/jose-korvusinc/finalproject-lidr-i4devs/issues/6) | Create tenant registration endpoint (409 on conflict) | BE | `area:backend` `type:feature` | #3, #4 |
| [#7](https://github.com/jose-korvusinc/finalproject-lidr-i4devs/issues/7) | Multitenant isolation foundation + cross-tenant e2e test | BE | `area:backend` `type:feature` `security:multitenancy` | #3 |
| [#8](https://github.com/jose-korvusinc/finalproject-lidr-i4devs/issues/8) | Build tenant registration form (Signal Forms + a11y + i18n) | FE | `area:frontend` `type:feature` `a11y` | — |
| [#9](https://github.com/jose-korvusinc/finalproject-lidr-i4devs/issues/9) | Frontend tenant context + interceptor (X-Tenant header) | FE | `area:frontend` `type:feature` `security:multitenancy` | — |
| [#10](https://github.com/jose-korvusinc/finalproject-lidr-i4devs/issues/10) | Tenant registration API service (check + register) | FE | `area:frontend` `type:feature` | #5, #6 |
| [#11](https://github.com/jose-korvusinc/finalproject-lidr-i4devs/issues/11) | Real-time subdomain availability feedback | FE | `area:frontend` `type:feature` | #8, #10 |
| [#12](https://github.com/jose-korvusinc/finalproject-lidr-i4devs/issues/12) | Handle registration outcome: success + conflict | FE | `area:frontend` `type:feature` | #8, #10 |
| [#13](https://github.com/jose-korvusinc/finalproject-lidr-i4devs/issues/13) | Wire lazy route for the tenant-registration feature | FE | `area:frontend` `type:feature` | #8 |

---

### Ticket 1 — Base de datos · [#3] Model businesses collection ($jsonSchema, unique subdomain & status indexes)

**Título (GitHub):** `[HU1][BE] Model businesses collection: $jsonSchema, unique subdomain & status indexes (migration)`
**Labels:** `area:backend` · `story:HU1` · `type:data-model` — **Milestone:** `HU1: Tenant registration`

#### Contexto y trazabilidad
Trazabilidad: **HU1** — Registro de Negocio (Tenant). Es la base de datos de **todos** los escenarios
(estados `AWAITING_DATA → VALIDATING_SUBDOMAIN → TENANT_CREATED / REGISTRATION_REJECTED`). Crea la
colección `businesses` —el **registro de tenants**— con su validador, unicidad global de subdominio e
índices. Habilita el resto de tickets del backend (#4, #5, #6, #7).

#### Alcance (de inicio a fin)
1. **Diseño del esquema** con la skill `mongodb-domain-model` (única fuente de verdad del diseño):
   `name: string`, `subdomain: string`, `status: string` (`TenantStatus = {active, suspended}`),
   `owner { name, email }` **embebido** (composición 1-1 "posee-a", sin identidad propia),
   `schemaVersion: int` y auditoría `createdAt`/`updatedAt`.
2. **Validador `$jsonSchema`** de la colección con `required`, tipos BSON y enum de `status`;
   `validationLevel: "strict"`, `validationAction: "errorAndLog"`.
3. **Índices** (nombre explícito; `businesses` es la **excepción** al prefijo `tenantId` porque su
   propio `_id` **es** el `tenantId`):
   - `uq_subdomain` = `{ subdomain: 1 }` **unique** (global, clave de enrutamiento DNS wildcard).
   - `idx_status` = `{ status: 1 }` (soporta listado/suspensión de HU9).
4. **Migración** versionada, idempotente y reversible con la skill `mongodb-migrations`
   (migrate-mongo): `up` crea colección + validador + índices; `down` los revierte.
5. **Esquema Mongoose** `business.schema.ts` alineado con el validador, con `autoIndex`/`autoCreate`
   **desactivados** (los índices los aplica la migración, no el arranque).

*Fuera de alcance:* DTOs y endpoints (#4, #5, #6); cualquier UI.

#### Criterios de aceptación (BDD)
```gherkin
Escenario: Unicidad global de subdominio a nivel de datos
  Dado que la migración de `businesses` está aplicada
  Cuando intento insertar dos documentos con el mismo `subdomain`
  Entonces la base rechaza el segundo por el índice único `uq_subdomain`

Escenario: Validación de esquema
  Dado el validador $jsonSchema de `businesses`
  Cuando inserto un documento sin `subdomain` o con `status` fuera del enum
  Entonces la inserción es rechazada (errorAndLog)
```

#### Notas técnicas y buenas prácticas
- **Rules aplicables:** `mongodb-data-modeling.md`, `mongodb-schema-conventions.md` (nomenclatura,
  BSON, validación), `mongodb-multitenancy.md` §4 (subdominio único global justificado),
  `mongodb-scalability-and-evolution.md` (`schemaVersion`, migración reversible),
  `nestjs-data-access-mongoose.md` §1/§5.
- Fuente del modelo: `04-data-model.md` → `businesses`. `owner` embebido, no colección aparte.
- Dinero/fechas no aplican aquí; `status` como enum cerrado validado por `$jsonSchema`.

#### Definition of Done
- [ ] TDD (rojo → verde → refactor); suite en verde.
- [ ] Migración `up`/`down` verificada (idempotente y reversible); `explain()` confirma uso de
      `uq_subdomain` sin `COLLSCAN`.
- [ ] Esquema Mongoose sin reglas divergentes del `$jsonSchema`.
- [ ] Lint/format sin errores; inglés y sin comentarios; ficheros en inglés (`file-naming.md`).
- [ ] Trazable a HU1 y al modelo `businesses`.

---

### Ticket 2 — Backend · [#6] Create tenant registration endpoint (409 on conflict)

**Título (GitHub):** `[HU1][BE] Create tenant registration endpoint with unique subdomain (409 on conflict)`
**Labels:** `area:backend` · `story:HU1` · `type:feature` — **Milestone:** `HU1: Tenant registration`

#### Contexto y trazabilidad
Trazabilidad: **HU1**, escenarios **"Alta exitosa con subdominio disponible"** y **"Subdominio ya
ocupado"** (estados `VALIDATING_SUBDOMAIN → TENANT_CREATED / REGISTRATION_REJECTED`). Es el endpoint
que da de alta un tenant garantizando el subdominio único global. Depende de #3 (colección + índice)
y #4 (DTOs); desbloquea el servicio de API del frontend (#10).

#### Alcance (de inicio a fin)
1. **Controlador fino** `TenantsController` con `POST /api/v1/tenants` (versionado URI + prefijo
   `api`); solo traduce HTTP ↔ dominio y delega en el servicio.
2. **Servicio** `TenantsService.register(dto)`: alta **atómica** del documento en `businesses` con
   `owner` embebido y `status: "active"`.
3. **Manejo de conflicto:** capturar el error de **clave duplicada** de Mongo (código `11000` sobre
   `uq_subdomain`) y traducirlo a **`409 Conflict`** (`ConflictException`), garantizando que **no
   queda registro parcial**. El resto de errores de negocio como `HttpException` adecuadas.
4. **Salida:** mapear a `TenantResponseDto` (`id`, `name`, `subdomain`, `status`, `portalUrl`); no
   exponer `_id` crudo, `tenantId` ni internos. `portalUrl` derivado del `subdomain`.

*Fuera de alcance:* verificación de email, DNS wildcard, UI; el check de disponibilidad va en #5.

#### Criterios de aceptación (BDD)
```gherkin
Escenario: Alta exitosa con subdominio disponible
  Dado datos válidos (name, ownerEmail, subdomain) y subdominio libre
  Cuando envío POST /api/v1/tenants
  Entonces recibo 201 con el tenant creado y su portalUrl habilitado

Escenario: Subdominio ya ocupado
  Dado que el subdominio "barberia-paco" ya pertenece a otro tenant
  Cuando envío POST /api/v1/tenants con ese subdominio
  Entonces recibo 409 Conflict y no se crea ningún registro parcial
```

#### Notas técnicas y buenas prácticas
- **Rules aplicables:** `nestjs-architecture.md` §2 (controlador fino) / §4 (versionado),
  `nestjs-validation-and-dtos.md` (DTO de entrada/salida, whitelist), `nestjs-errors-and-observability.md`
  §1 (duplicate key → 409, forma de error uniforme sin fugas), `mongodb-multitenancy.md` §4,
  `mongodb-transactions-and-integrity.md` §2 (la unicidad la garantiza el índice; la atomicidad de
  documento basta, sin transacción multi-documento).
- Endpoint: `POST /api/v1/tenants`. La respuesta de error no revela colección, query ni stack.

#### Plan TDD (guía de implementación)
- **RED (unit):** servicio devuelve el tenant en alta OK; lanza `ConflictException` al simular
  `11000`. **RED (e2e):** `POST` → `201` con forma de `TenantResponseDto`; segundo `POST` mismo
  subdominio → `409`; body inválido → `400`.
- **GREEN:** implementación mínima (insert + `catch` de `11000`). **REFACTOR:** extraer el mapeo de
  error duplicado a un helper reutilizable.

#### Definition of Done
- [ ] TDD (rojo → verde → refactor); suite en verde.
- [ ] Test unitario (alta OK, 409 en duplicado) y e2e del contrato (201/409/400).
- [ ] Respuesta sin `_id`/`tenantId`; error uniforme con `requestId`, sin internos.
- [ ] Lint/format sin errores; inglés y sin comentarios.
- [ ] Trazable a HU1 (alta y conflicto).

---

### Ticket 3 — Seguridad multitenant · [#7] Multitenant isolation foundation + cross-tenant e2e test

**Título (GitHub):** `[HU1][BE] Add multitenant isolation foundation (subdomain context + fail-closed guard + Mongoose tenant plugin) with cross-tenant e2e test`
**Labels:** `area:backend` · `story:HU1` · `type:feature` · `security:multitenancy` — **Milestone:** `HU1: Tenant registration`

#### Contexto y trazabilidad
Trazabilidad: **HU1**, escenario **"Aislamiento de datos entre tenants"**. Establece el **cimiento
multitenant de la capa de aplicación** que heredan HU2–HU4: resolución del tenant por subdominio,
guard *fail-closed* y filtro transversal en Mongoose, con **test e2e de no-fuga** entre tenants. Es
una **invariante de seguridad**, no un extra.

> Nota de tamaño: es el único ticket de HU1 con *Small* dudoso (agrupa contexto + guard + plugin +
> e2e). Si excede 1–2 días, se parte en `context+guard` / `plugin+e2e`.

#### Alcance (de inicio a fin)
1. **Middleware temprano** que resuelve el `tenantId` desde el **subdominio** del host y abre el
   contexto de petición con **`AsyncLocalStorage`** (`tenantId`, `requestId`) — **no** `Scope.REQUEST`
   (penaliza rendimiento). El `tenantId` **nunca** se acepta del body ni de un header controlable.
2. **Guard global *fail-closed***: valida que el contexto tenga un `tenantId` resuelto y válido antes
   de cualquier handler de negocio; si falta, **rechaza** (no deja pasar).
3. **Plugin de Mongoose** que inyecta el `tenantId` del contexto en `find/findOne/count/update*/
   delete*` y en las etapas `$match` de `aggregate`, y lo fija en `insert`/`save`. Se aplica al
   registrar cada esquema de negocio.
4. **Test e2e de no-fuga (obligatorio):** una petición como **tenant A** no lee ni escribe datos de
   **tenant B**; una consulta **sin** `tenantId` resuelto es **rechazada** por el guard.

*Fuera de alcance:* el propio alta de tenant (#6), que opera sobre `businesses` (registro de tenants,
no *tenant-scoped*); autenticación JWT (otra HU).

#### Criterios de aceptación (BDD)
```gherkin
Escenario: Aislamiento de datos entre tenants
  Dado dos tenants activos A y B con datos propios
  Cuando una petición resuelta como tenant A consulta un recurso de negocio
  Entonces solo obtiene documentos filtrados por el tenant_id de A (nunca de B)

Escenario: Consulta sin tenant rechazada (fail-closed)
  Dado una petición sin subdominio de tenant resoluble
  Cuando alcanza un handler de negocio
  Entonces el guard la rechaza y ninguna consulta se ejecuta sin tenantId
```

#### Notas técnicas y buenas prácticas
- **Rules aplicables:** `nestjs-security-and-multitenancy.md` §1 (AsyncLocalStorage) / §2 (guard
  fail-closed), `nestjs-data-access-mongoose.md` §3 (filtro transversal), `mongodb-multitenancy.md`
  §3/§6, `nestjs-architecture.md` §3/§7 (orden middleware → guards), `nestjs-testing-and-quality.md`
  §4 (test de aislamiento obligatorio).
- El guard de NestJS y el plugin de Mongoose son **pareja**: juntos garantizan que ninguna consulta
  se ejecute sin `tenantId`. Componentes: `tenant-context.middleware.ts`, `tenant.guard.ts`,
  `tenant-scope.plugin.ts`.

#### Definition of Done
- [ ] TDD (rojo → verde → refactor); suite en verde.
- [ ] **Test e2e de aislamiento entre tenants pasando** (requisito de seguridad).
- [ ] `AsyncLocalStorage` en vez de `Scope.REQUEST`; guard fail-closed verificado.
- [ ] Lint/format sin errores; inglés y sin comentarios.
- [ ] Trazable a HU1 · Aislamiento de datos entre tenants.

---

### Ticket 4 — Frontend · [#8] Build tenant registration form (Signal Forms + a11y + i18n)

**Título (GitHub):** `[HU1][FE] Build tenant registration form (Signal Forms + a11y + i18n)`
**Labels:** `area:frontend` · `story:HU1` · `type:feature` · `a11y` — **Milestone:** `HU1: Tenant registration`

#### Contexto y trazabilidad
Trazabilidad: **HU1**, estado **`AWAITING_DATA`** (formulario de registro vacío, ver `hu1/01-data-entry-form.png`).
Es la pieza de entrada del onboarding: el formulario de alta del negocio. Bloquea el feedback en vivo
(#11), el manejo de resultado (#12) y el cableado de ruta (#13).

#### Alcance (de inicio a fin)
1. **Componente de página** `tenant-registration` (standalone por defecto, `OnPush` por defecto) con
   **Signal Forms** (`@angular/forms/signals`): el estado del formulario es un `signal` del modelo y
   la validación se define por esquema.
2. **Campos:** business name, corporate email, subdomain (mostrado con el sufijo `.yourplatform.com`).
3. **Validación de formato accesible:** email válido y subdomain como *slug*; errores enlazados con
   `aria-describedby` + `aria-invalid` y anunciados por una live region (`aria-live`). No usar el
   placeholder como etiqueta; todo control con `<label>`.
4. **i18n:** **todo** el texto visible externalizado con i18n de Angular (IDs `@@` estables); sin
   texto en duro en plantilla ni en TS. Botones **Cancel** / **Create**; **Create** deshabilitado
   hasta que los datos son válidos.

*Fuera de alcance:* la llamada a la API (#10), el feedback de disponibilidad en vivo (#11) y las
vistas de resultado éxito/conflicto (#12).

#### Criterios de aceptación (BDD)
```gherkin
Escenario: Formulario de registro vacío
  Dado que abro la página de registro de negocio
  Cuando se renderiza el formulario
  Entonces veo los campos name, email y subdomain con sus labels accesibles
  Y el botón Create está deshabilitado hasta que los datos son válidos
```

#### Notas técnicas y buenas prácticas
- **Rules aplicables:** `angular-forms-and-accessibility.md` (Signal Forms, AXE/WCAG AA, i18n),
  `angular-components-and-signals.md` (`input()/output()/model()`, signals, sin `@HostBinding`),
  `angular-templates-and-performance.md` (control de flujo `@if/@for`, `[class.x]`, mobile-first),
  `angular-architecture.md` (feature perezosa, `inject()`).
- Componente en `features/tenant-registration/`. Contraste y foco visibles (WCAG AA). El widget de
  registro es mobile-first.

#### Definition of Done
- [ ] TDD (rojo → verde → refactor); Vitest en verde (comportamiento: validez → botón habilitado).
- [ ] **AXE/WCAG AA sin violaciones** en el formulario; texto vía i18n.
- [ ] Sin `standalone: true` ni `OnPush` explícitos; signals y control de flujo nativo.
- [ ] Lint/Prettier sin errores; inglés y sin comentarios.
- [ ] Trazable a HU1 · `AWAITING_DATA`.

---

> **Metodología:** cada ticket se implementa con el comando **`/tdd`**, que orquesta la fase RED
> (test-author) antes de la GREEN + REFACTOR (agente de implementación), respetando el aislamiento
> multitenant. El orden de ejecución sigue las dependencias declaradas (lo dependido primero).
