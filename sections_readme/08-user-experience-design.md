[<- Volver al README principal](../readme.md)

## 8. Diseño y experiencia de usuario

Esta sección documenta **cómo se ha diseñado la experiencia**: los principios que la guían, los
puntos de entrada de cada rol, el sistema de diseño que unifica todas las pantallas y el recorrido
completo de las cuatro historias de usuario, con imágenes.

Para el **paso a paso operativo** dirigido a una persona sin conocimientos técnicos, ver
[`11-user-manual.md`](11-user-manual.md). Esta sección explica **por qué** la interfaz es como es;
el manual explica **cómo se usa**.

> **Sobre las imágenes.** Las que acompañan cada recorrido son **mockups** creados en la fase de
> diseño (fuentes `.drawio` versionadas junto a cada `.png`), no capturas de la aplicación en
> ejecución. Documentan la intención de diseño y los estados de cada pantalla. La aplicación
> desplegada tiene aplicado el sistema de diseño descrito en §8.3, que llegó después de estos
> mockups: los textos y la disposición coinciden, el acabado visual es más elaborado.

---

### 8.1. Principios de diseño

| Principio | Qué implica | Dónde se comprueba |
| :--- | :--- | :--- |
| **Mobile-first estricto** | Se diseña primero para móvil y se escala con `min-width`. Solo dos puntos de ruptura: `40rem` y `64rem` | `angular-templates-and-performance.md` §6 |
| **Accesibilidad AA** | Contraste mínimo AA, foco visible siempre, semántica antes que ARIA | `angular-forms-and-accessibility.md` §3 |
| **Sin fricción para el cliente final** | Reservar **no exige cuenta ni contraseña**: servicio → profesional → hora → datos de contacto | HU4 |
| **El texto no se escribe en duro** | Toda la interfaz pasa por i18n; hay español e inglés | `angular-forms-and-accessibility.md` §4 |
| **Estado siempre visible** | Cada operación asíncrona muestra carga, éxito o error; nada es mudo | §8.5 |
| **Rendimiento percibido** | Rutas perezosas por feature y presupuestos de bundle vigilados en cada build | `angular.json`: bundle inicial avisa a 500 kB y falla a 1 MB; estilos por componente avisan a 4 kB y fallan a 8 kB |

---

### 8.2. Puntos de entrada: quién ve qué y dónde

La aplicación es **multitenant por subdominio**, y eso define la experiencia antes incluso de la
primera pantalla: **la misma URL raíz muestra cosas distintas según el host**.

| Entras por | Ves | Para quién |
| :--- | :--- | :--- |
| `jpasoftware.com` | La **landing** de la plataforma | Alguien que aún no es cliente |
| `registro.jpasoftware.com` | El **formulario de alta** directamente en la raíz | Un negocio que va a darse de alta |
| `barberia-paco.jpasoftware.com` | **Redirige al login** del negocio | El dueño del negocio |
| `barberia-paco.jpasoftware.com/booking` | El **widget público de reserva** | El cliente final |
| `barberia-paco.jpasoftware.com/admin` | El **backoffice**, con su menú | El dueño, ya dentro |

Tres decisiones de experiencia detrás de esta tabla:

- **El alta tiene dominio propio** (`registro.`) en vez de una ruta dentro de un negocio, porque
  quien se da de alta **todavía no tiene subdominio**. Es la única página que vive fuera del espacio
  de un negocio.
- **La raíz de un negocio no muestra la landing.** Un dueño que escribe la dirección de su negocio
  quiere entrar a gestionarlo, no leer un argumentario de venta.
- **El widget público no cuelga del backoffice.** Vive en `/booking` del mismo subdominio, para que
  el dueño pueda compartir un enlace corto y reconocible con su nombre delante.

Para facilitar justo eso, el backoffice incluye un botón **"Copia y comparte tu página de reserva"**
junto al menú, que copia al portapapeles la URL pública del negocio.

---

### 8.3. Sistema de diseño

Todas las pantallas comparten un único lenguaje visual, extraído de la landing y documentado en la
skill [`angular-ui-design-system`](../.claude/skills/angular-ui-design-system/SKILL.md).

- **Tokens** (`code/frontend/src/styles.scss`): color de marca, superficies, texto, espaciado,
  radios, sombra y foco. **Cero colores en duro** en las hojas de estilo de componente.
- **Modo oscuro automático**: el bloque `prefers-color-scheme: dark` redefine esos mismos tokens, y
  `color-scheme: light dark` hace que también los controles nativos sigan el tema.
