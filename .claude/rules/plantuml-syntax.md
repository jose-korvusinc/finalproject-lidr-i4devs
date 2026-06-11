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
- Pon un **título** descriptivo: `title Diagrama de Casos de Uso — Gestión de reservas`.
- Un archivo `.puml` por diagrama; nómbralo por su contenido y vista, p. ej. `logical_view/clases_reserva.puml`.
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
- Idioma de etiquetas: **español** (coherente con `uml-rup.md`).
- Prefiere `!theme plain` o el `skinparam` anterior antes que estilos ad hoc.

## 2. Casos de Uso

```plantuml
@startuml
title Casos de Uso — Reservas
left to right direction
skinparam packageStyle rectangle

actor "Cliente" as cliente
actor "Profesional" as pro
actor "Sistema de Pago" as pago

rectangle "Plataforma de Reservas" {
  usecase "Reservar cita" as UC1
  usecase "Cancelar reserva" as UC2
  usecase "Autenticar usuario" as UC3
  usecase "Procesar pago" as UC4
}

cliente --> UC1
cliente --> UC2
pro --> UC2
UC1 ..> UC3 : <<include>>
UC1 ..> UC4 : <<extend>>
UC4 --> pago
@enduml
```

- Actores: `actor "Nombre" as alias`.
- Casos de uso: `usecase "Verbo + objeto" as alias` dentro de un `rectangle "Sistema"`.
- Relaciones: asociación `-->`; `..> : <<include>>`; `..> : <<extend>>`; generalización `--|>`.

## 3. Clases

```plantuml
@startuml
title Diagrama de Clases — Dominio de Reservas
skinparam linetype ortho

interface IRepositorioReservas <<interface>> {
  + buscar(id): Reserva
  + guardar(r: Reserva): void
}

abstract class Usuario {
  # id: string
  + nombre: string
}

class Cliente extends Usuario {
  + email: string
}

class Reserva {
  + id: string
  + fechaInicio: Date
  + estado: EstadoReserva
  + confirmar(): void
}

enum EstadoReserva {
  PENDIENTE
  CONFIRMADA
  CANCELADA
}

Cliente "1" --> "0..*" Reserva : realiza
Reserva *-- "1" EstadoReserva
Reserva ..|> IRepositorioReservas
@enduml
```

- Visibilidad: `+` público, `-` privado, `#` protegido, `~` paquete.
- Relaciones: asociación `-->`, herencia `--|>` (o `extends`), realización `..|>`, dependencia `..>`, composición `*--`, agregación `o--`.
- Multiplicidad entre comillas: `"1"`, `"0..*"`, `"1..*"`.
- Estereotipos `<<interface>>`; clases abstractas con `abstract class`.

## 4. Secuencia

```plantuml
@startuml
title Secuencia — Reservar cita (flujo principal)
actor Cliente
participant "WidgetReserva" as UI
participant "ReservasService" as Svc
database "MongoDB" as DB

Cliente -> UI : seleccionar horario
activate UI
UI -> Svc : crearReserva(datos)
activate Svc
alt horario disponible
  Svc -> DB : insertar(reserva)
  DB --> Svc : ok
  Svc --> UI : reservaConfirmada
else horario ocupado
  Svc --> UI : errorNoDisponible
end
deactivate Svc
UI --> Cliente : mostrar resultado
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
title Estados — Reserva
[*] --> Pendiente
Pendiente --> Confirmada : confirmar [pagoOk] / enviarEmail
Pendiente --> Cancelada : cancelar
Confirmada --> Completada : finalizarCita
Confirmada --> Cancelada : cancelar [dentroDePlazo]
Cancelada --> [*]
Completada --> [*]
@enduml
```

- Estado inicial `[*] -->`, estado final `--> [*]`.
- Transición: `Origen --> Destino : evento [guarda] / acción`.
- Estados compuestos con `state Nombre { ... }`.

## 6. Actividad (sintaxis nueva, recomendada)

```plantuml
@startuml
title Actividad — Proceso de reserva
|Cliente|
start
:Seleccionar servicio;
:Elegir horario;
|Sistema|
if (¿horario disponible?) then (sí)
  :Crear reserva;
  fork
    :Enviar confirmación;
  fork again
    :Notificar profesional;
  end fork
else (no)
  :Mostrar alternativas;
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
title Componentes — Backend NestJS
component "AuthModule" as auth
component "ReservasModule" as reservas
component "NotificacionesModule" as notif
interface "API REST" as api

api - reservas
reservas ..> auth : usa
reservas ..> notif : publica eventos
@enduml
```

- Componente: `component "Nombre" as alias` (o `[Nombre]`).
- Interfaz provista `- ` (bola); requerida `..>` (zócalo/dependencia).

## 8. Paquetes

```plantuml
@startuml
title Paquetes — Organización del backend
package "domain" {
  [Entidades]
}
package "application" {
  [Servicios]
}
package "infrastructure" {
  [Repositorios]
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
title Despliegue — Producción
node "Navegador" {
  artifact "App Angular"
}
node "Servidor de Aplicación" {
  artifact "API NestJS"
}
database "Cluster MongoDB" as mongo

"App Angular" --> "API NestJS" : HTTPS/REST
"API NestJS" --> mongo : TLS (tenant_id)
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
