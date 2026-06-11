---
description: Diagramas UML a producir en la metodología RUP (Rational Unified Process). Define qué diagrama crear según la vista 4+1 y la fase del proyecto, y las convenciones de modelado.
globs:
alwaysApply: false
---

# Regla: Diagramas UML para la metodología RUP

Esta regla define **qué** diagramas UML hay que crear, **cuándo** y con **qué convenciones** cuando se trabaja bajo RUP.
Para la **sintaxis PlantUML** de cada diagrama, consulta la regla `plantuml-syntax.md`.

## 1. Principio rector: el modelo de vistas 4+1

RUP organiza la arquitectura en cinco vistas. Cada vista se expresa con un subconjunto concreto de diagramas UML. **No mezcles preocupaciones de vistas distintas en un mismo diagrama.**

| Vista | Pregunta que responde | Diagramas UML | Audiencia |
| :--- | :--- | :--- | :--- |
| **Casos de Uso** (+1, central) | ¿Qué hace el sistema y para quién? | Diagrama de Casos de Uso | Todos los stakeholders |
| **Lógica** | ¿Cómo se estructura el dominio y su comportamiento? | Clases, Objetos, Máquina de Estados, Secuencia, Comunicación | Analistas y diseñadores |
| **Proceso** | ¿Cómo fluye y se sincroniza la ejecución? | Actividad, Secuencia (concurrencia), Comunicación | Integradores |
| **Desarrollo / Implementación** | ¿Cómo se organiza el código? | Componentes, Paquetes | Programadores |
| **Despliegue / Física** | ¿Dónde se ejecuta? | Despliegue | Ingenieros de sistemas |

> Nota: las vistas 4+1 son **UML/RUP** y conviven con los diagramas **C4** de arquitectura del proyecto. C4 (Contexto/Contenedores/Componentes) describe la arquitectura de alto nivel; UML 4+1 detalla el diseño. No los dupliques: si algo ya está en C4 a nivel de contenedor, en UML profundiza en el diseño interno.

## 2. Qué diagramas crear por fase RUP

RUP es iterativo. Los diagramas se refinan a lo largo de las fases; esta tabla indica dónde **nace** cada uno.

| Fase | Objetivo | Diagramas que se producen/refinan |
| :--- | :--- | :--- |
| **Inicio** (Inception) | Alcance y viabilidad | Casos de Uso (alto nivel), diagrama de contexto |
| **Elaboración** (Elaboration) | Arquitectura estable | Casos de Uso (detallados), Clases (análisis), Secuencia de escenarios clave, Estados de entidades críticas, Componentes, Despliegue (línea base) |
| **Construcción** (Construction) | Producto operativo | Clases (diseño/implementación), Secuencia/Comunicación de todos los flujos, Actividad de procesos de negocio, Paquetes |
| **Transición** (Transition) | Entrega | Despliegue final, refinamiento de Componentes |

## 3. Diagramas obligatorios y sus convenciones

### 3.1. Diagrama de Casos de Uso
- **Cuándo**: siempre. Es el punto de entrada del modelado.
- **Contenido**: actores (humanos y sistemas externos), casos de uso, relaciones `<<include>>`, `<<extend>>` y generalización.
- **Reglas**:
  - Un actor representa un **rol**, no una persona concreta.
  - Nombra los casos de uso con verbo + objeto en infinitivo ("Reservar cita", "Cancelar reserva").
  - Usa `<<include>>` para comportamiento obligatorio reutilizado; `<<extend>>` para comportamiento opcional/condicional.
  - Acompaña cada caso de uso relevante con su **especificación textual** (flujo principal, alternativos, precondiciones, postcondiciones).