- **Primitivas compartidas** (`src/styles/`): `buttons`, `chips`, `titles`, `options`, `notices` y
  `forms`. Cada componente importa solo las que usa.
- **Tipografía**: títulos con `clamp()` para escalar con la pantalla; texto secundario siempre en
  el token atenuado.

Detalle relevante para la accesibilidad: **los estados visuales se pintan desde el atributo
accesible**, no desde una clase paralela. La opción elegida en el widget se resalta con
`[aria-pressed='true']` y la sección activa del menú con `[aria-current='page']`. Así el aspecto y
lo que anuncia un lector de pantalla **no pueden desincronizarse**.

---

### 8.4. Recorridos de usuario

#### A. El dueño del negocio

**1 · Descubrimiento y alta (HU1).** El formulario pide tres datos y comprueba el subdominio
mientras se escribe, para que el rechazo no llegue al final.

| Formulario | Comprobación en vivo | Alta correcta | Subdominio ocupado |
| :--- | :--- | :--- | :--- |
| ![Formulario de alta](../system_architecture/user_stories_view/hu1/01-data-entry-form.png) | ![Comprobando el subdominio](../system_architecture/user_stories_view/hu1/02-validating-subdomain.png) | ![Negocio creado](../system_architecture/user_stories_view/hu1/03-tenant-created.png) | ![Registro rechazado](../system_architecture/user_stories_view/hu1/04-registration-rejected.png) |

El botón de crear permanece **deshabilitado** hasta que los tres campos son válidos y el subdominio
está libre: se evita el error en vez de reportarlo. Los nombres reservados de la plataforma
(`registro`, `www`, `api`, `admin`, `app`) se informan como ocupados.

**2 · Configurar horarios (HU2).** Una fila por día; al marcar un día se despliegan sus horas.

| Panel de horarios | Definiendo una jornada | Guardado |
| :--- | :--- | :--- |
| ![Panel de horarios](../system_architecture/user_stories_view/hu2/01-schedule-panel.png) | ![Definiendo la jornada](../system_architecture/user_stories_view/hu2/02-defining-workday.png) | ![Horario guardado](../system_architecture/user_stories_view/hu2/03-rules-saved.png) |

El descanso es **opcional**, y las validaciones son de dominio, no de formato: el cierre debe ser
posterior a la apertura y el descanso debe caer dentro de la jornada.

**3 · Servicios y equipo (HU3).** La pantalla une las dos mitades del catálogo porque **solo tiene
sentido leerlas juntas**: un servicio sin nadie que lo realice no se puede reservar.

| Catálogo vacío | Servicio creado | Empleado creado | Servicio asignado | Servicio con citas |
| :--- | :--- | :--- | :--- | :--- |
| ![Catálogo vacío](../system_architecture/user_stories_view/hu3/01-catalog-panel.png) | ![Servicio creado](../system_architecture/user_stories_view/hu3/02-service-created.png) | ![Empleado creado](../system_architecture/user_stories_view/hu3/03-employee-created.png) | ![Servicio asignado](../system_architecture/user_stories_view/hu3/04-service-assigned.png) | ![Servicio conservado](../system_architecture/user_stories_view/hu3/05-deletion-blocked.png) |

Un servicio **nunca se borra**: se desactiva. Desaparece del catálogo público pero **las citas
existentes se conservan**, de modo que el histórico del negocio no se puede destruir por accidente.

**4 · Moverse por el backoffice.** Las dos secciones comparten un shell con menú, de modo que
cambiar de una a otra es un clic y la sección activa está siempre indicada.

#### B. El cliente final (HU4)

Asistente de tres pasos, pensado para el móvil y **sin registro**.

| 1 · Servicio y profesional | 2 · Buscando huecos | 3 · Eligiendo hora |
| :--- | :--- | :--- |
| ![Eligiendo servicio](../system_architecture/user_stories_view/hu4/01-selecting-service.png) | ![Buscando disponibilidad](../system_architecture/user_stories_view/hu4/02-checking-availability.png) | ![Huecos disponibles](../system_architecture/user_stories_view/hu4/03-selecting-slot.png) |

| 4 · Datos de contacto | 5 · Reserva registrada | Conflicto: hueco recién ocupado |
| :--- | :--- | :--- |
| ![Rellenando datos](../system_architecture/user_stories_view/hu4/04-filling-data.png) | ![Reserva pendiente](../system_architecture/user_stories_view/hu4/05-slot-pending.png) | ![Hueco no disponible](../system_architecture/user_stories_view/hu4/06-slot-unavailable.png) |

