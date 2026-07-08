[<- Volver al README principal](../readme.md)

## 6. Especificación de la API

API REST del backend NestJS 11.1. Todas las rutas se sirven bajo el prefijo global `api` y el
versionado por URI (`/api/v1/...`). La entrada se valida con DTOs (`class-validator`, whitelist
estricta) y la salida se mapea a DTOs de respuesta (sin exponer `_id`/`tenantId` internos). El
`tenantId` se resuelve del **subdominio** y se propaga por contexto; las rutas de negocio son
*tenant-scoped* y las de alta de tenant son públicas (pre-tenant).

> El esquema OpenAPI se genera desde los DTOs decorados con `@nestjs/swagger` (fuente única del
> contrato); esta sección documenta los endpoints principales. Se mantiene actualizada en cada
> cambio del backend.
>
> **Swagger UI** se expone en `GET /api/docs` **solo fuera de producción** (`NODE_ENV !== 'production'`).
> El documento OpenAPI versionado se genera con `npm run openapi:generate` y se persiste en
> `code/backend/openapi.json`.

### 6.1. HU1 — Registro de negocio (Tenant)

Recurso `tenants` (registro de tenants; público, pre-tenant).

#### `GET /api/v1/tenants/subdomain-availability`

Comprueba si un subdominio está libre (feedback previo al alta). Solo lectura.

| | |
| :--- | :--- |
| **Auth / tenant** | Pública (no requiere tenant resuelto) |
| **Query** | `subdomain` (string, slug `^[a-z0-9]+(?:-[a-z0-9]+)*$`, requerido) |
| **200** | `SubdomainAvailabilityResponseDto` → `{ "available": boolean }` |
| **400** | Query ausente o subdominio con formato inválido |

```http
GET /api/v1/tenants/subdomain-availability?subdomain=barberia-ana HTTP/1.1
```

```json
{ "available": true }
```

#### `POST /api/v1/tenants`

Da de alta un tenant garantizando subdominio único global.

| | |
| :--- | :--- |
| **Auth / tenant** | Pública (pre-tenant) |
| **Body** | `CreateTenantDto` |
| **201** | `TenantResponseDto` |
| **409** | Subdominio ya en uso (sin registro parcial) |
| **400** | Validación fallida (email, slug, propiedad no permitida) |

```yaml
# CreateTenantDto (request body)
name:       string   # nombre del negocio (requerido)
ownerEmail: string   # email corporativo, formato email (requerido)
subdomain:  string   # slug ^[a-z0-9]+(?:-[a-z0-9]+)*$ (requerido)

# TenantResponseDto (201)
id:        string
name:      string
subdomain: string
status:    string    # TenantStatus: "active" | "suspended"
portalUrl: string    # https://<subdomain>.yourplatform.com
```

```http
POST /api/v1/tenants HTTP/1.1
Content-Type: application/json

{ "name": "Barbería Paco", "ownerEmail": "paco@barberia-paco.test", "subdomain": "barberia-paco" }
```

```json
{
  "id": "665f1b2c9c1e4a0012ab34cd",
  "name": "Barbería Paco",
  "subdomain": "barberia-paco",
  "status": "active",
  "portalUrl": "https://barberia-paco.yourplatform.com"
}
```

Respuesta de conflicto (subdominio ocupado):

```json
{ "statusCode": 409, "error": "Conflict", "message": "Subdomain already taken" }
```

---

### 6.2. HU2 — Horario semanal del negocio (Working hours)

Recurso `working-hours` (reglas de horario semanal del tenant; *tenant-scoped*).

#### `GET /api/v1/working-hours`

Devuelve las reglas de horario semanal del **tenant activo**, ordenadas de lunes a domingo. Solo
lectura. El filtro por `tenantId` lo impone el contexto de tenant de forma transversal (nunca se
acepta del cliente).

| | |
| :--- | :--- |
| **Auth / tenant** | *Tenant-scoped* (requiere tenant resuelto por subdominio) |
| **200** | `WeeklyScheduleResponseDto[]` ordenado `mon → sun`; lista vacía si el tenant no tiene reglas |
| **403** | Sin tenant resuelto (fail-closed) |

```yaml
# WeeklyScheduleResponseDto (elemento de la respuesta 200)
weekday:      string   # Weekday: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
isWorkingDay: boolean  # si el negocio abre ese día
openTime:     string?  # apertura HH:mm 24h (opcional)
closeTime:    string?  # cierre HH:mm 24h (opcional)
breakStart:   string?  # inicio del descanso HH:mm 24h (opcional)
breakEnd:     string?  # fin del descanso HH:mm 24h (opcional)
```

```http
GET /api/v1/working-hours HTTP/1.1
Host: acme.yourplatform.com
```

```json
[
  { "weekday": "mon", "isWorkingDay": true, "openTime": "09:00", "closeTime": "18:00", "breakStart": "13:00", "breakEnd": "14:00" },
  { "weekday": "wed", "isWorkingDay": true, "openTime": "09:00", "closeTime": "18:00" },
  { "weekday": "fri", "isWorkingDay": false }
]
```

Respuesta sin tenant resuelto (fail-closed):

```json
{ "statusCode": 403, "error": "Forbidden", "message": "Missing tenant context" }
```

---

> **Pendiente de documentar** conforme se implementen: HU2 — `PUT /api/v1/working-hours`
> (tenant-scoped, escritura); y las HU siguientes.
