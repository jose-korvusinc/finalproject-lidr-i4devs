---
description: Crea los commits de git de un ticket implementado, en orden TDD (tests antes que producción), con un mensaje descriptivo que incluye el ticket, la trazabilidad a la HU y el estado real de los tests y el lint.
argument-hint: <ticket implementado, p. ej. #3 (opcional; si se omite, se infiere de los cambios y la rama)>
---

Crea los **commits de git** de los cambios asociados al ticket indicado en `$ARGUMENTS`, con un
mensaje **descriptivo del ticket implementado y del estado de los tests**. Tú (hilo principal)
orquestas; **no inventes** el estado de la suite: ejecútala y reporta números reales. Aplica
`.claude/rules/tdd-workflow.md` (orden **tests antes que producción**) y `.claude/rules/file-naming.md`.

Los commits son un cambio en el historial: agrúpalos con criterio y **no hagas `push`** salvo que el
usuario lo pida explícitamente.

## 0. Preparación y contexto

1. Determina el **ticket**:
   - Si `$ARGUMENTS` trae un `#N` (o un número), ese es el ticket. Recupera su título y trazabilidad
     con `gh issue view <N> --json number,title,labels,milestone` (si `gh` está disponible).
   - Si `$ARGUMENTS` está vacío, **infiere** el ticket del contexto de la conversación o de la rama
     actual (`git branch --show-current`) y de los cambios (`git status`, `git diff --stat`). Si sigue
     siendo ambiguo, **pregunta**; no lo inventes.
2. Revisa el árbol de trabajo: `git status --short` y `git diff --stat` (staged + unstaged +
   untracked). Identifica qué ficheros pertenecen al ticket. Si hay cambios **ajenos** al ticket,
   **decláralos** y no los incluyas sin confirmación.
3. Determina el/los **stack(s)** afectados por las rutas: `code/backend` (NestJS) y/o `code/frontend`
   (Angular). Esto decide qué suites ejecutar (paso 2) y el `scope` del mensaje (paso 4).

## 1. Guardarraíl de rama (fail-closed)

- Lee la rama actual. Si es la rama por defecto (`main`/`master`), **detente** y propón crear una rama
  de feature antes de commitear (p. ej. `feature/hu1-<n>-<slug>`); no commitees directo a `main` sin
  el OK del usuario.

## 2. Estado real de los tests y el lint (obligatorio, no fabricar)

Ejecuta las comprobaciones de los stacks tocados y **captura los números reales**:

- **Backend** (`code/backend`): `npm test` (Jest). Opcional pero recomendado: `npm run lint`.
- **Frontend** (`code/frontend`): `npm test` o `ng test` (Vitest). Opcional: `npm run lint`.

Anota, por stack: **suites y tests que pasan/fallan** (p. ej. `17/17 passing`) y **lint** (`0 errors`
o el recuento). Estos datos van **literalmente** en el mensaje del commit (paso 4).

### Gate rojo

- Si la suite está **en rojo**, **no commitees** por defecto: informa del fallo y espera indicación.
  Solo procede en rojo si `$ARGUMENTS` incluye un override explícito (p. ej. `--allow-red` o
  `wip`), y en ese caso refléjalo en el mensaje (`Tests: RED (N failing) — WIP`).

## 3. Agrupación en orden TDD

Separa los cambios en dos grupos por ruta/naturaleza y **commitea los tests primero** (coherente con
`tdd-workflow.md` §2):

1. **Tests** — ficheros `*.spec.ts` / `*.e2e-spec.ts` (y utilidades de test).
2. **Producción** — el resto del código del ticket (esquemas, migraciones, DTOs, servicios,
   controladores, componentes, rutas…).

- Usa `git add -- <rutas>` para **stagear selectivamente** cada grupo; no uses `git add -A` a ciegas.
- Si el ticket **solo** tiene producción o **solo** tests, haz **un** commit.
- Si separar es artificial (cambio atómico pequeño), un único commit bien descrito es aceptable:
  decláralo.

## 4. Mensaje de commit (descriptivo, en inglés)

Formato **Conventional Commits**; **asunto en inglés** (coherente con el código y los títulos de
issue), cuerpo en español o inglés (coherente con la doc). Estructura:

```
<type>(<scope>): <subject conciso> (HU<N> #<ticket>)

<1–3 líneas: qué entrega este commit y su trazabilidad a la HU/escenario o estado>

Tests: <stack> <passing>/<total> passing (<runner>)[; lint <estado>].
Traceability: HU<N> · <recurso o criterio>.

Refs #<ticket>
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

- `type`: `feat` (funcionalidad), `test` (solo tests), `fix`, `refactor`, `chore`, `docs`.
  - Commit de **tests** (grupo 1) → `test(<scope>): …`.
  - Commit de **producción** (grupo 2) → `feat`/`fix`/`refactor` según corresponda.
- `scope`: el módulo/feature (p. ej. `tenants`, `booking`, `availability`), derivado de las rutas.
- Incluye **siempre** `#<ticket>` en el asunto y `Refs #<ticket>` al pie (trazabilidad).
- La línea **`Tests:`** lleva los **números reales** del paso 2 (no los inventes). Si corriste lint,
  añádelo.
- Escribe cada cuerpo a un fichero temporal del scratchpad y usa `git commit -F <fichero>` para evitar
  problemas de escaping; no uses `-m` con saltos de línea frágiles.

✅ Ejemplo (producción, ticket #3):

```
feat(tenants): model businesses collection with unique subdomain and status enum (HU1 #3)

Adds the businesses tenant-registry schema: $jsonSchema validator with the
TenantStatus enum, global unique uq_subdomain index and idx_status, plus the
aligned Mongoose business.schema. Root of HU1 onboarding.

Tests: backend 17/17 passing (jest); lint 0 errors.
Traceability: HU1 · businesses data model.

Refs #3
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

✅ Ejemplo (tests, ticket #3):

```
test(tenants): add businesses migration contract and schema specs (HU1 #3)

Failing-first specs for the businesses $jsonSchema (status enum, required
fields, owner) and the uq_subdomain/idx_status migration contract.

Tests: backend 17/17 passing (jest).
Traceability: HU1 · businesses data model.

Refs #3
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

## 5. Ejecutar los commits

1. Stagea el **grupo de tests** y haz su commit (`git commit -F <scratch>/commit-test.md`).
2. Stagea el **grupo de producción** y haz su commit (`git commit -F <scratch>/commit-prod.md`).
3. Verifica con `git log --oneline -n <k>` y `git status` que el árbol queda limpio y el orden es el
   esperado (tests antes que producción).

## 6. Reporte

Resume: rama usada, commits creados (hash corto + asunto), ficheros incluidos por commit y el
**estado de tests/lint** que quedó registrado. Recuerda que **no** se ha hecho `push`; ofrécelo como
siguiente paso solo si el usuario lo pide.

## Guardarraíles

- **No fabriques** el estado de los tests: si no ejecutaste la suite, no la cites.
- **No** commitees en rojo salvo override explícito, y márcalo como WIP en el mensaje.
- **No** commitees directamente en `main`/`master`; propón rama.
- **No** hagas `push` ni toques remotos sin petición explícita.
- **No** incluyas cambios ajenos al ticket sin declararlos y confirmarlos.
- Asunto y `#<ticket>` **en inglés**; trazabilidad a la HU obligatoria.
