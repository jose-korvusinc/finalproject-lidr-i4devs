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

#### `PUT /api/v1/working-hours`

Persiste el horario semanal del **tenant activo** (upsert de una regla por día). Sustituye la
configuración de cada día enviado. Idempotente: reenviar el mismo día actualiza su regla en vez de
duplicarla (índice único `{ tenantId, weekday }`). El `tenantId` lo impone el contexto de tenant de
forma transversal; **nunca** se acepta del cuerpo.

| | |
| :--- | :--- |
| **Auth / tenant** | *Tenant-scoped* (requiere tenant resuelto por subdominio) |
| **Body** | `SetWeeklyScheduleDto` (`days: WorkingHourDto[]`, sin `weekday` duplicados) |
| **200** | `WeeklyScheduleResponseDto[]` con el horario persistido, ordenado `mon → sun` |
| **400** | Validación fallida: rango inválido (`openTime` ≥ `closeTime`), descanso fuera de rango, `weekday` duplicado, o propiedad no permitida (p. ej. `tenantId` en el body) |
| **403** | Sin tenant resuelto (fail-closed) |

```yaml
# SetWeeklyScheduleDto (body)
days:
  - weekday:      string   # "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun" (sin duplicados)
    isWorkingDay: boolean
    openTime:     string?  # requerido si isWorkingDay; HH:mm 24h
    closeTime:    string?  # requerido si isWorkingDay; HH:mm 24h; openTime < closeTime
    breakStart:   string?  # HH:mm 24h; open <= breakStart < breakEnd <= close
    breakEnd:     string?  # HH:mm 24h
```

```http
PUT /api/v1/working-hours HTTP/1.1
Host: acme.yourplatform.com
Content-Type: application/json

{
  "days": [
    { "weekday": "mon", "isWorkingDay": true, "openTime": "09:00", "closeTime": "18:00", "breakStart": "14:00", "breakEnd": "15:00" },
    { "weekday": "tue", "isWorkingDay": true, "openTime": "09:00", "closeTime": "18:00" },
    { "weekday": "sat", "isWorkingDay": false }
  ]
}
```

```json
[
  { "weekday": "mon", "isWorkingDay": true, "openTime": "09:00", "closeTime": "18:00", "breakStart": "14:00", "breakEnd": "15:00" },
  { "weekday": "tue", "isWorkingDay": true, "openTime": "09:00", "closeTime": "18:00" },
  { "weekday": "sat", "isWorkingDay": false }
]
```

### 6.3. HU3 — Catálogo de servicios (Services)

Recurso `services` (servicios que ofrece el negocio; *tenant-scoped*). El filtro por `tenantId` lo
impone el contexto de tenant de forma transversal (nunca se acepta del cliente). El precio viaja
como **string decimal** (persistido en `Decimal128`) y la respuesta pública no expone `_id`,
`tenantId`, `schemaVersion` ni marcas de auditoría.

```yaml
# ServiceResponseDto (forma pública de la respuesta)
id:              string   # identificador del servicio (mapeo de _id)
name:            string
price:           string   # importe decimal, p. ej. "25.00"
durationMinutes: integer
active:          boolean
```

#### `POST /api/v1/services`

Crea un servicio para el **tenant activo**. `active` se fija a `true` en el servidor; el cliente no
lo controla. El `tenantId` lo impone el contexto de tenant; **nunca** se acepta del cuerpo.

| | |
| :--- | :--- |
| **Auth / tenant** | *Tenant-scoped* (requiere tenant resuelto por subdominio) |
| **Body** | `CreateServiceDto` (`name`, `price`, `durationMinutes`) |
| **201** | `ServiceResponseDto` con el servicio creado (`active: true`) |
| **400** | Validación fallida: `name` vacío, `price` con formato inválido (no `^\d+(\.\d{1,2})?$`), `durationMinutes` no entero positivo, o propiedad no permitida (p. ej. `active` o `tenantId` en el body) |
| **403** | Sin tenant resuelto (fail-closed) |

