# Regla: Plantillas, estilos y rendimiento en Angular 22

Esta regla define **cómo se escriben las plantillas y los estilos** y cómo se cumple el presupuesto
de rendimiento (interacciones percibidas <200 ms, bundle inicial acotado). Complementa
`angular-components-and-signals.md`. Todo el código va en **inglés y sin comentarios**.

## 1. Control de flujo nativo

- Usa el control de flujo integrado **`@if`**, **`@for`**, **`@switch`** y **`@let`**. **No** uses
  las directivas estructurales `*ngIf`, `*ngFor`, `*ngSwitch` (legado).
- En `@for`, **`track`** es obligatorio: usa una clave estable (id), nunca `$index` si hay id.
- `@let` para valores derivados locales de la plantilla; evita expresiones repetidas o complejas.
- Mantén la plantilla **simple**: la lógica va en `computed()` del componente, no en la plantilla.

✅ Listado con estado vacío:

```html
@if (appointments().length) {
  <ul>
    @for (appointment of appointments(); track appointment.id) {
      <li>{{ appointment.customerName }}</li>
    }
  </ul>
} @else {
  <p i18n="@@booking.empty">No appointments yet</p>
}
```

## 2. Bindings de clase y estilo

- Usa **`[class.x]`**, **`[class]`**, **`[style.x]`** y **`[style]`**. **No** uses `ngClass` ni
  `ngStyle`.

```html
<button [class.is-active]="isActive()" [style.width.px]="widthPx()">…</button>
```

## 3. Datos asíncronos en plantilla

- Consume signals directamente (`value()`), o el **`async` pipe** para observables.
- No asumas globales (`new Date()`, `window`) disponibles en la plantilla; pásalos desde el
  componente (relevante también para SSR, ver `angular-architecture.md`).

## 4. Carga diferida de vista (`@defer`)

- Usa **`@defer`** para diferir fragmentos pesados o no críticos (p. ej. el calendario
  **FullCalendar** del backoffice, gráficos, mapas), con `@placeholder`, `@loading` y `@error`.
- Elige el disparador según el caso: `on viewport`, `on interaction`, `on idle`, `when <cond>`.

✅ Diferir el calendario de agenda:

```html
@defer (on viewport) {
  <app-schedule-calendar [events]="events()" />
} @placeholder {
  <div class="calendar-skeleton" aria-hidden="true"></div>
} @loading (minimum 200ms) {
  <app-spinner />
}
```

## 5. Imágenes y assets

- Usa **`NgOptimizedImage`** (`ngSrc`) para todas las imágenes estáticas, con `width`/`height` o
  `fill` para evitar layout shift; marca las críticas con `priority`.
- `NgOptimizedImage` **no** sirve para imágenes inline base64.

## 6. Estilos y mobile-first

- **SCSS** (el proyecto usa `style: scss`). Estilos con **ámbito de componente** por defecto; evita
  estilos globales salvo tokens/reset en `src/styles.scss`.
- **Mobile-first**: diseña primero para móvil y escala con media queries `min-width`. El **widget
  público de reserva** es mobile-first estricto (ver `angular-architecture.md`).
- No fijes colores ni tamaños "mágicos" repetidos: usa variables/tokens SCSS. El contraste debe
  cumplir **WCAG AA** (ver `angular-forms-and-accessibility.md`).

## 7. Presupuesto de rendimiento

- Respeta los **budgets** de `angular.json` (initial y `anyComponentStyle`); no los subas sin
  justificar.
- Lazy loading por feature (ver `angular-architecture.md`) + `@defer` mantienen el bundle inicial
  pequeño.
- Deriva con `computed()` en vez de recalcular en cada ciclo; usa `track` correcto en `@for` para
  minimizar el trabajo del DOM.
