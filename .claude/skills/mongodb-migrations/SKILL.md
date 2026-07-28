---
name: mongodb-migrations
description: Crea y gestiona migraciones de MongoDB 8.3 versionadas, idempotentes y reversibles con migrate-mongo (NO Prisma). Úsala cuando el usuario pida crear/aplicar/revertir migraciones, crear colecciones/índices/validadores $jsonSchema en la base, o preparar cambios de esquema para desplegar. Aplica SIEMPRE las rules `mongodb-*` como única fuente de verdad.
---

# Skill: Migraciones de MongoDB (migrate-mongo)

Crea y gestiona **migraciones versionadas, idempotentes y reversibles** para MongoDB 8.3 usando
**`migrate-mongo`**. Es el paso que **aplica** en la base el modelo diseñado por la skill
`mongodb-domain-model`: crea colecciones, índices y validadores `$jsonSchema`, y ejecuta cambios de
datos controlados.

## Por qué migrate-mongo y NO Prisma (decisión de proyecto, no preferencia)

- **Prisma Migrate no soporta MongoDB**: con el conector de MongoDB solo existe `prisma db push`,
  que **sincroniza** el esquema pero **no genera historial versionado ni migraciones `down`/
  reversibles**. Eso incumple `mongodb-scalability-and-evolution.md` §4 (migraciones idempotentes y
  reversibles) y añadiría un segundo ODM sobre Mongoose (fuente de verdad duplicada).
- **`migrate-mongo`** da migraciones versionadas con `up`/`down`, historial en la base y ejecución
  con el **driver nativo** (independiente de los modelos Mongoose), que es lo correcto para operar
  índices, validadores y datos.

## Fuente de verdad (OBLIGATORIO leer antes de migrar)

Lee y aplica SIEMPRE. Si hay conflicto, las rules mandan sobre cualquier suposición:

- `.claude/rules/mongodb-scalability-and-evolution.md` → versionado, idempotencia, reversibilidad, trazabilidad.
- `.claude/rules/mongodb-schema-conventions.md` → validadores `$jsonSchema`, tipos, nomenclatura.
- `.claude/rules/mongodb-indexing-and-performance.md` → índices (guía ESR), TTL, unicidad.
- `.claude/rules/mongodb-multitenancy.md` → `tenantId` como primera clave de todo índice.
- `.claude/rules/mongodb-transactions-and-integrity.md` → índices únicos e invariantes.
- `.claude/rules/mongodb-security.md` → RBAC del usuario de migración, campos cifrados.
- `.claude/rules/file-naming.md` → nombres en inglés (la parte descriptiva del fichero de migración).

El **diseño** (qué colecciones/índices/validadores) lo produce la skill `mongodb-domain-model`;
esta skill lo **aplica**. No rediseñes el modelo aquí.

## Cuándo se activa

Cuando el usuario pida crear/aplicar/revertir migraciones, crear colecciones, índices o validadores
en la base, o preparar cambios de esquema/datos para desplegar.

## Ubicación

- Si existe `code/backend/` (NestJS), las migraciones viven en `code/backend/migrations/` con su config en
  `code/backend/migrate-mongo-config.js`.
- Si aún no hay backend, créalas en `migrations/` en la raíz (o pregunta) y muévelas cuando exista.
- La conexión (`MONGODB_URI`, `databaseName`) se toma de variables de entorno; **nunca** se
  hardcodean credenciales (ver `mongodb-security.md`).

## Bootstrap (solo la primera vez, si no existe la configuración)

```bash
npx migrate-mongo init
```

Configura `migrate-mongo-config.js` leyendo la conexión del entorno. Para TypeScript/ESM en NestJS,
usa `moduleSystem: 'esm'` y `migrationFileExtension: '.mjs'` (o compila `.ts`):

```javascript
const config = {
  mongodb: {
    url: process.env.MONGODB_URI,
    databaseName: process.env.MONGODB_DB,
    options: {}
  },
  migrationsDir: "migrations",
  changelogCollectionName: "migrations_changelog",
  migrationFileExtension: ".js",
  useFileHash: false,
  moduleSystem: "commonjs"
};

module.exports = config;
```

## Crear una migración

```bash
npx migrate-mongo create create-appointments-collection
```

Genera `migrations/<timestamp>-create-appointments-collection.js`. El prefijo de timestamp lo
impone `migrate-mongo` (excepción de nomenclatura); la parte descriptiva va **en inglés** y
`kebab-case`.

## Reglas de contenido de cada migración (OBLIGATORIO)

- **Una intención por migración** (una colección, un conjunto de índices coherente, un cambio de
  datos). No mezcles cambios no relacionados.
