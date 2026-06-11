### 2. Historias de Usuario

[Volver al índice de prompts](../prompts.md)

**Prompt 1: Completar readme con las historias de usuario (Cursor Auto)**

Completar `sections_prompts/02-user-stories.md` basandote en la información creada en el fichero `bussiness_docs/prd.md` en la sección "3. Historias de Usuario (User Stories) y Criterios de Aceptación."

**Prompt 2: Actualizar la información de las historias de usuario y priorizar (Cursor Auto)**

Modifica `sections_prompts/02-user-stories.md` para completar la información de las historias de usuario:
1. Comprueba que cada historia de usuario cumple los criterios INVEST y haz los cambios que consideres para que todas los cumplan.
2. Establece claramente los criterios de aceptación que denen cumplirse para considerar cada historia de usuario como "terminada". Usar formato BDD
3. Estima estos cuatro elementos de cada historia de usuario (crea una tabla en MD con esta información):
   3.1. Impacto en el usuario y valor del negocio.
   3.2. Urgencia basada en tendencias del mercado y feedback de usuarios.
   3.3. Complejidad y esfuerzo estimado de implementación.
   3.4. Riesgos y dependencias entre tareas.
   3.5. Tiempo de desarrollo estimado.
4. Establece una prioridad de cada historia de usuario con estas etiquetas: Baja, Media, Alta, Critica

**Prompt 3: Crear dos rules para la sintaxis de UML y de plantuml (Claude Opus 4.8)**

Eres un experto en crear rules para claude. Necesito crear dos rules:
1. Sintáxis de diagramas de UML que hay que crear para la metodología RUP
2. Sintaxis de plantuml para crear los diagramas UML con su sintaxis
Guardar las dos rules en la carpeta @.claude/rules

**Prompt 4: Metaprompt para crear una skill (Claude Opus 4.8)**

Crea un prompt para crear una skill que genere cualquier diagrama en UML usando las rules @.claude/rules/uml-rup.md y @.claude/rules/plantuml-syntax.md

**Prompt 5: Prompt que devuelve el metaprompt anterior (Claude Opus 4.8)**

Crea una skill de Claude Code llamada `uml-diagram` que genere cualquier diagrama UML
  del modelo de vistas 4+1 de RUP, escrito en PlantUML.

  ## Propósito
  La skill debe permitir al usuario pedir un diagrama UML en lenguaje natural (p. ej.
  "crea el diagrama de clases del dominio de reservas" o "diagrama de secuencia del login")
  y producir un archivo `.puml` válido, conforme a las convenciones del proyecto, y opcionalmente
  renderizarlo a imagen.

  ## Fuente de verdad (OBLIGATORIO)
  La skill NO debe inventar convenciones ni sintaxis. Debe leer y aplicar SIEMPRE estas dos rules:
  - `.claude/rules/uml-rup.md` → decide QUÉ diagrama crear, en qué vista 4+1 encaja,
    qué fase RUP corresponde y qué convenciones de modelado aplican.
  - `.claude/rules/plantuml-syntax.md` → decide CÓMO escribir ese diagrama en PlantUML
    (plantilla por tipo, estilo base, relaciones, multiplicidades, fragmentos, etc.).
  Si hay conflicto, las rules mandan sobre cualquier suposición.

  ## Cuándo se activa
  Cuando el usuario pida crear, generar, actualizar o corregir un diagrama UML / PlantUML:
  casos de uso, clases, objetos, secuencia, comunicación, máquina de estados, actividad,
  componentes, paquetes o despliegue.

  ## Argumentos / entrada
  Acepta una descripción en lenguaje natural. Si falta información esencial para elegir
  o construir el diagrama, pregunta SOLO lo imprescindible:
  - tipo de diagrama (si no se deduce de la petición),
  - ámbito/escenario concreto (un diagrama = una intención),
  - nivel de detalle (análisis vs. diseño) cuando aplique a clases.

  ## Flujo de trabajo que debe seguir la skill
  1. Leer ambas rules antes de generar nada.
  2. Determinar el tipo de diagrama y la vista 4+1 según `uml-rup.md`.
     Si el usuario no lo especifica, inferirlo y confirmarlo brevemente.
  3. Recopilar el contenido del dominio: revisar la documentación del proyecto
     (`sections_readme/04-data-model.md`, `05-api-specification.md`,
     `03-system-architecture.md`) y el código relevante para que nombres de entidades,
     actores, módulos y estados COINCIDAN con el proyecto (regla de coherencia y trazabilidad).
  4. Generar el `.puml` aplicando la plantilla y el estilo base de `plantuml-syntax.md`
     (bloque skinparam común, alias cortos, multiplicidades, etiquetas en español, título).
  5. Respetar "una intención por diagrama": si el alcance es demasiado grande, proponer
     dividirlo en varios diagramas.
  6. Guardar el archivo en la carpeta de la vista correspondiente bajo
     `system_architecture/`, con nomenclatura `<vista>/<tipo>_<tema>.puml`
     (p. ej. `logical_view/clases_reserva.puml`). Crear la carpeta si no existe.
  7. Validar la sintaxis. Si hay `plantuml` disponible (Java + Graphviz), renderizar a
     `.png`/`.svg` junto al `.puml`; si no, indicar el comando exacto para renderizar y
     no fallar por ello.
  8. Devolver al usuario: ruta del `.puml`, el bloque PlantUML generado, y la vista/fase RUP
     a la que pertenece.

  ## Reglas de calidad (verificar antes de terminar)
  - El diagrama empieza con `@startuml` y termina con `@enduml` y tiene `title`.
  - Solo contiene elementos de UNA vista 4+1 (no mezclar preocupaciones).
  - Nombres en español y consistentes con el modelo de datos y el código.
  - Sintaxis conforme a `plantuml-syntax.md` (relaciones, estereotipos, fragmentos correctos).
  - Trazable a un caso de uso o requisito cuando sea un diagrama de diseño.

  ## Estructura de la skill
  - `SKILL.md` con la descripción, el cuándo-se-activa y el flujo anterior.
  - Que las dos rules se referencien por ruta (no copiar su contenido dentro de la skill,
    para mantener una única fuente de verdad).
  - Incluir 2-3 ejemplos de invocación en la documentación de la skill.

  Notas rápidas:
  - El prompt deja claro que la skill lee las rules en tiempo de ejecución en lugar de duplicar su contenido — así las rules siguen siendo la única fuente de verdad y mantener una sola cosa actualiza todo.
  - Incluye el paso de leer la documentación/código del proyecto para que los nombres de entidades y actores sean coherentes (cumpliendo la regla de trazabilidad).


