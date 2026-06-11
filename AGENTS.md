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
  fragmentos). Las etiquetas de los diagramas van en **español**; los nombres de fichero, en
  inglés (regla de nomenclatura).

> Si hay conflicto entre una suposición y estas rules, **mandan las rules**.

## Flujos de trabajo especializados

- **Generar un diagrama UML** → sigue el flujo de la skill `.claude/skills/uml-diagram/SKILL.md`.
  Lee antes las dos rules de UML; recopila nombres reales del dominio desde
  `sections_readme/` y el código; guarda el `.puml` en la carpeta de su vista bajo
  `system_architecture/` con nomenclatura `<type>_<topic>.puml` (en inglés).

- **Generar VARIOS diagramas coherentes** (p. ej. "documenta toda la vista lógica") → sigue
  el comportamiento del agente `.claude/agents/uml-diagrams-maker.md`: produce todos los
  diagramas manteniendo coherencia de nombres entre ellos y con el modelo de datos/código.

## Nota sobre Cursor

Cursor carga este `AGENTS.md` como instrucciones de proyecto. Para invocar manualmente los
flujos puedes pedirlos en lenguaje natural (p. ej. "genera el diagrama de casos de uso de
las HU seleccionadas"); el agente leerá los ficheros de `.claude/` referenciados y los
aplicará.
