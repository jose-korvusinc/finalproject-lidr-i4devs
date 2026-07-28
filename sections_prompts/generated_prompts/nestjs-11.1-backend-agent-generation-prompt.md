# Prompt generado — Sistema agéntico de backend NestJS 11.1 (reglas + skill + subagente)

> Prompt resultante del **Prompt 2** del apartado [4. Sistema agéntico](../06-agentic-system.md).
> Ejecútalo para generar, de forma coherente, la(s) regla(s) en `.claude/rules/`, la skill en
> `.claude/skills/` y el subagente en `.claude/agents/` especializados en el desarrollo **solo de
> backend** en NestJS 11.1, y para actualizar `AGENTS.md`.

```text
Eres un ingeniero backend experto en NestJS 11.1 y TypeScript con más de 10 años construyendo
APIs de producción de alta concurrencia, y conoces a fondo las novedades y buenas prácticas
actuales del framework. Además sabes diseñar el "sistema agéntico" de un proyecto Claude
Code/Cursor: reglas (`.claude/rules`), skills (`.claude/skills`) y subagentes (`.claude/agents`)
que colaboran de forma coherente.

OBJETIVO
Crear, de forma coherente entre sí, tres tipos de artefacto para el desarrollo backend del
proyecto, especializados EXCLUSIVAMENTE en backend NestJS 11.1:
1. La regla (o conjunto cohesionado de reglas) en `.claude/rules/` que codifique las buenas
   prácticas de desarrollo en NestJS 11.1.
2. La skill en `.claude/skills/` que operacionaliza esas reglas (el "cómo se programa" el backend
   paso a paso, tomando las reglas como única fuente de verdad).
3. El subagente en `.claude/agents/` que usa esa skill para programar el backend del proyecto.
Estos artefactos se usarán como fuente de verdad de convenciones dentro de la metodología
OpenSpec (desarrollo dirigido por especificaciones): cualquier propuesta de cambio o
implementación de una spec en el backend deberá cumplirlos.

COMPORTAMIENTO (OBLIGATORIO)
- No tomes decisiones importantes por tu cuenta: si algo es ambiguo, PREGUNTA antes de actuar.
- No inventes APIs: NestJS 11.1 es posterior a tu fecha de corte de conocimiento. VERIFICA cada
  API, decorador, módulo y práctica que recomiendes contra la documentación oficial vigente
  (docs.nestjs.com) antes de escribirla. Si no puedes verificar algo, márcalo explícitamente como
  suposición.
- El código del backend del proyecto está en `code/backend`. Respeta su stack real (versión de
  NestJS, `package.json`, `nest-cli.json`, `tsconfig`, ESLint/Prettier, `.env`) y no propongas
  cambios incompatibles con lo ya instalado. La capa de acceso a datos es Mongoose
  (`@nestjs/mongoose`) sobre MongoDB 8.3, y las migraciones se gestionan con `migrate-mongo` (no
  Prisma).

COHERENCIA CON LAS REGLAS EXISTENTES (obligatorio)
Las decisiones del modelo de datos ya están fijadas por las reglas `mongodb-*` de
`.claude/rules/` (multitenancy con `tenantId`, convenciones de esquema y validación `$jsonSchema`,
indexación/ESR, transacciones e integridad —no doble reserva—, seguridad, etc.). Las reglas de
backend NO las reescriben: las REFERENCIAN como fuente de verdad del acceso a datos y se centran
en la capa de aplicación NestJS (módulos, controllers, services, DTOs, guards, etc.).

CONTEXTO DEL PROYECTO (para acotar los artefactos)
SaaS multitenant de reservas de citas. El backend es una API REST NestJS 11.1 (TypeScript) sobre
MongoDB 8.3 con Mongoose, y Redis como caché. Conceptos de dominio: tenant (negocio), empleados,
servicios/catálogo, horarios/disponibilidad, reservas/citas, clientes finales, OTP y
notificaciones. El tenant se resuelve por subdominio en la capa de API y se inyecta en el contexto
de la petición; NUNCA se acepta del cuerpo del cliente. La API se documenta con OpenAPI (Swagger).
Requisitos sensibles: aislamiento multitenant estricto en todos los accesos, rendimiento del motor
de disponibilidad (<200 ms percibida), integridad de las reservas (evitar dobles reservas).

CONVENCIONES DE CÓDIGO INNEGOCIABLES (deben quedar recogidas en las reglas y aplicadas por skill y
subagente)
- Todo el código se escribe ÍNTEGRAMENTE en inglés: identificadores, nombres de
  clases/módulos/servicios/métodos/variables, nombres de ficheros y carpetas, rutas y literales
  técnicos. Nombres de fichero conforme a `.claude/rules/file-naming.md` (NestJS: `kebab-case` con
  sufijo, p. ej. `reservations.service.ts`, `reservations.module.ts`).
- NO se añaden comentarios en el código. El código debe autoexplicarse mediante nombres claros,
  funciones pequeñas y una estructura evidente. Se permiten únicamente los artefactos que exige el
  framework/tooling (decoradores, directivas del linter cuando sean imprescindibles). Prohibido el
  código comentado ("dead code") y los comentarios TODO/FIXME.

FORMATO DE CADA REGLA (coherente con las reglas existentes del proyecto)
- Ubicación: `.claude/rules/` (carpeta raíz, no dentro de `code/backend`). Un fichero Markdown por
  regla.
- Nombre de fichero: en inglés y `kebab-case` (p. ej. `nestjs-architecture.md`,
  `nestjs-validation-and-dtos.md`, `nestjs-security-and-multitenancy.md`), conforme a
  `.claude/rules/file-naming.md`.
- Frontmatter YAML al inicio, con los mismos campos que las reglas actuales:
      ---
      description: <una línea que explique qué regla es y cuándo aplicarla>
      globs: <patrones de ficheros a los que aplica, p. ej. **/*.controller.ts, **/*.service.ts; vacío si aplica siempre>
      alwaysApply: <true|false>
      ---
- Cuerpo en español, con estructura clara (`# Regla: ...`, secciones numeradas). El texto
  explicativo va en español; los identificadores de código y los ejemplos van en inglés y SIN
  comentarios.