**Prompt 7: Metaprompt para crear un subagente que use la skill anterior (Claude Opus 4.8)**

Crea un prompt para crear un subagente que use la skill @.claude/skills/uml-diagram/SKILL.md

**Prompt 8: Prompt devuelto en la llamada anterior (Claude Opus 4.8)**

Crea un subagente de Claude Code llamado `diagramador-uml` y guárdalo en `.claude/agents/diagramador-uml.md`.

  ## Propósito
  Subagente especializado en producir diagramas UML del modelo 4+1 de RUP, escritos en
  PlantUML, para este proyecto. Su trabajo es generar uno o varios diagramas `.puml`
  correctos, coherentes con el dominio, y devolver las rutas y un resumen.

  ## Capacidad central (OBLIGATORIO)
  El subagente debe apoyarse SIEMPRE en la skill `uml-diagram`
  (`.claude/skills/uml-diagram/SKILL.md`) como mecanismo de generación. No debe reimplementar
  ni reinterpretar las convenciones: la skill ya lee las rules `.claude/rules/uml-rup.md`
  (qué diagrama) y `.claude/rules/plantuml-syntax.md` (cómo escribirlo), que son la única
  fuente de verdad. El subagente invoca la skill y aplica su flujo de trabajo.

  ## Cuándo se debe invocar
  Cuando el usuario pida crear, generar, actualizar, corregir o revisar uno o varios
  diagramas UML / archivos `.puml` (casos de uso, clases, objetos, secuencia, comunicación,
  máquina de estados, actividad, componentes, paquetes, despliegue). Es especialmente útil
  para encargos que requieren PRODUCIR VARIOS diagramas a la vez (p. ej. "documenta toda la
  vista lógica" o "genera todos los diagramas de la entrega").

  ## Herramientas
  Concede solo las necesarias: Read, Write, Glob, Grep, Bash (para renderizar con `plantuml`)
  y la capacidad de invocar la skill `uml-diagram`. No necesita acceso a herramientas de red
  ni de edición de código de producción.

  ## Modelo
  Usa un modelo capaz de razonar sobre el dominio (hereda el de la sesión salvo que se indique
  lo contrario).

  ## Comportamiento esperado
  1. Leer las dos rules y la skill antes de generar.
  2. Para cada diagrama solicitado: determinar tipo y vista 4+1, recopilar nombres reales del
     dominio desde `sections_readme/` y el código, y generar el `.puml` siguiendo el flujo de
     la skill (estilo base, nomenclatura, carpeta destino bajo `system_architecture/`).
  3. Si el encargo implica varios diagramas, producirlos todos manteniendo COHERENCIA de
     nombres entre ellos (una entidad se llama igual en todos los diagramas).
  4. Validar cada diagrama contra la lista de verificación de calidad de la skill y renderizar
     a `.png` si `plantuml` está disponible; si no, indicar el comando exacto.
  5. Si el alcance de un diagrama es demasiado grande, dividirlo (una intención por diagrama)
     y avisarlo.
  6. Pedir aclaraciones SOLO si falta información esencial e imposible de inferir.

  ## Salida (system prompt del subagente)
  El system prompt debe instruir al agente a devolver, como mensaje final, un resumen
  estructurado: por cada diagrama generado, su tipo, la vista/fase RUP, la ruta del `.puml`
  (y del `.png` si se renderizó) y cualquier suposición o división de alcance que haya hecho.
  Recordarle que su mensaje final es el resultado que recibe el agente principal, no una
  conversación con el usuario.

  Redacta la descripción del frontmatter de forma que el agente principal delegue
  automáticamente en este subagente cuando detecte peticiones de diagramas UML.

  Notas:
  - La pieza importante es que el subagente delega en la skill (que a su vez lee las rules), de modo que mantienes una sola fuente de verdad en tres capas: rules → skill → subagente.
  - El prompt destaca el caso de uso donde un subagente aporta más valor: generar varios diagramas de golpe manteniendo coherencia de nombres entre ellos, descargando ese trabajo del contexto principal.

**Prompt 9: Generar diagrama de actores con las 4 historias de usuario seleccionadas para el proyecto (Claude Opus 4.8)**

Haz un diagrama de casos de uso UML de las historias de usuario seleccionadas en el punto 2.3 del fichero `sections_readme/02-user-stories.md`

**Prompt 10: Generar diagrama de contexto (Claude Opus 4.8)**

Añadir una nueva sección "2.4 Modelo de contexto" en el fichero @sections_readme/02-user-stories.md donde se añade:
  1. Una pequeña descripción de lo que es un modelo de contexto en RUP (diagrama de estados donde las transiciones son las historias de usuario) y que se va a diagramar SOLO para las 4
  historias de usuario seleccionadas en el punto 2.3. Este diagrama sirve para ver como colaboran los casos de uso entre si.
  2. Crear el diagrama UML de contexto usando el agente `uml-diagrams-maker.md` semejante al de la imagen adjunta de ejemplo
  3. Guarda el diagrama UML en formato .puml en `system_architecture/user_stories_view`

**Prompt 11: Crear diagrama de estado por cada historia de usuario (Claude Opus 4.8)**

Crear un diagrama de estado UML especifico para cada caso de uso HU1-HU4 donde las transiciones serán mensajes que se mandan entre los actores y el sistema y los nodos son los estados que aparecen en el
diagrama de contexto `system_architecture/user_stories_view/context-model_selected-user-stories.puml`. Guardar estos cuatro ficheros .puml en la carpeta `system_architecture/user_stories_view`

**Prompt 12: Crear vista de interfaz para cada historia de usuario (Claude Opus 4.8)**

Dibujar unas vistas de interfaz para estos 4 casos de uso HU1-HU4 para adjuntarlas como documentación en la fase de Iniciación de RUP con draw.io

**Prompt 13: Crear vistas de interfaz especificas siguiendo el diagrama de estados de cada historia de usuario (Claude Opus 4.8)**

Genera con draw.io un conjunto de vistas para cada historia de usuario HU1-HU4 para mostrar como se veran las pantalla de cada estado que aparece en el diagrama de estados especifico de historia de usuario.
Los diagramas de estados de cada historia de usuario son: @system_architecture/user_stories_view/state-diagram_hu1.png , @system_architecture/user_stories_view/state-diagram_hu2.png,
  @system_architecture/user_stories_view/state-diagram_hu3.png y @system_architecture/user_stories_view/state-diagram_hu4.png
Almacena estas vistas en una carpeta por historia de usuario en @system_architecture/user_stories_view
