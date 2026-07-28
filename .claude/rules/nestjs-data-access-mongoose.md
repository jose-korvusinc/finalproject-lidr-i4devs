# Regla: Acceso a datos con `@nestjs/mongoose` (capa de aplicación)

Esta regla define cómo la aplicación NestJS **accede** a MongoDB con `@nestjs/mongoose` (Mongoose 9).
Cubre el **cableado y el patrón de acceso** desde NestJS; el **diseño del modelo de datos**
(colecciones, campos, tipos BSON, embed/reference, índices, validadores `$jsonSchema`, invariantes,
transacciones) es competencia de las rules `mongodb-*.md`, que son la **única fuente de verdad**.
Esta capa **no reescribe** esas reglas: las **respeta y las invoca**.

## 0. Fuente de verdad del modelo de datos (no duplicar)

Para todo lo relativo a esquema, índices, transacciones y multitenancy de datos, sigue:

- `mongodb-data-modeling.md`, `mongodb-normalization-fnbc.md`, `mongodb-schema-conventions.md`
  → forma de las colecciones, tipos BSON, nomenclatura y validadores.
- `mongodb-multitenancy.md` → `tenantId` obligatorio y como primera clave de todo índice.
- `mongodb-indexing-and-performance.md` → índices (guía ESR), paginación keyset, proyección.
- `mongodb-transactions-and-integrity.md` → atomicidad de documento, no doble reserva,
  concurrencia optimista, transacciones multi-documento, `read/writeConcern`.
- `mongodb-security.md` → mínima exposición, sanitización.

La **creación** de colecciones, índices y validadores en la base se hace SIEMPRE con la skill
`mongodb-migrations` (`.claude/skills/mongodb-migrations/SKILL.md`), **no** con comandos ad hoc ni
con `autoIndex` en producción. El **diseño** de esquemas lo produce la skill `mongodb-domain-model`.
Esta capa de aplicación consume esos artefactos; no los inventa.

## 1. Conexión y registro de esquemas

- Conecta con `MongooseModule.forRootAsync` leyendo la URI del `ConfigService` (`MONGODB_URI`),
  nunca hardcodeada. Exige **TLS** en la conexión de producción (ver `mongodb-security.md` §2).
- Registra los esquemas por módulo con `MongooseModule.forFeature([...])`; cada esquema en su
  fichero `*.schema.ts` (en inglés, sin comentarios), alineado con el validador `$jsonSchema` de la
  colección (`mongodb-schema-conventions.md`).
- **Desactiva `autoIndex` y `autoCreate` en producción**: los índices y validadores los aplican las
  migraciones (`migrate-mongo`), no el arranque de la app.

```typescript
MongooseModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    uri: config.getOrThrow<string>("MONGODB_URI"),
    autoIndex: false,
    autoCreate: false,
  }),
});
```

## 2. Acceso aislado en servicios de datos

- El acceso a Mongoose (`@InjectModel`) vive en **servicios/repositorios de datos**, no en
  controladores ni en servicios de negocio que orquestan varios agregados. El resto del dominio
  depende de esa abstracción.
- **Proyecta** siempre lo mínimo y usa `.lean()` para lecturas de solo salida (documentos planos,
  más rápidos) cuando no necesites métodos de documento. Devuelve **DTOs**, no documentos crudos
  (ver `nestjs-validation-and-dtos.md` §4 y `mongodb-security.md` §4).
- Aplica las invariantes de escritura definidas en `mongodb-transactions-and-integrity.md`
  (escritura condicional atómica para no doble reserva, `version` para concurrencia optimista). No
  reimplementes "leer y luego escribir" cuando exista una operación atómica.

## 3. Filtro por `tenantId` transversal (obligatorio)

`mongodb-multitenancy.md` §3 exige que **ninguna** consulta se ejecute sin `tenantId`. En la capa
de aplicación esto se impone **de forma transversal**, no manual por consulta:

- **Plugin/middleware de Mongoose** que inyecte el `tenantId` del contexto de la petición (ver
  `nestjs-security-and-multitenancy.md`, `AsyncLocalStorage`) en `find`, `findOne`, `count`,
  `update*`, `delete*` y en las etapas `$match` de `aggregate`, y que lo fije en los `insert`/`save`.
- **Guard de NestJS** que valide la presencia del `tenantId` en el contexto antes de llegar al
  handler (ver `nestjs-security-and-multitenancy.md`). Una consulta sin `tenantId` es un **defecto
  de seguridad**, no una optimización pendiente.
- El `tenantId` **nunca** se acepta del cuerpo del cliente: se resuelve del subdominio en la capa de
  API y se propaga por el contexto (ver `mongodb-multitenancy.md` §1).

✅ Plugin de tenant aplicado al registrar el esquema:

```typescript
reservationSchema.plugin(tenantScopePlugin);
```

## 4. Integridad referencial y transacciones (nivel de aplicación)

- MongoDB no impone `FK` ni cascada: valida la existencia del referido antes de crear la relación y
  documenta la política de borrado del padre por cada referencia (ver
  `mongodb-transactions-and-integrity.md` §4).
- Prefiere la **atomicidad de documento**; usa transacciones multi-documento
  (`session.withTransaction`, `readConcern: "snapshot"`, `writeConcern: "majority"`) **solo** cuando
  una invariante cruce varias colecciones y no pueda rediseñarse en un documento. Mantenlas cortas y
  sin llamadas externas dentro (ver `mongodb-transactions-and-integrity.md` §3).

## 5. Evolución del esquema

- Los cambios de esquema (nueva colección, campo, índice) se aplican con **migraciones**
  versionadas, idempotentes y reversibles (skill `mongodb-migrations`), no desde el código de la app.
- Respeta `schemaVersion` y la compatibilidad hacia atrás durante la transición (ver
  `mongodb-scalability-and-evolution.md` §4).
