[<- Volver al README principal](../readme.md)

## 11. Manual de usuario

> Este manual está pensado para **cualquier persona**, tenga o no conocimientos de informática.
> No hace falta saber nada técnico: solo seguir los pasos y las imágenes. Si algo no te sale a la
> primera, al final tienes una sección de **"¿Y si algo va mal?"** que resuelve las dudas más
> comunes.

---

### 11.1. ¿Qué es esta aplicación y para quién es?

Imagina que tienes un negocio pequeño donde la gente pide cita: una **barbería**, una **peluquería**,
una **clínica**, un **centro de estética**, una **consultoría**… Esta plataforma te da tu propia
**página de reservas por internet**, para que tus clientes reserven ellos mismos, desde el móvil, a
cualquier hora, sin tener que llamarte por teléfono.

Hay **dos tipos de personas** que usan la aplicación, y cada una tiene su propia parte:

| Quién eres | Qué haces | Tu parte de la app |
| :--- | :--- | :--- |
| 🧑‍💼 **El dueño del negocio** (o quien lo gestiona) | Das de alta tu negocio, pones tus horarios, tus servicios y tu equipo | El **panel de administración** (el "backoffice") |
| 🙋 **El cliente** que quiere una cita | Eliges servicio, profesional, día y hora, y dejas tus datos | La **página pública de reservas** (el "widget") |

En este manual verás **las dos partes**, en orden: primero cómo preparar tu negocio (secciones 11.3
a 11.5) y luego cómo reserva un cliente (sección 11.6).

---

### 11.2. Lo primero: cómo se entra a cada sitio

Cada negocio tiene su **propia dirección web** con su nombre delante. Por ejemplo, si tu barbería se
llama *Barbería Paco*, tu dirección será algo como:

```
barberia-paco.yourplatform.com
```

Ese nombre de delante (`barberia-paco`) se llama **subdominio**, y es tu "dirección" única en la
plataforma: es lo que hace que **tus datos sean solo tuyos** y no se mezclen con los de ningún otro
negocio.

Dentro de esa dirección, cada pantalla tiene su propia página:

| Para qué sirve | A dónde vas | Quién la usa |
| :--- | :--- | :--- |
| Registrar un negocio nuevo | `/register` | El dueño (la primera vez) |
| Configurar horarios | `/admin/schedule` | El dueño |
| Servicios y equipo | `/admin/catalog` | El dueño |
| Reservar una cita | `/booking` | El cliente final |

> 💡 **Nota práctica:** en un ordenador de pruebas la aplicación se abre en `http://localhost:4200`
> y detrás funciona un servidor en `http://localhost:3000`. En el uso real, cada negocio entra por su
> subdominio (`tunegocio.yourplatform.com`). Añadiendo al final la página que quieras (por ejemplo
> `/admin/schedule`) llegas a cada apartado.

---

## PARTE A — Para el dueño del negocio

### 11.3. HU1 · Dar de alta tu negocio

Es el **primer paso de todos**. Aquí creas tu espacio en la plataforma. Solo se hace **una vez**.

**Cómo llegar:** entra en la página `/register`.

**Verás un formulario con tres casillas para rellenar:**

![Formulario de registro vacío](../system_architecture/user_stories_view/hu1/01-data-entry-form.png)

1. **Nombre del negocio** *(Business name)* — cómo se llama tu negocio. Por ejemplo: *Barbería Paco*.
2. **Correo del negocio** *(Corporate email)* — tu email. Tiene que ser un email de verdad, con su
   arroba (por ejemplo `paco@barberia-paco.com`).
3. **Subdominio** *(Subdomain)* — el nombre corto que quieres para tu dirección web. A su derecha
   verás fijo el texto `.yourplatform.com`, así que tú solo escribes la parte de delante.
   - Usa **minúsculas, números y guiones**. Nada de espacios, mayúsculas ni acentos. Por ejemplo:
     `barberia-paco` ✅ (no `Barbería Paco` ❌).

**Mientras escribes el subdominio, la app lo comprueba sola** y te avisa debajo de la casilla:

![Comprobando la disponibilidad del subdominio](../system_architecture/user_stories_view/hu1/02-validating-subdomain.png)

- *"Checking availability…"* → está mirando si está libre (espera un segundo).
- *"This subdomain is available"* → ✅ **¡Libre!** Puedes usarlo.
- *"This subdomain is already taken"* → ❌ Ese nombre ya lo tiene otro negocio; elige otro.

