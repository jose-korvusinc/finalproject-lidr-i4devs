### 5. Modelo de Datos

[Volver al índice de prompts](../prompts.md)

**Prompt 1: Metaprompt para crear un prompt que genere las reglas de MongoDB 8.3 (Claude Opus 4.8)**
Crea un prompt que genere la regla o reglas en .claude/rules como experto diseñador de base de datos en MongoDB 8.3 siguiendo las buenas prácticas,
cumplir las normas de normalización FNBC, que sea facilmente escalable y mantenible.

Prompt generado: [Reglas de MongoDB 8.3 para `.claude/rules`](generated_prompts/mongodb-8.3-rules-generation-prompt.md)

**Prompt 2: Prompt sobre la posibilidad de crear un agente y skill para migraciones con Prisma y MongoDB 8.3 (Claude Opus 4.8)**
¿como verias crear un subagente y skill que uses estas reglas de MongoDB para crear el modelado de las entidades del dominio en función de la documentación existente y de gestionar las migraciones con Prisma, o seráa suficiente con tener las reglas y crear un skill para las migraciones con Prisma? Dame una respuesta sin tener en cuenta mis preferencias, dime lo que creas mas convieniente aunque no me guste y basate en datos cientificos y no investes o presupongas nada

**Prompt 3: Prompt para generar diagrama ERD y migraciones del modelo de datos del dominio (Claude Opus 4.8)**
Usa el subagente mongodb-data-modeler para generar el modelado de datos REAL del dominio del proyecto.
Fuente de verdad: las rules `.claude/rules/mongodb-*.md`; mecanismo: la skill `mongodb-domain-model` (y `mongodb-migrations` para la migración).
Basa el modelo en la documentación de la fase de diseÃ±o `system_architecture/design_view/classes_design/` (especialmente `classes_design_domain.puml` y `classes_design_persistence.puml`), y contrástala con `system_architecture/domain_model/domain_model.puml` y `glossary.txt`.
Modela TODAS las entidades del dominio (business, employees, services, working-hours, time-slots, appointments, customers, reminders, otp) como colecciones/sub-documentos, decidiendo embed vs reference con justificación (FNBC), con tipos BSON, `tenantId`, auditorí­a, `schemaVersion`, í­ndices (guí­a ESR, `tenantId` primero, únicos por tenant, TTL) y validadores `$jsonSchema`.
MantÃ©n COHERENCIA de nombres y tipos entre todas las entidades y con la documentación de diseÃ±o.
Documenta el modelo en `sections_readme/04-data-model.md`: incluye un diagrama ERD en Mermaid (`erDiagram`, con claves y relaciones) y la descripción por entidad (campos, tipos, claves, restricciones, í­ndices).
Como NO existe aún `backend/`, no generes código Mongoose: deja el diseño canónico documentado y listo para implementar.
Después, usando la skill `mongodb-migrations` (migrate-mongo, NO Prisma), crea la PRIMERA migración idempotente y reversible: la colección `appointments` con su validador `$jsonSchema` y su índice único por tenant que evita la doble reserva.
No inventes entidades ni atributos que no están en la documentación: marca como suposición cualquier decisión no derivable, y no uses Prisma ni un segundo ODM.
Entrega: resumen por entidad (colección, decisión embed/reference, í­ndices), ruta del modelo documentado con el ERD, y el fichero de migración creado con qué crea y cómo se revierte. En el documento @sections_readme/04-data-model.md tienes que documentar y poner en formato mermaid el modelo ERD y caracteristicas principales de cada entidad.


