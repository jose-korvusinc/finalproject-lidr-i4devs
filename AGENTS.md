# AGENTS.md — Instrucciones para agentes de IA

Este proyecto define sus convenciones para agentes de IA en la carpeta **`.claude/`**, que
es la **única fuente de verdad**. Este fichero `AGENTS.md` expone esas convenciones a Cursor
y a cualquier herramienta compatible con el estándar *agents.md*, **sin duplicar contenido**:
solo referencia los ficheros de `.claude/`. Si editas las convenciones, hazlo en `.claude/`.

## Reglas (léelas y aplícalas siempre que correspondan)

- **Nomenclatura de ficheros** → `.claude/rules/file-naming.md`
  Todos los nombres de ficheros y carpetas que generes deben estar **en inglés**
  (`kebab-case` por defecto). Afecta al nombre, no al contenido. Aplica **siempre** que
  crees, renombres o muevas un fichero.

- **Diagramas UML / RUP (QUÉ crear)** → `.claude/rules/uml-rup.md`
  Decide qué diagrama UML del modelo 4+1 crear, en qué vista y fase RUP, y con qué
  convenciones de modelado. Aplica al crear/editar diagramas UML o ficheros `.puml`.

- **Sintaxis PlantUML (CÓMO escribirlo)** → `.claude/rules/plantuml-syntax.md`
 Define cómo escribir cada `.puml` (estilo base, relaciones, multiplicidades, estereotipos,
 fragmentos). Las etiquetas de los diagramas van en **inglés**; los nombres de fichero, en
 inglés (regla de nomenclatura).

- **Diseño de base de datos MongoDB 8.3** → `.claude/rules/mongodb-*.md`
  Conjunto cohesionado de rules para el modelo de datos (fuente de verdad al crear/editar
  esquemas, colecciones, índices, validadores o migraciones):
  `mongodb-data-modeling.md`, `mongodb-normalization-fnbc.md`, `mongodb-schema-conventions.md`,
  `mongodb-multitenancy.md`, `mongodb-indexing-and-performance.md`,
  `mongodb-transactions-and-integrity.md`, `mongodb-scalability-and-evolution.md`,
  `mongodb-security.md`. La capa de acceso es Mongoose (`@nestjs/mongoose`); las migraciones se
  gestionan con `migrate-mongo` (**no** Prisma).

- **Frontend Angular 22** → `.claude/rules/angular-*.md`
  Conjunto cohesionado de rules para el desarrollo del frontend (fuente de verdad al crear/editar
  componentes, servicios, rutas, formularios, estilos o tests en `code/frontend`):
  `angular-architecture.md`, `angular-components-and-signals.md`,
  `angular-templates-and-performance.md`, `angular-api-and-multitenancy.md`,
  `angular-forms-and-accessibility.md`, `angular-testing-and-quality.md`. Angular 22 signals-first:
  standalone y `OnPush` por defecto (no los declares), `input()/output()/model()`, `inject()`,
  Resource API, Signal Forms, control de flujo nativo. Todo el código en **inglés y sin
  comentarios**; el texto de UI vía i18n. Alcance **solo frontend**: consume la API REST de NestJS,
  nunca accede a la base de datos.

- **Backend NestJS 11.1** → `.claude/rules/nestjs-*.md`
  Conjunto cohesionado de rules para la **capa de aplicación** del backend (`code/backend`):
  `nestjs-architecture.md`, `nestjs-validation-and-dtos.md`, `nestjs-data-access-mongoose.md`,
  `nestjs-security-and-multitenancy.md`, `nestjs-performance-and-async.md`,
  `nestjs-errors-and-observability.md`, `nestjs-testing-and-quality.md`. Cubren arquitectura
  modular, DTOs/validación, acceso a datos con Mongoose, multitenancy por petición, caché,
  errores/observabilidad y tests. El **modelo de datos** sigue siendo competencia de las rules
  `mongodb-*.md` (única fuente de verdad de persistencia), que estas rules **referencian sin
  reescribir**.

> Si hay conflicto entre una suposición y estas rules, **mandan las rules**.

## Flujos de trabajo especializados

