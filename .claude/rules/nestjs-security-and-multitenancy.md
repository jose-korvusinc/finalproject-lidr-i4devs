# Regla: Seguridad y contexto multitenant en NestJS 11.1

Esta regla define la **seguridad de la capa de aplicación** y el **aislamiento multitenant por
petición** en el backend NestJS. Es el brazo aplicativo de `mongodb-multitenancy.md` (aislamiento a
nivel de datos) y `mongodb-security.md` (seguridad del modelo de datos), que son la **única fuente
de verdad** para la capa de datos. Trabaja con `nestjs-data-access-mongoose.md`,
`nestjs-validation-and-dtos.md` y `nestjs-architecture.md`.

## 1. Resolución y propagación del contexto de tenant

- El `tenantId` se resuelve **del subdominio** en la capa de API (p. ej. `acme.app.com → acme`) y se
  traduce al `ObjectId` del tenant. **Nunca** se acepta del body ni de un header controlable por el
  cliente sin verificar (ver `mongodb-multitenancy.md` §1).
- Propaga el contexto de petición (`tenantId`, `userId`, `requestId`) con **`AsyncLocalStorage`**
  (nativo de Node) o un `ClsModule` equivalente, **no** con `Scope.REQUEST` en toda la cadena de
  providers (penaliza el rendimiento; ver `nestjs-architecture.md` §3). Un middleware temprano abre
  el store; guards, servicios y el plugin de Mongoose lo leen.

✅ Middleware que abre el contexto de tenant por petición:

```typescript
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly als: AsyncLocalStorage<TenantContext>) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const tenantId = resolveTenantFromHost(req.hostname);
    this.als.run({ tenantId, requestId: randomUUID() }, () => next());
  }
}
```

## 2. Guard de tenant (fail-closed)

- Un **guard global** valida que el contexto tenga un `tenantId` resuelto y válido antes de ejecutar
  cualquier handler de negocio. Si falta o no resuelve, **rechaza** la petición (`fail-closed`), no
  la deja pasar. Este guard es el par del filtro transversal del plugin de Mongoose
  (`nestjs-data-access-mongoose.md` §3): juntos garantizan que ninguna consulta se ejecute sin tenant.
- La autorización comprueba que el usuario autenticado **pertenece** al tenant resuelto: un usuario
  de un tenant no puede operar sobre otro (prevención de fuga entre tenants, ver
  `mongodb-multitenancy.md` §6).

## 3. Autenticación y autorización

- Autenticación por **JWT** (`@nestjs/jwt` + `@nestjs/passport`, por instalar): valida firma,
  expiración, emisor y audiencia; el token porta el `sub` (usuario) y su tenant. Guards de NestJS
  para proteger las rutas; roles/permeisos con un `RolesGuard` y decorador de metadatos.
- Los secretos (clave JWT, credenciales Mongo/Redis) provienen de **entorno/secret manager** vía
  `ConfigService`, **nunca** del código ni de logs; **rótalos** (ver `mongodb-security.md` §1).
- Contraseñas y OTP: hash fuerte (bcrypt/argon2); OTP y sesiones con **TTL** en base (ver
  `mongodb-indexing-and-performance.md` §2) y validación de vencimiento también en la consulta.

## 4. Endurecimiento HTTP

- **`helmet`** (cabeceras de seguridad) como middleware global (dependencia por instalar).
- **CORS** restringido: lista blanca de orígenes (incluidos los subdominios de tenant), métodos y
  cabeceras permitidos; nada de `origin: *` con credenciales.
- **Rate limiting** con `@nestjs/throttler` (por instalar): límites por IP y/o por tenant para
  proteger endpoints sensibles (login, reserva) de abuso y fuerza bruta.
- **TLS obligatorio** de extremo a extremo (cliente ↔ API ↔ Mongo), coherente con
  `mongodb-security.md` §2.

## 5. Sanitización y RBAC de datos

- La sanitización de entrada y la prevención de inyección de operadores `$` viven en
  `nestjs-validation-and-dtos.md` §3 (DTOs + `ValidationPipe` whitelist). No repitas la lógica: esta
  regla exige que **esté activa**.
- El usuario de aplicación de MongoDB tiene **mínimo privilegio** (`readWrite` sobre su base), nunca
  roles administrativos en producción (ver `mongodb-security.md` §1); la app se conecta con ese
  usuario, no con `root`.

## 6. Exposición mínima y auditoría

- No expongas `_id`, `tenantId` ni internos en respuestas más de lo necesario: mapea a DTOs (ver
  `nestjs-validation-and-dtos.md` §4 y `mongodb-security.md` §4).
- Registra accesos y cambios sensibles (quién, qué, cuándo, tenant) **sin** volcar datos personales
  en claro (auditoría, ver `mongodb-security.md` §5 y `nestjs-errors-and-observability.md` §5).

## 7. Tests de aislamiento (obligatorios)

- Los tests deben cubrir **explícitamente** que una petición de un tenant **no** puede leer ni
  escribir datos de otro (ver `mongodb-multitenancy.md` §6 y `nestjs-testing-and-quality.md` §4).
