# Regla: Testing y calidad del backend NestJS 11.1

Esta regla define **cómo probar** el backend y qué **calidad de código** exigir. Los tests de
aislamiento entre tenants son un requisito de seguridad, coherente con `mongodb-multitenancy.md` §6.
Trabaja con `nestjs-architecture.md`, `nestjs-security-and-multitenancy.md` y
`nestjs-data-access-mongoose.md`.

## 1. Herramientas del proyecto

- El proyecto está configurado con **Jest 30 + ts-jest** (compilador `tsc`); los tests unitarios son
  `*.spec.ts` y los e2e usan `test/jest-e2e.json`. **Usa esa configuración**: no la cambies sin
  motivo. NestJS 11 admite además Vitest/SWC como opción más rápida, pero **este proyecto pin­ea
  Jest**; respétalo salvo decisión explícita documentada.
- Usa `@nestjs/testing` (`Test.createTestingModule`) para construir módulos de prueba, **supertest**
  para los e2e HTTP y el runner de scripts `npm test`, `npm run test:e2e`, `npm run test:cov`.

## 2. Tests unitarios (servicios y lógica)

- Prueba la **lógica de negocio** en los servicios de forma aislada, **mockeando** el acceso a datos
  (el `Model` de Mongoose o el repositorio) con `getModelToken`. Los controladores, al ser finos
  (`nestjs-architecture.md` §2), necesitan poco test unitario propio.
- Cubre los **casos límite** y las invariantes: rechazo de doble reserva → 409, validación fallida →
  400, recurso inexistente → 404, acceso cruzado → 403.

## 3. Tests e2e (HTTP)

- Levanta la app con los **mismos pipes/guards/filtros globales** que producción (ValidationPipe
  whitelist, guard de tenant, exception filter) para que el e2e refleje el comportamiento real.
- Usa una base de datos de prueba efímera (contenedor o `mongodb-memory-server`) y **limpia el estado
  entre tests**. No pruebes contra datos de producción.
- Verifica el contrato: códigos de estado, forma de la respuesta (DTOs, sin `_id`/`tenantId`
  filtrados) y la forma de error uniforme (`nestjs-errors-and-observability.md` §2).

## 4. Tests de aislamiento entre tenants (obligatorios)

- **Obligatorio** (requisito de seguridad, `mongodb-multitenancy.md` §6): al menos un test e2e
  demuestra que una petición autenticada como **tenant A** **no** puede leer ni escribir datos del
  **tenant B**. Cubre lectura (`GET` devuelve 404/empty), escritura y agregación.
- Verifica también que una consulta **sin** `tenantId` resuelto es rechazada por el guard
  (`nestjs-security-and-multitenancy.md` §2), no ejecutada.

✅ Esqueleto del test de aislamiento:

```typescript
it("does not leak data across tenants", async () => {
  const created = await asTenant("acme").post("/api/v1/reservations").send(payload);
  await asTenant("globex").get(`/api/v1/reservations/${created.body.id}`).expect(404);
});
```

## 5. Cobertura y criterios

- Prioriza cobertura en la **lógica de negocio** y en las **invariantes de seguridad** (tenant, auth,
  validación) sobre el porcentaje global. Un endpoint nuevo llega con sus tests.
- La suite debe pasar en CI antes de integrar; los tests son **deterministas** (sin dependencias de
  reloj/red no controladas): fija el tiempo y aísla dependencias externas.

## 6. Calidad estática

- **ESLint + Prettier** del proyecto (`eslint.config.mjs`, `typescript-eslint` type-checked) deben
  pasar (`npm run lint`). Respeta las reglas activas (`no-floating-promises`, `no-unsafe-argument`).
- Código **en inglés** y **sin comentarios** (ver `nestjs-architecture.md` §0); nombres de fichero
  según `file-naming.md`. El código se explica por diseño, no por comentarios.
- No introduzcas `any` en fronteras de entrada (usa DTOs, `nestjs-validation-and-dtos.md`); `any`
  interno solo si una librería lo fuerza.
