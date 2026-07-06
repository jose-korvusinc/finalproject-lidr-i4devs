# Regla: Multitenancy en MongoDB (modelo de colecciones compartidas)

Esta regla define el **aislamiento multitenant** del modelo de datos. El proyecto usa el
**modelo pool**: una sola base de datos, **colecciones compartidas** discriminadas por `tenantId`.
Es la estrategia por defecto y **obligatoria** salvo excepción justificada (§5). Trabaja con
`mongodb-indexing-and-performance.md` (prefijo de índice) y `mongodb-security.md` (fuga entre
tenants).

## 1. `tenantId` obligatorio

- Toda colección de datos de negocio incluye `tenantId: ObjectId` **requerido** y validado por
  `$jsonSchema` (ver `mongodb-schema-conventions.md`).
- El `tenantId` se resuelve desde el subdominio en la capa de API (NestJS) y se inyecta en el
  contexto de la petición; **nunca** se acepta del cuerpo del cliente.

## 2. `tenantId` como primer campo de cada índice

- **Todo índice** de una colección multitenant lleva `tenantId` como **primera** clave. Esto
  garantiza que las consultas por tenant usen el índice (igualdad primero, regla ESR) y acota el
  trabajo del planificador al conjunto del tenant.

```javascript
db.appointments.createIndex({ tenantId: 1, employeeId: 1, startsAt: 1 }, { unique: true })
db.services.createIndex({ tenantId: 1, isActive: 1 })
```

## 3. Ninguna consulta sin `tenantId`

- **Cada** lectura, escritura y pipeline filtra por `tenantId`. Una consulta sin `tenantId` es un
  defecto de seguridad, no una optimización pendiente.
- Impón el filtro de forma **transversal**, no manual por consulta: usa un plugin/middleware de
  Mongoose que inyecte `tenantId` (del contexto de petición) en `find`, `update`, `delete`,
  `count` y `aggregate`, más un guard de NestJS que valide su presencia. Así ninguna consulta
  puede olvidarlo.

## 4. Unicidad e integridad por tenant

- Las restricciones de unicidad son **por tenant**: índice único compuesto que empieza por
  `tenantId` (p. ej. `{ tenantId: 1, slug: 1 }` para servicios). Nunca declares único un campo de
  negocio sin `tenantId` delante.

## 5. Cuándo escalar a base de datos por tenant

El modelo pool es el default por coste y escala a **muchos** tenants pequeños. Considera
**database-per-tenant** solo si un requisito lo exige (aislamiento físico/regulatorio, backup o
borrado por cliente, tenants muy grandes). Trade-off: mayor coste operativo, límite práctico de
número de tenants y despliegue más complejo. **Documenta y justifica** el cambio por spec; no se
mezcla con el modelo pool en la misma colección.

## 6. Prevención de fuga entre tenants

- Los tests deben cubrir explícitamente que una petición de un tenant **no** puede leer/escribir
  datos de otro.
- No expongas `_id` ni `tenantId` internos en respuestas públicas más de lo necesario (ver
  `mongodb-security.md`).