- **Generar un diagrama UML** → sigue el flujo de la skill `.claude/skills/uml-diagram/SKILL.md`.
  Lee antes las dos rules de UML; recopila nombres reales del dominio desde
  `sections_readme/` y el código; guarda el `.puml` en la carpeta de su vista bajo
  `system_architecture/` con nomenclatura `<type>_<topic>.puml` (en inglés).

- **Generar VARIOS diagramas coherentes** (p. ej. "documenta toda la vista lógica") → sigue
  el comportamiento del agente `.claude/agents/uml-diagrams-maker.md`: produce todos los
  diagramas manteniendo coherencia de nombres entre ellos y con el modelo de datos/código.

- **Exportar diagramas `.puml` a imagen** → sigue el flujo de la skill
  `.claude/skills/uml-export/SKILL.md`, que autodetecta el motor de render (plantuml CLI, Docker o
  el jar de la extensión) y deja el `.png`/`.svg` junto al `.puml`. Es el paso complementario a
  `uml-diagram`: primero se generan/actualizan los `.puml`, luego se exportan; no modifica el
  contenido de los diagramas.

- **Modelar el dominio en MongoDB** → sigue el flujo de la skill
  `.claude/skills/mongodb-domain-model/SKILL.md`. Lee antes las rules `mongodb-*`; recopila los
  nombres reales del dominio desde `system_architecture/domain_model/` y `sections_readme/`;
  documenta el modelo en `sections_readme/04-data-model.md` (ER en Mermaid + entidades) y, si
  existe `code/backend/`, genera los esquemas Mongoose `*.schema.ts`.

- **Modelar VARIAS entidades coherentes** (p. ej. "modela todo el dominio de reservas") → usa el
  agente `.claude/agents/mongodb-data-modeler.md`: modela todas las entidades manteniendo
  coherencia de nombres y tipos, y delega la creación en base a la skill de migraciones.

- **Migraciones de MongoDB** → sigue el flujo de la skill
  `.claude/skills/mongodb-migrations/SKILL.md`: migraciones versionadas, idempotentes y
  reversibles con `migrate-mongo` (**no** Prisma). Es el paso que aplica en la base el modelo
  diseñado por `mongodb-domain-model`.

- **Desarrollar el frontend Angular 22** → sigue el flujo de la skill
  `.claude/skills/angular-frontend-dev/SKILL.md`. Lee antes las rules `angular-*`; inspecciona
  `code/frontend` (`angular.json`, `src/app/`) y `sections_readme/` para el dominio; genera
  componentes signals-first, servicios con Resource API, interceptor multitenant, Signal Forms y
  tests. Alcance estrictamente frontend.

- **Construir una feature de frontend completa** (p. ej. "crea el widget público de reserva" o
  "monta el backoffice de agenda con FullCalendar") → usa el agente
  `.claude/agents/angular-frontend-developer.md`: produce todas las piezas (rutas perezosas,
  componentes, servicios, estilos, tests) manteniendo coherencia, y **nunca** toca el backend
  NestJS ni la base de datos MongoDB.

- **Desarrollar el backend NestJS** → sigue el flujo de la skill
  `.claude/skills/nestjs-backend-dev/SKILL.md`. Lee antes las rules `nestjs-*` y las `mongodb-*`
  relevantes; trabaja SOLO en `code/backend` (nunca el frontend); delega el diseño del modelo de
  datos a `mongodb-domain-model` y las migraciones a `mongodb-migrations`.

- **Implementar una feature de backend completa** (p. ej. "implementa el módulo de reservas
  end-to-end") → usa el agente `.claude/agents/nestjs-backend-developer.md`: implementa módulos,
  controladores finos, servicios, DTOs, guards/interceptors/filtros y tests (incluido el de
  aislamiento entre tenants) manteniendo coherencia entre capas, con alcance estricto de backend.

## Nota sobre Cursor

Cursor carga este `AGENTS.md` como instrucciones de proyecto. Para invocar manualmente los
flujos puedes pedirlos en lenguaje natural (p. ej. "genera el diagrama de casos de uso de
las HU seleccionadas"); el agente leerá los ficheros de `.claude/` referenciados y los
aplicará.
