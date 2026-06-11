[<- Volver al README principal](../readme.md)

## 3. Arquitectura del Sistema

### **3.1. Tecnologías:**

Este stack combina un frontend robusto, un backend modular y una base de datos documental orientada a escalar un SaaS multitenant. Sus principales beneficios son la rapidez de desarrollo, el tipado con TypeScript, la generación de contratos claros mediante OpenAPI y la flexibilidad para modelar datos de negocios distintos sin esquemas rígidos. Como contrapartida, Angular y NestJS añaden cierta complejidad inicial por su estructura y convenciones, mientras que MongoDB exige un diseño cuidadoso de índices, validaciones y aislamiento por `tenant_id` para evitar inconsistencias o fugas de datos entre tenants.

| Capa | Tecnología | Versión | Justificación |
| :--- | :--- | :--- | :--- |
| Frontend | Angular | 22 | Framework frontend principal para construir el panel de gestión y el widget público, con apoyo de librerías como `FullCalendar.io` para la agenda interactiva. |
| Backend | Node.js + NestJS | NestJS 11.1.x | Backend tipado con TypeScript, estructura modular y generación de documentación OpenAPI, adecuado para acelerar el desarrollo asistido por IA. |
| Base de datos | MongoDB | 8.3 | Base documental flexible, escalable horizontalmente y adecuada para consultas multitenant mediante índices como `tenant_id`. |

### **3.2. Diagramas C4**

#### C1 - Contexto del sistema

![Diagrama C4 C1 - Contexto del sistema](../system_architecture/design_view/c1_system_context.png)

#### C2 - Contenedores

![Diagrama C4 C2 - Contenedores](../system_architecture/design_view/c2_containers.png)

#### C3 - Componentes del API

![Diagrama C4 C3 - Componentes del API](../system_architecture/design_view/c3_components_api.png)

### **3.3. Componentes principales**

A continuación se describen los componentes principales del sistema, agrupados según los tres niveles del modelo C4.

#### Actores y sistemas externos (C1)

- **Super-Admin**: propietario del SaaS. Supervisa las métricas globales del ecosistema y activa o suspende las cuentas de los negocios (tenants). Interactúa con la plataforma vía HTTPS.
- **Tenant Admin / Business Owner**: dueño del negocio. Configura su negocio, los horarios laborales (`WorkingHours`), el catálogo de servicios (`Service`) y los empleados (`Employee`), y gestiona la agenda. Acceso vía HTTPS al backoffice.
- **Employee / Staff**: personal que atiende las citas. Consulta y reorganiza su agenda diaria (drag & drop) y puede sincronizar sus citas con su calendario externo.
- **Final Customer**: cliente final que reserva una cita (`Appointment`) desde el widget público, sin necesidad de registro, y verifica su identidad mediante un código OTP.
- **Google Calendar** *(externo)*: calendario personal del empleado donde se inyectan las citas confirmadas mediante la Google Calendar API.
- **Email Provider** *(externo)*: servicio de correo usado para el envío de códigos OTP y de recordatorios de citas.

#### Contenedores (C2)

- **Reverse Proxy** *(Nginx)*: punto de entrada del sistema. Acepta enrutamiento wildcard (`*.tuplataforma.com`), resuelve el subdominio del tenant, sirve los recursos estáticos de la SPA y proxia las llamadas al API. Es la pieza que habilita el acceso público por subdominio.
- **Web Application** *(Angular 22, FullCalendar.io)*: SPA única que ofrece tanto el backoffice (panel de administración/empleado con calendario interactivo) como el widget público de reservas. Consume el API vía JSON/HTTPS.
- **API Application** *(NestJS 11, TypeScript, OpenAPI)*: núcleo de la lógica de negocio. Gestiona reservas, cálculo de disponibilidad, verificación OTP, notificaciones y la resolución de contexto multitenant. Expone una API REST documentada con OpenAPI.
- **Operational Database** *(MongoDB 8.3)*: base de datos documental con enfoque *Shared Database/Collection*. Persiste negocios, servicios, empleados, horarios y citas, con el campo `tenant_id` indexado para garantizar el aislamiento de datos entre tenants.
- **Cache & Temporal Store** *(Redis)*: almacén temporal que guarda los códigos OTP con su TTL y gestiona el bloqueo temporal de huecos (`SlotLocking`) durante el flujo de verificación de reserva.

#### Componentes internos clave de la API (C3)

- **Tenant Resolution & Auth Middleware**: autentica las peticiones y resuelve el contexto del tenant, inyectando de forma mandatoria el `tenant_id` en todas las consultas. Es la defensa central frente a la fuga de datos inter-tenant.
- **Business Management Module**: alta y configuración del negocio (tenant), subdominio y datos generales. Persiste a través de la capa de persistencia.
- **Working Hours Module**: configuración de días laborales, horarios de apertura/cierre y descansos, que acotan la disponibilidad pública.
- **Service & Employee Catalog Module**: gestión de los servicios (precio y duración) y de los empleados cualificados para realizarlos.
- **Availability Engine**: calcula los huecos libres (`TimeSlot`) cruzando los horarios laborales, la duración del servicio y la agenda del empleado, con un objetivo de respuesta inferior a 200 ms.
- **Booking / Appointment Module**: crea, mueve (drag & drop) y cancela citas, y gestiona sus estados (`Pending` / `Confirmed` / `Cancelled`). Orquesta la verificación OTP, los recordatorios y la sincronización de calendario.
- **OTP Verification Module**: genera y valida los códigos OTP de un solo uso apoyándose en Redis (TTL), y aplica rate limiting para evitar el abuso anti-spam.
- **Notification & Reminder Module**: job planificado (cron horario) que dispara los recordatorios por email 24 horas antes de cada cita confirmada, reduciendo los *no-shows*.
- **Calendar Sync Module**: gestiona la autenticación OAuth2 con Google e inyecta de forma asíncrona los eventos de las citas confirmadas en el calendario externo, con una cola de reintentos (`RetryQueue`) ante fallos de la API.
- **Platform Admin Module**: da soporte a la consola del Super-Admin con las métricas globales, la gestión de planes y la suspensión de tenants.
- **Persistence Layer** *(Mongoose Repositories)*: capa de acceso a datos que fuerza el filtrado por `tenant_id` en cada operación contra MongoDB.

### **3.4. Estructura de ficheros**

> Representa la estructura del proyecto y explica brevemente el propósito de las carpetas principales, así como si obedece a algún patrón o arquitectura específica.

### **3.5. Infraestructura y despliegue**

> Detalla la infraestructura del proyecto, incluyendo un diagrama en el formato que creas conveniente, y explica el proceso de despliegue que se sigue

### **3.6. Seguridad**

> Enumera y describe las prácticas de seguridad principales que se han implementado en el proyecto, añadiendo ejemplos si procede

### **3.7. Tests**

> Describe brevemente algunos de los tests realizados