```yaml
# CreateServiceDto (body)
name:            string   # requerido, no vacío
price:           string   # requerido; decimal no negativo con hasta 2 decimales ("25", "25.5", "25.00")
durationMinutes: integer  # requerido; entero positivo
```

```http
POST /api/v1/services HTTP/1.1
Host: acme.yourplatform.com
Content-Type: application/json

{ "name": "Massage", "price": "40.00", "durationMinutes": 60 }
```

```json
{ "id": "665f1b2c9c1e4a0012ab34cd", "name": "Massage", "price": "40.00", "durationMinutes": 60, "active": true }
```

#### `GET /api/v1/services`

Devuelve los servicios **activos** del tenant activo. Solo lectura.

| | |
| :--- | :--- |
| **Auth / tenant** | *Tenant-scoped* (requiere tenant resuelto por subdominio) |
| **200** | `ServiceResponseDto[]`; lista vacía si el tenant no tiene servicios |
| **403** | Sin tenant resuelto (fail-closed) |

```json
[
  { "id": "665f1b2c9c1e4a0012ab34cd", "name": "Haircut", "price": "25.00", "durationMinutes": 30, "active": true }
]
```

#### `GET /api/v1/services/{id}`

Devuelve un servicio del tenant activo por su identificador. Un servicio de otro tenant devuelve
**404** (aislamiento entre tenants), no 403.

| | |
| :--- | :--- |
| **Auth / tenant** | *Tenant-scoped* (requiere tenant resuelto por subdominio) |
| **200** | `ServiceResponseDto` |
| **404** | El servicio no existe para el tenant activo |
| **403** | Sin tenant resuelto (fail-closed) |

#### `PATCH /api/v1/services/{id}`

Actualiza los campos editables (`name`, `price`, `durationMinutes`) de un servicio del tenant
activo. La activación/desactivación no se gestiona aquí. El `tenantId` lo impone el contexto de
tenant; **nunca** se acepta del cuerpo.

| | |
| :--- | :--- |
| **Auth / tenant** | *Tenant-scoped* (requiere tenant resuelto por subdominio) |
| **Body** | `UpdateServiceDto` (parcial de `name`, `price`, `durationMinutes`) |
| **200** | `ServiceResponseDto` con el servicio actualizado |
| **400** | Validación fallida (mismas reglas que `POST`) o propiedad no permitida |
| **404** | El servicio no existe para el tenant activo |
| **403** | Sin tenant resuelto (fail-closed) |

```http
PATCH /api/v1/services/665f1b2c9c1e4a0012ab34cd HTTP/1.1
Host: acme.yourplatform.com
Content-Type: application/json

{ "name": "Deluxe haircut", "price": "30.00", "durationMinutes": 45 }
```

```json
{ "id": "665f1b2c9c1e4a0012ab34cd", "name": "Deluxe haircut", "price": "30.00", "durationMinutes": 45, "active": true }
```

---

### 6.4. HU3 — Empleados (Employees)

Recurso `employees` (profesionales del negocio que prestan los servicios; *tenant-scoped*). El
filtro por `tenantId` lo impone el contexto de tenant de forma transversal (nunca se acepta del
cliente). Cada empleado puede tener asignados servicios del **mismo tenant** vía `serviceIds`; la
asignación es opcional y se valida contra el catálogo de servicios del tenant. Un `serviceId` de
otro tenant se trata como inexistente (aislamiento). La respuesta pública no expone `_id`,
`tenantId`, `schemaVersion` ni marcas de auditoría.

```yaml
# EmployeeResponseDto (forma pública de la respuesta)
id:         string    # identificador del empleado (mapeo de _id)
name:       string
email:      string
serviceIds: string[]  # identificadores de los servicios asignados
```

#### `POST /api/v1/employees`

Crea un empleado para el **tenant activo**, con una asignación opcional de servicios. Todos los
`serviceIds` deben existir en el catálogo del tenant; si alguno no existe (o pertenece a otro
tenant), la petición se rechaza y **no** se crea el empleado. El `tenantId` lo impone el contexto de
tenant; **nunca** se acepta del cuerpo.

