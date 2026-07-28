---
description: Orquesta el ciclo TDD (red-green-refactor) de un slice encadenando el test-author (RED) y el agente de implementación (GREEN + REFACTOR) del stack correspondiente.
argument-hint: <slice o feature a implementar en TDD (texto libre)>
---

Orquesta un ciclo **TDD estricto** para el slice descrito en `$ARGUMENTS`, aplicando
`.claude/rules/tdd-workflow.md`. Tú (hilo principal) coordinas; los subagentes ejecutan cada fase.
El orden **rojo antes que verde** es obligatorio y no negociable.

## 0. Preparación

1. Si `$ARGUMENTS` está vacío o es ambiguo, **pregunta** qué slice implementar; no inventes.
2. Determina el **stack** (backend NestJS / frontend Angular) a partir del slice. Si toca ambos,
   divídelo y ejecuta un ciclo por stack.
3. Recopila la **spec** del slice (historia de usuario, contrato de API, modelo de datos) desde
   `sections_readme/`, `system_architecture/` y el código. No inventes comportamiento no
   especificado.

## 1. RED — escribir los tests que fallan

Invoca al test-author del stack (agente `nestjs-test-author` o `angular-test-author`) con el slice y
la spec recopilada. Debe escribir los tests y **confirmar que fallan por aserción**. En backend,
exige el **RED obligatorio** (aislamiento entre tenants e invariantes) cuando el slice toque datos.

## 2. Verificar ROJO

Comprueba el reporte del test-author: la suite falla, y falla por **aserción** (no por error de
compilación/import). Si el rojo es "falso" o falta el RED obligatorio, **devuélvelo** al test-author;
no avances a implementar.

## 3. GREEN — implementación mínima

Invoca al agente de implementación del stack (`nestjs-backend-developer` o
`angular-frontend-developer`) **en modo TDD**: debe hacer pasar los tests recibidos con el **mínimo**
código, **sin modificar, debilitar, borrar ni `skip`** ningún test.

## 4. Verificar VERDE

Ejecuta la suite. Debe estar en **verde**. Verifica además que **ningún test cambió**: si un test
pasó de rojo a verde por edición del propio test, **rechaza** el resultado y repite la fase GREEN.

## 5. REFACTOR

Pide al agente de implementación que **refactorice en verde** (eliminar duplicación, mejorar
nombres/estructura) sin cambiar comportamiento ni añadir funcionalidad. Re-ejecuta la suite y
confirma que sigue verde.

## 6. Cierre e iteración

- Si el slice tiene más comportamiento pendiente, vuelve al paso 1 con el siguiente sub-slice.
- Al terminar, resume: tests añadidos (y el RED obligatorio cubierto), ficheros de producción
  tocados, y el estado final de la suite. Si procede commitear, **los tests van antes** que la
  implementación.

## Guardarraíles

- Ningún agente edita los tests de otro para "cuadrar" el resultado.
- No se implementa código sin un test rojo previo que lo justifique.
- Si un test parece incorrecto, se **detiene y se declara**; no se cambia en silencio.
