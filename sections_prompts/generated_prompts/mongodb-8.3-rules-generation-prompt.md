# Prompt generado — Reglas de MongoDB 8.3 para `.claude/rules` (OpenSpec)

> Prompt resultante del **Prompt 1** del apartado [5. Modelo de Datos](../04-data-model.md).
> Ejecútalo para generar la regla (o reglas) de diseño y buenas prácticas de MongoDB 8.3 en `.claude/rules/`.

```text
Eres un arquitecto y diseñador de bases de datos experto en MongoDB 8.3, con más de 10 años
modelando datos para sistemas de producción de alta concurrencia. Dominas tanto la teoría
relacional de normalización (1FN, 2FN, 3FN y la Forma Normal de Boyce-Codd, FNBC/BCNF) como
el modelado de datos orientado a documentos y los patrones de diseño de esquemas de MongoDB.

OBJETIVO
Generar la regla (o el conjunto coherente de reglas) en `.claude/rules/` que codifique las
buenas prácticas de diseño de base de datos en MongoDB 8.3 para este proyecto: esquemas
escalables, mantenibles y correctos. Estas reglas se usarán como fuente de verdad de
convenciones dentro de la metodología OpenSpec (desarrollo dirigido por especificaciones):
cualquier propuesta de cambio o implementación de una spec que toque el modelo de datos, las
colecciones, los índices o las consultas deberá cumplirlas.

COMPORTAMIENTO (OBLIGATORIO)
- No tomes decisiones importantes por tu cuenta: si algo es ambiguo, PREGUNTA antes de actuar.
- No inventes APIs ni características: MongoDB 8.3 es posterior a tu fecha de corte de
  conocimiento. VERIFICA cada operador, comando, opción de índice, sintaxis de agregación y
  práctica que recomiendes contra la documentación oficial vigente (mongodb.com/docs) antes de
  escribirla. Si no puedes verificar algo, márcalo explícitamente como suposición.
- Alcance greenfield: en el proyecto todavía NO hay esquemas de MongoDB ni OpenSpec instalado.
  Las reglas definen las convenciones del modelo de datos que se creará; no asumas colecciones o
  estructura preexistentes. Sí puedes proponer la organización de colecciones recomendada.

CONTEXTO DEL PROYECTO (para acotar las reglas)
SaaS multitenant de reservas de citas. El backend es una API NestJS 11 (acceso a datos vía
Mongoose/driver oficial) sobre MongoDB 8.3, con Redis como caché. Conceptos de dominio
principales: tenant (negocio), empleados, servicios/catálogo, horarios/disponibilidad,
reservas/citas, clientes finales, OTP y notificaciones. El tenant se resuelve por subdominio.
Requisitos sensibles: aislamiento multitenant estricto en todos los accesos a datos,
rendimiento del motor de disponibilidad (respuesta <200 ms percibida), integridad de las
reservas (evitar dobles reservas) y crecimiento por número de tenants y volumen de citas.

NORMALIZACIÓN FNBC EN UN MODELO DOCUMENTAL (punto clave a resolver en las reglas)
La FNBC es un concepto relacional; MongoDB es documental. Las reglas deben CONCILIAR ambos, no
copiar la teoría relacional a ciegas:
- Aplica los principios de normalización (1FN→FNBC) como criterio para eliminar anomalías de
  inserción/actualización/borrado y dependencias funcionales problemáticas: toda dependencia no
  trivial debe partir de una clave candidata; evita dependencias parciales y transitivas dentro
  de un mismo documento.
- La "forma normal" se aplica al modelo lógico de entidades y a sus relaciones (qué se referencia
  vs. qué se embebe), NO a prohibir el anidamiento: los sub-documentos y arrays son legítimos
  cuando modelan una relación de composición todo-parte "posee-a", no una entidad independiente.
- El modelado final se decide por los PATRONES DE ACCESO (lecturas/escrituras reales), no solo
  por la pureza normal. Cuando se opte por denormalización controlada por rendimiento, la regla
  debe: (a) justificar el patrón, (b) definir la fuente de verdad, y (c) especificar cómo se
  mantiene la coherencia (actualizaciones atómicas, transacciones, o recomputación).
- Documenta el criterio embed-vs-reference: embeber para datos que se leen juntos, acotados y
  con cardinalidad limitada; referenciar para entidades compartidas, de alta cardinalidad o con
  ciclo de vida propio.

CONVENCIONES INNEGOCIABLES (deben quedar recogidas en las reglas)
- Todo el modelo de datos se nombra ÍNTEGRAMENTE en inglés: nombres de colecciones, campos,
  índices, vistas, enums y valores técnicos. Los datos de contenido visibles al usuario son
  dominio, no convención de esquema.
- Nomenclatura coherente y explícita: colecciones en plural y `camelCase` (o la convención que
  fijes, pero única y justificada), campos en `camelCase`, sin abreviaturas ambiguas. Coherente
  con la regla `.claude/rules/file-naming.md` para cualquier fichero que se genere.
- NO se añaden comentarios explicativos dentro de los ejemplos de código/esquema. El esquema debe
  autoexplicarse mediante nombres claros. Se permiten únicamente los artefactos que exige la
  herramienta (p. ej. `$jsonSchema`, decoradores de Mongoose). Prohibido el esquema "muerto".

FORMATO DE CADA REGLA (coherente con las reglas existentes del proyecto)
- Ubicación: `.claude/rules/`. Un fichero Markdown por regla.
- Nombre de fichero: en inglés y `kebab-case` (p. ej. `mongodb-schema-design.md`,
  `mongodb-indexing-and-performance.md`, `mongodb-multitenancy.md`,
  `mongodb-normalization-and-data-modeling.md`), conforme a `.claude/rules/file-naming.md`.
- Frontmatter YAML al inicio, con los mismos campos que las reglas actuales:
      ---
      description: <una línea que explique qué regla es y cuándo aplicarla>
      globs: <patrones de ficheros a los que aplica, p. ej. **/*.schema.ts, **/*.model.ts; vacío si aplica siempre>
      alwaysApply: <true|false>
      ---
- Cuerpo en español, con estructura clara (`# Regla: ...`, secciones numeradas). El texto
  explicativo va en español; los identificadores de esquema y los ejemplos van en inglés y SIN
  comentarios.
