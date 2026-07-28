# Regla: Transacciones, concurrencia e integridad en MongoDB

Esta regla define cómo garantizar la **integridad** de las escrituras —en especial la **no doble
reserva** de citas— con el menor coste. MongoDB no impone integridad referencial; se gestiona por
diseño y en la capa de aplicación. Trabaja con `mongodb-data-modeling.md` y
`mongodb-multitenancy.md`.

## 1. La atomicidad de documento es el primer recurso

- Una operación sobre **un solo documento es atómica**. Modela para que las invariantes que deben
  cumplirse juntas vivan **en el mismo documento** siempre que sea razonable; así evitas
  transacciones multi-documento.
- La documentación oficial es explícita: las transacciones **no** sustituyen a un buen diseño de
  esquema y no son necesarias para muchos casos prácticos.

## 2. Prevención de doble reserva

Combina dos mecanismos:

1. **Índice único por tenant** sobre la ranura reservable, para que la base rechace el duplicado:

```javascript
db.appointments.createIndex(
  { tenantId: 1, employeeId: 1, startsAt: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "confirmed"] } } }
)
```

2. **Escritura condicional atómica** (crear-si-libre) en una sola operación, en vez de
   "leer y luego escribir":

```javascript
db.appointments.updateOne(
  { tenantId, employeeId, startsAt, status: { $exists: false } },
  { $setOnInsert: { status: "confirmed", createdAt: new Date() } },
  { upsert: true }
)
```

3. **Concurrencia optimista** para actualizaciones de estado: incluye un campo `version` y
   condiciona la actualización a su valor, incrementándolo con `$inc`.

## 3. Transacciones multi-documento (solo si son imprescindibles)

Cuando una invariante cruce **varias** colecciones/documentos y no pueda rediseñarse en uno solo:

- Úsalas con `readConcern: "snapshot"` y `writeConcern: "majority"` (aislamiento snapshot).
- **Mantenlas cortas** (límite por defecto 60 s, `transactionLifetimeLimitSeconds`); no metas
  llamadas externas ni trabajo lento dentro.
- Soportadas en replica sets y sharded clusters. Trátalas como excepción, no como norma.

## 4. Integridad referencial (nivel de aplicación)

- Las referencias por `ObjectId` **no** tienen `FK` ni cascada nativa. Documenta, por cada
  referencia, la política ante borrado del padre (impedir, marcar huérfano, o borrado en cascada
  a nivel de servicio).
- Valida la existencia del referido en la capa de aplicación antes de crear la relación.

## 5. readConcern / writeConcern por defecto

- Escrituras de negocio: `writeConcern: "majority"` para durabilidad.
- Lecturas que exijan datos confirmados: `readConcern: "majority"`; para lecturas de catálogo no
  críticas basta el default por rendimiento.
