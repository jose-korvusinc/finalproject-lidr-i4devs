# Prompt generado — Reglas de Angular 22 para `.claude/rules` (OpenSpec)

> Prompt resultante del **Prompt 1** del apartado [4. Sistema agéntico](../04-agentic-system.md).
> Ejecútalo para generar la regla (o reglas) de buenas prácticas de Angular 22 en `.claude/rules/`.

```text
Eres un ingeniero frontend experto en Angular 22 con más de 10 años construyendo SPAs
de producción, y conoces a fondo las novedades y buenas prácticas actuales del framework.

OBJETIVO
Generar la regla (o el conjunto coherente de reglas) en `.claude/rules/` que codifique las
buenas prácticas de desarrollo frontend en Angular 22 para este proyecto. Estas reglas se
usarán como fuente de verdad de convenciones dentro de la metodología OpenSpec (desarrollo
dirigido por especificaciones): cualquier propuesta de cambio o implementación de una spec en
el frontend deberá cumplirlas.

COMPORTAMIENTO (OBLIGATORIO)
- No tomes decisiones importantes por tu cuenta: si algo es ambiguo, PREGUNTA antes de actuar.
- No inventes APIs: Angular 22 es posterior a tu fecha de corte de conocimiento. VERIFICA cada
  API, sintaxis y práctica que recomiendes contra la documentación oficial vigente
  (angular.dev) antes de escribirla. Si no puedes verificar algo, márcalo como suposición.
- Alcance greenfield: en el proyecto todavía NO hay código Angular ni OpenSpec instalado. Las
  reglas definen las convenciones del código que se creará; no asumas ficheros o estructura
  preexistentes. Sí puedes proponer la estructura de carpetas recomendada.

CONTEXTO DEL PROYECTO (para acotar las reglas)
SaaS multitenant de reservas de citas. El frontend es una SPA Angular 22 que ofrece:
(1) un backoffice de gestión (negocio, horarios, catálogo de servicios/empleados, agenda con
calendario interactivo drag&drop usando FullCalendar.io) y (2) un widget público de reserva
mobile-first sin registro. Consume una API REST de NestJS documentada con OpenAPI. El tenant
se resuelve por subdominio. Requisitos sensibles: rendimiento (respuesta de disponibilidad
<200 ms percibida), UX móvil, y aislamiento multitenant en las llamadas al API.

CONVENCIONES DE CÓDIGO INNEGOCIABLES (deben quedar recogidas en las reglas)
- Todo el código Angular se escribe ÍNTEGRAMENTE en inglés: identificadores, nombres de
  clases/componentes/servicios/métodos/variables, nombres de ficheros y carpetas, rutas y
  literales técnicos. Los textos visibles al usuario se gestionan por i18n, no se codifican en
  español en el código.
- NO se añaden comentarios en el código. El código debe autoexplicarse mediante nombres claros,
  funciones pequeñas y una estructura evidente. Se permiten únicamente los artefactos que NO son
  comentarios explicativos y que exige el framework/tooling (p. ej. JSDoc de API pública solo si
  el proyecto lo estandariza, decoradores, o directivas de configuración de linter cuando sean
  imprescindibles). Prohibido el código comentado ("dead code") y los comentarios TODO/FIXME.

FORMATO DE CADA REGLA (coherente con las reglas existentes del proyecto)
- Ubicación: `.claude/rules/`. Un fichero Markdown por regla.
- Nombre de fichero: en inglés y `kebab-case` (p. ej. `angular-architecture.md`,
  `angular-components-and-signals.md`), conforme a la regla `.claude/rules/file-naming.md`.
- Frontmatter YAML al inicio, con los mismos campos que las reglas actuales:
      ---
      description: <una línea que explique qué regla es y cuándo aplicarla>
      globs: <patrones de ficheros a los que aplica, p. ej. **/*.ts, **/*.html; vacío si aplica siempre>
      alwaysApply: <true|false>
      ---
- Cuerpo en español, con estructura clara (`# Regla: ...`, secciones numeradas). El texto
  explicativo de la regla va en español; los identificadores de código y los ejemplos van en
  inglés y SIN comentarios.
