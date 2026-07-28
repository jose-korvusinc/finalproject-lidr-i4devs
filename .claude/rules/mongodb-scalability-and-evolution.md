# Regla: Escalabilidad y evolución del esquema en MongoDB 8.3

Esta regla asegura que el modelo **crezca** (por número de tenants y volumen de citas) y
**evolucione** sin romper la trazabilidad. Trabaja con `mongodb-data-modeling.md`,
`mongodb-multitenancy.md` e `mongodb-indexing-and-performance.md`.

## 1. Preparación para sharding

Aunque no se despliegue sharding desde el día uno, diseña para poder hacerlo:

- **Shard key** con **alta cardinalidad** y **buena distribución**; evita claves **monótonas**
  (p. ej. `_id` creciente, `createdAt`) que crean un punto caliente → usa **hashed sharding** o una
  clave compuesta que empiece por un campo de alta cardinalidad.
- En multitenancy, una shard key que empiece por `tenantId` (o `{ tenantId, ...hashed }`) alinea la
  distribución con el aislamiento; evita que un tenant enorme cree un jumbo chunk revisando la
  cardinalidad interna.
- Herramientas de MongoDB 8.x para rectificar sin migración manual: `reshardCollection` (5.0+),
  `moveCollection` y `unshardCollection` (**nuevas en 8.0**), `analyzeShardKey` (7.0+).

## 2. Colecciones time-series (métricas y series temporales)

Para datos de serie temporal puros (métricas de uso, analítica de reservas), usa **time-series
collections** (GA desde 5.0) en vez de colecciones normales o el patrón bucket manual:

- `timeField` (obligatorio), `metaField` (opcional e **inmutable** tras la creación), y
  `granularity` (`seconds`/`minutes`/`hours`) **o** `bucketMaxSpanSeconds` + `bucketRoundingSeconds`
  (deben ser iguales), no ambos.
- Limitaciones: updates/deletes deben filtrar por `metaField`; en 8.0 **está deprecado** incluir el
  `timeField` en la shard key (reparte por `metaField`).
- No las uses para entidades de negocio con ciclo de vida (citas, servicios): esas van en
  colecciones normales.

## 3. Crecimiento acotado del documento

- Respeta el límite de **16 MB** por documento; nunca dejes crecer arrays sin límite (aplica
  `subset` o referencia, ver `mongodb-data-modeling.md`). Para binarios grandes, GridFS.

## 4. Versionado y migración de esquema

- Incluye `schemaVersion` en las colecciones que vayan a evolucionar (**Schema Versioning
  Pattern**): permite convivencia de versiones y migración perezosa.
- Las **migraciones** son **scripts idempotentes y reversibles**, versionados en el repositorio,
  con estrategia hacia delante y de rollback. Evita migraciones "big-bang" bloqueantes cuando el
  patrón de versión permita migrar bajo demanda.
- Mantén **compatibilidad hacia atrás** durante la transición (la aplicación lee vN y vN-1).

## 5. Archivado y retención

- Define políticas de retención para datos efímeros o históricos: **TTL** para OTP/sesiones (ver
  `mongodb-indexing-and-performance.md`), o **Archive Pattern** (mover a colección/almacenamiento
  frío) para citas antiguas.

## 6. Trazabilidad

- Todo cambio de modelo (nueva colección, campo, índice o migración) debe poder **rastrearse hasta
  la spec o el caso de uso** que lo motiva, coherente con la metodología del proyecto.