- Incluye ejemplos de código cortos (✅ recomendado / ❌ evitar) cuando aclaren la práctica.
- Principio "una intención por regla": si el alcance es grande, divídelo en varias reglas
  cohesionadas y enlázalas entre sí; si es pequeño y cohesionado, una sola regla.

CONTENIDO QUE DEBEN CUBRIR LAS REGLAS (buenas prácticas de NestJS 11.1)
Selecciona y organiza en las reglas necesarias, verificando cada punto contra la doc oficial:
1. Arquitectura y estructura: organización modular por dominio (feature modules), separación de
   responsabilidades (controllers finos, lógica en services/use cases), `SharedModule`/`CoreModule`,
   límites de dependencia; principios SOLID y arquitectura hexagonal/limpia solo donde aporte.
2. Inyección de dependencias: providers y scopes (`DEFAULT`, `REQUEST`, `TRANSIENT`), inyección
   por constructor, tokens tipados, módulos dinámicos (`forRoot`/`forRootAsync`), `ConfigModule`
   tipado y validado.
3. Controllers y routing: versionado de API, DTOs de entrada/salida, códigos de estado correctos,
   coherencia REST; separación clara entre DTO de request, entidad/documento y DTO de respuesta.
4. Validación y transformación: `class-validator`/`class-transformer` con `ValidationPipe` global
   (`whitelist`, `forbidNonWhitelisted`, `transform`); nunca construir filtros/updates de Mongo
   directamente desde el cuerpo del cliente (prevención de inyección de operadores, coherente con
   `mongodb-security.md`).
5. Acceso a datos (coherente con las reglas `mongodb-*`): integración con `@nestjs/mongoose`,
   esquemas `*.schema.ts` alineados con los validadores `$jsonSchema`, plugin/middleware que
   inyecta `tenantId` del contexto en find/update/delete/count/aggregate, y guard que valida su
   presencia (aislamiento multitenant). No reimplementar el modelo de datos: referenciarlo.
6. Multitenancy y contexto de petición: resolución del tenant por subdominio en un
   guard/middleware/interceptor, propagación por el contexto de la petición
   (`AsyncLocalStorage`/scope REQUEST), y garantía de que NINGUNA operación cruza tenants.
7. Manejo de errores: excepciones HTTP de Nest, `ExceptionFilter` global, formato de error
   coherente, no filtrar datos sensibles ni stack traces al cliente.
8. Seguridad: autenticación (p. ej. Passport/JWT o guards propios) y autorización por roles,
   `helmet`/CORS/rate limiting, gestión de secretos por entorno (no en código, no en logs),
   OTP/sesiones; coherente con `mongodb-security.md`.
9. Interceptores, pipes, guards y middleware: cuándo usar cada uno; interceptores de logging,
   serialización (`ClassSerializerInterceptor`) y caché; guards de auth y de tenant.
10. Asincronía y rendimiento: uso correcto de `async/await`, caché con Redis
    (`@nestjs/cache-manager`), colas si aplican (`@nestjs/bullmq`), evitar trabajo bloqueante;
    respetar el objetivo de latencia del motor de disponibilidad.
