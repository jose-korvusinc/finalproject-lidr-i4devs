---
name: github-issue-breakdown
description: Descompone una historia de usuario (HU) del proyecto en issues de GitHub pequeñas y verticales (estilo ticket JIRA), separadas por frontend Angular y backend NestJS, trazables a la HU y sus criterios de aceptación (BDD). Úsala cuando el usuario pida generar/crear los tickets o issues de una historia de usuario. Genera un plan revisable y, tras aprobación, crea las issues con `gh`. Aplica SIEMPRE las rules del proyecto como única fuente de verdad; NO escribe código de producción.
---

# Skill: Descomposición de historias de usuario en issues de GitHub

Convierte **una** historia de usuario (HU1–HU4 del proyecto) en un conjunto de **issues pequeñas,
verticales y accionables** (estilo ticket JIRA), separadas en **frontend** (Angular 22, `code/frontend`)
y **backend** (NestJS 11.1, `code/backend`). Esta skill define **el método y el formato**; no inventa
comportamiento ni convenciones: los toma de la documentación y las rules del proyecto, que son la
**única fuente de verdad**.

Esta skill **no escribe código de producción**. Su entregable es: (1) un **plan de tickets** revisable
y (2), tras aprobación, las **issues creadas en GitHub** con sus labels y milestone.

## 0. Fuente de verdad (OBLIGATORIO leer antes de descomponer)

Antes de generar ningún ticket, recopila la spec de la HU y su contexto:

- **Historia de usuario y criterios de aceptación (BDD)** → `sections_readme/02-user-stories.md`
  (rol, objetivo, escenarios *Dado/Cuando/Entonces*, prioridad, dependencias). Es el origen de la
  trazabilidad: cada ticket cita la HU y el/los escenario(s) que cubre.
- **Estados y pantallas por estado** → `system_architecture/user_stories_view/state-diagram_huN.png`
  y las capturas por estado en `system_architecture/user_stories_view/huN/` (cada estado ≈ una
  porción de UI/flujo). El wireframe general está en
  `system_architecture/user_stories_view/wireframe_huN-*.png`.
- **Contrato de API** → `sections_readme/05-api-specification.md` (endpoints; si un endpoint aún no
  está especificado, el ticket lo propone de forma coherente con `nestjs-architecture.md` §4).
- **Modelo de datos** → `sections_readme/04-data-model.md` y las rules `mongodb-*`.
- **Rules aplicables** (marcan el "cómo" de cada ticket y su Definition of Done):
  - Backend: `.claude/rules/nestjs-*.md` y `.claude/rules/mongodb-*.md`.
  - Frontend: `.claude/rules/angular-*.md`.
  - Transversal: `.claude/rules/tdd-workflow.md` (todo ticket se implementa en TDD),
    `.claude/rules/file-naming.md` (nombres en inglés).

Si la HU indicada no existe o es ambigua, **detente y pregunta**; no inventes una HU.

## 1. Principios de descomposición

1. **Vertical antes que horizontal.** Un ticket entrega una porción de valor de punta a punta dentro
   de su capa, no "una capa técnica entera". Deriva los cortes de los **escenarios BDD** y de los
   **estados** del diagrama de la HU, no de las tablas de la base de datos.
2. **Pequeño (INVEST · *Small*).** Cada ticket debe ser abordable en **≤ 1–2 días**. Si un escenario
   es grande, pártelo (p. ej. "endpoint de creación" vs. "validación de unicidad de subdominio").
   Señala en el plan cualquier ticket que dudes que sea *Small*.
3. **Separación FE / BE estricta**, coherente con el alcance de los agentes del proyecto: los tickets
   de backend nunca tocan `code/frontend` y viceversa. El contrato de API es la frontera entre ambos.
4. **Backend habilita frontend.** Cuando un ticket de FE consume un endpoint, declara la **dependencia**
   al ticket de BE que lo expone. Ordena el plan para que lo dependido vaya primero.
5. **Trazabilidad obligatoria.** Cada ticket enlaza a la **HU** y cita el/los **escenario(s) BDD** y/o
   **estado(s)** que satisface. Sin trazabilidad, el ticket no se crea.
6. **Invariantes de seguridad como tickets o como DoD, nunca omitidas.** El **aislamiento multitenant**
   (backend) y la **cabecera de tenant** (frontend) son requisitos, no extras: van en el DoD de todo
   ticket que toque datos, con su test correspondiente (ver §4).

## 2. Cobertura mínima por HU (checklist de cortes típicos)

Genera al menos los tickets que cubran, según aplique a la HU:

**Backend (NestJS):**
- Modelo de datos y migración (esquema `$jsonSchema`, índices, validador) — delega el diseño a
  `mongodb-domain-model` y la migración a `mongodb-migrations`; el ticket referencia esa entrega.
- DTOs de entrada/salida con validación (`class-validator`, whitelist).
- Endpoint(s) del caso de uso (controlador fino + servicio), con su verbo/ruta versionada.
- Invariante de negocio de la HU (p. ej. unicidad de subdominio, no doble reserva → 409, bloqueo de
  borrado con dependencias) con su **test** (unitario + e2e cuando toque datos).
- Aislamiento multitenant del recurso (guard/plugin de tenant) con **test e2e de no-fuga** entre
  tenants (obligatorio si el recurso es de negocio).

