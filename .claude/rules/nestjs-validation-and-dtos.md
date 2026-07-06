# Regla: Validación, DTOs y contrato de API en NestJS 11.1

Esta regla define cómo **validar la entrada**, **modelar los DTOs** y **serializar la salida** en el
backend NestJS. Es la primera línea de defensa contra entradas maliciosas y complementa
`mongodb-security.md` (§3 inyección de operadores, §4 exposición mínima). Trabaja con
`nestjs-architecture.md` y `nestjs-data-access-mongoose.md`.

## 1. DTOs como frontera de entrada y salida

- **Toda** entrada de un endpoint (body, query, params) se tipa con un **DTO de clase** decorado con
  `class-validator`. Nunca uses `any` ni objetos sin validar como entrada del handler.
- Separa **DTOs de entrada** (`CreateReservationDto`, `UpdateReservationDto`, `ListReservationsQueryDto`)
  de **DTOs de respuesta** (`ReservationResponseDto`). No expongas el documento Mongoose crudo.
- DTOs de entidad ≠ esquema de persistencia: el esquema Mongoose y su validador `$jsonSchema` son la
  fuente de verdad de integridad de datos (ver `mongodb-schema-conventions.md`); el DTO valida el
  contrato HTTP. Mantenlos coherentes, sin duplicar reglas divergentes.

✅ DTO de entrada tipado:

```typescript
export class CreateReservationDto {
  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  serviceId: string;

  @IsISO8601()
  startsAt: string;

  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;
}
```

## 2. ValidationPipe global (whitelist estricta)

- Registra un **`ValidationPipe` global** en el bootstrap con configuración estricta. Es
  **obligatorio**:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
  }),
);
```

- `whitelist: true` elimina propiedades no declaradas; `forbidNonWhitelisted: true` **rechaza** la
  petición si llegan propiedades extra; `transform: true` instancia el DTO y convierte tipos según
  decoradores. Evita `enableImplicitConversion` para conversiones sorpresa: tipa explícitamente.
- Usa los **pipes de parseo** de NestJS para params sueltos (`ParseIntPipe`, `ParseBoolPipe`,
  `ParseUUIDPipe`, `ParseDatePipe` —nuevo en NestJS 11—) en vez de convertir a mano.

## 3. Prevención de inyección de operadores (crítico)

- **Nunca** construyas un filtro/actualización de MongoDB directamente desde un objeto del cliente.
  Un `{ "$gt": "" }` o `{ "$where": ... }` inyectado altera la consulta (ver `mongodb-security.md` §3).
- La whitelist del `ValidationPipe` + DTOs tipados es la defensa base: al descartar campos no
  declarados y forzar tipos, un operador `$`-inyectado no sobrevive al mapeo a DTO.
- Refuerzos: valida los ids con `@IsMongoId()`; **rechaza claves que empiecen por `$` o contengan
  `.`** en cualquier payload de forma libre; convierte los valores del DTO a la query de forma
  explícita (nunca `find(req.body)`); prohíbe `$where` y JavaScript de servidor con entrada de usuario.

❌ Filtro construido desde el cliente sin sanear:

```typescript
find(@Query() query: any) {
  return this.model.find(query);
}
```

✅ Query derivada de un DTO validado, campo a campo:

```typescript
list(@Query() q: ListReservationsQueryDto) {
  return this.reservations.list({ status: q.status, from: q.from, to: q.to });
}
```

## 4. Serialización y exposición mínima de la salida

- Usa `ClassSerializerInterceptor` (global) con DTOs de respuesta decorados por
  `class-transformer`: expón solo lo necesario con `@Expose()` y oculta lo interno con `@Exclude()`.
- **No devuelvas** `_id`, `tenantId` ni campos internos más de lo necesario (ver `mongodb-security.md`
  §4). Mapea `_id → id` en la capa de presentación y proyecta solo los campos que la respuesta usa.
- Los datos personales que no se usan en una respuesta **no se seleccionan** (proyección en la query,
  ver `mongodb-indexing-and-performance.md` §3).

✅ DTO de respuesta con exposición controlada:

```typescript
export class ReservationResponseDto {
  @Expose()
  id: string;

  @Expose()
  status: string;

  @Exclude()
  tenantId: string;
}
```

## 5. Documentación del contrato (OpenAPI / Swagger)

- Documenta la API con `@nestjs/swagger` (dependencia por instalar): decora los DTOs con
  `@ApiProperty()` y los controladores con `@ApiTags`/`@ApiResponse`. El DTO es la **única fuente**
  del esquema OpenAPI; no mantengas un contrato paralelo a mano.
- Expón el Swagger UI **solo en entornos no productivos** o tras autenticación; no publiques la
  superficie interna de la API sin control.
- Mantén el contrato versionado junto al versionado de rutas (`nestjs-architecture.md` §4).