Cuando las tres casillas estén bien rellenas, pulsa el botón **"Create"** (Crear). Si algo falta o
está mal, el botón aparece **apagado** y no te deja seguir hasta que lo corrijas.

**Si todo va bien**, la pantalla cambia y te da la bienvenida:

![Negocio creado, portal listo](../system_architecture/user_stories_view/hu1/03-tenant-created.png)

Verás el mensaje *"Your workspace is ready"* (Tu espacio está listo) y un **enlace a tu portal**.
¡Ya tienes tu negocio dado de alta! A partir de aquí ya puedes configurar tus horarios y servicios.

**Si el subdominio ya estaba pillado** justo al pulsar Crear, te lo dice y no crea nada a medias:

![Registro rechazado por subdominio ocupado](../system_architecture/user_stories_view/hu1/04-registration-rejected.png)

> Solo tienes que cambiar el subdominio por otro que esté libre y volver a pulsar *Create*.

---

### 11.4. HU2 · Configurar tus horarios

Aquí le dices a la plataforma **qué días abres y a qué horas**. Esto es importante porque el sistema
**solo ofrecerá citas dentro de tu horario**: si cierras los domingos, ningún cliente podrá reservar
un domingo.

**Cómo llegar:** entra en `/admin/schedule`.

Al entrar, la app carga tu horario actual. Si es la primera vez, verás todos los días sin marcar:

![Panel de horarios](../system_architecture/user_stories_view/hu2/01-schedule-panel.png)

**Verás una fila por cada día de la semana**, de lunes a domingo. Cada día funciona así:

![Definiendo la jornada de un día](../system_architecture/user_stories_view/hu2/02-defining-workday.png)

1. **La casilla del día** (checkbox): márcala si ese día **trabajas**. Si la dejas sin marcar, ese
   día está cerrado y no aparecerán citas.
2. **Cuando marcas un día**, se abren cuatro horas para rellenar (en formato de 24 horas, por ejemplo
   `09:00` o `18:30`):
   - **Hora de apertura** *(Open time)* — a qué hora empiezas. Ej.: `09:00`.
   - **Hora de cierre** *(Close time)* — a qué hora terminas. **Tiene que ser más tarde que la de
     apertura.** Ej.: `18:00`.
   - **Inicio del descanso** *(Break start)* — si paras a comer o descansar, cuándo empieza. Ej.:
     `14:00`. *(Opcional)*
   - **Fin del descanso** *(Break end)* — cuándo vuelves. Ej.: `15:00`. *(Opcional)*

> 🍽️ **El descanso es opcional.** Si no paras, deja esas dos casillas vacías. Y si lo pones, el
> descanso tiene que caer **dentro** de tu horario (por ejemplo, no puedes descansar de 20:00 si
> cierras a las 18:00).

Cuando tengas todos los días como quieres, pulsa **"Save schedule"** (Guardar horario). La app te
avisa mientras guarda (*"Saving schedule…"*) y luego confirma:

![Horario guardado](../system_architecture/user_stories_view/hu2/03-rules-saved.png)

Verás *"Schedule saved."* (Horario guardado). ¡Listo! El buscador de huecos ya usará estos horarios.

> ✅ Puedes volver aquí y cambiar tus horarios cuando quieras. Los cambios afectan a las **nuevas**
> reservas; las citas que ya estaban confirmadas no se tocan.

---

### 11.5. HU3 · Tus servicios y tu equipo

Aquí montas **qué ofreces** (los servicios) y **quién los hace** (los empleados). Los clientes solo
podrán reservar servicios que tengan a alguien asignado, así que este paso es clave.

**Cómo llegar:** entra en `/admin/catalog`.

Al entrar verás la pantalla dividida en dos zonas: **Servicios** y **Empleados**. Si aún no has
creado nada, aparecerá vacía:

![Panel de catálogo vacío](../system_architecture/user_stories_view/hu3/01-catalog-panel.png)

#### 11.5.1. Crear un servicio

En el formulario de servicio rellena:

1. **Nombre del servicio** *(Service name)* — por ejemplo *Corte de pelo*.
2. **Precio** *(Price)* — con números y, si quieres, hasta dos decimales. Ej.: `25` o `25.00`.
3. **Duración en minutos** *(Duration in minutes)* — cuánto dura, en minutos. Ej.: `30`. Tiene que
   ser un número mayor que cero.

