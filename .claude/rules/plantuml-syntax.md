---
description: Sintaxis de PlantUML para escribir los diagramas UML de la metodología RUP. Plantillas y reglas de estilo por tipo de diagrama (casos de uso, clases, secuencia, estados, actividad, componentes, paquetes, despliegue).
globs:
alwaysApply: false
---

# Regla: Sintaxis de PlantUML para diagramas UML

Esta regla define **cómo** escribir en PlantUML cada diagrama UML que pide la regla `uml-rup.md`.
Decide *qué* diagrama crear con `uml-rup.md`; usa *esta* regla para escribirlo.

## 1. Reglas generales del archivo `.puml`

- Todo diagrama empieza con `@startuml` y termina con `@enduml`.
- Pon un **título** descriptivo: `title Use Case Diagram — Booking management`.
- Un archivo `.puml` por diagrama; nómbralo por su contenido y vista, p. ej. `logical_view/classes_booking.puml`.
- Añade el bloque de estilo común al inicio para uniformidad:

```plantuml
@startuml
' --- estilo base del proyecto ---
skinparam shadowing false
skinparam defaultFontName "Helvetica"
skinparam backgroundColor White
skinparam ArrowColor #333333
skinparam linetype ortho
left to right direction
' --------------------------------
@enduml
```

- Comentarios con comilla simple `'` (línea) o `/' ... '/` (bloque).
- Idioma de etiquetas: **inglés** (coherente con `uml-rup.md`). Es decir, todo el texto que aparece dentro del diagrama (títulos, actores, clases, casos de uso, estados, mensajes, etiquetas de relación) se escribe en inglés, coherente con el modelo de datos y el código.
- Prefiere `!theme plain` o el `skinparam` anterior antes que estilos ad hoc.

## 2. Casos de Uso

```plantuml
@startuml
title Use Cases — Bookings
left to right direction
skinparam packageStyle rectangle

actor "Customer" as customer
actor "Professional" as pro
actor "Payment System" as payment

rectangle "Booking Platform" {
  usecase "Book appointment" as UC1
  usecase "Cancel booking" as UC2
  usecase "Authenticate user" as UC3
  usecase "Process payment" as UC4
}

customer --> UC1
customer --> UC2
pro --> UC2
UC1 ..> UC3 : <<include>>
UC1 ..> UC4 : <<extend>>
UC4 --> payment
@enduml
```

- Actores: `actor "Nombre" as alias`.
- Casos de uso: `usecase "Verbo + objeto" as alias` dentro de un `rectangle "Sistema"`.
- Relaciones: asociación `-->`; `..> : <<include>>`; `..> : <<extend>>`; generalización `--|>`.

## 3. Clases

```plantuml
@startuml
title Class Diagram — Booking Domain
skinparam linetype ortho

interface IBookingRepository <<interface>> {
  + find(id): Booking
  + save(b: Booking): void
}

abstract class User {
  # id: string
  + name: string
}

class Customer extends User {
  + email: string
}

class Booking {
  + id: string
  + startDate: Date
  + status: BookingStatus
  + confirm(): void
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
}

Customer "1" --> "0..*" Booking : makes
Booking *-- "1" BookingStatus
Booking ..|> IBookingRepository
@enduml
```

- Visibilidad: `+` público, `-` privado, `#` protegido, `~` paquete.
- Relaciones: asociación `-->`, herencia `--|>` (o `extends`), realización `..|>`, dependencia `..>`, composición `*--`, agregación `o--`.
- Multiplicidad entre comillas: `"1"`, `"0..*"`, `"1..*"`.
- Estereotipos `<<interface>>`; clases abstractas con `abstract class`.

## 4. Secuencia