Dos detalles de experiencia que resuelven problemas reales:

- **Solo aparecen los profesionales que realizan el servicio elegido**, así que no existe la
  combinación imposible.
- **Si otra persona coge la hora un segundo antes**, el sistema lo dice con claridad y **devuelve al
  usuario a la lista de huecos, no al principio**. El error de concurrencia (409 en el API) se
  traduce en una acción recuperable, no en un callejón sin salida.

---

### 8.5. Estados de interfaz

Toda operación asíncrona expone sus cuatro estados, con la primitiva `notice` y regiones vivas:

| Estado | Tratamiento | Anuncio a lectores de pantalla |
| :--- | :--- | :--- |
| **Carga** | Mensaje propio ("Cargando…") | `role="status"` + `aria-busy="true"` |
| **Vacío** | Texto que explica **qué hacer**, no solo que no hay nada | `role="status"` |
| **Error** | Aviso en color de peligro con acción sugerida | `role="alert"` + `aria-live="assertive"` |
| **Éxito** | Confirmación explícita | `role="status"` + `aria-live="polite"` |

Ejemplo del criterio: cuando no hay huecos, el widget no dice "0 resultados" sino *"No hay horas
disponibles: prueba otra fecha u otro profesional"*, que es la acción que resuelve la situación.

---

### 8.6. Accesibilidad

Compromiso del proyecto: **AXE sin fallos y WCAG AA**.

- **Formularios**: todo control tiene `<label>` asociado; el error se enlaza con `aria-describedby`
  y el control se marca con `aria-invalid`.
- **Foco**: anillo de foco global visible en toda la aplicación, definido una sola vez en la capa
  base.
- **Landmarks y encabezados**: `main`, `nav` con nombre accesible, un único `h1` por página.
- **Iconografía**: los SVG decorativos van con `aria-hidden="true"`; ninguno transmite información
  por sí solo.
- **Color**: nunca es el único portador de significado — el estado seleccionado también lo indican
  `aria-pressed` y `aria-current`.

Los tests de frontend incluyen comprobaciones de estas propiedades (nombres accesibles, `aria-*`,
regiones vivas), de forma que una regresión de accesibilidad **rompe la build**, no se descubre en
producción.

---

### 8.7. Internacionalización

La interfaz está en **español** (por defecto) e **inglés**. El selector de idioma vive **solo en la
landing**: el resto de pantallas se sirven en el idioma de la build correspondiente (`/` en español,
`/en/` en inglés), sin conmutador propio.
Ningún texto visible está escrito en duro: cada cadena tiene un identificador `i18n` estable y su
traducción vive en `code/frontend/src/locale/messages.es.xlf`. Las fechas y horas se muestran con
los pipes de localización.

---

### 8.8. Wireframes de referencia

Bocetos de la fase de diseño, previos a los mockups de detalle:

| Alta de negocio | Configuración de horarios | Catálogo | Widget de reserva |
| :--- | :--- | :--- | :--- |
| ![Wireframe HU1](../system_architecture/user_stories_view/wireframe_hu1-tenant-registration.png) | ![Wireframe HU2](../system_architecture/user_stories_view/wireframe_hu2-schedule-configuration.png) | ![Wireframe HU3](../system_architecture/user_stories_view/wireframe_hu3-catalog-management.png) | ![Wireframe HU4](../system_architecture/user_stories_view/wireframe_hu4-public-booking.png) |

---

### 8.9. Limitaciones conocidas de la experiencia actual

Honestidad sobre el estado real, para no vender lo que aún no hay:

- **La autenticación no está implementada.** La pantalla de login valida el formulario y entra: no
  hay sesión, ni token, ni protección real del backoffice, al que se llega escribiendo la URL. Por
  eso los botones de *Log in* de la landing aparecen **deshabilitados**.
- **La raíz de un negocio lleva siempre al login.** La variante "si ya está logueado, ir
  directamente a la agenda" queda pendiente de que exista sesión.
- **La reserva queda en estado *pendiente***: el hueco se aparta a nombre del cliente a la espera de
  verificación. La verificación por OTP está diseñada pero no implementada.
- **El calendario del backoffice (FullCalendar)** está previsto en la arquitectura; la gestión
  actual de la agenda es la configuración de horarios.
- **El cambio de idioma solo se ofrece en la landing** (ver §8.7); dentro del backoffice y del
  widget no hay conmutador.

---

[<- Volver al README principal](../readme.md)
