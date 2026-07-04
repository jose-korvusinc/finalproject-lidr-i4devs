---
name: uml-diagram
description: Genera cualquier diagrama UML del modelo de vistas 4+1 de RUP (casos de uso, clases, objetos, secuencia, comunicación, máquina de estados, actividad, componentes, paquetes, despliegue) escrito en PlantUML. Úsala cuando el usuario pida crear, generar, actualizar o corregir un diagrama UML o un archivo .puml. Aplica SIEMPRE las rules del proyecto como única fuente de verdad.
---

# Skill: Generador de diagramas UML (RUP + PlantUML)

Genera diagramas UML válidos en PlantUML, conformes a la metodología RUP y a las
convenciones del proyecto. La skill **no inventa** convenciones ni sintaxis: las toma
de las dos rules del proyecto.

## Fuente de verdad (OBLIGATORIO leer antes de generar)

Lee y aplica SIEMPRE estas dos rules. Si hay conflicto, las rules mandan sobre cualquier suposición:

- `.claude/rules/uml-rup.md` → decide **QUÉ** diagrama crear, en qué vista 4+1 encaja,
  qué fase RUP corresponde y qué convenciones de modelado aplican.
- `.claude/rules/plantuml-syntax.md` → decide **CÓMO** escribirlo en PlantUML
  (plantilla por tipo, estilo base, relaciones, multiplicidades, fragmentos, etc.).

No copies el contenido de las rules aquí: léelas en tiempo de ejecución para mantener
una única fuente de verdad.

## Cuándo se activa

Cuando el usuario pida crear, generar, actualizar o corregir un diagrama UML / PlantUML:
casos de uso, clases, objetos, secuencia, comunicación, máquina de estados, actividad,
componentes, paquetes o despliegue.

## Entrada

Una descripción en lenguaje natural (p. ej. "diagrama de clases del dominio de reservas").
Pregunta SOLO lo imprescindible si falta algo esencial:
- tipo de diagrama (si no se deduce de la petición),
- ámbito/escenario concreto (un diagrama = una intención),
- nivel de detalle (análisis vs. diseño) cuando aplique a clases.

## Flujo de trabajo

1. **Leer ambas rules** (`uml-rup.md` y `plantuml-syntax.md`) antes de generar nada.
2. **Determinar tipo de diagrama y vista 4+1** según `uml-rup.md`. Si el usuario no lo
   especifica, inferirlo y confirmarlo brevemente.
3. **Recopilar el contenido del dominio** revisando la documentación del proyecto para que
   nombres de entidades, actores, módulos y estados COINCIDAN con el proyecto
   (coherencia y trazabilidad):
   - `sections_readme/05-data-model.md` (entidades, atributos, relaciones),
   - `sections_readme/06-api-specification.md` (operaciones, contratos),
   - `sections_readme/03-system-architecture.md` (componentes, despliegue, C4),
   - `sections_readme/02-user-stories.md` (actores y casos de uso),
   - y el código relevante (`backend/` NestJS, `frontend/` Angular) cuando exista.
4. **Generar el `.puml`** aplicando la plantilla y el bloque de estilo base de
   `plantuml-syntax.md` (skinparam común, alias cortos, multiplicidades, etiquetas en
   español, `title` descriptivo).
5. **Respetar "una intención por diagrama"**: si el alcance es grande, proponer dividirlo.
6. **Guardar el archivo** en la carpeta de la vista correspondiente bajo
   `system_architecture/` (crear subcarpeta si no existe):

   | Tipo de diagrama | Vista 4+1 | Carpeta destino |
   | :--- | :--- | :--- |
   | Casos de uso | Casos de Uso (+1) | `system_architecture/user_stories_view/` |
   | Clases, Objetos | Lógica | `system_architecture/domain_model/` |
   | Secuencia, Comunicación, Estados | Lógica/Proceso | `system_architecture/design_view/` |
   | Actividad | Proceso | `system_architecture/design_view/` |
   | Componentes, Paquetes | Desarrollo | `system_architecture/implementation_view/` |
   | Despliegue | Física | `system_architecture/deploy_view/` |

   Nomenclatura del archivo: `<tipo>_<tema>.puml` (p. ej. `clases_reserva.puml`,
   `secuencia_reservar_cita.puml`).
7. **Validar y renderizar**: para exportar el `.puml` a imagen, usa la skill `uml-export`
   (`.claude/skills/uml-export/SKILL.md`), que autodetecta el motor de render (plantuml CLI,
   Docker o el jar de la extensión) y deja el `.png` junto al `.puml`. No falles si no hay
   motor: la propia skill indica el comando a ejecutar. Ejemplo:
   `.claude/skills/uml-export/scripts/render-plantuml.sh system_architecture/<vista>/<archivo>.puml`
8. **Devolver al usuario**: ruta del `.puml`, el bloque PlantUML generado y la vista/fase
   RUP a la que pertenece.

## Lista de verificación de calidad (antes de terminar)

- [ ] Empieza con `@startuml`, termina con `@enduml` y tiene `title`.
- [ ] Contiene elementos de UNA sola vista 4+1 (no mezcla preocupaciones).
- [ ] Nombres en español y consistentes con el modelo de datos y el código.
- [ ] Sintaxis conforme a `plantuml-syntax.md` (relaciones, estereotipos, fragmentos).
- [ ] Trazable a un caso de uso o requisito si es un diagrama de diseño.
- [ ] Nivel de detalle acorde a la fase (análisis sin tipos / diseño con tipos).

## Ejemplos de invocación

- "Crea el diagrama de casos de uso de la gestión de reservas."
- "Genera el diagrama de clases (diseño) del dominio de reservas con multiplicidades."
- "Diagrama de secuencia del flujo principal de reservar cita."
- "Diagrama de despliegue de producción (Angular + NestJS + MongoDB)."
- "Diagrama de estados de la entidad Reserva."
