# Regla: Seguridad del modelo de datos en MongoDB 8.3

Esta regla cubre la seguridad a nivel de datos. Complementa el aislamiento de
`mongodb-multitenancy.md` (cuya garantía de no cruzar tenants es también un requisito de
seguridad) y las convenciones de `mongodb-schema-conventions.md`.

## 1. RBAC y mínimo privilegio

- El usuario de aplicación tiene **solo** los privilegios que necesita sobre **su** base de datos
  (typ. `readWrite`); **nunca** roles administrativos (`dbAdmin`, `root`) en producción.
- Credenciales fuera del código (variables de entorno/secret manager); rota y no las loguees.

## 2. Cifrado

- **En tránsito**: TLS obligatorio en todas las conexiones a MongoDB.
- **En reposo**: cifrado de almacenamiento (WiredTiger encryption / cifrado del proveedor).
- **A nivel de campo** para datos personales sensibles (p. ej. datos de contacto del cliente):
  - **Queryable Encryption (QE)**: preferido para desarrollos nuevos; soporta consultas de
    **igualdad** (GA) y de **rango** (GA desde MongoDB 8.0). Las consultas por prefijo/sufijo/
    substring están en *preview* (8.2) y **no** son para producción.
  - **CSFLE**: alternativa para igualdad determinista o cuando se requieran claves por campo/tenant.
  - Elige QE por defecto; CSFLE si el caso lo exige. Documenta qué campos se cifran y con qué
    esquema de claves (considera clave por tenant).

## 3. Prevención de inyección de operadores

- **Sanitiza** la entrada: nunca construyas un filtro/actualización directamente desde un objeto
  del cliente sin validar (un `{ "$gt": "" }` inyectado altera la consulta).
- Valida y tipa las entradas con DTOs (NestJS) antes de llegar a la capa de datos.
- Evita `$where` y JavaScript del lado servidor con entrada del usuario.

## 4. Exposición mínima de datos

- No devuelvas documentos internos completos: proyecta y **mapea a DTOs**; no expongas `_id`,
  `tenantId` ni campos internos más de lo necesario.
- Los datos personales que no se usan en una respuesta no se seleccionan.

## 5. Auditoría

- Registra accesos y cambios sensibles a nivel de aplicación (quién, qué, cuándo, tenant), sin
  volcar datos personales en claro en los logs.
