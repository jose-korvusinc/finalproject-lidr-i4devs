# Regla: Indexación y rendimiento en MongoDB 8.3

Esta regla define cómo indexar y consultar para cumplir el requisito de latencia (motor de
disponibilidad <200 ms percibida). Cada índice existe para soportar un patrón de acceso concreto
de `mongodb-data-modeling.md`, y empieza por `tenantId` según `mongodb-multitenancy.md`.

## 1. Orden de claves: guía ESR

Ordena las claves de un índice compuesto por **Equality, Sort, Range** (ESR):

1. Campos de **igualdad** primero (siempre), incluido `tenantId`.
2. Campos de **ordenación** después.
3. Campos de **rango** al final.

Es una **guía**, no una ley: si el predicado de rango es muy selectivo, puede convenir
**ERS** (rango antes que ordenación) para evitar ordenaciones en memoria. Verifica siempre con
`explain()`.

```javascript
db.appointments.createIndex({ tenantId: 1, employeeId: 1, startsAt: 1 })
```

## 2. Tipos de índice y cuándo usarlos

- **Compuesto**: el caso normal; cubre filtros + orden de una consulta.
- **Único (por tenant)**: integridad; empieza por `tenantId` (ver `mongodb-multitenancy.md`).
- **Parcial** (`partialFilterExpression`): indexa solo un subconjunto (p. ej. `status: "confirmed"`),
  reduce tamaño y coste.
- **Sparse**: para campos opcionales.
- **TTL** (`expireAfterSeconds`): expiración automática de OTP y sesiones. Solo **un campo** de
  tipo `Date`; el proceso de borrado corre **cada 60 s**, así que la eliminación **no es exacta al
  vencimiento**: no lo uses como corte de seguridad duro, valida también el vencimiento en la
  consulta/lógica.
- **Texto** / **wildcard** / **geoespacial**: solo si un patrón de acceso lo requiere.

```javascript
db.otps.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
db.appointments.createIndex(
  { tenantId: 1, startsAt: 1 },
  { partialFilterExpression: { status: "confirmed" } }
)
```

## 3. Consultas eficientes

- **Covered queries**: cuando sea posible, que la proyección se sirva solo del índice (todos los
  campos proyectados están en el índice y no se pide `_id` fuera de él).
- **Proyecta** siempre lo mínimo necesario; no devuelvas documentos completos por defecto.
- **Paginación**: usa **rango/keyset** sobre un campo indexado, no `skip` grande (`skip` escanea
  desde el principio y se degrada al crecer el offset).

```javascript
db.appointments
  .find({ tenantId, startsAt: { $gt: lastStartsAt } })
  .sort({ startsAt: 1 })
  .limit(20)
```

## 4. Agregación

- Coloca `$match` (con `tenantId`) **lo antes posible** para aprovechar índices; proyecta pronto
  para reducir el flujo.
- Usa `$lookup` **con moderación**: si aparece en un camino caliente, replantea el modelo
  (Extended Reference en `mongodb-data-modeling.md`).

## 5. Verificación y presupuesto de índices

- Valida cada índice nuevo con **`explain()`** (`executionStats`): confirma uso de índice,
  ausencia de `COLLSCAN` y de ordenaciones en memoria (`SORT`).
- **Presupuesto por colección**: no añadas índices redundantes (un prefijo de otro compuesto ya
  cubre las consultas por ese prefijo). Cada índice tiene coste en escritura y RAM.
- MongoDB 8.3 usa por defecto el **Cost-Based Ranker (CBR)** para elegir plan; aun así, mide con
  `explain()` sobre datos representativos.
