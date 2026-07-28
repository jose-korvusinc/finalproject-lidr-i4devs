# Product Requirement Document (PRD)
## Proyecto: Sistema SaaS Multitenant de Gestión de Reservas y Citas (MVP)

---

## 1. Objetivos del Producto

### 1.1 Visión del Producto
Convertirse en la solución de agendamiento en la nube más ágil y con menor fricción para microempresas y profesionales independientes, permitiéndoles digitalizar su agenda en minutos, protegerse del spam y centralizar su operativa en una única infraestructura compartida.

### 1.2 Objetivos de Negocio (OKR Clave)
* **Time-to-Market:** Desplegar un MVP completamente funcional en un plazo máximo de [X] meses utilizando flujos de desarrollo asistidos por IA.
* **Adopción Temprana:** Alcanzar los primeros 100 *Tenants* (negocios) activos en los primeros 90 días post-lanzamiento.
* **Retención:** Mantener una tasa de abandono (*Churn Rate*) inferior al 5% mensual durante el primer año mediante una UX ultra-simplificada.

---

## 2. Stakeholders (Partes Interesadas)

* **Super-Admin (Propietario del SaaS):** Requiere visibilidad global del ecosistema, métricas de uso agregado y herramientas de control/suspensión de cuentas.
* **Tenant Admin (Dueño del Negocio / Cliente B2B):** Requiere un panel autogestionable para configurar su negocio, empleados y servicios, además de una agenda visual interactiva.
* **Empleado / Staff:** Requiere acceso rápido a su agenda diaria y sincronización con sus herramientas personales (Google Calendar).
* **Cliente Final (Usuario B2C):** Requiere un widget web móvil-primero, rápido, intuitivo y que no le obligue a crear un usuario con contraseña para reservar.

---

## 3. Historias de Usuario (User Stories) y Criterios de Aceptación

### Épica 1: Onboarding y Configuración (Tenant / Dueño de Negocio)

#### HU1: Registro de Negocio y Creación de Espacio Aislado (Tenant)
* **Como** emprendedor o dueño de un negocio,
* **quiero** registrarme en la plataforma y definir un subdominio único,
* **para** tener mi propio portal de reservas personalizado e independiente de otros comercios.
* **Criterios de Aceptación:**
    * *Dado* que un usuario no registrado rellena el formulario de alta con los datos de su negocio (Nombre, Email, Subdominio deseado).
    * *Cuando* el subdominio está disponible y se procesa el alta.
    * *Entonces* el sistema crea la estructura aislada de datos (Tenant), asigna un `tenant_id` único y permite acceder a la URL dinámica `mi-negocio.tuplataforma.com`.

#### HU2: Configuración de la Agenda y Horarios Laborales
* **Como** administrador de mi negocio en la plataforma,
* **quiero** configurar los días laborales, horarios de apertura/cierre y turnos de descanso,
* **para** establecer los límites de disponibilidad en los que mis clientes pueden reservar.
* **Criterios de Aceptación:**
    * *Dado* que estoy en el panel de configuración de horarios del Tenant.
    * *Cuando* defino rangos horarios (ej. Lunes a Viernes de 09:00 a 18:00 con descanso de 14:00 a 15:00).
    * *Entonces* el backend persiste estas reglas asociadas al `tenant_id` y el motor de disponibilidad restringe los huecos públicos fuera de estos límites.

#### HU3: Gestión del Catálogo de Servicios y Empleados
* **Como** administrador de mi negocio,
* **quiero** dar de alta mis servicios (precio y duración) y asignar qué empleados pueden realizarlos,
* **para** que la oferta de mi portal sea clara y esté organizada.
* **Criterios de Aceptación:**
    * *Dado* que registro el servicio "Fisioterapia" (Duración: 60 min) y lo vinculo al Empleado A.
    * *Cuando* el cliente final consulte el widget de ese Tenant específico.
    * *Entonces* el sistema solo mostrará opciones de cita cruzando la agenda del Empleado A con la duración del servicio seleccionado.

### Épica 2: Flujo del Cliente Final (El que hace la reserva)