```plantuml
@startuml
title Sequence — Book appointment (main flow)
actor Customer
participant "BookingWidget" as UI
participant "BookingService" as Svc
database "MongoDB" as DB

Customer -> UI : select time slot
activate UI
UI -> Svc : createBooking(data)
activate Svc
alt slot available
  Svc -> DB : insert(booking)
  DB --> Svc : ok
  Svc --> UI : bookingConfirmed
else slot taken
  Svc --> UI : errorNotAvailable
end
deactivate Svc
UI --> Customer : show result
deactivate UI
@enduml
```

- Mensaje síncrono `->`, retorno `-->`, asíncrono `->>`.
- Activaciones con `activate`/`deactivate` (o `++`/`--` en la flecha).
- Fragmentos: `alt`/`else`/`end`, `opt`/`end`, `loop`/`end`, `par`/`end`.
- Tipos de línea de vida: `actor`, `participant`, `database`, `boundary`, `control`, `entity`.

## 5. Máquina de Estados

```plantuml
@startuml
title States — Booking
[*] --> Pending
Pending --> Confirmed : confirm [paymentOk] / sendEmail
Pending --> Cancelled : cancel
Confirmed --> Completed : finishAppointment
Confirmed --> Cancelled : cancel [withinDeadline]
Cancelled --> [*]
Completed --> [*]
@enduml
```

- Estado inicial `[*] -->`, estado final `--> [*]`.
- Transición: `Origen --> Destino : evento [guarda] / acción`.
- Estados compuestos con `state Nombre { ... }`.

## 6. Actividad (sintaxis nueva, recomendada)

```plantuml
@startuml
title Activity — Booking process
|Customer|
start
:Select service;
:Choose time slot;
|System|
if (slot available?) then (yes)
  :Create booking;
  fork
    :Send confirmation;
  fork again
    :Notify professional;
  end fork
else (no)
  :Show alternatives;
endif
stop
@enduml
```

- Inicio `start`, fin `stop`/`end`.
- Acción `:texto;`.
- Decisión `if (cond?) then (etiqueta) ... else (etiqueta) ... endif`.
- Concurrencia `fork` / `fork again` / `end fork`.
- Calles (swimlanes) con `|Nombre|`.

## 7. Componentes

```plantuml
@startuml
title Components — NestJS Backend
component "AuthModule" as auth
component "BookingModule" as booking
component "NotificationModule" as notif
interface "REST API" as api

api - booking
booking ..> auth : uses
booking ..> notif : publishes events
@enduml
```

- Componente: `component "Nombre" as alias` (o `[Nombre]`).
- Interfaz provista `- ` (bola); requerida `..>` (zócalo/dependencia).

## 8. Paquetes

```plantuml
@startuml
title Packages — Backend organization
package "domain" {
  [Entities]
}
package "application" {
  [Services]
}
package "infrastructure" {
  [Repositories]
}
application ..> domain
infrastructure ..> domain
@enduml
```

- Paquete: `package "Nombre" { ... }`.
- Dependencia entre paquetes con `..>`. Evita ciclos.

## 9. Despliegue

```plantuml
@startuml
title Deployment — Production
node "Browser" {
  artifact "Angular App"
}
node "Application Server" {
  artifact "NestJS API"
}
database "MongoDB Cluster" as mongo

"Angular App" --> "NestJS API" : HTTPS/REST
"NestJS API" --> mongo : TLS (tenant_id)
@enduml
```

- Nodos: `node`, `cloud`, `database`; artefactos con `artifact`.
- Etiqueta cada conexión con su **protocolo**.

## 10. Buenas prácticas de estilo

- Usa **alias cortos** (`as svc`) y reutilízalos; evita renombrar el mismo elemento.
- Mantén la dirección legible: `left to right direction` para casos de uso/componentes; vertical por defecto en secuencia/estados.
- Agrupa con `package`/`rectangle`/`node` para reducir cruces de líneas.
- Si un diagrama queda ilegible, **divídelo** (coherente con "una intención por diagrama" de `uml-rup.md`).
- Renderiza con `plantuml diagrama.puml` (requiere Java + Graphviz) o la extensión PlantUML del IDE; versiona el `.puml` fuente junto a la imagen exportada.