- Incluye ejemplos cortos (✅ recomendado / ❌ evitar) de documentos, `$jsonSchema`, índices y
  pipelines cuando aclaren la práctica; también en inglés y sin comentarios.
- Principio "una intención por regla": si el alcance es grande, divídelo en varias reglas
  cohesionadas y enlázalas entre sí; si es pequeño y cohesionado, una sola regla.

CONTENIDO QUE DEBEN CUBRIR LAS REGLAS (buenas prácticas de MongoDB 8.3)
Selecciona y organiza en las reglas necesarias, verificando cada punto contra la doc oficial:
1. Modelado de datos y normalización: proceso de diseño dirigido por patrones de acceso;
   principios 1FN→FNBC aplicados al modelo lógico; criterios embed-vs-reference; relaciones
   1-1, 1-N, N-M y sus patrones (referencing, subset, extended reference, computed, bucket,
   outlier, schema versioning); denormalización controlada y mantenimiento de coherencia.
2. Convenciones de esquema: nomenclatura de colecciones/campos/índices en inglés; tipos de
   datos correctos (evitar strings para fechas/números; `Decimal128` para dinero; `Date` UTC);
   uso de `_id` y `ObjectId`; representación de enums y estados; campos de auditoría
   (`createdAt`/`updatedAt`) y su gestión.
3. Validación e integridad: validación de esquema con `$jsonSchema` (`validationLevel`,
   `validationAction`); campos requeridos y restricciones; unicidad e índices únicos; garantías
   de integridad referencial a nivel de aplicación (MongoDB no las impone) y su documentación.
4. Multitenancy (crítico): estrategia de aislamiento (colección compartida con `tenantId`,
   base de datos por tenant, u otra), sus trade-offs y cuándo aplicar cada una; `tenantId` como
   prefijo obligatorio de las claves de índice; garantía de que NINGUNA consulta cruza tenants;
   consideraciones de cifrado y cumplimiento.
5. Indexación y rendimiento: índices compuestos y regla ESR (Equality, Sort, Range); índices
   parciales, `sparse`, TTL (p. ej. OTP y sesiones), de texto, `wildcard`, geoespaciales;
   covered queries; evitar índices redundantes; uso de `explain()` para verificar planes;
   presupuesto de índices por colección.
6. Consultas y agregación: pipeline de agregación idiomático, `$lookup` con moderación,
   proyecciones para minimizar payload, paginación eficiente (por rango/`_id`, no `skip`
   grande), operadores de actualización atómica (`$set`, `$inc`, `$push` con `$slice`).
7. Concurrencia y transacciones: atomicidad a nivel de documento como primer recurso; patrón
   para evitar dobles reservas (índices únicos, actualizaciones condicionales, optimistic
   concurrency con versión); transacciones multi-documento solo cuando sean imprescindibles y
   sus costes; `readConcern`/`writeConcern` recomendados.
8. Escalabilidad: diseño preparado para sharding (elección de shard key, cardinalidad,
   monotonicidad y distribución), colecciones time-series para métricas/citas si aplica,
   estrategias de archivado/retención, y crecimiento acotado de documentos (límite de 16 MB,
   evitar arrays no acotados).
9. Evolución y mantenibilidad: versionado de esquema (schema versioning pattern), estrategia de
   migraciones (scripts idempotentes y reversibles), compatibilidad hacia atrás, y trazabilidad
   de cambios de modelo hasta la spec/caso de uso que los motiva.
10. Seguridad: RBAC y principio de mínimo privilegio del usuario de la aplicación; cifrado en
    reposo y en tránsito; Client-Side/Queryable Encryption para datos sensibles (p. ej. datos de
    contacto del cliente); no exponer `_id`/datos internos innecesarios; sanitización para evitar
    inyección de operadores.
11. Integración con la capa de acceso (NestJS): coherencia entre el esquema de la base de datos y
    los modelos/DTOs de la aplicación (Mongoose/driver), sin duplicar la fuente de verdad;
    convenciones de nombres de ficheros de esquema conforme a `file-naming.md`.

COMPATIBILIDAD CON OPENSPEC
- Redacta las reglas como convenciones normativas (imperativas: "usa", "evita", "debe"),
  fácilmente citables desde una spec o propuesta de cambio.
- No dependas de rutas ni comandos concretos de OpenSpec (aún no está instalado); las reglas
  deben ser válidas por sí mismas y seguir aplicando cuando OpenSpec se integre.

ENTREGA (tu mensaje final)
- Lista de ficheros de regla creados en `.claude/rules/` con una línea de propósito de cada uno.
- Cómo has resuelto la conciliación entre FNBC y el modelado documental (decisiones y criterios).
- Puntos que hayas verificado contra la documentación oficial y cualquier suposición pendiente
  de confirmar.
- Preguntas abiertas, si las hubiera, antes de dar por cerradas las reglas.
```
