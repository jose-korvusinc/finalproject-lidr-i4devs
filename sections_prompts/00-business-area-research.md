## 0. Investigación del área de negocio

[Volver al índice de prompts](../prompts.md)

**Prompt para investigar el dominio a elegir: (Modelo Gemini 3.5 Flash)**

Necesito ideas de proyectos para poder hacer en un master de implementación usando herramientas de IA para generar el código, no quiero usar la IA para el producto del proyecto.
Tengo una primera idea sobre un proyecto para crear una pasarela de pago genérica.

**Prompt 2:Pedir detalle de una de las dos ideas (Modelo Gemini 3.5 Flash)**

Podrías detallarme un poco mas este proyecto: Sistema de Gestión de Reservas y Citas Multitenant

**Prompt 3: Comparativa entre los dos dominios (Modelo Gemini 3.5 Flash)**

¿Me puedes hacer un documento resumen con las funcionalidad básicas del proyecto "Generic Payment Gateway SaaS" y otro del proyecto "Sistema de Gestión de Reservas y Citas Multitenant" para enviarlo a mi mentor y que me ayude a elegir?

**Prompt 4: Elección del dominio y solicitar historias de usuario (Modelo Gemini 3.5 Flash)**

Me voy a decantar por el proyecto "Sistema de Gestión de Reservas", necesito que tenga entre 8-10 historias de usuario

**Prompt 5: Crear documentación para buscar inversión (Modelo Gemini 3.5 Flash)**

Eres un experto en definir un modelo de negocio y redactar documentación.
Necesito crear un documento más completo con toda la información para presentarlo de forma oficial a un inversor.
El formato del documento debe ser MD.

**Prompt 6: Análisis competencia y funcionalidad (Modelo Gemini 3.5 Flash)**

¿Qué portales de reservas SAAS Multitenant open source y comerciales  son más conocidos?
Compáralos en funcionalidades junto con nuestra definición de proyecto para ver diferencias.
Si detectas alguna funcionalidad que no tengamos definida y sea muy importante, sustituye una historia de usuario poco relevante por esta

**Prompt 7: Eliminar historias de usuario con complejidad técnica (Modelo Gemini 3.5 Flash)**

Esta historia de usuario no la voy a añadir para el desarrollo actual porque añade complejidad con la integración del TPV, lo tendré en cuenta para más adelante.

**Prompt 8: Generar PRD del proyecto (Modelo Gemini 3.5 Flash)**

Actúa como un senior product manager con experiencia en portales de reservas SAAS Multitenant.
Basándote en la información de contexto de alto nivel que has generado, necesito crear un PRD que incluya: objetivos, stakeholders, user stories (usar las que ya has definido), requisitos técnicos, métricas de éxito, riesgos potenciales y criterios de aceptación. Formato MD.

**ARTEFACTOS OBTENIDOS**

* [business_investment_proposal.md](../bussiness_docs/business_investment_proposal.md): Propuesta de inversión y modelo de negocio del portal de reservas SaaS multitenant.
* [competitive_analysis.xlsx](../bussiness_docs/competitive_analysis.xlsx): Comparativa de funcionalidades frente a competidores open source y comerciales.
* [prd.md](../bussiness_docs/prd.md): Documento de requisitos de producto (PRD) con objetivos, user stories, requisitos técnicos, métricas y riesgos.

