# Regla: Modelado de datos en MongoDB (dirigido por patrones de acceso)

Esta regla define **cómo** modelar el esquema de documentos en MongoDB 8.3 para el proyecto.
El diseño se guía por los **patrones de acceso** reales, no por el modelo relacional. Trabaja
junto con `mongodb-normalization-fnbc.md` (corrección del modelo lógico), con
`mongodb-schema-conventions.md` (nomenclatura, tipos y validación) y con
`mongodb-indexing-and-performance.md` (índices que soportan estas consultas).

## 1. Principio rector

- **Diseña a partir de las consultas, no de las entidades.** Antes de definir una colección,
  enumera las lecturas y escrituras que la aplicación hará sobre ella (frecuencia, filtros,
  ordenación, cardinalidad). El esquema óptimo es el que sirve esos accesos con el menor número
  de operaciones e índices.
- **Lo que se lee junto, se guarda junto.** Si un dato se recupera casi siempre acompañado de
  otro en la misma vista o endpoint, es candidato a **embeberse**.
- **Una colección por concepto de acceso, no por tabla.** No traslades el esquema relacional
  1:1; agrupa por cómo se consulta el dominio.

## 2. Embeber vs. referenciar

| Embeber (sub-documento / array) | Referenciar (`ObjectId` a otra colección) |
| :--- | :--- |
| Se lee junto con el padre casi siempre | Se consulta o actualiza de forma independiente |
| Relación de composición "posee-a" (la parte no vive sin el todo) | Entidad con ciclo de vida propio |
| Cardinalidad **acotada y pequeña** | Cardinalidad alta o no acotada |
| Datos que cambian a la vez que el padre | Datos compartidos por muchos padres |

- **Por defecto, embebe** relaciones 1-1 y 1-N acotadas (few); **referencia** las 1-N grandes
  (many) y todas las N-M.
- Nunca embebas arrays **no acotados** (ver §5). Si un array puede crecer sin límite, referencia
  o aplica el patrón `subset`.

## 3. Relaciones

- **1-1**: embebe salvo que el sub-documento se acceda por separado o infle el padre.
- **1-N (few, acotada)**: embebe el array de hijos (p. ej. líneas de un horario semanal).
- **1-N (many)**: referencia; el hijo guarda el `ObjectId` del padre y se indexa por él.
- **N-M**: referencia por ambos lados con arrays de `ObjectId` **acotados**, o una colección de
  enlace si la relación tiene atributos propios o crece.

## 4. Patrones de diseño (MongoDB "Building With Patterns")

Aplica el patrón que resuelva el acceso; nómbralos con su nombre oficial:

- **Subset**: embebe solo el subconjunto más usado de un array grande (p. ej. últimas N citas)
  y referencia el resto. Evita documentos inflados y el límite de 16 MB.
- **Extended Reference**: duplica en el hijo unos pocos campos del padre que se leen siempre
  (p. ej. `serviceName`, `servicePrice` en la cita), evitando `$lookup`. Define la fuente de
  verdad y cómo se propaga el cambio (ver denormalización controlada en
  `mongodb-normalization-fnbc.md`).
- **Computed**: precalcula agregados costosos (p. ej. `bookingsCount`) en escritura en vez de en
  lectura.
- **Bucket**: agrupa series temporales por ventana (p. ej. disponibilidad por día) en un solo
  documento acotado; para métricas puras prefiere colecciones time-series (ver
  `mongodb-scalability-and-evolution.md`).
- **Schema Versioning**: incluye `schemaVersion` para evolucionar el esquema sin migración masiva.
- **Outlier / Polymorphic**: para documentos atípicos o variantes de una misma colección.

## 5. Anti-patrones a evitar

- **Arrays no acotados** (primer anti-patrón oficial): pueden superar los **16 MB** por documento
  y degradan los índices. Remedio: `subset` o referencia.
- **Documentos "hinchados"**: campos grandes que casi nunca se leen; sepáralos en otra colección.
- **Demasiadas colecciones** o una colección por tenant en el modelo pool (ver
  `mongodb-multitenancy.md`).
- **`$lookup` masivo** para suplir un mal modelado (ver `mongodb-indexing-and-performance.md`).

## 6. Ejemplo del dominio (reservas)

✅ Cita como documento propio (many, ciclo de vida propio), con extended reference al servicio:

```javascript
{
  _id: ObjectId(),
  tenantId: ObjectId(),
  employeeId: ObjectId(),
  customer: { name: "Ada Lovelace", phone: "+34600000000" },
  service: { serviceId: ObjectId(), name: "Haircut", durationMinutes: 30 },
  startsAt: ISODate("2026-07-10T09:00:00Z"),
  status: "confirmed",
  price: NumberDecimal("25.00"),
  schemaVersion: 1
}
```

❌ Evita embeber todas las citas dentro del documento del empleado (array no acotado).
