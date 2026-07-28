# Regla: Testing, calidad y seguridad del frontend Angular 22

Esta regla define las **puertas de calidad** del frontend: tests, linting/formato, convenciones de
código y seguridad del cliente. Trabaja con el resto de reglas `angular-*`. El proyecto usa
**Vitest** (`@angular/build:unit-test`), TypeScript estricto y Prettier.

## 1. Convenciones de código (no negociables)

- **Todo en inglés**: identificadores, nombres de fichero (ver `file-naming.md`), símbolos.
- **Sin comentarios**: el código es autoexplicativo; extrae funciones y usa nombres claros en lugar
  de comentar. Excepción: JSDoc de API pública de una librería compartida solo si aporta.
- **TypeScript estricto**: tipado estricto activado; prefiere la **inferencia** cuando el tipo es
  obvio; evita `any` (usa `unknown` si el tipo es incierto y estréchalo).
- **Texto de UI** siempre vía i18n, nunca en duro (ver `angular-forms-and-accessibility.md`).

## 2. Testing con Vitest

- Framework de test: **Vitest** con el builder `@angular/build:unit-test` (`ng test`). No introduzcas
  Karma/Jasmine.
- Prueba el **comportamiento observable**, no los detalles internos: entradas (`input()`), salidas
  (`output()`), render condicional y estado derivado (`computed`).
- Usa `TestBed` para componentes; provee dobles de los servicios de API (no llames a la red real).
  Para signals, verifica el valor tras `set/update` y la reactividad de los `computed`.
- **Multitenant**: cubre que el interceptor de tenant añade la cabecera correcta y que un contexto
  sin tenant no la envía (coherente con `angular-api-and-multitenancy.md`).
- **Accesibilidad**: incluye aserciones/automatización AXE en los flujos clave (widget de reserva,
  backoffice) para no regresar en WCAG AA.
- Mantén los tests deterministas: sin dependencias de reloj/red reales (mockea tiempo y HTTP).

## 3. Linting y formato

- **ESLint** (con `angular-eslint`) y **Prettier** son obligatorios; el código debe pasar ambos sin
  errores antes de darse por terminado. Respeta la configuración del repo (`.prettierrc`,
  `.editorconfig`).
- Las reglas de lint refuerzan esta guía: control de flujo nativo, sin `ngClass`/`ngStyle`, sin
  `@HostBinding`/`@HostListener`, sin `standalone: true` explícito, sin `OnPush` explícito.
- No silencies reglas con `eslint-disable` salvo justificación puntual.

## 4. Seguridad del cliente (XSS y otras)

- **Confía en el sanitizado de Angular**: la interpolación `{{ }}` y los property bindings escapan
  por defecto. **No** uses `bypassSecurityTrust*` con datos que no controlas al 100 %.
- **Evita `innerHTML`** con contenido no confiable; si es imprescindible mostrar HTML del servidor,
  sanitízalo explícitamente y documenta la fuente.
- No construyas URLs, estilos ni HTML concatenando entrada del usuario sin sanitizar; nada de
  `eval`/`Function`.
- No expongas secretos ni identificadores internos (`_id`, `tenantId`) en el DOM más de lo
  necesario; el tenant viaja por cabecera, no en el cuerpo (ver `angular-api-and-multitenancy.md`).
- Asume que el backend valida y autoriza: el frontend nunca es la frontera de seguridad, pero no
  debe abrir agujeros (XSS, fuga de datos en logs de consola en producción).

## 5. Puerta de "terminado"

Antes de dar por completada una tarea de frontend:

- [ ] Compila (`ng build`) y pasa los tests (`ng test`, Vitest).
- [ ] Pasa ESLint y Prettier sin errores.
- [ ] Cumple AXE y WCAG AA en la UI tocada.
- [ ] Sin comentarios; todo en inglés; texto de UI vía i18n.
- [ ] Sin `standalone: true` ni `OnPush` explícitos; signals y control de flujo nativo.
