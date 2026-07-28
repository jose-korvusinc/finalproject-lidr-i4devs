# Prompt generado — Sistema agéntico de frontend Angular 22 (reglas + skill + subagente)

> Prompt resultante del **Prompt 1** del apartado [4. Sistema agéntico](../06-agentic-system.md).
> Ejecútalo para generar, de forma coherente, la(s) regla(s) en `.claude/rules/`, la skill en
> `.claude/skills/` y el subagente en `.claude/agents/` especializados en el desarrollo **solo de
> frontend** en Angular 22, y para actualizar `AGENTS.md`.

```text
Eres un ingeniero frontend experto en Angular 22 con más de 10 años construyendo SPAs de
producción, y conoces a fondo las novedades y buenas prácticas actuales del framework. Además
sabes diseñar el "sistema agéntico" de un proyecto Claude Code/Cursor: reglas (`.claude/rules`),
skills (`.claude/skills`) y subagentes (`.claude/agents`) que colaboran de forma coherente.

OBJETIVO
Crear, de forma coherente entre sí, tres tipos de artefacto para el desarrollo frontend del
proyecto, especializados EXCLUSIVAMENTE en frontend Angular 22:
1. La regla (o conjunto cohesionado de reglas) en `.claude/rules/` que codifique las buenas
   prácticas de desarrollo en Angular 22.
2. La skill en `.claude/skills/` que operacionaliza esas reglas (el "cómo se programa" el
   frontend paso a paso, tomando las reglas como única fuente de verdad).
3. El subagente en `.claude/agents/` que usa esa skill para programar el frontend del proyecto.
Estos artefactos se usarán como fuente de verdad de convenciones dentro de la metodología
OpenSpec (desarrollo dirigido por especificaciones): cualquier propuesta de cambio o
implementación de una spec en el frontend deberá cumplirlos.

COMPORTAMIENTO (OBLIGATORIO)
- No tomes decisiones importantes por tu cuenta: si algo es ambiguo, PREGUNTA antes de actuar.
- No inventes APIs: Angular 22 es posterior a tu fecha de corte de conocimiento. VERIFICA cada
  API, sintaxis y práctica que recomiendes contra la documentación oficial vigente (angular.dev)
  antes de escribirla. Si no puedes verificar algo, márcalo explícitamente como suposición.
- El código del frontend del proyecto está en `code/frontend`. Respeta su stack real (versión de
  Angular, `package.json`, `angular.json`, `tsconfig`, linter/formatter) y no propongas cambios
  incompatibles con lo ya instalado.

ARTEFACTOS EXISTENTES A ABSORBER Y ELIMINAR (paso previo obligatorio)
En `code/frontend` existen una carpeta `.claude/` y un fichero `AGENTS.md` que fueron generados
por el scaffolding de Angular y contienen buenas prácticas iniciales (TypeScript estricto,
componentes standalone, signals, control de flujo nativo, accesibilidad AXE/WCAG AA, Signal
Forms, `inject()`, etc.).
- LEE ambos y usa su contenido como material de partida para redactar las reglas, la skill y el
  subagente (no lo pierdas: incorpóralo y amplíalo verificándolo contra angular.dev).
- Una vez incorporado su contenido, ELIMINA `code/frontend/.claude/` y `code/frontend/AGENTS.md`:
  la única fuente de verdad del proyecto es la carpeta raíz `.claude/` (ver `AGENTS.md` raíz). No
  debe quedar configuración agéntica duplicada dentro de `code/frontend`.

CONTEXTO DEL PROYECTO (para acotar los artefactos)
SaaS multitenant de reservas de citas. El frontend es una SPA Angular 22 que ofrece: (1) un
backoffice de gestión (negocio, horarios, catálogo de servicios/empleados, agenda con calendario
interactivo drag&drop usando FullCalendar.io) y (2) un widget público de reserva mobile-first sin
registro. Consume una API REST de NestJS documentada con OpenAPI. El tenant se resuelve por
subdominio. Requisitos sensibles: rendimiento (respuesta de disponibilidad <200 ms percibida), UX
móvil, y aislamiento multitenant en las llamadas al API.

CONVENCIONES DE CÓDIGO INNEGOCIABLES (deben quedar recogidas en las reglas y aplicadas por skill y
subagente)
- Todo el código Angular se escribe ÍNTEGRAMENTE en inglés: identificadores, nombres de
  clases/componentes/servicios/métodos/variables, nombres de ficheros y carpetas, rutas y
  literales técnicos. Los textos visibles al usuario se gestionan por i18n, no se codifican en
  español en el código. Nombres de fichero conforme a `.claude/rules/file-naming.md`.
- NO se añaden comentarios en el código. El código debe autoexplicarse mediante nombres claros,
  funciones pequeñas y una estructura evidente. Se permiten únicamente los artefactos que exige el
  framework/tooling (decoradores, directivas de configuración del linter cuando sean
  imprescindibles). Prohibido el código comentado ("dead code") y los comentarios TODO/FIXME.

FORMATO DE CADA REGLA (coherente con las reglas existentes del proyecto)
- Ubicación: `.claude/rules/` (carpeta raíz, no dentro de `code/frontend`). Un fichero Markdown
  por regla.
- Nombre de fichero: en inglés y `kebab-case` (p. ej. `angular-architecture.md`,
  `angular-components-and-signals.md`, `angular-api-and-multitenancy.md`), conforme a
  `.claude/rules/file-naming.md`.
- Frontmatter YAML al inicio, con los mismos campos que las reglas actuales:
      ---
      description: <una línea que explique qué regla es y cuándo aplicarla>
      globs: <patrones de ficheros a los que aplica, p. ej. **/*.ts, **/*.html; vacío si aplica siempre>
      alwaysApply: <true|false>
      ---
- Cuerpo en español, con estructura clara (`# Regla: ...`, secciones numeradas). El texto
  explicativo va en español; los identificadores de código y los ejemplos van en inglés y SIN
  comentarios.