#### HU4: Reserva Pública de Citas sin Registro (Widget de Reserva)
* **Como** cliente final de un negocio,
* **quiero** acceder a su portal web público, elegir un servicio, un empleado y una fecha/hora disponible,
* **para** agendar una cita de manera rápida y sin tener que crearme una cuenta con contraseña.
* **Criterios de Aceptación:**
    * *Dado* que navego en `clinica-alfa.tuplataforma.com/reservar`.
    * *Cuando* selecciono los parámetros y relleno mis datos básicos (Nombre, Email, Teléfono).
    * *Entonces* el sistema bloquea temporalmente el slot de tiempo en estado "Pendiente" y activa el flujo de verificación.

#### HU5: Verificación de Reserva mediante Código OTP (Anti-Spam)
* **Como** administrador del sistema,
* **quiero** que los clientes verifiquen su identidad introduciendo un código único enviado a su correo antes de confirmar la cita,
* **para** evitar reservas falsas (spam) que bloqueen las agendas de los negocios.
* **Criterios de Aceptación:**
    * *Dado* que el cliente pulsa en "Solicitar Reserva".
    * *Cuando* el sistema genera un token de 6 dígitos con un tiempo de vida (TTL) de 5 minutos y lo envía vía email.
    * *Entonces* la cita cambia a estado "Confirmada" si el código introducido es correcto. Si el tiempo expira, el slot se libera automáticamente.

### Épica 3: Gestión Interna y Panel de Control (Backoffice)

#### HU6: Dashboard con Calendario Interactivo (Drag & Drop)
* **Como** dueño de negocio o empleado,
* **quiero** ver todas las citas programadas en un calendario visual y poder moverlas arrastrándolas con el ratón,
* **para** reorganizar el día de forma ágil ante cualquier imprevisto.
* **Criterios de Aceptación:**
    * *Dado* que visualizo el calendario en la vista semanal del panel.
    * *Cuando* arrastro una cita existente a una nueva hora.
    * *Entonces* el backend intercepta el evento, valida que el nuevo slot esté libre para ese empleado y actualiza el registro emitiendo una notificación visual de éxito.

#### HU7: Sincronización Externa con Google Calendar
* **Como** empleado o dueño del negocio,
* **quiero** que las citas confirmadas en la plataforma se sincronicen automáticamente con mi Google Calendar personal,
* **para** no solapar compromisos personales con citas de trabajo.
* **Criterios de Aceptación:**
    * *Dado* que el empleado ha completado el flujo de autenticación OAuth2 con Google.
    * *Cuando* una cita que le corresponde pasa al estado "Confirmada".
    * *Entonces* el sistema inyecta en background un evento en su calendario externo mediante la API de Google de forma asíncrona.

### Épica 4: Notificaciones y Automatización

#### HU8: Recordatorios Automáticos de Citas (Email)
* **Como** administrador del negocio,
* **quiero** que el sistema envíe un recordatorio automático al cliente 24 horas antes de su cita,
* **para** reducir al mínimo el número de clientes que no se presentan (*no-shows*).
* **Criterios de Aceptación:**
    * *Dado* un proceso planificado (*cron job*) que se ejecuta cada hora en el servidor.
    * *Cuando* identifica citas confirmadas cuyo timestamp esté exactamente a 24 horas de ocurrir.
    * *Entonces* dispara una plantilla de email personalizada con los datos de la cita y la opción de cancelarla.

### Épica 5: Administración Global (Super-Admin)

#### HU9: Panel de Control Global y Gestión de Planes
* **Como** propietario de la plataforma de reservas (Super-Admin),
* **quiero** tener un panel general para ver las métricas de todos los negocios registrados y poder activar o suspender sus cuentas,
* **para** monetizar y controlar el uso del software que he desarrollado.
* **Criterios de Aceptación:**
    * *Dado* que inicio sesión con credenciales de nivel Super-Admin.
    * *Cuando* accedo a la consola centralizada de administración.
    * *Entonces* puedo visualizar el listado completo de Tenants, filtrar por volumen de uso y cambiar el estado del Tenant a "Suspendido" (lo que bloqueará el acceso a sus paneles y widgets de inmediato).

