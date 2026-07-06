# Regla: Convenciones y validación de esquema en MongoDB

Esta regla fija la **nomenclatura**, los **tipos de datos** y la **validación** de todo esquema
de MongoDB 8.3. Complementa `mongodb-data-modeling.md` y `mongodb-normalization-fnbc.md`, y es
coherente con `.claude/rules/file-naming.md` para los nombres de ficheros de esquema.

## 1. Nomenclatura (en inglés, siempre)

- **Colecciones**: nombre en **inglés**, **plural** y `camelCase` (p. ej. `appointments`,
  `services`, `availabilitySlots`). Un concepto de dominio por colección.
- **Campos**: `camelCase` en inglés (`startsAt`, `tenantId`, `employeeId`); sin abreviaturas
  ambiguas. Booleanos con prefijo (`isActive`, `hasReminder`).
- **Índices**: nombra explícitamente los índices compuestos (`tenantId_employeeId_startsAt`).
- **Enums**: valores en inglés, en minúscula o `SCREAMING_SNAKE`, pero **un** criterio único
  (p. ej. `"pending" | "confirmed" | "cancelled" | "completed"`).
- Los nombres de entidad deben **coincidir** con el modelo del dominio y el código NestJS.

## 2. Tipos de datos (BSON correcto)

- **Fechas**: siempre `Date` en **UTC** (`ISODate`), nunca strings. La zona horaria se resuelve en
  la capa de presentación.
- **Dinero**: `Decimal128` (BSON `decimal`), nunca `double`/`float` (no representan fracciones
  decimales exactas). En Mongoose, `MongooseSchema.Types.Decimal128`.
- **Identificadores**: `ObjectId` para `_id` y para referencias; no uses strings para claves.
- **Enteros**: `int`/`long` según rango; evita `double` para cantidades enteras.
- **Enums/estados**: `string` con conjunto cerrado, validado por `$jsonSchema` (§4).

## 3. `_id`, auditoría y metadatos

- Deja que MongoDB genere `_id` como `ObjectId` salvo que exista una clave natural estable.
- Añade **auditoría** con `createdAt`/`updatedAt` (`timestamps: true` en Mongoose).
- Incluye `schemaVersion` (ver `mongodb-scalability-and-evolution.md`) cuando la colección vaya a
  evolucionar.
- `tenantId` es **obligatorio** en toda colección de datos de negocio (ver `mongodb-multitenancy.md`).

## 4. Validación con `$jsonSchema`

Toda colección de negocio se crea con un validador `$jsonSchema` que declara `required`, tipos y
enums. Configura el nivel y la acción de validación:

- `validationLevel`: `strict` (por defecto, valida inserts y updates), `moderate` (inserts y
  updates solo de documentos ya válidos — útil al introducir validación sobre datos existentes),
  `off`.
- `validationAction`: `error` (por defecto, rechaza), `warn` (registra y admite), o **`errorAndLog`**
  (rechaza **y** registra; disponible desde MongoDB 8.1). En producción usa `error` o `errorAndLog`.
- Los errores devuelven detalle estructurado (`failingDocumentId`, `details.schemaRulesNotSatisfied`).

✅ Validador de colección:

```javascript
db.createCollection("appointments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenantId", "employeeId", "startsAt", "status", "price"],
      properties: {
        tenantId: { bsonType: "objectId" },
        employeeId: { bsonType: "objectId" },
        startsAt: { bsonType: "date" },
        status: { enum: ["pending", "confirmed", "cancelled", "completed"] },
        price: { bsonType: "decimal" }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "errorAndLog"
})
```

✅ Esquema Mongoose alineado con el validador (sin comentarios, en inglés):

```typescript
@Schema({ collection: "appointments", timestamps: true })
export class Appointment {
  @Prop({ type: Types.ObjectId, required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  startsAt: Date;

  @Prop({ type: String, enum: AppointmentStatus, required: true, default: AppointmentStatus.PENDING })
  status: AppointmentStatus;

  @Prop({ type: MongooseSchema.Types.Decimal128, required: true })
  price: Types.Decimal128;
}
```

El `$jsonSchema` de la colección es la **fuente de verdad de la integridad**; el esquema Mongoose
lo refleja sin duplicar reglas divergentes.
