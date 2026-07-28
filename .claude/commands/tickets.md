---
description: Descompone una historia de usuario (HU) en issues de GitHub pequeñas y verticales (estilo JIRA), separadas por frontend y backend, trazables a la HU y sus criterios de aceptación. Genera un plan revisable y, tras tu aprobación, crea las issues con gh.
argument-hint: <HU a descomponer, p. ej. HU1 (o su nombre)>
---

Descompone la historia de usuario indicada en `$ARGUMENTS` en **issues de GitHub pequeñas**
(estilo ticket JIRA), separadas en **frontend** y **backend**, aplicando la skill
`.claude/skills/github-issue-breakdown/SKILL.md`. Tú (hilo principal) orquestas y **no creas nada en
GitHub sin la aprobación explícita del usuario** (gate de revisión).

## 0. Preparación

1. Si `$ARGUMENTS` está vacío o es ambiguo, **pregunta** qué HU descomponer; no la inventes. El
   proyecto tiene seleccionadas **HU1–HU4** (`sections_readme/02-user-stories.md` §2.3).
2. Invoca la skill `github-issue-breakdown` y sigue su método. Recopila la spec de la HU: su texto y
   escenarios BDD (`02-user-stories.md`), sus estados y pantallas
   (`system_architecture/user_stories_view/`), el contrato de API (`05-api-specification.md`) y el
   modelo de datos (`04-data-model.md`). No inventes comportamiento no especificado.
3. Comprueba si ya existen tickets de esa HU: `gh issue list --label "story:HU<N>" --state all` (si
   `gh` está disponible). Si los hay, **avisa** y no los recrees salvo que el usuario lo pida.

## 1. Descomponer (generar el plan)

Aplicando la skill, produce el **plan de tickets**: la lista de issues FE y BE con, por cada una,
título (inglés), capa, escenario(s)/estado(s) BDD que cubre, dependencias y estimación *Small*.
Respeta la cobertura mínima y los principios de la skill (vertical, pequeño, trazable, invariantes de
seguridad incluidas).

## 2. GATE de revisión (OBLIGATORIO — no crear nada aún)

Presenta el plan al usuario en una **tabla resumen** (nº propuesto, título, capa, HU/escenario,
depende de, estimación) más el **cuerpo completo** de al menos un ticket de ejemplo por capa para que
valide el formato. Señala explícitamente cualquier ticket que dudes que sea *Small* o cuya dependencia
sea incierta.

**Pregunta y espera la aprobación** del usuario. No avances a crear issues hasta un OK claro. Si pide
cambios (más/menos granularidad, renombrar, quitar), ajusta el plan y vuelve a mostrarlo.

## 3. Verificar `gh` (fail-closed)

Antes de crear nada: `gh --version` y `gh auth status`. Si `gh` no está instalado o no hay sesión,
**detente** e indica al usuario que ejecute `! gh auth login` (o instale `gh`). No intentes crear
issues sin sesión ni manejes tokens en claro.

## 4. Crear en GitHub

Tras la aprobación y con `gh` operativo, siguiendo la skill (§5):

1. Crea el **milestone** de la HU (idempotente) y los **labels** necesarios (idempotentes).
2. Crea las issues **en orden de dependencia** (lo dependido primero); escribe cada cuerpo a un `.md`
   temporal en el scratchpad y usa `gh issue create --body-file`. Captura el `#número`/URL devuelto y
   referencia `#<n>` en los cuerpos que declaren "Depende de".

## 5. Reporte

Resume las issues creadas en una **tabla** (nº, título, capa, URL) agrupadas por frontend/backend, con
el milestone y los labels aplicados. Recuerda que cada ticket se implementa en **TDD** (`/tdd`) y
respeta el aislamiento multitenant.

## Guardarraíles

- **Rojo → verde de aprobación**: ninguna issue se crea antes del OK del usuario al plan (paso 2).
- No dupliques issues de una HU ya desglosada (paso 0.3).
- No escribas código de producción ni toques `code/`: este comando solo produce y crea tickets.
- Títulos y labels en **inglés**; trazabilidad a la HU y su BDD obligatoria en cada ticket.
