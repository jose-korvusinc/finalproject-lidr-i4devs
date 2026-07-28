# Regla: Acceso a la API y multitenancy en el frontend Angular 22

Esta regla define **cómo el frontend consume la API REST de NestJS** y cómo se propaga el **tenant**
en el cliente. El frontend **no** accede a MongoDB ni contiene lógica de negocio del backend; solo
consume endpoints. Alinea con la regla de servidor `mongodb-multitenancy.md` (el `tenantId` real lo
resuelve y valida siempre el backend). Trabaja con `angular-architecture.md`.

## 1. HttpClient y datos del servidor

- Configura **`provideHttpClient(withInterceptors([...]))`** en `app.config.ts`. No uses
  `HttpClientModule`.
- Prefiere la **Resource API** para datos del servidor dentro del grafo de signals (estable en v22):
  - **`httpResource`**: lectura declarativa reactiva ligada a signals (recarga al cambiar sus
    dependencias); ideal para GET dependientes de parámetros (fecha, servicio, empleado).
  - **`rxResource`**: cuando necesites componer con RxJS.
  - **`resource`**: async genérico.
- Para **escrituras** (crear/cancelar reserva) usa `HttpClient` (o la Submission API cuando aplique
  a un formulario, ver `angular-forms-and-accessibility.md`) y refresca el resource afectado.
- Encapsula el acceso en **servicios de API por feature** (`*.api.ts`) que devuelven tipos del
  dominio; los componentes no llaman a `HttpClient` directamente.

✅ Lectura reactiva de disponibilidad:

```typescript
@Service()
export class AvailabilityApi {
  private readonly baseUrl = '/api/availability';
  readonly filters = signal<AvailabilityQuery | null>(null);

  readonly availability = httpResource<TimeSlot[]>(() => {
    const query = this.filters();
    return query ? { url: this.baseUrl, params: { ...query } } : undefined;
  });
}
```

## 2. Interceptor multitenant

- El **tenant se resuelve desde el subdominio** en el cliente y se envía en **cada** petición como
  cabecera (p. ej. `X-Tenant`), mediante un **interceptor funcional** registrado en `core/`. El
  backend valida y no confía en el cliente: la cabecera es contexto, no autoridad.
- **Nunca** metas el tenant en el cuerpo de la petición ni lo pidas al usuario; se deriva del host.
- El mismo interceptor (o uno encadenado) añade el token de auth y normaliza errores.

✅ Interceptor de tenant por subdominio:

```typescript
export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const tenant = inject(TenantContext).slug();
  return tenant ? next(req.clone({ setHeaders: { 'X-Tenant': tenant } })) : next(req);
};
```

```typescript
@Service()
export class TenantContext {
  readonly slug = signal<string | null>(this.resolveFromHost());
  private resolveFromHost(): string | null {
    const [sub] = window.location.hostname.split('.');
    return sub && sub !== 'www' ? sub : null;
  }
}
```

## 3. Manejo de errores y estados

- Centraliza el mapeo de errores HTTP en un interceptor: traduce a mensajes de usuario vía i18n (no
  vuelques mensajes crudos del backend en la UI).
- Aprovecha los estados del resource (`isLoading()`, `error()`, `value()`) para renderizar carga,
  error y vacío; no dupliques flags de estado manuales.
- No expongas identificadores internos ni el `tenantId` en la UI más de lo necesario.

## 4. Seguridad del cliente

- Toda entrada del backend que se pinte como HTML pasa por el sanitizado de Angular; nunca uses
  `bypassSecurityTrust*` con datos no confiables (ver `angular-testing-and-quality.md`).
- No guardes secretos en el cliente; el frontend solo maneja tokens de sesión según el flujo de
  auth definido.
