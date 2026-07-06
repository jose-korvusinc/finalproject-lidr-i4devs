# Regla: Flujo de trabajo TDD (red-green-refactor)

Esta regla define la **disciplina de Test-Driven Development** del proyecto: el ciclo
**red → green → refactor** y sus guardarraíles. Es transversal a frontend y backend. Define el
**cuándo y en qué orden**; el **cómo** escribir cada test es competencia de las rules de testing de
cada stack, que son la **única fuente de verdad** de las herramientas y convenciones de prueba:

- `.claude/rules/nestjs-testing-and-quality.md` → Jest + supertest, aislamiento entre tenants.
- `.claude/rules/angular-testing-and-quality.md` → Vitest, comportamiento, AXE.

Y trabaja con `mongodb-multitenancy.md` §6 y `mongodb-transactions-and-integrity.md` §2 (invariantes
que deben quedar cubiertas por tests).

## 1. Principio rector

Ningún código de producción se escribe sin un **test que falle** que lo justifique. El ciclo es:

1. **RED** — escribe el test más pequeño que exprese el siguiente comportamiento deseado y
   **confírmalo en rojo**.
2. **GREEN** — escribe el **mínimo** código de producción para que pase.
3. **REFACTOR** — mejora el diseño **manteniendo la suite en verde**.

Se itera slice a slice. Un "slice" es una porción de comportamiento trazable a una historia de
usuario, un endpoint del contrato o una invariante.

## 2. Fase RED (autoría de tests, independiente)

- Los tests se derivan de la **spec** (historia de usuario, contrato de API, modelo de datos), **no**
  de una implementación existente. Quien escribe el test actúa **ciego a la implementación** para no
  reflejar el código en el test.
- **Confirma que el test falla por el motivo correcto**: por una **aserción** no satisfecha, no por
  un error de compilación, import inexistente o `describe` vacío. Un rojo "falso" (no compila) no
  cuenta como RED válido.
- **Commitea los tests en rojo antes de implementar** (trazabilidad y prevención de que se ajusten a
  posteriori).

## 3. Fase GREEN (implementación mínima)

- Escribe **solo** el código que hace pasar los tests actuales; no añadas comportamiento no cubierto
  ("no lo vas a necesitar").
- **Prohibido tocar los tests para forzar el verde**: no los modifiques, debiliten, borres, ni los
  marques `skip`/`only`, ni relajes los matchers. Si un test parece incorrecto, **detente y
  decláralo** explícitamente; no lo cambies en silencio.
- **Prohibido "gamear" el test**: no hardcodees la salida esperada por el test, no devuelvas
  constantes que solo satisfacen el caso probado, no simules con mocks el comportamiento que
  precisamente se está probando.

## 4. Fase REFACTOR

- Solo se refactoriza **en verde**; tras cada cambio, la suite completa vuelve a pasar.
- Elimina duplicación y mejora nombres/estructura sin cambiar el comportamiento observable ni añadir
  funcionalidad nueva (eso abre un nuevo ciclo RED).

## 5. Qué conduce el bucle y qué es RED obligatorio

- **El bucle lo guían los tests unitarios** (rápidos, deterministas), tanto en frontend como en
  backend.
- **Backend — RED obligatorio (e2e de seguridad e invariantes)**: todo slice que toque datos de
  negocio incluye, cuando aplique, un test e2e de **aislamiento entre tenants** (tenant A no lee ni
  escribe datos de B; consulta sin `tenantId` rechazada) y de las **invariantes** críticas (p. ej.
  no doble reserva → 409). No se da por completado sin ellos.
- **Frontend**: el bucle cubre comportamiento (`input()/output()/computed`, render condicional) y la
  **cabecera de tenant** del interceptor. La accesibilidad **AXE** se mantiene según
  `angular-testing-and-quality.md` como buena práctica; no bloquea el ciclo unitario salvo que el
  slice sea de UI accesible crítica.

## 6. Roles y orquestación (los subagentes no hacen ping-pong)

Los subagentes corren en **contextos aislados**; el ciclo no se reparte assert a assert entre ellos.
La división es **por fase**:

- **Test-author agents** (`nestjs-test-author`, `angular-test-author`) → fase **RED**: escriben los
  tests que fallan desde la spec. No implementan producción.
- **Agentes de implementación** (`nestjs-backend-developer`, `angular-frontend-developer`) → fase
  **GREEN + REFACTOR**: hacen pasar los tests recibidos y refactorizan, sin tocarlos.
- **Comando `/tdd`** (`.claude/commands/tdd.md`) → **orquesta el orden** (rojo antes que verde) y
  **verifica el estado** entre fases. Es lo que garantiza que sea TDD y no test-after.

## 7. Guardarraíles anti-regresión de la disciplina

- El orden **rojo → verde** es obligatorio: no se implementa sin un rojo previo.
- Un test que pasa de rojo a verde **por edición del test** invalida el ciclo: se rechaza y se
  repite.
- Ningún agente edita los tests de otro para "cuadrar" el resultado.
- Los tests son **deterministas** (sin reloj/red reales): fija el tiempo y aísla dependencias.

## 8. Trazabilidad

- Cada slice y sus tests se **rastrean** a una historia de usuario, caso de uso o issue. El nombre
  del test describe el comportamiento, no la implementación.