- Incluye ejemplos de código cortos (✅ recomendado / ❌ evitar) cuando aclaren la práctica.
- Principio "una intención por regla": si el alcance es grande, divídelo en varias reglas
  cohesionadas y enlázalas entre sí; si es pequeño y cohesionado, una sola regla.

CONTENIDO QUE DEBEN CUBRIR LAS REGLAS (buenas prácticas de Angular 22)
Selecciona y organiza en las reglas necesarias, verificando cada punto contra la doc oficial:
1. Arquitectura y estructura: componentes standalone por defecto, `bootstrapApplication`,
   organización por features/dominios, separación de capas (feature/ui/data-access/core/shared),
   límites de dependencia entre capas, lazy loading por ruta.
2. Reactividad con signals: `signal`, `computed`, `effect`; inputs/outputs basados en señales
   (`input()`, `output()`, `model()`), signal queries (`viewChild`, `contentChild`); cuándo usar
   señales frente a RxJS; interoperación (`toSignal`/`toObservable`), `resource`/`rxResource` para
   datos asíncronos. No usar `mutate` en señales (usar `update`/`set`).
3. Plantillas: control de flujo nativo `@if`/`@for` (con `track` obligatorio)/`@switch`/`@let`,
   vistas diferidas `@defer`; evitar lógica pesada en plantilla; `NgOptimizedImage`; usar
   bindings `class`/`style` en vez de `ngClass`/`ngStyle`.
4. Detección de cambios y rendimiento: `OnPush` por defecto en v22+ (no declararlo
   explícitamente) o zoneless (`provideZonelessChangeDetection`), evitar suscripciones manuales
   innecesarias, memoización con `computed`, presupuesto de bundle y estrategias de carga.
5. Inyección de dependencias: función `inject()` en vez de inyección por constructor; servicios
   `providedIn: 'root'` (o el decorador `@Service` en v22+) vs. scope de ruta/componente; tokens
   de inyección tipados; guards/resolvers/interceptors funcionales.
6. Comunicación con el API (crítico multitenant): `HttpClient` con `provideHttpClient`,
   interceptor funcional que inyecta el contexto del tenant/subdominio y auth, tipado de DTOs
   (idealmente generados desde el OpenAPI del backend), manejo de errores centralizado, retries y
   estados de carga.
7. Formularios: preferir Signal Forms (`@angular/forms/signals`, estables en v22+); si no,
   reactive forms tipados; validadores reutilizables, accesibilidad de formularios.
8. Enrutamiento: rutas standalone, `input` binding de parámetros, títulos, guards, lazy routes.
9. Estado: preferir señales/servicios ligeros; criterios para introducir una librería de estado
   solo si se justifica.
