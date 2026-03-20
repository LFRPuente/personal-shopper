# Instrucciones para el agente: dockerizar este proyecto

## Objetivo
Dockerizar el estado actual del repositorio para que el proyecto pueda levantarse con contenedores de forma reproducible.

La meta de esta tarea es infraestructura y empaquetado, no desarrollo funcional del producto.

## Alcance real de esta tarea
El agente debe:

- Analizar la estructura actual del repo y contenerizar lo que ya existe.
- Preparar backend, frontend y configuracion compartida para ejecutarse en Docker.
- Dejar una forma clara de levantar el proyecto con un solo comando.
- Documentar o dejar automatizado el arranque minimo necesario.

El agente no debe:

- Implementar nuevas features del backlog funcional.
- Redisenar modelos, flujos o pantallas salvo que sea estrictamente necesario para que Docker funcione.
- Basarse en scripts `.bat`.

## Nota importante sobre scripts antiguos
Los archivos `.bat` del repositorio ya no forman parte del flujo actual. Fueron usados antes para exponer servicios por Cloudflare Tunnel o para desarrollo local en Windows.

Para esta tarea:

- No usar `.bat` como fuente de verdad.
- No copiar comandos desde `.bat` a Docker sin validar que sigan siendo correctos.
- La fuente de verdad debe ser el codigo actual del repo y la configuracion nueva de Docker.

## Estado actual del proyecto que el agente debe respetar

- Backend: Django con ASGI y WebSocket.
- Frontend: React con Vite.
- La app usa Channels para tiempo real.
- La configuracion actual usa SQLite.
- El comportamiento por defecto debe seguir funcionando con SQLite.
- La app maneja archivos `media/`.
- El frontend hoy tiene configuracion de proxy pensada para local.
- Para esta tarea se debe agregar soporte por entorno para Postgres.
- Para esta tarea se debe agregar soporte por entorno para Redis.
- Estos cambios no deben romper el funcionamiento actual con SQLite e `InMemoryChannelLayer`.

## Regla principal
No asumir que para dockerizar hay que completar el backlog funcional del producto.

Los puntos funcionales existentes sirven solo como contexto del negocio. No son el alcance de esta tarea salvo que alguno afecte directamente el arranque en Docker.

## Restriccion adicional: no interferir con otros proyectos de la computadora
La dockerizacion de este proyecto no debe romper, detener, tomar puertos ni reutilizar por accidente servicios de otros proyectos que ya esten corriendo en la maquina.

Esto aplica a:

- puertos expuestos en host
- nombres de contenedores
- nombres de volumenes
- redes de Docker
- bases de datos o Redis compartidos con otros proyectos
- rutas locales montadas en volumen

## Entregables minimos esperados
El agente debe dejar, como minimo:

- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml`
- `.dockerignore` donde haga falta
- variables de entorno necesarias documentadas o definidas con un `.env.example`
- comando de arranque reproducible
- validacion minima de que frontend y backend levantan

Si detecta que falta un manifiesto reproducible de dependencias Python, tambien debe crearlo.

## Errores que el agente NO debe cometer

### 1. Mezclar dockerizacion con backlog funcional
Error:

- Intentar implementar home, calculadora, reportes, nuevas vistas o cambios de UX como parte de esta tarea.

Correccion:

- Dockerizar el estado actual del repo.
- Si hay backlog funcional pendiente, dejarlo fuera de alcance.

### 2. Usar el servidor incorrecto para el backend
Error:

- Arrancar Django con una configuracion que ignore ASGI y WebSocket.
- Usar un flujo pensado solo para WSGI si eso rompe Channels.

Correccion:

- Levantar el backend con ASGI.
- Usar un servidor compatible con ASGI, por ejemplo `daphne` o `uvicorn`.

### 3. Asumir que el channel layer en memoria es suficiente en cualquier escenario
Error:

- Dejar tiempo real montado con backend en varios procesos o varios contenedores usando solo memoria local.

Correccion:

- Mantener `InMemoryChannelLayer` como default para no romper el flujo actual.
- Agregar soporte configurable para Redis por variables de entorno.
- Documentar que Redis se usa cuando se quiera probar o desplegar una configuracion mas cercana a contenedores reales.

### 4. Romper la comunicacion entre contenedores por usar `localhost`
Error:

- Dejar frontend o backend apuntando a `localhost` como si ambos procesos vivieran dentro del mismo contenedor.

Correccion:

- Usar nombres de servicio de Docker o variables de entorno.
- Revisar especialmente API base URL, proxy de Vite y WebSocket URL.

### 5. Perder datos por no montar volumenes
Error:

- Guardar SQLite y `media/` dentro del filesystem efimero del contenedor sin volumen.
- Reutilizar un volumen generico que ya este siendo usado por otro proyecto.

Correccion:

- Montar volumen para la base de datos si se mantiene SQLite.
- Montar volumen para `media/`.
- Usar nombres de volumen aislados para este proyecto.

### 6. Inventar dependencias o dejar versiones no reproducibles
Error:

- Instalar paquetes manualmente en la imagen sin dejar un manifiesto claro.
- Usar versiones flotantes sin control para el backend si hoy no existe archivo de dependencias.

Correccion:

- Crear o completar un archivo de dependencias reproducible para Python.
- Instalar solo lo necesario para ejecutar el codigo actual.

### 7. Olvidar dependencias implicitas del backend
Error:

- No declarar librerias que el codigo ya usa.

Correccion:

- Validar al menos dependencias del stack actual: Django, Channels, servidor ASGI, DRF, JWT, CORS y manejo de imagenes.

### 8. Ignorar migraciones al arrancar
Error:

- Construir la imagen pero no correr migraciones.

Correccion:

- Definir un flujo claro para `migrate`.
- Si aplica, automatizarlo en entrypoint o documentarlo en el comando de arranque.

### 9. Dejar configuracion insegura hardcodeada
Error:

- Mantener secretos, hosts o modos de debug como valores fijos sin control por entorno.

Correccion:

- Parametrizar configuracion sensible con variables de entorno.
- Separar razonablemente configuracion de desarrollo y despliegue.

### 10. No definir como se sirven `static` y `media`
Error:

- Suponer que Django servira todo igual que en desarrollo.

Correccion:

- Definir estrategia para `static`.
- Definir estrategia para `media`.
- Si se usa `DEBUG=False`, contemplar `collectstatic` y el servidor correspondiente.

### 11. No exponer correctamente el frontend en Docker
Error:

- Levantar Vite sin escuchar en `0.0.0.0`.

Correccion:

- Ajustar Vite o el comando de arranque para aceptar conexiones desde fuera del contenedor.

### 12. Basarse en supuestos no verificados
Error:

- Entregar archivos Docker sin probar que el proyecto realmente construye y arranca.
- Asumir que puertos, nombres o servicios compartidos estan libres en la maquina.

Correccion:

- Ejecutar validaciones minimas reales.
- Si algo no puede validarse por dependencias faltantes, dejarlo explicado con precision.
- Validar que los puertos elegidos no choquen con otros proyectos ya corriendo.

### 13. Interferir con otros proyectos de la maquina
Error:

- Publicar puertos por defecto que ya pueden estar siendo usados por otros proyectos.
- Definir nombres fijos de contenedores que puedan colisionar.
- Reutilizar redes o volumenes globales sin aislamiento.
- Conectarse por defecto a un Postgres o Redis ya existente en la maquina sin consentimiento explicito.

Correccion:

- Usar puertos configurables y, de preferencia, no tomar puertos comunes sin validarlos.
- Mantener aislamiento por proyecto en nombres, redes y volumenes.
- No usar `container_name` salvo que haya una razon clara.
- Si se usan Postgres o Redis en Docker, deben ser servicios propios de este proyecto.
- Si se usa infraestructura externa ya corriendo, debe indicarse de forma explicita y opt-in.

## Decisiones tecnicas que el agente debe tomar de forma explicita
El agente debe dejar claro cual de estas decisiones tomo:

- SQLite por defecto, con soporte configurable para Postgres.
- Channels en memoria por defecto, con soporte configurable para Redis.
- Frontend en modo desarrollo con Vite o frontend compilado y servido como artefacto estatico.
- Estrategia para `static` y `media`.

No debe dejar estas decisiones implicitas.

## Restricciones tecnicas explicitas de esta tarea
Para evitar sobre-ingenieria o cambios innecesarios, el agente debe respetar estas restricciones:

- Mantener compatibilidad total con SQLite.
- Mantener compatibilidad total con `InMemoryChannelLayer`.
- Agregar Postgres y Redis como opciones activables por entorno.
- No romper el flujo actual de desarrollo local por defecto.
- No interferir con otros proyectos ya corriendo en la computadora.
- Si detecta limitaciones o tradeoffs, debe documentarlos sin reemplazar la configuracion existente de forma silenciosa.

## Reglas de aislamiento para Docker
El agente debe diseñar la dockerizacion con aislamiento local suficiente para convivir con otros proyectos de la maquina:

- usar puertos de host configurables por variables de entorno o por `docker-compose.yml`
- evitar asumir que `5432`, `6379`, `8000` o `5173` estan libres en el host
- preferir exponer solo lo necesario al host
- usar nombres de volumenes propios del proyecto
- usar una red propia del proyecto creada por Compose
- evitar depender de servicios globales de la maquina salvo que se configure de forma explicita

## Que se puede probar antes de dockerizar
Si el entorno local tiene dependencias instaladas, es valido probar primero el proyecto fuera de Docker para reducir incertidumbre.

Pruebas utiles previas:

- instalar dependencias del backend y confirmar que Django arranca
- correr migraciones
- levantar backend ASGI
- instalar dependencias del frontend
- levantar frontend local
- verificar que frontend y backend se comunican
- verificar que la ruta WebSocket responde en el esquema actual
- verificar que el backend puede arrancar tambien con Postgres
- verificar que el channel layer puede arrancar tambien con Redis
- verificar que los puertos elegidos para pruebas no choquen con otros proyectos locales

Limite importante:

- Si el entorno local no tiene dependencias instaladas o no existe un manifiesto reproducible del backend, primero hay que resolver eso.
- No debe inventarse que el proyecto funciona localmente si no pudo validarlo.
- Si se prueban Postgres y Redis, esas pruebas deben ser opt-in por variables de entorno y no deben alterar la configuracion default del proyecto.

## Criterios minimos de aceptacion
La tarea solo se considera bien hecha si el agente puede demostrar, o dejar claramente preparado, que:

- `docker compose up --build` levanta los servicios esperados.
- El frontend abre desde el host.
- El backend responde por HTTP.
- La ruta de API funciona.
- El flujo de WebSocket queda contemplado y no se rompe por la arquitectura elegida.
- Los archivos subidos no se pierden al recrear contenedores.
- La base de datos no se pierde al recrear contenedores, si se mantiene SQLite.
- La solucion no colisiona por defecto con otros proyectos ya corriendo en la computadora.

## Orden de trabajo recomendado
1. Inspeccionar estructura real del repo.
2. Identificar dependencias faltantes para backend y frontend.
3. Crear manifiesto reproducible para Python si no existe.
4. Crear Dockerfile de backend.
5. Crear Dockerfile de frontend.
6. Crear `docker-compose.yml`.
7. Parametrizar variables de entorno.
8. Resolver red entre servicios.
9. Resolver persistencia de base de datos y `media/`.
10. Validar build y arranque.

## Contexto funcional existente: solo referencia, no alcance de esta tarea
El backlog funcional existente incluye, entre otros temas:

- interaccion AV y PS en home
- notificaciones y revisiones de productos
- copiado de fotos
- listado de peticiones en tiempo real
- menu fijo y contenido con scroll
- calculadora por factor o porcentaje
- mejoras en productos por cliente
- desglose de cuenta por mision
- envios
- reportes

Estos puntos no deben implementarse como parte de dockerizar, salvo que alguno revele una dependencia tecnica real necesaria para el arranque del sistema actual.
