---
name: angular-frontend-dev
description: Desarrolla el frontend Angular 22 del proyecto (componentes signals-first, standalone, plantillas con control de flujo nativo, Signal Forms, Resource API, interceptor multitenant, accesibilidad AXE/WCAG AA e i18n) siguiendo las rules `angular-*` como única fuente de verdad. Úsala cuando el usuario pida crear, generar o modificar código del frontend en `code/frontend` (componentes, servicios, rutas, formularios, estilos o tests). NUNCA toca el backend ni la base de datos.
---

# Skill: Desarrollo del frontend Angular 22

Produce y modifica **código de frontend Angular 22** en `code/frontend` (componentes, directivas,
servicios, rutas, formularios, estilos y tests) aplicando las mejores prácticas de Angular 22. La
skill **no inventa** convenciones: las toma de las rules `angular-*` del proyecto, que son la ÚNICA
fuente de verdad. Alcance **estrictamente frontend**: nunca modifica `code/backend/` ni la base de
datos; consume la API REST de NestJS.

## Fuente de verdad (OBLIGATORIO leer antes de codificar)

Lee y aplica SIEMPRE estas rules. Si hay conflicto, las rules mandan sobre cualquier suposición:

- `.claude/rules/angular-architecture.md` → estructura por features, standalone, lazy loading,
  routing, DI (`@Service`/`inject`), estado, SSR opcional, áreas de dominio (FullCalendar, widget).
- `.claude/rules/angular-components-and-signals.md` → signals, `input()/output()/model()`,
  `computed/effect`, host bindings, `OnPush` por defecto.
- `.claude/rules/angular-templates-and-performance.md` → control de flujo nativo, `@defer`,
  `NgOptimizedImage`, bindings `class`/`style`, SCSS, mobile-first, budgets.
- `.claude/rules/angular-api-and-multitenancy.md` → HttpClient, Resource API (`httpResource`),
  interceptor de tenant por subdominio.
- `.claude/rules/angular-forms-and-accessibility.md` → Signal Forms, a11y (AXE/WCAG AA), i18n.
- `.claude/rules/angular-testing-and-quality.md` → Vitest, ESLint+Prettier, sin comentarios, XSS.

Y la regla de nomenclatura de ficheros: `.claude/rules/file-naming.md`.

No copies el contenido de las rules aquí: léelas en tiempo de ejecución (única fuente de verdad).

## Cuándo se activa

Cuando el usuario pida crear, generar, actualizar o corregir código del frontend Angular: un
componente, una feature con sus rutas, un servicio de API o store, un formulario, estilos, o tests.

## Contexto del proyecto (léelo antes de codificar)

- **Config del frontend**: `code/frontend/angular.json` (builder `@angular/build`, `style: scss`,
  budgets), `package.json` (Angular ^22, Vitest), `.prettierrc`, `.editorconfig`, `tsconfig*.json`.
- **Código existente**: `code/frontend/src/app/` (`app.config.ts`, `app.routes.ts`, componentes) para
  mantener coherencia de estructura, nombres y estilo.
- **Dominio y contratos**: `sections_readme/` y la documentación del proyecto para nombres de
  entidades (Appointment, Service, Employee, Customer, Tenant) y los endpoints de la API de NestJS.

## Flujo de trabajo

1. **Leer las rules `angular-*` y `file-naming.md`** antes de escribir nada.
2. **Situar el cambio**: identifica la feature (`features/<feature>/`), o si toca `core/`, `shared/`
   o `layout/`. Reutiliza lo existente antes de crear.
3. **Diseñar la unidad**:
   - Componente standalone (sin `standalone: true`, sin `OnPush` explícito), signals-first
     (`input()/output()/model()`, `computed`), host bindings en `host`.
   - Plantilla con control de flujo nativo (`@if/@for(track)/@switch/@let`), `class`/`style`
     bindings, `@defer` para lo pesado (p. ej. FullCalendar), `NgOptimizedImage` para imágenes.
   - Estilos SCSS con ámbito de componente, mobile-first.
4. **Datos y tenant**: acceso a la API en un servicio `*.api.ts` con Resource API (`httpResource`)
   para lecturas y `HttpClient`/Submission API para escrituras; el tenant viaja por el interceptor
   de subdominio, nunca en el cuerpo ni pedido al usuario.
5. **Formularios**: Signal Forms (`@angular/forms/signals`) por defecto; Reactive Forms de respaldo;
   accesibles (labels, `aria-*`, foco) y con texto vía i18n.
6. **Rutas**: lazy loading por feature (`loadComponent`/`loadChildren`), guards funcionales.
7. **Calidad**: código en inglés y sin comentarios; pasa ESLint + Prettier; añade/actualiza tests
   Vitest del comportamiento (incluida la cabecera de tenant y AXE en flujos clave); sin agujeros
   XSS (no `bypassSecurityTrust*` con datos no confiables, evita `innerHTML`).
8. **Verificar**: cuando sea viable, `ng build` y `ng test` en `code/frontend`; informa del
   resultado. No modifiques backend ni base de datos bajo ningún concepto.

## Convenciones no negociables

- **Standalone por defecto** (no declares `standalone: true`); **`OnPush` por defecto** (no lo
  declares).
- `input()/output()/model()`, `inject()`, `@Service()` (o `@Injectable({ providedIn: 'root' })`),
  control de flujo nativo, `class`/`style` bindings, host bindings en `host`, `set/update` (no
  `mutate`), `NgOptimizedImage`.
- Todo el código en **inglés**, **sin comentarios**; texto de UI vía **i18n** (nunca en duro).
- Nombres de fichero según `file-naming.md` (kebab-case, convención Angular).

## Lista de verificación de calidad (antes de terminar)

- [ ] He leído las rules `angular-*` y las he aplicado como fuente de verdad.
- [ ] Componentes standalone signals-first; sin `standalone: true` ni `OnPush` explícitos.
- [ ] Plantillas con control de flujo nativo y `track`; `class`/`style` bindings; `@defer` en lo pesado.
- [ ] Datos con Resource API; interceptor de tenant por subdominio; nunca tenant en el cuerpo.
- [ ] Formularios con Signal Forms; accesibles (AXE/WCAG AA); texto vía i18n.
- [ ] Rutas con lazy loading por feature y guards funcionales.
- [ ] Código en inglés, sin comentarios; pasa ESLint + Prettier; tests Vitest actualizados.
- [ ] Cero cambios fuera de `code/frontend` (no toca backend ni base de datos).

## Ejemplos de invocación

- "Crea la feature del widget público de reserva (mobile-first) con su ruta perezosa y su formulario."
- "Añade el interceptor multitenant que envía el tenant del subdominio en cada petición."
- "Genera el componente de agenda del backoffice con FullCalendar diferido con @defer."