| | |
| :--- | :--- |
| **Auth / tenant** | *Tenant-scoped* (requiere tenant resuelto por subdominio) |
| **Body** | `CreateEmployeeDto` (`name`, `email`, `serviceIds?`) |
| **201** | `EmployeeResponseDto` con el empleado creado |
| **400** | Validación fallida (`name` vacío, `email` inválido, `serviceIds` no array o con elementos que no son Mongo id, propiedad no permitida como `tenantId`) o un `serviceId` inexistente en el tenant |
| **409** | Ya existe un empleado con ese `email` en el tenant |
| **403** | Sin tenant resuelto (fail-closed) |

```yaml
# CreateEmployeeDto (body)
name:       string    # requerido, no vacío
email:      string    # requerido; email válido
serviceIds: string[]  # opcional (por defecto []); cada elemento un Mongo id de un servicio del tenant
```

```http
POST /api/v1/employees HTTP/1.1
Host: acme.yourplatform.com
Content-Type: application/json

{ "name": "Grace Hopper", "email": "grace@acme.test", "serviceIds": ["665f1b2c9c1e4a0012ab34cd"] }
```

```json
{ "id": "665f1b2c9c1e4a0012ab9999", "name": "Grace Hopper", "email": "grace@acme.test", "serviceIds": ["665f1b2c9c1e4a0012ab34cd"] }
```

#### `GET /api/v1/employees`

Devuelve los empleados del tenant activo. Solo lectura.

| | |
| :--- | :--- |
| **Auth / tenant** | *Tenant-scoped* (requiere tenant resuelto por subdominio) |
| **200** | `EmployeeResponseDto[]`; lista vacía si el tenant no tiene empleados |
| **403** | Sin tenant resuelto (fail-closed) |

```json
[
  { "id": "665f1b2c9c1e4a0012ab9999", "name": "Ada Lovelace", "email": "ada@acme.test", "serviceIds": ["665f1b2c9c1e4a0012ab34cd"] }
]
```

#### `GET /api/v1/employees/{id}`

Devuelve un empleado del tenant activo por su identificador. Un empleado de otro tenant devuelve
**404** (aislamiento entre tenants), no 403.

| | |
| :--- | :--- |
| **Auth / tenant** | *Tenant-scoped* (requiere tenant resuelto por subdominio) |
| **200** | `EmployeeResponseDto` |
| **404** | El empleado no existe para el tenant activo |
| **403** | Sin tenant resuelto (fail-closed) |

#### `PATCH /api/v1/employees/{id}`

Actualiza los campos editables (`name`, `email`, `serviceIds`) de un empleado del tenant activo. Si
se envían `serviceIds`, se revalida que todos existan en el catálogo del tenant antes de aplicar la
reasignación. El `tenantId` lo impone el contexto de tenant; **nunca** se acepta del cuerpo.

| | |
| :--- | :--- |
| **Auth / tenant** | *Tenant-scoped* (requiere tenant resuelto por subdominio) |
| **Body** | `UpdateEmployeeDto` (parcial de `name`, `email`, `serviceIds`) |
| **200** | `EmployeeResponseDto` con el empleado actualizado |
| **400** | Validación fallida (mismas reglas que `POST`) o un `serviceId` inexistente en el tenant |
| **409** | El nuevo `email` colisiona con otro empleado del tenant |
| **404** | El empleado no existe para el tenant activo |
| **403** | Sin tenant resuelto (fail-closed) |

```http
PATCH /api/v1/employees/665f1b2c9c1e4a0012ab9999 HTTP/1.1
Host: acme.yourplatform.com
Content-Type: application/json

{ "name": "Grace M. Hopper", "serviceIds": ["665f1b2c9c1e4a0012ab34cd"] }
```

```json
{ "id": "665f1b2c9c1e4a0012ab9999", "name": "Grace M. Hopper", "email": "grace@acme.test", "serviceIds": ["665f1b2c9c1e4a0012ab34cd"] }
```

---

> **Pendiente de documentar** conforme se implementen las HU siguientes.
