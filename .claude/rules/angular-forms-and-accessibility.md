# Regla: Formularios, accesibilidad e i18n en Angular 22

Esta regla define **cómo se construyen los formularios**, cómo se garantiza la **accesibilidad**
(AXE + WCAG AA) y cómo se **internacionaliza** la UI. Trabaja con
`angular-components-and-signals.md` y `angular-templates-and-performance.md`. Todo el código va en
**inglés y sin comentarios**.

## 1. Signal Forms (preferido)

- Para formularios nuevos usa **Signal Forms** (`@angular/forms/signals`), estables en Angular 22:
  estado basado en signals, acceso a campos con tipos seguros y validación por esquema.
- Modela el estado del formulario como un `signal` del modelo; define el `form()` y sus validaciones
  por esquema; usa la **Submission API** para el envío (estado de envío, deshabilitado, errores).
- Muestra errores de validación ligados al estado del campo y accesibles (ver §3).

✅ Formulario de reserva con Signal Forms:

```typescript
export class BookingForm {
  readonly model = signal<BookingRequest>({ serviceId: '', startsAt: '', customerName: '' });
  readonly form = form(this.model, (path) => {
    required(path.serviceId);
    required(path.startsAt);
    required(path.customerName);
  });

  private readonly api = inject(BookingApi);
  readonly submit = submit(this.form, async (value) => this.api.create(value));
}
```

## 2. Reactive Forms (respaldo)

- Cuando Signal Forms no encaje, usa **Reactive Forms** tipados. **Nunca** Template-driven Forms
  (`ngModel`) para formularios de negocio.

## 3. Accesibilidad (AXE + WCAG AA)

- La UI **debe pasar todas las comprobaciones de AXE** y cumplir los **mínimos WCAG AA**.
- **Etiquetas**: todo control tiene `<label>` asociado (o `aria-label`/`aria-labelledby`). No uses
  el placeholder como etiqueta.
- **Errores**: enlaza el mensaje con `aria-describedby` y marca el control con `aria-invalid`;
  anuncia cambios importantes con una live region (`aria-live`).
- **Gestión de foco**: foco visible siempre; mueve el foco de forma lógica al abrir diálogos y tras
  navegar; devuélvelo al cerrar. No crees trampas de foco no intencionadas.
- **Contraste de color**: ratio mínimo AA (4.5:1 texto normal, 3:1 texto grande) — coherente con
  los tokens SCSS (ver `angular-templates-and-performance.md`).
- **Roles y semántica**: usa HTML semántico primero; ARIA solo para completar lo que el HTML no
  cubre. Elementos interactivos operables por teclado.
- El **widget público de reserva** (mobile-first) y el **backoffice** cumplen ambos AA; verifica
  también el calendario (FullCalendar) con teclado y lector de pantalla.

## 4. Internacionalización (i18n)

- **Nunca** escribas texto visible en duro en plantillas ni en TypeScript. Externaliza **todo** el
  texto de UI con **i18n de Angular** (atributo `i18n`/`i18n-*` con IDs `@@` estables), o el
  mecanismo i18n definido por el proyecto.
- Las cadenas de error de validación y los mensajes de la API mapeados a UI también se traducen.
- Fechas, horas, números y moneda: usa los **pipes de localización** (`date`, `number`, `currency`)
  con el locale activo; las fechas llegan del backend en UTC y se presentan en la zona del usuario.

✅ Texto de UI traducible:

```html
<button type="submit" i18n="@@booking.confirm">Confirm booking</button>
```

❌ Texto en duro sin i18n:

```html
<button type="submit">Confirmar reserva</button>
```
