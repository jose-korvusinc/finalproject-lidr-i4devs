## 1. Descripción general del producto

[Volver al índice de prompts](../prompts.md)

**Prompt 1: Modificar los aspectos técnicos del PRD (Cursor Auto)**

Modificar el punto 4 de `bussiness_docs/prd.md` para que se use la última versión de Angular en el frontend, ultima versión de NestJs en el backend y MongoDB para la base de datos, diciendo exactamente que versión numérica se usará en cada tecnología.

**Prompt 2: Crear una breve descripción para fichero readme.md (Cursor Auto)**

Dame una breve descripción de 2 o 3 lineas de este proyecto basandote en `bussiness_docs/prd.md`

**Prompt 3: Completar readme con la información general del proyecto (Cursor Auto)**

Completar las secciones que te especifico en `sections_prompts/01-product-overview.md` basandote en la información creada en el fichero `bussiness_docs/prd.md`.
Secciones:
1. Descripción general del producto
2. Objetivo del Proyecto
3. Características y Funcionalidades Principales

**Prompt 4: Crear un modelo del dominio y glosario de términos (Claude Opus 4.8)**

Eres un experto en la metodología RUP y modelado UML.
No tomes decisiones, pregunte todo lo que necesites.
Basándote en la información del PRD `bussiness_docs/prd.md`, crea un diagrama del modelo del dominio con UML usando la sintaxis del lenguage plantUML.
Tener en cuenta estos criterios para crear el modelo del dominio:
1. Describe los conceptos más importantes (tipos de objetos) del contexto como objetos del dominio y los enlaces de éstos a otros. El resto de términos menos relevantes se pasan a un documento con el glosario de térmismo del dominio en formato texto, una linea por cada término. Estos conceptos se identifican:
   1.1. Objetos de negocio que representan cosas que son manipuladas en un negocio
   1.2. Objetos del mundo real y conceptos que un sistema necesita hacer un seguimiento
   1.3. Eventos que ocurrirán o han ocurrido
   1.4. Los conceptos deben estar en inglés
2. No hacer el diagrama pensando en software, se trata de modelar la realidad.
3. Ayuda a poner un vocabulario común y a comprender el contexto del dominio.
4. Se representa con un diagrama de clases sin atributos ni métodos.
5. En el glosario de terminos, los terminos tienen que estar en ingles pero la descripción en español.
El resultado debe ser guardar el modelo del dominio en formato plantuml en `system_architecture/domain_model/domain_model.puml` y el glosario de términos en `system_architecture/domain_model/glossary.txt`.

TRABAJO MANUAL: Adaptar las relaciones entre las clases del modelo del dominio.