### 3.2. Diagrama de Clases (Vista Lógica)
- **Cuándo**: Elaboración (análisis) → Construcción (diseño).
- **Contenido**: clases, atributos, operaciones, y relaciones (asociación, agregación, composición, herencia, dependencia).
- **Reglas**:
  - Distingue **clases de análisis** (sin tipos ni visibilidad detallados) de **clases de diseño** (con tipos, visibilidad `+ - # ~`, multiplicidades).
  - Indica **multiplicidad** en todas las asociaciones (`1`, `0..1`, `1..*`, `*`).
  - Usa **composición** (rombo relleno) para relaciones todo-parte donde la parte no vive sin el todo; **agregación** (rombo vacío) en caso contrario.
  - Marca interfaces y clases abstractas con su estereotipo (`<<interface>>`, *cursiva* para abstractas).

### 3.3. Diagrama de Secuencia (Vista Lógica / Proceso)
- **Cuándo**: por cada escenario significativo de un caso de uso.
- **Contenido**: líneas de vida (actores/objetos), mensajes síncronos/asíncronos, activaciones, fragmentos combinados (`alt`, `opt`, `loop`, `par`).
- **Reglas**:
  - Un diagrama de secuencia documenta **un escenario** (flujo principal **o** una alternativa concreta), no todos a la vez.
  - Usa `alt`/`opt` para condicionales y `loop` para iteración; no abuses de notas para suplir control de flujo.
  - Refleja el retorno con flechas discontinuas solo cuando aporta claridad.

### 3.4. Diagrama de Máquina de Estados (Vista Lógica)
- **Cuándo**: para entidades con ciclo de vida no trivial (p. ej. una "Reserva": pendiente → confirmada → cancelada/completada).
- **Reglas**:
  - Incluye estado inicial (●) y, si aplica, final (◉).
  - Etiqueta transiciones con `evento [guarda] / acción`.
  - Modela solo entidades cuyo comportamiento dependa del estado.

### 3.5. Diagrama de Actividad (Vista de Proceso)
- **Cuándo**: para procesos de negocio o algoritmos con bifurcaciones y concurrencia.
- **Reglas**:
  - Usa nodos de decisión (rombo) y barras de sincronización (fork/join) para concurrencia.
  - Emplea **calles (swimlanes)** para asignar responsabilidades a actores/componentes.

### 3.6. Diagrama de Componentes (Vista de Desarrollo)
- **Cuándo**: Elaboración → Construcción.
- **Reglas**:
  - Modela componentes y sus **interfaces provistas/requeridas** (notación bola-y-zócalo).
  - Alinea los componentes con los módulos reales del código (en este proyecto: módulos NestJS, librerías Angular).

### 3.7. Diagrama de Paquetes (Vista de Desarrollo)
- **Cuándo**: cuando la organización del código necesita visualizarse.
- **Reglas**: muestra dependencias entre paquetes y evita ciclos de dependencia.

### 3.8. Diagrama de Despliegue (Vista Física)
- **Cuándo**: Elaboración (línea base) → Transición (final).
- **Reglas**:
  - Modela **nodos** (servidores, contenedores, dispositivos), artefactos desplegados y rutas de comunicación con su protocolo.
  - Refleja la topología real (frontend Angular, backend NestJS, MongoDB) y el aislamiento multitenant si es relevante.

## 4. Convenciones transversales

- **Idioma**: nombres de elementos y etiquetas en **español**, salvo identificadores técnicos que en el código sean en inglés.
- **Coherencia de nombres**: una entidad debe llamarse igual en todos los diagramas y coincidir con el modelo de datos y el código.
- **Trazabilidad**: cada diagrama de diseño debe poder rastrearse hasta un caso de uso o requisito.
- **Nivel de detalle adecuado a la fase**: no detalles tipos en análisis ni dejes diagramas de construcción sin tipos.
- **Una intención por diagrama**: si un diagrama necesita explicación extensa para entenderse, divídelo.
- **Formato y ubicación**: genera los diagramas con PlantUML (`.puml`) y exporta a imagen para el README. Mantén el `.puml` fuente versionado junto al diagrama.
