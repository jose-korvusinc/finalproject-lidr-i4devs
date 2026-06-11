## 3. Arquitectura del Sistema

[Volver al índice de prompts](../prompts.md)

**Prompt 1: Metaprompt para diagramas C4 (Claude Opus 4.8)**

`system_architecture/domain_model/domain_model.puml` `@bussiness_docs/prd.md` crea un prompt para obtener los diagramas C4 del proyecto.

**Prompt 2: Generar los diagramas C4 (Claude Opus 4.8)**

Eres un experto en arquitectura de software y en el modelo C4 (Context, Containers, Components, Code) de Simon Brown.
No tomes decisiones, pregunta todo lo que necesites.
Basándote en la información del PRD `bussiness_docs/prd.md` y en el modelo del dominio `system_architecture/domain_model/domain_model.puml`, crea los diagramas C4 del proyecto usando la sintaxis del lenguaje plantUML con la librería `C4-PlantUML` (`!include` de `C4_Context.puml`, `C4_Container.puml` y `C4_Component.puml`).
Tener en cuenta estos criterios para crear los diagramas:
1. Genera tres niveles de abstracción, cada uno en su propio fichero:
   1.1. Nivel 1 - System Context: el sistema como una caja negra, sus usuarios (Super-Admin, Tenant Admin/Dueño, Empleado, Cliente Final) y los sistemas externos con los que interactúa (Google Calendar, proveedor de email).
   1.2. Nivel 2 - Containers: las unidades desplegables del sistema (frontend Angular, API NestJS, base de datos MongoDB, caché Redis, etc.) y cómo se comunican entre sí y con los actores y sistemas externos.
   1.3. Nivel 3 - Components: el desglose interno del contenedor de la API (controladores/módulos principales: reservas, disponibilidad, OTP, notificaciones, multitenancy, etc.) y sus relaciones.
2. Respeta el stack tecnológico definido en el punto 4 del PRD (NestJS 11, MongoDB 8.3, Redis, Angular 22) y refléjalo en las tecnologías de cada contenedor/componente.
3. Mantén la coherencia con los actores y conceptos del modelo del dominio y del glosario.
4. Cada relación debe indicar el propósito y, cuando aplique, el protocolo/tecnología de comunicación (HTTPS/REST, etc.).
5. Los nombres y etiquetas de los elementos deben estar en inglés; las descripciones pueden ir en español.
El resultado debe ser guardar cada diagrama en formato plantuml en `system_architecture/c4_model/c1_system_context.puml`, `system_architecture/c4_model/c2_containers.puml` y `system_architecture/c4_model/c3_components.puml`.

TRABAJO MANUAL: Revisar y ajustar las tecnologías y relaciones entre contenedores y componentes según las decisiones reales de arquitectura.

**Prompt 3: Describir los componentes principales del proyecto (Claude Opus 4.8)**

Eres un experto en arquitectura de software y en documentación técnica.
No tomes decisiones, pregunta todo lo que necesites.
Basándote en los diagramas C4 (`system_architecture/design_view/c1_system_context.puml`, `system_architecture/design_view/c2_containers.puml`, `system_architecture/design_view/c3_components_api.puml`), el modelo del dominio `system_architecture/domain_model/domain_model.puml`, el glosario `system_architecture/domain_model/glossary.txt` y el PRD `bussiness_docs/prd.md`, redacta una breve descripción de los componentes principales del proyecto.
Tener en cuenta estos criterios:
1. Agrupa la descripción por nivel C4:
   1.1. Actores y sistemas externos (C1): quién usa el sistema y con qué sistemas externos integra.
   1.2. Contenedores (C2): Reverse Proxy, Web App, API, MongoDB y Redis.
   1.3. Componentes internos clave de la API (C3): middleware multitenant, motor de disponibilidad, reservas, OTP, recordatorios, sincronización de calendario, etc.
2. Para cada componente indica de forma concisa (2-4 líneas): su responsabilidad, la tecnología que usa y sus relaciones/dependencias principales.
3. Mantén la coherencia de nombres con los ficheros `.puml` y el glosario; los nombres de los componentes en inglés y las descripciones en español.
4. No inventes componentes ni tecnologías que no aparezcan en los diagramas C4, el modelo del dominio o el PRD.
5. Usa la terminología del glosario y del modelo del dominio para evitar ambigüedades.
El resultado debe ser añadir la descripción de los componentes principales en la sección de arquitectura del README `sections_readme/03-system-architecture.md`, justo debajo de los diagramas C4 (sección 3.2).

TRABAJO MANUAL: Revisar que cada descripción se corresponde con la implementación real y completar los matices de despliegue/seguridad.

**Prompt 2:**

**Prompt 3:**

### **3.3. Descripción de alto nivel del proyecto y estructura de ficheros**

**Prompt 1:**

**Prompt 2:**

**Prompt 3:**

### **3.4. Infraestructura y despliegue**

**Prompt 1:**

**Prompt 2:**

**Prompt 3:**

### **3.5. Seguridad**

**Prompt 1:**

**Prompt 2:**

**Prompt 3:**

### **3.6. Tests**

**Prompt 1:**

**Prompt 2:**

**Prompt 3:**