Pulsa **"Save service"** (Guardar servicio) y aparecerá en la lista de abajo:

![Servicio creado](../system_architecture/user_stories_view/hu3/02-service-created.png)

> ⏱️ La **duración** es la que usa el sistema para partir tu jornada en huecos. Si un corte dura 30
> minutos y abres de 09:00 a 10:00, saldrán dos huecos: 09:00 y 09:30.

Cada servicio de la lista tiene dos botones:

- **"Edit"** (Editar) — carga los datos del servicio en el formulario para revisarlos.
- **"Deactivate"** (Desactivar) — quita el servicio del catálogo público.

> 🗂️ **Sobre desactivar un servicio:** un servicio **nunca se borra de verdad**. Al desactivarlo,
> deja de aparecer en la lista de servicios activos y en la página de reservas, **pero las citas que
> ya existían con ese servicio se conservan intactas**. Así nunca pierdes el histórico de tu negocio.

#### 11.5.2. Crear un empleado

En el formulario de empleado rellena:

1. **Nombre del empleado** *(Employee name)* — por ejemplo *Ana*.
2. **Email** *(Email)* — un correo válido de esa persona. No puede repetirse con otro empleado.
3. **Servicios que sabe hacer** *(Assigned services)* — una lista de casillas, una por cada servicio
   que hayas creado. **Marca los que esa persona puede realizar.**

![Empleado creado](../system_architecture/user_stories_view/hu3/03-employee-created.png)

Pulsa **"Save employee"** (Guardar empleado) y se añadirá a la lista.

#### 11.5.3. La conexión servicio ↔ empleado (¡importante!)

Esas casillas que marcas al crear un empleado son la clave de todo el sistema:

![Servicio asignado y visible en la página de reservas](../system_architecture/user_stories_view/hu3/04-service-assigned.png)

- Un servicio **solo se puede reservar** si tiene **al menos un empleado** que lo sepa hacer.
- Cuando un cliente elige un servicio en la página pública, solo le aparecerán los **profesionales
  que tienen ese servicio marcado**.
- Un empleado sin ningún servicio marcado **no aparece** como opción para reservar.

> 🔗 Regla fácil de recordar: **primero crea los servicios, luego los empleados, y al crear cada
> empleado marca qué servicios hace.** Si te olvidas de marcar, ese servicio no se podrá reservar.

Un servicio que ya tiene citas está protegido: como se ha explicado, **no desaparece del sistema**,
solo se desactiva, y sus citas siguen guardadas.

![Un servicio con citas se conserva](../system_architecture/user_stories_view/hu3/05-deletion-blocked.png)

---

## PARTE B — Para el cliente que reserva

### 11.6. HU4 · Reservar una cita desde el móvil

Esta es la parte que ve **tu cliente**. Está pensada para el **móvil** y para hacerse en **muy pocos
pasos**, sin crear ninguna cuenta ni contraseña.

**Cómo llegar:** el cliente entra en la página `/booking` de tu negocio (por ejemplo
`barberia-paco.yourplatform.com/booking`). Normalmente le pasas ese enlace o lo pones en tus redes.

Es un asistente que va **paso a paso**:

#### Paso 1 — Elegir servicio y profesional

![Eligiendo servicio](../system_architecture/user_stories_view/hu4/01-selecting-service.png)

- Primero, **elige el servicio** que quiere (bajo *"Choose a service"*). Toca uno y queda marcado.
- Después aparece **"Choose a professional"** para elegir con quién. Aquí **solo salen los
  profesionales que hacen ese servicio**.
- Cuando ha elegido las dos cosas, pulsa **"Continue"** (Continuar).

#### Paso 2 — Elegir día y hora

![Buscando huecos disponibles](../system_architecture/user_stories_view/hu4/02-checking-availability.png)

- Arriba hay un selector de **fecha** *(Date)*: elige el día. Por defecto aparece el día de hoy.
- La app busca los huecos libres de ese profesional para ese día (*"Loading available times"*) y los
  muestra como botones con la hora:

![Huecos disponibles](../system_architecture/user_stories_view/hu4/03-selecting-slot.png)

- Si **no hay huecos** ese día, verás *"No times available. Try another date or professional."*
  (No hay horas disponibles: prueba otra fecha u otro profesional). Solo hay que cambiar de día.