---

## 4. Requisitos Técnicos y de Arquitectura

### 4.1 Infraestructura y Aislamiento (Multitenancy)
* **Nivel de base de datos:** Enfoque de *Shared Database, Shared Collection*. Cada documento del sistema (excepto los globales del Super-Admin) debe contener el campo `tenant_id` indexado.
* **Capa de Middleware:** Todo *endpoint* expuesto en el API (a excepción del widget público que lee por subdominio) debe pasar por un middleware de autenticación y resolución de contexto que inyecte de forma mandatoria el `tenant_id` en las consultas a la base de datos (evitando inyecciones y fugas de información entre clientes).
* **DNS Dinámico:** El servidor web/proxy inverso (ej. Nginx o configuraciones Cloud) debe aceptar enrutamiento *Wildcard* (`*.tuplataforma.com`) para mapear dinámicamente los subdominios al servidor de aplicaciones.

### 4.2 Stack Tecnológico Sugerido (Optimizado para desarrollo asistido por IA)
* **Backend:** Node.js con **NestJS 11** (v11.1.x). Aporta tipado estático (TypeScript) y documentación automática con OpenAPI, lo cual facilita enormemente que herramientas de IA generen código robusto sin ambigüedades.
* **Base de Datos:** **MongoDB 8.3** por su flexibilidad de esquema documental, su escalabilidad horizontal y su excelente manejo de índices para consultas multitenant.
* **Caché y Temporales:** Redis para almacenar los códigos OTP de la HU5 y manejar la expiración (TTL) nativa del bloqueo temporal de huecos.
* **Frontend:** **Angular 22**, utilizando bibliotecas como `FullCalendar.io` para agilizar la maquetación del Drag & Drop.

---

## 5. Métricas de Éxito (KPIs de Producto)

### 5.1 Métricas Técnicas y de Sistema
* **Uptime del Sistema:** $>99.9\%$ de disponibilidad mensual.
* **Rendimiento de Consultas de Disponibilidad:** El algoritmo de cálculo de huecos libres en el widget debe responder en menos de **200ms**, incluso bajo condiciones de alta concurrencia.
* **Tasa de Fuga de Datos:** 0 eventos de acceso a datos inter-tenant.

### 5.2 Métricas de Producto (Engagement)
* **Conversión del Widget:** Porcentaje de usuarios que entran al widget público y terminan completando el flujo OTP de reserva.
* **Reducción del No-Show:** Medir la caída porcentual de citas no presentadas en los comercios tras la activación de la HU8 (Recordatorios).
* **Net Promoter Score (NPS):** Mantener una puntuación superior a 40 entre los Tenant Admins a los 6 meses de uso.

---

## 6. Riesgos Potenciales y Mitigación

| Riesgo Detectado | Impacto | Mitigación Propuesta |
| :--- | :--- | :--- |
| **Fuga de datos (Inter-tenant data leak)** | Crítico | Implementar pruebas unitarias y de integración automatizadas (generadas con IA) que simulen peticiones cruzadas y fuercen al ORM a fallar si falta el parámetro `tenant_id`. |
| **Lógica defectuosa generada por IA** | Alto | El rol del alumno/ingeniero se centrará en la revisión manual exhaustiva de código, la arquitectura y la aprobación de Pull Requests. Ningún código generado por la IA va a producción sin pasar *Code Review*. |
| **Abuso del sistema OTP (Costes o Bloqueos)** | Medio | Implementar *Rate Limiting* en la generación de OTPs por dirección IP y por número/correo para evitar que atacantes maliciosos bloqueen intencionadamente slots legítimos de la agenda. |
| **Desconexión de Google Calendar API** | Bajo | Manejo resiliente de excepciones en el backend. Si la API de Google falla o expira el token del empleado, la cita se guarda localmente en nuestra plataforma y se encola un reintento (*Retry Queue*) para no romper la experiencia del usuario final. |