**Frontend (Angular):**
- Servicio de API de la feature (`*.api.ts`, Resource API para lecturas, `HttpClient` para escrituras).
- Componente(s) de página/presentación por estado del diagrama (formulario, listado, panel, widget…),
  signals-first, con estados de carga/error/vacío.
- Formulario con **Signal Forms** + validación accesible (AXE/WCAG AA) e **i18n** cuando aplique.
- Ruta perezosa de la feature y cableado en el router.
- Manejo de los estados de conflicto/rechazo del BDD (p. ej. subdominio ocupado, hueco no disponible).

No fuerces tickets que la HU no necesite. Ajusta el número al alcance real (una HU pequeña puede salir
con 4–6 tickets; una crítica con 8–12).

## 3. Formato del ticket (cuerpo de la issue)

Cada issue usa esta plantilla en Markdown (contenido en español; **títulos de issue y labels en
inglés**, coherentes con `file-naming.md` y el código):

```markdown
## Contexto
Trazabilidad: <HU_ID> — <título de la HU>. Cubre: <escenario(s) BDD / estado(s)>.
Breve objetivo del ticket (1–2 frases: qué valor entrega y por qué).

## Alcance
- [ ] Punto de trabajo 1
- [ ] Punto de trabajo 2
Fuera de alcance: <lo que NO entra, para mantenerlo Small>.

## Criterios de aceptación
```gherkin
Escenario: <derivado del BDD de la HU>
  Dado ...
  Cuando ...
  Entonces ...
```

## Notas técnicas
- Rules aplicables: <lista concreta, p. ej. nestjs-validation-and-dtos.md, mongodb-multitenancy.md>.
- Contrato/endpoint o componente afectado: <ruta HTTP o componente/servicio>.
- Dependencias: <#issue o "HU previa"> · Bloquea a: <#issue>.

## Definition of Done
- [ ] Implementado en TDD (rojo → verde → refactor), suite en verde.
- [ ] (Backend, si toca datos) test e2e de aislamiento entre tenants pasando.
- [ ] (Frontend) AXE/WCAG AA sin violaciones en la UI tocada; texto vía i18n.
- [ ] Lint/format sin errores; código en inglés y sin comentarios.
- [ ] Trazable a <HU_ID> y a su(s) criterio(s) de aceptación.
```

Adapta el DoD a la capa (no pongas ítems de frontend en un ticket de backend).

## 4. Convención de metadatos (labels y milestone)

- **Milestone**: uno por HU → `HU1`, `HU2`, `HU3`, `HU4` (título = `HU<N>: <nombre corto>`).
- **Labels** (créalas de forma idempotente antes de usarlas, ver §5):
  - Capa: `area:frontend`, `area:backend`.
  - Historia: `story:HU1` … `story:HU4`.
  - Tipo: `type:feature`, `type:test`, `type:data-model`, `type:chore`.
  - Cuando aplique: `security:multitenancy`, `a11y`.
- **Título de la issue** (inglés, imperativo, prefijo de capa y HU):
  `[HU1][BE] Create tenant registration endpoint with unique subdomain`
  `[HU1][FE] Build tenant registration form (Signal Forms + a11y)`.

## 5. Creación en GitHub con `gh` (tras aprobación)

La creación es un **efecto externo**: solo ocurre después de que el usuario apruebe el plan (el
comando `/tickets` gestiona ese gate). Requisitos y pasos:

1. **Verifica `gh`**: `gh --version` y `gh auth status`. Si `gh` no está instalado o no hay sesión,
   **detente** e indica al usuario que ejecute `! gh auth login` (o instale `gh`); no intentes crear
   issues sin sesión. No manejes tokens en claro ni los loguees.
2. **Repositorio**: usa el remoto `origin` del repo (no lo hardcodees); `gh` lo detecta solo dentro
   del repo.
3. **Milestone idempotente** (la creación falla si ya existe; ignora ese error):
   ```bash
   gh api repos/{owner}/{repo}/milestones -f title="HU1: Registro de tenant" 2>/dev/null || true
   ```
4. **Labels idempotentes**:
   ```bash
   gh label create "area:backend" --color 1D76DB --force >/dev/null 2>&1 || true
   ```
5. **Crear cada issue** con el cuerpo desde un fichero temporal (evita problemas de escaping); usa el
   scratchpad para los `.md` temporales, no el árbol del proyecto:
   ```bash
   gh issue create \
     --title "[HU1][BE] Create tenant registration endpoint with unique subdomain" \
     --body-file "$SCRATCH/hu1-be-01.md" \
     --label "area:backend" --label "story:HU1" --label "type:feature" \
     --milestone "HU1: Registro de tenant"
   ```
6. **Dependencias**: crea primero los tickets de los que dependen otros; captura el número/URL que
   devuelve `gh issue create` y referencia `#<n>` en los cuerpos que declaren "Depende de".
7. **Reporta** al final la tabla de issues creadas (número, título, URL) agrupadas por capa, y avisa de
   cualquier ticket que hayas marcado como dudoso en tamaño o dependencia.

## 6. Guardarraíles

- **Nunca** crees issues sin la aprobación del plan (lo controla `/tickets`).
- **No** dupliques issues: si el comando indica que ya existen tickets de esa HU (búsqueda por label
  `story:HUN`), avisa y no recrees.
- **No** escribas código de producción ni toques `code/`. Esta skill solo produce tickets.
- Mantén los títulos y labels **en inglés**; el cuerpo puede ir en español (coherente con la doc del
  proyecto).
- Todo ticket es **trazable** a una HU y su BDD; si no lo es, no se crea.