- **Idempotente**: `up` puede re-ejecutarse sin romper. `createIndex` con **nombre explícito** es
  idempotente; para validadores comprueba existencia de la colección (`listCollections`) antes de
  `createCollection`, o usa `collMod`. Guarda los updates de datos con filtros que no re-apliquen.
- **Reversible**: implementa SIEMPRE `down` deshaciendo exactamente lo que hace `up` (drop index por
  nombre, quitar validador con `collMod` `validator: {}`, revertir datos). Si algo es
  irreversible por naturaleza, decláralo explícitamente en el `down` y avísalo.
- **Driver nativo, no modelos Mongoose**: opera con el objeto `db` para no acoplar la migración al
  estado de los modelos de la aplicación.
- **Aplica las rules**: `tenantId` como PRIMERA clave de cada índice; unicidad por tenant; TTL para
  datos efímeros (OTP/sesiones); validador `$jsonSchema` con `validationLevel`/`validationAction`.
- **Cambios de datos grandes** en lotes; envuelve en transacción (`readConcern: "snapshot"`,
  `writeConcern: "majority"`) solo cuando la invariante cruce varios documentos y sea imprescindible
  (ver `mongodb-transactions-and-integrity.md`).

## Plantilla de migración (idempotente y reversible, en inglés, sin comentarios)

```javascript
module.exports = {
  async up(db) {
    const exists = await db.listCollections({ name: "appointments" }).hasNext();
    if (!exists) {
      await db.createCollection("appointments", {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["tenantId", "employeeId", "startsAt", "status"],
            properties: {
              tenantId: { bsonType: "objectId" },
              employeeId: { bsonType: "objectId" },
              startsAt: { bsonType: "date" },
              status: { enum: ["pending", "confirmed", "cancelled", "completed"] }
            }
          }
        },
        validationLevel: "strict",
        validationAction: "errorAndLog"
      });
    }
    await db.collection("appointments").createIndex(
      { tenantId: 1, employeeId: 1, startsAt: 1 },
      { name: "uq_tenant_employee_startsAt", unique: true,
        partialFilterExpression: { status: { $in: ["pending", "confirmed"] } } }
    );
  },

  async down(db) {
    await db.collection("appointments").dropIndex("uq_tenant_employee_startsAt");
    await db.command({ collMod: "appointments", validator: {}, validationLevel: "off" });
  }
};
```

TTL para datos efímeros (OTP), como migración propia:

```javascript
await db.collection("otps").createIndex(
  { expiresAt: 1 }, { name: "ttl_expiresAt", expireAfterSeconds: 0 }
);
```

## Aplicar, revertir y consultar estado

```bash
npx migrate-mongo status
npx migrate-mongo up
npx migrate-mongo down
```

`up` aplica las pendientes y las registra en `migrations_changelog`; `down` revierte la última.
Verifica `status` antes y después.

## Flujo de trabajo

1. **Lee las rules** y recibe de `mongodb-domain-model` la lista de colecciones/índices/validadores.
2. **Bootstrap** si no existe configuración (`init` + config desde entorno).
3. **Crea una migración por intención** (`create <english-kebab-name>`).
4. **Escribe `up`/`down`** idempotentes y reversibles siguiendo la plantilla y las rules.
5. **Verifica**: `status` → `up` → `status`; comprueba índices con `getIndexes()` y el validador
   con `db.getCollectionInfos()`. Prueba el `down` en un entorno no productivo.
6. **Devuelve** al usuario: ficheros de migración creados, qué crean/revierten, y el resultado de
   `status`. Trazabilidad: enlaza cada migración con la entidad/spec que la motiva.

## Lista de verificación de calidad (antes de terminar)

- [ ] He leído las rules `mongodb-*` y las aplico como fuente de verdad.
- [ ] NO se usa Prisma; la herramienta es `migrate-mongo` con driver nativo.
- [ ] Una intención por migración; nombre descriptivo en inglés `kebab-case`.
- [ ] `up` es idempotente (índices con nombre; colección/validador comprobados antes de crear).
- [ ] `down` revierte exactamente el `up` (o declara y avisa lo irreversible).
- [ ] `tenantId` es la primera clave de cada índice; unicidad por tenant; TTL donde corresponde.
- [ ] Validador `$jsonSchema` con `validationLevel`/`validationAction` aplicado por migración.
- [ ] Sin credenciales hardcodeadas; conexión desde entorno.
- [ ] `status`/`up`/`down` verificados; cada migración es trazable a su entidad o spec.

## Ejemplos de invocación

- "Crea la migración de la colección appointments con su validador e índice único por tenant."
- "Añade una migración con índice TTL para los OTP."
- "Aplica las migraciones pendientes y muéstrame el estado."
- "Revierte la última migración."
