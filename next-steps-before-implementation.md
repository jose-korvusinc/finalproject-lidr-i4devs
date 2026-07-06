# Pasos previos a la generación de código (post-fase de diseño)

> Checklist de trabajo para retomar más tarde. Ordenado por prioridad: primero lo que
> más bloquea o encarece el proyecto si se salta. Contexto: SaaS multitenant de reservas,
> Angular 22 + NestJS 11.1 + MongoDB 8.3 + Redis, metodología RUP, alcance HU1–HU4.
> Diagramas de la fase de diseño ya finalizados.

## A. Cerrar contratos y decisiones (lo que más duele si se salta)

- [ ] **Rellenar el modelo de datos** (`sections_readme/05-data-model.md`, hoy vacío) a partir
      de `system_architecture/design_view/classes_design/classes_design_domain.puml`:
      colecciones, campos, tipos, **índices** (incluido `tenant_id` y unicidad de `subdomain`),
      y qué va embebido vs. referenciado.
- [ ] **Definir el contrato OpenAPI de HU1–HU4** (`sections_readme/06-api-specification.md`, hoy
      vacío) a partir de los diagramas de secuencia. Es la frontera front/back y la base para
      **generar los DTOs de Angular desde el OpenAPI**; debe existir antes de codificar.
- [ ] **Fijar la estrategia multitenant** de forma explícita: resolución por subdominio, dónde se
      inyecta `tenant_id`, y cómo lo fuerza la capa de persistencia. Transversal y caro de
      retrofit: decidir antes de la primera línea.
- [ ] **Decidir el tooling que congela el scaffold**: monorepo vs. dos repos, gestor de paquetes,
      runner de tests (Karma vs. Vitest/Jest), ESLint + Prettier, convención de commits,
      estrategia de ramas. Decidir antes de `ng new` / `nest new`.

## B. Esqueleto e infraestructura

- [ ] **Generar los esqueletos**: `nest new` y `ng new` con los flags decididos.
- [ ] **`docker-compose`** con MongoDB + Redis + Nginx (wildcard de subdominio) para desarrollo
      local; endpoint de health y middleware multitenant como stub.
- [ ] **Walking skeleton**: una rebanada vertical fina de extremo a extremo (p. ej. HU1 registro →
      tenant aislado → persistido) que atraviese todas las capas antes de producir en masa.
      Valida que la arquitectura de los diagramas funciona de verdad.

## C. Reglas y puertas de calidad (con el scaffold ya delante)

- [ ] **Generar las reglas de tecnología** (Angular 22, NestJS 11.1, MongoDB 8.3) ancladas al
      scaffold real y **cableadas a ESLint/Prettier** (no como texto suelto). Ver metaprompts en
      `sections_prompts/06-agentic-system.md` y `sections_prompts/generated_prompts/`.
      Requisito: código en inglés y sin comentarios, **impuesto por el linter**.
- [ ] **Puertas de calidad en CI**: lint + format + typecheck + tests, umbral de cobertura,
      pre-commit hooks y un **"definition of done"** por ticket.

## D. Verificación y trazabilidad

- [ ] **Convertir los criterios BDD en tests** (aunque sea como tests *pending*): cada escenario
      de HU1–HU4 → un test e2e/unitario. Es lo que garantiza que el código sea *funcional*.
- [ ] **Desglose en tickets** (`sections_readme/07-work-tickets.md`, hoy plantilla): mapear
      HU → tickets → endpoints → tests, respetando el orden HU1 → HU2 → HU3 → HU4.

## E. Entorno y arranque

- [ ] Variables de entorno y **gestión de secretos**.
- [ ] **Datos semilla** para desarrollo.
- [ ] Verificar que el proxy resuelve subdominios en local.

---

**Resumen:** antes de codificar, cerrar los dos documentos vacíos (modelo de datos + OpenAPI) y
la estrategia multitenant, levantar esqueleto + infraestructura, validar con un walking skeleton,
y solo entonces generar reglas que el linter haga cumplir y tests desde los BDD. Nada de esto
requiere OpenSpec.

**Primer bloqueante a atacar:** rellenar el modelo de datos y el contrato OpenAPI de HU1–HU4 a
partir de los diagramas de diseño existentes.