10. Estilos, accesibilidad e i18n: encapsulación de estilos, diseño mobile-first, accesibilidad
    (debe pasar AXE y cumplir WCAG AA: foco, contraste, ARIA) e i18n (todos los textos de UI vía
    i18n, nunca hardcodeados).
11. Calidad y testing: estrategia de pruebas (unitarias de componentes/servicios e integración),
    Testing Library/harnesses, mocking del `HttpClient`, cobertura mínima recomendada;
    linting/formato (ESLint + Prettier) que haga cumplir "código en inglés y sin comentarios".
12. Seguridad frontend: prevención de XSS y sanitización de Angular, no exponer secretos, manejo
    seguro de tokens.
13. Integración de FullCalendar.io en el backoffice y patrón del widget público mobile-first.
14. (Opcional, si aplica) SSR/hydration con `provideClientHydration` e hidratación incremental.

FORMATO DE LA SKILL (coherente con las skills existentes del proyecto)
- Ubicación: `.claude/skills/<skill-name>/SKILL.md` (carpeta con `kebab-case`, p. ej.
  `angular-frontend-dev`).
- Frontmatter YAML con `name` y `description` (una línea, en el estilo de las skills actuales:
  cuándo usarla y qué produce). La descripción debe dejar claro que aplica SIEMPRE las reglas
  `angular-*` como única fuente de verdad.
- Cuerpo en español que describa el FLUJO operativo de programar frontend: (a) leer primero las
  reglas `angular-*` y `file-naming.md`; (b) recoger contexto real del dominio y del API
  (OpenAPI, `sections_readme/`, código existente); (c) trabajar dentro de `code/frontend`
  respetando su estructura; (d) checklist de verificación antes de dar por terminado (lint,
  build/test, accesibilidad, sin comentarios, en inglés). La skill NO reescribe las reglas: las
  referencia como fuente de verdad.

FORMATO DEL SUBAGENTE (coherente con los agentes existentes del proyecto)
- Ubicación: `.claude/agents/<agent-name>.md` (p. ej. `angular-frontend-developer`).
- Frontmatter YAML con `name`, `description` (cuándo invocarlo; deja claro que es SOLO frontend) y
  `tools` (el conjunto mínimo necesario, p. ej. `Read, Write, Edit, Glob, Grep, Bash, Skill`).
- Cuerpo en español: define el rol (experto frontend Angular 22), su ALCANCE ESTRICTO a frontend
  (no toca backend ni base de datos), y la instrucción OBLIGATORIA de apoyarse SIEMPRE en la skill
  anterior y en las reglas `angular-*` como fuente de verdad. Debe trabajar sobre `code/frontend`.

ACTUALIZACIÓN DE `AGENTS.md` (OBLIGATORIO)
Tras crear los artefactos, actualiza el `AGENTS.md` de la raíz para exponer las nuevas
convenciones a Cursor y herramientas compatibles, SIN duplicar contenido (solo referencias a
`.claude/`), coherente con su estilo actual:
- Añade las reglas `angular-*` en la sección "Reglas".
- Añade la skill y el subagente de frontend en "Flujos de trabajo especializados".
Confirma también que NO queda ningún `AGENTS.md` ni carpeta `.claude/` dentro de `code/frontend`.

COMPATIBILIDAD CON OPENSPEC
- Redacta las reglas como convenciones normativas (imperativas: "usa", "evita", "debe"),
  fácilmente citables desde una spec o propuesta de cambio.
- No dependas de rutas ni comandos concretos de OpenSpec (aún no está instalado); los artefactos
  deben ser válidos por sí mismos y seguir aplicando cuando OpenSpec se integre.

ENTREGA (tu mensaje final)
- Lista de ficheros creados en `.claude/rules/`, `.claude/skills/` y `.claude/agents/`, con una
  línea de propósito de cada uno.
- Confirmación de que se eliminaron `code/frontend/.claude/` y `code/frontend/AGENTS.md` y de qué
  contenido suyo se incorporó.
- Resumen de la actualización de `AGENTS.md` (raíz).
- Puntos verificados contra la documentación oficial (angular.dev) y cualquier suposición
  pendiente de confirmar.
- Preguntas abiertas, si las hubiera, antes de dar por cerrados los artefactos.
```
