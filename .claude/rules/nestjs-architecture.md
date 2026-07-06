# Regla: Arquitectura de la aplicación NestJS 11.1 (backend)

Esta regla define **cómo estructurar** el backend NestJS (`code/backend`, NestJS 11.1 sobre
Express 5, Node 24) para que sea modular, testeable y coherente. Cubre la **capa de aplicación**;
el **modelo de datos** (colecciones, tipos, índices, validadores, transacciones, multitenancy a
nivel de datos) es competencia de las rules `mongodb-*.md`, que son la **única fuente de verdad**
para persistencia. Trabaja con `nestjs-data-access-mongoose.md`, `nestjs-validation-and-dtos.md`,
`nestjs-security-and-multitenancy.md`, `nestjs-errors-and-observability.md`,
`nestjs-performance-and-async.md` y `nestjs-testing-and-quality.md`.

## 0. Convenciones no negociables

- **Todo el código en inglés** (identificadores, tipos, mensajes de log técnicos, nombres de ruta).
- **Sin comentarios en el código**: el código se explica por sí mismo (nombres descriptivos y
  funciones pequeñas). La documentación va en Markdown, no en el `.ts`.
- **Nombres de fichero** según `.claude/rules/file-naming.md`: `kebab-case` con sufijo del tipo
  (`reservations.controller.ts`, `reservations.service.ts`, `reservations.module.ts`,
  `create-reservation.dto.ts`, `tenant.guard.ts`, `tenant-context.service.ts`).

## 1. Organización modular por dominio

- **Un módulo NestJS por concepto de dominio** (`ReservationsModule`, `ServicesModule`,
  `AuthModule`, `TenantsModule`), no por capa técnica. El `AppModule` raíz solo compone e importa
  los módulos de dominio y los módulos transversales (config, base de datos, caché, salud).
- Cada módulo expone su superficie con `exports` y oculta lo demás; **no** hay dependencias
  circulares entre módulos (evita `forwardRef`; si aparece, replantea el diseño).
- Mantén la estructura estándar de NestJS con `AppModule`: aunque NestJS 11 permite arrancar sin
  módulo raíz (`NestFactory.create(AppController)`), en este proyecto **se conserva el AppModule
  modular**.
- Estructura de carpetas por módulo (una responsabilidad por fichero):

```text
src/reservations/
  reservations.module.ts
  reservations.controller.ts
  reservations.service.ts
  dto/create-reservation.dto.ts
  schemas/reservation.schema.ts
```

## 2. Controladores finos, lógica en servicios

- Los **controladores** solo traducen HTTP ↔ dominio: leen params/DTO validado, delegan en un
  servicio y devuelven el resultado. **No** contienen lógica de negocio, acceso a datos ni
  construcción de queries.
- La **lógica de negocio** vive en **providers** (`@Injectable()` servicios). El acceso a datos se
  aísla en servicios/repositorios de datos (ver `nestjs-data-access-mongoose.md`).
- Regla práctica: si un método de controlador tiene más de una llamada al servicio o un `if` de
  negocio, mueve esa lógica al servicio.

✅ Controlador fino:

```typescript
@Controller({ path: "reservations", version: "1" })
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Post()
  create(@Body() dto: CreateReservationDto): Promise<ReservationResponseDto> {
    return this.reservations.create(dto);
  }
}
```

❌ Lógica de negocio y acceso a datos en el controlador:

```typescript
@Post()
async create(@Body() body: any) {
  const exists = await this.model.findOne({ startsAt: body.startsAt });
  if (exists) throw new Error("taken");
  return this.model.create(body);
}
```

## 3. Inyección de dependencias y ámbitos (scopes)

- Usa **inyección por constructor** con tipos concretos o tokens (`@Inject(TOKEN)`); nada de
  `new` manual de dependencias ni singletons globales ad hoc.
- Prefiere el ámbito **por defecto (singleton)**: es el más rápido. Usa `Scope.REQUEST` **solo**
  cuando necesites estado por petición que no puedas obtener de otra forma; ten en cuenta que se
  propaga a toda la cadena de inyección y penaliza el rendimiento. Para el contexto de tenant por
  petición, prefiere `AsyncLocalStorage` frente a `Scope.REQUEST` (ver
  `nestjs-security-and-multitenancy.md`).
- Programa contra **abstracciones** (interfaces + token de provider) cuando facilite el testeo y el
  reemplazo de implementación.

## 4. Enrutado y versionado de la API

- Activa el **versionado de URI** en el bootstrap (`app.enableVersioning({ type: VersioningType.URI }`)
  y versiona cada controlador (`@Controller({ path, version })`). Toda ruta pública vive bajo `/v1`.
- Establece un **prefijo global** coherente (p. ej. `app.setGlobalPrefix("api")`), excluyendo las
  rutas de salud (ver `nestjs-errors-and-observability.md`).
- Rutas en inglés, en plural y `kebab-case` (`/api/v1/reservations`). Nombra las operaciones con el
  verbo HTTP correcto (POST crea, GET lee, PATCH actualiza parcial, DELETE elimina).

## 5. Configuración validada (ConfigModule)

- Carga la configuración con `@nestjs/config` como **módulo global** y **valida el esquema de
  entorno al arrancar**: si falta una variable requerida, la app **no debe arrancar**.
- **Nunca** leas `process.env` disperso por el código: accede siempre vía `ConfigService`
  tipado. Las credenciales (MongoDB, JWT, Redis) provienen de entorno/secret manager y **no** se
  loguean (ver `mongodb-security.md` §1).
- En NestJS 11 `ConfigService#get` admite override por variable de entorno sobre factories
  personalizadas; documenta la precedencia si la usas.

✅ Validación de entorno al arranque:

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  validate: (env) => validateEnv(env),
});
```

## 6. Ciclo de vida y apagado ordenado (graceful shutdown)

- Habilita `app.enableShutdownHooks()` y libera recursos en `OnModuleDestroy` / `OnApplicationShutdown`
  (conexiones Mongo, colas, timers). En NestJS 11 el **orden de los hooks de terminación está
  invertido** respecto a v10: revisa las dependencias entre módulos al liberar.
- El backend debe cerrar de forma limpia ante `SIGTERM`/`SIGINT` (drenar peticiones en curso, no
  aceptar nuevas), imprescindible para despliegues en contenedor.

## 7. Elementos transversales y su orden de ejecución

- Aplica preocupaciones transversales de forma **global y declarativa**, no repetida por endpoint:
  - **Middleware** (Express) para lo más temprano (correlación de request, helmet).
  - **Guards** para autorización y resolución/validación de tenant (ver
    `nestjs-security-and-multitenancy.md`).
  - **Interceptors** para serialización, caché, logging y timeouts (ver
    `nestjs-errors-and-observability.md` y `nestjs-performance-and-async.md`).
  - **Pipes** para validación/transformación de entrada (ver `nestjs-validation-and-dtos.md`).
  - **Exception filters** para el mapeo uniforme de errores (ver `nestjs-errors-and-observability.md`).
- Orden conceptual de una petición: `middleware → guards → interceptors (pre) → pipes → handler →
  interceptors (post) → exception filter`.

## 8. Trazabilidad

- Todo módulo, endpoint o provider nuevo debe poder **rastrearse hasta una historia de usuario o
  caso de uso** del proyecto, coherente con la metodología (ver `sections_readme/02-user-stories.md`).