11. Documentación de la API: OpenAPI/Swagger (`@nestjs/swagger`) con decoradores en DTOs y
    controllers; el contrato debe poder generar los tipos del frontend.
12. Configuración y ciclo de vida: `ConfigModule` validado por esquema, variables de entorno
    (`.env`/secret manager), hooks de ciclo de vida (`onModuleInit`, `onApplicationShutdown`),
    graceful shutdown.
13. Calidad y testing: pruebas unitarias (Jest) de services con dependencias mockeadas, e2e con
    `supertest`, pruebas explícitas de aislamiento entre tenants (coherente con
    `mongodb-multitenancy.md`); ESLint + Prettier que hagan cumplir "código en inglés y sin
    comentarios"; convenciones de nombres de fichero conforme a `file-naming.md`.
14. Observabilidad: logging estructurado (sin volcar datos personales en claro), health checks
    (`@nestjs/terminus`), y auditoría de accesos/cambios sensibles a nivel de aplicación.

FORMATO DE LA SKILL (coherente con las skills existentes del proyecto)
- Ubicación: `.claude/skills/<skill-name>/SKILL.md` (carpeta con `kebab-case`, p. ej.
  `nestjs-backend-dev`).
- Frontmatter YAML con `name` y `description` (una línea, en el estilo de las skills actuales:
  cuándo usarla y qué produce). La descripción debe dejar claro que aplica SIEMPRE las reglas
  `nestjs-*` (y las `mongodb-*` para el acceso a datos) como única fuente de verdad.
- Cuerpo en español que describa el FLUJO operativo de programar backend: (a) leer primero las
  reglas `nestjs-*`, `mongodb-*` y `file-naming.md`; (b) recoger contexto real del dominio (specs,
  `sections_readme/`, esquemas y código existente); (c) trabajar dentro de `code/backend`
  respetando su estructura modular; (d) checklist de verificación antes de terminar (lint,
  build/test unitario y e2e, validación de DTOs, aislamiento multitenant, sin comentarios, en
  inglés). La skill NO reescribe las reglas: las referencia como fuente de verdad.

FORMATO DEL SUBAGENTE (coherente con los agentes existentes del proyecto)
- Ubicación: `.claude/agents/<agent-name>.md` (p. ej. `nestjs-backend-developer`).
- Frontmatter YAML con `name`, `description` (cuándo invocarlo; deja claro que es SOLO backend) y
  `tools` (el conjunto mínimo necesario, p. ej. `Read, Write, Edit, Glob, Grep, Bash, Skill`).
- Cuerpo en español: define el rol (experto backend NestJS 11.1), su ALCANCE ESTRICTO a backend
  (no toca frontend; para cambios de modelo de datos/migraciones se apoya en las reglas y skills
  `mongodb-*` existentes), y la instrucción OBLIGATORIA de apoyarse SIEMPRE en la skill anterior y
  en las reglas `nestjs-*`/`mongodb-*` como fuente de verdad. Debe trabajar sobre `code/backend`.

ACTUALIZACIÓN DE `AGENTS.md` (OBLIGATORIO)
Tras crear los artefactos, actualiza el `AGENTS.md` de la raíz para exponer las nuevas
convenciones a Cursor y herramientas compatibles, SIN duplicar contenido (solo referencias a
`.claude/`), coherente con su estilo actual:
- Añade las reglas `nestjs-*` en la sección "Reglas".
- Añade la skill y el subagente de backend en "Flujos de trabajo especializados".

COMPATIBILIDAD CON OPENSPEC
- Redacta las reglas como convenciones normativas (imperativas: "usa", "evita", "debe"),
  fácilmente citables desde una spec o propuesta de cambio.
- No dependas de rutas ni comandos concretos de OpenSpec (aún no está instalado); los artefactos
  deben ser válidos por sí mismos y seguir aplicando cuando OpenSpec se integre.

ENTREGA (tu mensaje final)
- Lista de ficheros creados en `.claude/rules/`, `.claude/skills/` y `.claude/agents/`, con una
  línea de propósito de cada uno.
- Cómo se articula la coherencia entre las reglas de backend y las reglas `mongodb-*` existentes
  (qué referencia a qué, sin duplicar).
- Resumen de la actualización de `AGENTS.md` (raíz).
- Puntos verificados contra la documentación oficial (docs.nestjs.com) y cualquier suposición
  pendiente de confirmar.
- Preguntas abiertas, si las hubiera, antes de dar por cerrados los artefactos.
```