- Toca la **hora** que le venga bien.

#### Paso 3 — Dejar los datos de contacto

![Rellenando los datos de contacto](../system_architecture/user_stories_view/hu4/04-filling-data.png)

Rellena tres campos:

1. **Nombre completo** *(Full name)*.
2. **Email** *(Email)* — un correo válido.
3. **Teléfono** *(Phone number)* — su número de contacto.

Si algún dato está mal (por ejemplo un email sin arroba), la app lo avisa y **no reserva nada** hasta
que se corrija. Cuando está todo bien, pulsa **"Confirm"** (Confirmar).

#### Paso final — Reserva registrada

![Reserva pendiente de verificación](../system_architecture/user_stories_view/hu4/05-slot-pending.png)

Verás el mensaje *"Your booking is pending confirmation. We will verify it shortly."* (Tu reserva
está pendiente de confirmación; la verificaremos en breve).

Esto quiere decir que **el hueco queda apartado a tu nombre** mientras se verifica. Es un mecanismo
de seguridad para evitar reservas falsas que bloqueen la agenda del negocio.

#### ¿Y si alguien pilla el hueco a la vez?

Puede pasar que otra persona reserve exactamente esa misma hora justo un segundo antes que tú. En ese
caso la app te avisa:

![El hueco ya no está disponible](../system_architecture/user_stories_view/hu4/06-slot-unavailable.png)

Verás *"That time slot was just taken. Please choose another one."* (Esa hora la acaban de coger,
elige otra). Y te vuelve a mostrar los huecos para que **elijas otra hora** sin empezar de cero.

---

### 11.7. ¿Y si algo va mal? (preguntas frecuentes)

**"No me deja pulsar el botón de Crear / Guardar / Continuar."**
El botón se queda apagado cuando falta algún dato o hay algo mal escrito. Repasa las casillas: casi
siempre es un email sin arroba, una hora de cierre anterior a la de apertura, o un subdominio con
mayúsculas o espacios.

**"Me dice que el subdominio ya está cogido."**
Ese nombre lo tiene otro negocio. Elige otro (puedes añadir tu ciudad o un número, por ejemplo
`barberia-paco-madrid`). El sistema te dirá al momento si está libre.

**"He configurado los horarios pero a mis clientes no les aparece ninguna hora."**
Repasa tres cosas, en este orden:
1. En **horarios** (`/admin/schedule`), que ese día esté **marcado** como laborable y con sus horas.
2. En **catálogo** (`/admin/catalog`), que el **servicio** exista.
3. Que ese servicio tenga **un empleado con la casilla marcada**. Sin empleado asignado, no hay
   huecos.

**"Un cliente reservó a una hora que ya estaba ocupada."**
No puede pasar: el sistema **aparta cada hueco de forma exclusiva**. Si dos personas intentan la misma
hora a la vez, solo una lo consigue y a la otra le pide elegir otra hora.

**"¿Los datos de mi negocio se mezclan con los de otro?"**
No. Cada negocio vive en su propio subdominio y **solo ve sus propios datos**: sus horarios, sus
servicios, sus empleados y sus citas. Es imposible ver o tocar los de otro negocio.

**"El cliente reservó pero la cita sale como 'pendiente'."**
Es lo normal en esta versión: la reserva se aparta como **pendiente** a la espera de verificación.
Ese paso protege tu agenda de reservas falsas.

---

### 11.8. Mini-glosario (por si acaso)

| Palabra | Qué significa, en fácil |
| :--- | :--- |
| **Tenant / negocio** | Cada empresa que usa la plataforma con su propio espacio y su propia dirección web. |
| **Subdominio** | El nombre corto de tu dirección web (`tunegocio`.yourplatform.com). |
| **Backoffice / panel** | La parte privada donde el dueño configura horarios, servicios y equipo. |
| **Widget de reserva** | La página pública donde el cliente pide su cita. |
| **Hueco / slot** | Un espacio de tiempo libre en la agenda donde cabe una cita. |
| **Servicio** | Lo que ofreces (corte de pelo, masaje, consulta…), con su precio y duración. |
| **Empleado / profesional** | La persona que atiende al cliente y realiza el servicio. |
| **Cita pendiente** | Una reserva apartada a nombre de un cliente, a la espera de verificación. |

---

[<- Volver al README principal](../readme.md)
