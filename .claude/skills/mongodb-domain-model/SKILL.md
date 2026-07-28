---
name: mongodb-domain-model
description: Deriva el modelado de datos MongoDB 8.3 (colecciones, tipos BSON, relaciones embed/reference, índices y validadores $jsonSchema) de las entidades del dominio a partir de la documentación existente del proyecto. Úsala cuando el usuario pida crear, generar o actualizar el modelo de datos / esquemas de MongoDB / entidades de dominio. Aplica SIEMPRE las rules `mongodb-*` como única fuente de verdad.
---

# Skill: Modelado de datos de dominio en MongoDB (8.3)

Produce el **modelo de datos concreto de MongoDB** (colecciones, campos, tipos BSON, decisiones
embed-vs-reference, índices y validadores `$jsonSchema`) a partir de la documentación de dominio
existente. La skill **no inventa** convenciones: las toma de las rules `mongodb-*` del proyecto,
que son la ÚNICA fuente de verdad.

## Fuente de verdad (OBLIGATORIO leer antes de modelar)

Lee y aplica SIEMPRE estas rules. Si hay conflicto, las rules mandan sobre cualquier suposición:

- `.claude/rules/mongodb-data-modeling.md` → embed vs reference, relaciones, patrones y anti-patrones.
- `.claude/rules/mongodb-normalization-fnbc.md` → normalización 1FN–FNBC del modelo lógico y denormalización controlada.
- `.claude/rules/mongodb-schema-conventions.md` → nomenclatura, tipos BSON, auditoría y `$jsonSchema`.
- `.claude/rules/mongodb-multitenancy.md` → `tenantId` obligatorio y su prefijo en índices.
- `.claude/rules/mongodb-indexing-and-performance.md` → índices (guía ESR), TTL, unicidad.
- `.claude/rules/mongodb-transactions-and-integrity.md` → invariantes, no doble reserva, integridad.
- `.claude/rules/mongodb-scalability-and-evolution.md` → `schemaVersion`, sharding, time-series.
- `.claude/rules/mongodb-security.md` → cifrado de campos sensibles, mínima exposición.

Y la regla de nomenclatura de ficheros: `.claude/rules/file-naming.md`.

No copies el contenido de las rules aquí: léelas en tiempo de ejecución (única fuente de verdad).

## Cuándo se activa

Cuando el usuario pida crear, generar, actualizar o corregir el modelo de datos de MongoDB, los
esquemas de las entidades del dominio, las colecciones, índices o validadores.

## Entrada (documentación de dominio del proyecto)

Recopila los nombres y relaciones REALES del dominio desde (léelos antes de modelar):

- `system_architecture/domain_model/domain_model.puml` y `glossary.txt` (conceptos y vocabulario).
- `system_architecture/design_view/classes_design/classes_design_domain.puml` y `_persistence.puml`.
- `system_architecture/analysis_view/classes_analysis-mvc_v2.puml`.
- `sections_readme/02-user-stories.md` (comportamiento y estados), `03-system-architecture.md`.
- `sections_readme/04-data-model.md` (destino del modelo documentado).
- `bussiness_docs/prd.md` cuando exista.
- Código `code/backend/` (NestJS) cuando exista.

Pregunta SOLO lo imprescindible que no puedas inferir del proyecto.

## Flujo de trabajo

1. **Leer las rules `mongodb-*` y `file-naming.md`** antes de modelar nada.
2. **Recopilar el dominio** de la documentación anterior. Las entidades, atributos, relaciones y
   estados deben COINCIDIR con el modelo del dominio, el glosario y el código.
3. **Para cada entidad / agregado**, decide y documenta:
   - **Colección** (inglés, plural, `camelCase`) o **sub-documento embebido**, aplicando el
     criterio embed-vs-reference y la normalización FNBC del modelo lógico (justifica cada
     decisión de embeber una entidad independiente o de denormalizar: patrón, fuente de verdad,
     mantenimiento de coherencia).
   - **Campos** con **tipo BSON** correcto (`Date` UTC, `Decimal128` para dinero, `ObjectId` para
     ids/refs), `required`, enums de estado, `tenantId`, auditoría (`createdAt`/`updatedAt`) y
     `schemaVersion`.
   - **Índices** (guía ESR, `tenantId` como primera clave, únicos por tenant, TTL para efímeros).
   - **Validador `$jsonSchema`** (required + tipos + enums) con `validationLevel`/`validationAction`.
   - **Invariantes** (p. ej. no doble reserva) y su mecanismo (índice único + escritura condicional).
