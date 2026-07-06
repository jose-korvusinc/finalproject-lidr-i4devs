# Regla: Normalización (1FN–FNBC) en un modelo documental

Esta regla concilia la teoría de **normalización relacional** (hasta la Forma Normal de
Boyce-Codd, **FNBC/BCNF**) con el modelado orientado a documentos de MongoDB. La normalización
se aplica al **modelo lógico** de entidades y relaciones para eliminar anomalías; el modelado
físico final lo decide `mongodb-data-modeling.md` según los patrones de acceso. No copies la
teoría relacional a ciegas ni la uses para prohibir el anidamiento legítimo.

## 1. Por qué normalizar en un almacén documental

La flexibilidad de los documentos facilita introducir **redundancia no controlada**, que provoca
anomalías de **inserción**, **actualización** y **borrado** (el mismo dato en varios sitios se
desincroniza). Normalizar el modelo lógico previene esas anomalías; luego se denormaliza **solo**
de forma deliberada y con mecanismo de coherencia (§4).

## 2. Formas normales aplicadas al modelo lógico

- **1FN**: todo atributo contiene un valor atómico respecto a su significado. En documentos, un
  array es 1FN si sus elementos son valores de un mismo dominio (p. ej. `tags: string[]`); no lo
  es si mezcla conceptos heterogéneos en un campo.
- **2FN**: sin dependencias **parciales** de una clave compuesta. Ningún atributo debe depender de
  parte de la clave identificadora de la entidad.
- **3FN**: sin dependencias **transitivas**. Un atributo no clave no debe depender de otro atributo
  no clave (p. ej. no guardes `cityName` derivable de `postalCode` como fuente de verdad).
- **FNBC**: **toda dependencia funcional no trivial parte de una clave candidata**. Es la meta del
  modelo lógico: cada hecho vive en la entidad de la que depende funcionalmente, una sola vez.

## 3. Reconciliación con el modelo documental

- La forma normal se aplica a **entidades y relaciones**, **no** prohíbe embeber. Un sub-documento
  o array que modela una **composición todo-parte "posee-a"** (la parte no es una entidad
  independiente) es correcto y sigue siendo normal: forma parte del mismo hecho que su padre.
- Embeber una **entidad independiente** (con su propia clave e identidad) sí introduce
  redundancia entre agregados: eso es lo que la normalización evita → **referénciala**.
- Regla práctica: **normaliza las entidades, decide embed/reference por acceso.** El resultado
  puede tener anidamiento (composición) y estar en FNBC a nivel de entidades.

## 4. Denormalización controlada (cuando se justifica por acceso)

Si `mongodb-data-modeling.md` decide duplicar datos por rendimiento (p. ej. Extended Reference),
la regla es **obligatoria**:

1. **(a) Justifica el patrón de acceso** que lo motiva (qué consulta se acelera y por qué).
2. **(b) Declara la fuente de verdad**: qué colección posee el dato canónico.
3. **(c) Define el mantenimiento de coherencia**: actualización atómica en un documento,
   transacción multi-documento (ver `mongodb-transactions-and-integrity.md`), o recomputación
   programada. Documenta la ventana de inconsistencia aceptada.

Sin los tres puntos, **no se denormaliza**.

## 5. Ejemplos

❌ Dependencia transitiva y redundancia (el nombre del servicio como fuente de verdad repetida):

```javascript
{ _id: ObjectId(), serviceId: ObjectId(), serviceName: "Haircut", serviceCategoryName: "Hair" }
```

✅ Modelo lógico en FNBC: la cita referencia el servicio; si se duplica `serviceName`, es
Extended Reference con fuente de verdad declarada en `services` y propagación definida:

```javascript
{ _id: ObjectId(), tenantId: ObjectId(), service: { serviceId: ObjectId(), name: "Haircut" } }
```