- Incluye ejemplos de código cortos (✅ recomendado / ❌ evitar) cuando aclaren la práctica;
  los ejemplos también deben ir en inglés y sin comentarios.
- Principio "una intención por regla": si el alcance es grande, divídelo en varias reglas
  cohesionadas y enlázalas entre sí; si es pequeño y cohesionado, una sola regla.

CONTENIDO QUE DEBEN CUBRIR LAS REGLAS (buenas prácticas de Angular 22)
Selecciona y organiza en las reglas necesarias, verificando cada punto contra la doc oficial:
1. Arquitectura y estructura: componentes standalone por defecto, `bootstrapApplication`,
   organización por features/dominios, separación de capas (feature/ui/data-access/core/shared),
   límites de dependencia entre capas, lazy loading por ruta.
2. Reactividad con signals: `signal`, `computed`, `effect`; inputs/outputs basados en señales
   (`input()`, `output()`, `model()`), signal queries (`viewChild`, `contentChild`); cuándo
   usar señales frente a RxJS; interoperación (`toSignal`/`toObservable`), `resource`/`rxResource`
   para datos asíncronos.
3. Plantillas: nuevo control de flujo `@if`/`@for` (con `track` obligatorio)/`@switch`/`@let`,
   vistas diferidas `@defer`; evitar lógica pesada en plantilla; `NgOptimizedImage`.
4. Detección de cambios y rendimiento: `OnPush` o zoneless (`provideZonelessChangeDetection`),
   evitar suscripciones manuales innecesarias, `trackBy`/`track`, memoización con `computed`,
   presupuesto de bundle y estrategias de carga.
5. Inyección de dependencias: función `inject()`, servicios `providedIn: 'root'` vs. scope de
   ruta/componente, tokens de inyección tipados, guards/resolvers/interceptors funcionales.
6. Comunicación con el API (crítico multitenant): `HttpClient` con `provideHttpClient`,
   interceptor funcional que inyecta el contexto del tenant/subdominio y auth, tipado de DTOs
   (idealmente generados desde el OpenAPI del backend), manejo de errores centralizado, retries
   y estados de carga.
7. Formularios: reactive forms tipados, validadores reutilizables, accesibilidad de formularios.
8. Enrutamiento: rutas standalone, `input` binding de parámetros, títulos, guards, lazy routes.
9. Estado: preferir señales/servicios ligeros; criterios para introducir una librería de estado
   solo si se justifica.
10. Estilos, accesibilidad e i18n: encapsulación de estilos, diseño mobile-first, criterios de
    accesibilidad (roles/aria/foco/contraste) y consideraciones de internacionalización (todos
    los textos de UI vía i18n, nunca hardcodeados en el código).
11. Calidad y testing: estrategia de pruebas (unitarias de componentes/servicios y de
    integración), Testing Library/harnesses, mocking del `HttpClient`, cobertura mínima
    recomendada; linting/formato (ESLint + Prettier) que haga cumplir "código en inglés y sin
    comentarios", y convenciones de nombres de ficheros y símbolos (coherentes con `file-naming.md`).
12. Seguridad frontend: prevención de XSS y uso correcto de la sanitización de Angular, no
    exponer secretos, manejo seguro de tokens.
13. Integración de FullCalendar.io en el backoffice y patrón del widget público mobile-first.
14. (Opcional, si aplica) SSR/hydration con `provideClientHydration` e hidratación incremental.

COMPATIBILIDAD CON OPENSPEC
- Redacta las reglas como convenciones normativas (imperativas: "usa", "evita", "debe"),
  fácilmente citables desde una spec o propuesta de cambio.
- No dependas de rutas ni comandos concretos de OpenSpec (aún no está instalado); las reglas
  deben ser válidas por sí mismas y seguir aplicando cuando OpenSpec se integre.

ENTREGA (tu mensaje final)
- Lista de ficheros de regla creados en `.claude/rules/` con una línea de propósito de cada uno.
- Puntos que hayas verificado contra la documentación oficial y cualquier suposición pendiente
  de confirmar.
- Preguntas abiertas, si las hubiera, antes de dar por cerradas las reglas.
```