4. **Mantener COHERENCIA global**: una entidad se llama igual en todas las colecciones, DTOs,
   diagramas y código; los tipos y `tenantId` son consistentes en todo el modelo.
5. **Producir los artefactos** según el estado del proyecto:
   - **Documentación (siempre)**: completa `sections_readme/04-data-model.md` con (a) un diagrama
     ER en **Mermaid** y (b) la descripción por entidad (campos, tipos, claves, relaciones,
     restricciones, índices, validador). Este documento es el diseño canónico.
   - **Código (solo si existe `code/backend/` NestJS)**: genera los esquemas Mongoose
     `*.schema.ts` (en inglés, sin comentarios) alineados con el validador `$jsonSchema`, más un
     módulo con las definiciones de índices/validadores que la skill `mongodb-migrations` aplicará.
     Si NO existe backend, no crees código: deja el diseño listo para que las migraciones y el
     código futuro lo implementen.
6. **Handoff de persistencia**: la **creación** de colecciones, índices y validadores en la base
   se realiza SIEMPRE mediante la skill `mongodb-migrations`
   (`.claude/skills/mongodb-migrations/SKILL.md`), no con comandos ad hoc. Esta skill diseña; las
   migraciones aplican. Entrega a esa skill la lista de índices y validadores a crear.
7. **Una intención por artefacto**: si el modelo es grande, agrúpalo por agregado/módulo y avísalo.

## Ejemplo de diseño de colección (referencia)

```javascript
{
  _id: ObjectId(),
  tenantId: ObjectId(),
  employeeId: ObjectId(),
  service: { serviceId: ObjectId(), name: "Haircut", durationMinutes: 30, price: NumberDecimal("25.00") },
  customer: { name: "Ada Lovelace", phone: "+34600000000" },
  startsAt: ISODate("2026-07-10T09:00:00Z"),
  status: "confirmed",
  schemaVersion: 1,
  createdAt: ISODate(),
  updatedAt: ISODate()
}
```

Índice de unicidad e invariante (no doble reserva), con `tenantId` primero (ESR):

```javascript
db.appointments.createIndex(
  { tenantId: 1, employeeId: 1, startsAt: 1 },
  { name: "uq_tenant_employee_startsAt", unique: true,
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } } }
)
```

## Lista de verificación de calidad (antes de terminar)

- [ ] He leído las rules `mongodb-*` y las he aplicado como fuente de verdad.
- [ ] Cada entidad del dominio (glosario/`domain_model.puml`) está modelada o justificada su omisión.
- [ ] Nombres en inglés, `camelCase`, coherentes con dominio, diagramas y código.
- [ ] Tipos BSON correctos (`Date` UTC, `Decimal128` dinero, `ObjectId` refs).
- [ ] `tenantId` requerido en toda colección de negocio y como PRIMERA clave de cada índice.
- [ ] Cada decisión embed/reference y toda denormalización está justificada (patrón, fuente de verdad, coherencia).
- [ ] Índices siguen la guía ESR; unicidad definida por tenant; TTL en datos efímeros.
- [ ] Validador `$jsonSchema` definido con `validationLevel`/`validationAction`.
- [ ] Invariantes críticas (no doble reserva) tienen mecanismo definido.
- [ ] La creación en base se delega a la skill `mongodb-migrations` (no comandos ad hoc).

## Ejemplos de invocación

- "Genera el modelo de datos MongoDB de las entidades del dominio a partir de la documentación."
- "Modela la colección de reservas (appointments) con sus índices y validador."
- "Actualiza el modelo de datos: añade recordatorios (reminders) con expiración TTL."
