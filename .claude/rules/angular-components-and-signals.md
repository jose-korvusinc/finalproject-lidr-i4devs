# Regla: Componentes y signals en Angular 22

Esta regla define **cómo se escriben** los componentes y su estado reactivo. Complementa
`angular-architecture.md` (dónde viven) y `angular-templates-and-performance.md` (su plantilla).
Todo el código va en **inglés y sin comentarios**.

## 1. Detección de cambios

- **`OnPush` es el valor por defecto en Angular 22.** **No** declares
  `changeDetection: ChangeDetectionStrategy.OnPush` de forma explícita (redundante); la estrategia
  antigua "Default" está deprecada y sustituida por un opt-in "Eager" que **no** debes usar salvo
  causa justificada y documentada.
- Trabaja **zoneless-friendly**: la reactividad procede de signals; no fuerces la detección con
  `ChangeDetectorRef.detectChanges()`.

## 2. Entradas, salidas y modelo

- **Entradas**: función `input()` (o `input.required()`), **no** el decorador `@Input()`.
- **Salidas**: función `output()`, **no** `@Output()` ni `EventEmitter` manual.
- **Two-way**: `model()` para el patrón banana-in-a-box, **no** el par `@Input()/@Output()`.
- Tipa siempre las entradas; usa `input()` con `transform` cuando debas normalizar el valor.

✅ Componente de presentación:

```typescript
@Component({
  selector: 'app-slot-picker',
  templateUrl: './slot-picker.html',
  styleUrl: './slot-picker.scss',
})
export class SlotPicker {
  readonly slots = input.required<TimeSlot[]>();
  readonly selected = model<TimeSlot | null>(null);
  readonly slotChosen = output<TimeSlot>();

  choose(slot: TimeSlot): void {
    this.selected.set(slot);
    this.slotChosen.emit(slot);
  }
}
```

## 3. Estado con signals

- **Estado**: `signal<T>(initial)`.
- **Estado derivado**: `computed()`; nunca recalcules a mano en la plantilla lo que un `computed`
  puede memoizar.
- **Actualización**: `set()` o `update()`. **Nunca** `mutate()` (eliminado); tampoco mutes objetos
  o arrays en su sitio: crea nuevas referencias.
- **`effect()`**: solo para efectos colaterales (logging, sincronización con APIs externas), no
  para derivar estado. No cambies estado dentro de un `effect` sin `allowSignalWrites` justificado.
- Mantén las transformaciones de estado **puras y predecibles**.

✅ / ❌ Actualización de signal:

```typescript
this.appointments.update((list) => [...list, created]);
```

```typescript
this.appointments.mutate((list) => list.push(created));
```

## 4. Host bindings

- Pon los bindings de host en el objeto **`host`** del decorador `@Component`/`@Directive`. **No**
  uses los decoradores `@HostBinding` ni `@HostListener`.

✅ Host binding y listener declarativos:

```typescript
@Component({
  selector: 'app-booking-card',
  templateUrl: './booking-card.html',
  host: {
    '[class.is-selected]': 'selected()',
    '[attr.aria-pressed]': 'selected()',
    '(click)': 'toggle()',
  },
})
export class BookingCard {
  readonly selected = signal(false);
  toggle(): void {
    this.selected.update((value) => !value);
  }
}
```

## 5. Ciclo de vida y limpieza

- Prefiere `computed`/`effect` a hooks manuales. Cuando necesites limpieza, usa
  `DestroyRef`/`takeUntilDestroyed()` en lugar de implementar `OnDestroy` con `Subject` manual.
- Interoperabilidad con RxJS: `toSignal()`/`toObservable()`; no te suscribas manualmente sin
  gestionar la baja.

## 6. Buenas prácticas de componente

- Un componente = una responsabilidad; extrae subcomponentes de presentación cuando crezca.
- Contenedores orquestan datos (servicios, resources); presentacionales solo reciben `input()` y
  emiten `output()`.
- Plantillas inline para componentes pequeños; externas (`templateUrl`/`styleUrl` relativos al
  `.ts`) para las grandes. Sin lógica compleja en plantilla (ver
  `angular-templates-and-performance.md`).
