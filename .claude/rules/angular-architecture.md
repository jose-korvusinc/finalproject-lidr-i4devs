# Regla: Arquitectura del frontend Angular 22

Esta regla define **cómo se estructura** la aplicación Angular 22 del proyecto (SaaS multitenant
de reservas). El frontend vive en `code/frontend` y **nunca** contiene lógica de backend ni acceso
directo a la base de datos: consume la API REST de NestJS. Trabaja con
`angular-components-and-signals.md` (piezas de UI), `angular-api-and-multitenancy.md` (acceso a
datos y tenant) y `angular-templates-and-performance.md` (rendimiento). Los nombres de fichero
siguen `file-naming.md`.

Versión de referencia: **Angular 22** (signals-first, standalone por defecto, `OnPush` por defecto).

## 1. Principios rectores

- **Standalone por defecto.** Todo componente, directiva y pipe es standalone. **No** declares
  `standalone: true` (es el valor por defecto desde v20) ni crees `NgModule` de features.
- **Signals-first.** El estado se modela con signals; la reactividad fluye por el grafo de signals
  (ver `angular-components-and-signals.md`), no con estado mutable disperso.
- **Todo en inglés y sin comentarios.** Identificadores, ficheros y símbolos en inglés; el código
  es autoexplicativo (sin comentarios). El texto visible para el usuario se externaliza vía i18n,
  nunca se escribe en duro (ver `angular-forms-and-accessibility.md`).
- **Una responsabilidad por unidad.** Componentes pequeños y enfocados; servicios de dominio con
  una sola responsabilidad.

## 2. Organización por features (capas)

Organiza `src/app` por **feature**, no por tipo técnico. Separación de responsabilidades:

- **`core/`**: singletons transversales (interceptores, guards, configuración, servicios de
  sesión/tenant). Se cargan una vez.
- **`shared/`**: componentes, directivas y pipes standalone reutilizables y sin estado de negocio.
- **`features/<feature>/`**: cada feature agrupa sus `*.routes.ts`, componentes de página
  (contenedores) y de presentación, y sus servicios de dominio. Se **carga perezosamente**.
- **`layout/`**: shell de la aplicación (chrome, navegación).

Distingue **componentes contenedor** (orquestan datos y estado, hablan con servicios) de
**componentes de presentación** (reciben `input()` y emiten `output()`, sin dependencias de datos).

## 3. Lazy loading y routing

- **Rutas standalone** con `loadComponent` (componente) y `loadChildren` (grupo de rutas de una
  feature). El bundle inicial solo carga el shell y la primera vista.
- Cada feature expone un `*.routes.ts` que el router raíz importa perezosamente.
- Usa **guards funcionales** (`CanActivateFn` con `inject()`), no clases guard.
- Prefiere **input bindings de ruta** (`withComponentInputBinding`) para recibir parámetros como
  `input()` en lugar de leer `ActivatedRoute` manualmente cuando sea posible.

✅ Ruta raíz con carga perezosa por feature:

```typescript
export const appRoutes: Routes = [
  {
    path: 'booking',
    loadChildren: () => import('./features/booking/booking.routes').then((m) => m.bookingRoutes),
  },
  {
    path: 'admin',
    canMatch: [adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
];
```

❌ No uses `NgModule` con `RouterModule.forChild` ni guards basados en clase.

## 4. Inyección de dependencias

- Usa la función **`inject()`** siempre, nunca inyección por constructor.
- Servicios singleton de aplicación: usa el decorador **`@Service()`** (Angular 22), la forma
  ergonómica y recomendada, equivalente a `@Injectable({ providedIn: 'root' })`. Ambas son
  válidas; `@Injectable({ providedIn: 'root' })` sigue siendo correcta y es la que debes usar
  cuando necesites opciones explícitas (p. ej. `providedIn` no-root o `autoProvided: false` para
  servicios con ámbito de componente).
- Provee configuración con **`provide*` functions** en `app.config.ts`
  (`provideRouter`, `provideHttpClient(withInterceptors(...))`, `provideZonelessChangeDetection`,
  etc.), no con `NgModule`.

✅ Servicio singleton de dominio:

```typescript
@Service()
export class BookingStore {
  private readonly api = inject(BookingApi);
  readonly appointments = signal<Appointment[]>([]);
}
```

## 5. Gestión de estado

- **Estado local**: signals dentro del componente; estado derivado con `computed()`.
- **Estado compartido de feature**: un servicio *store* con `@Service()` que expone signals de solo
  lectura (`signal`/`computed`) y métodos de mutación (`set`/`update`, **nunca** `mutate`).
- **Datos del servidor**: no los guardes a mano; derívalos con la **Resource API**
  (`resource`/`httpResource`/`rxResource`), ver `angular-api-and-multitenancy.md`.
- No introduzcas una librería de estado externa salvo que un requisito lo justifique y se documente;
  el grafo de signals cubre el caso general.

## 6. Áreas de dominio del frontend

- **Backoffice de agenda (admin)**: vista de calendario con **FullCalendar.io** para que el
  profesional gestione citas. Encapsula FullCalendar en un componente de presentación con su
  configuración tipada; los datos entran por `input()` y las interacciones salen por `output()`.
  Carga la feature de forma perezosa y difiere el render pesado con `@defer` (ver
  `angular-templates-and-performance.md`).
- **Widget público de reserva**: **mobile-first**, la ruta pública que usa el cliente final para
  reservar. Prioriza el bundle mínimo, la accesibilidad (AXE/WCAG AA) y el rendimiento percibido
  (<200 ms en interacciones); difiere lo no crítico.

## 7. SSR / hydration (opcional)

- Si un requisito de SEO o de first paint lo justifica, activa **SSR con hydration incremental**
  (`provideClientHydration(withIncrementalHydration())`). Documenta la decisión.
- Con SSR: no asumas APIs de navegador (`window`, `document`, `new Date()` en plantilla) sin guardar
  la plataforma; usa `NgOptimizedImage` y difiere el trabajo cliente. Si no se justifica, mantén la
  app como SPA.
