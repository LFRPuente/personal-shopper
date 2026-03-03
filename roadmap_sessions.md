# Personal Shopper — Roadmap de Implementación por Sesiones

Cada sesión es una unidad de trabajo independiente que se puede completar en una sola conversación.
Al inicio de cada sesión, pide al asistente: **"Implementa la Sesión X del roadmap_sessions.md"**

---

## Sesión 1: Layout Fijo + Modelo Store + Cambio de Status
**Objetivo:** Arreglar nav fijo, crear modelo de tiendas, cambiar los status de producto.

### Backend
1. Crear modelo `Store` en `api/models.py`:
   - `name` CharField(max_length=255)
   - `created_by` FK → User (nullable)
   - `created_at` DateTimeField(auto_now_add)
2. Agregar campo `store` como FK(Store) nullable en `ProductItem`
3. Cambiar las choices de `ProductItem.status` de:
   - `PENDING`, `BOUGHT`, `PAID`, `SHIPPED`
   - A: `ANNOTATED` (Anotado), `IN_REVIEW` (En Revisión), `SHIPPED` (Enviado)
4. Crear `StoreSerializer` con fields `__all__`
5. Crear `StoreViewSet` con CRUD completo (permissions: IsAuthenticated)
6. Registrar ruta `stores` en `api/urls.py`
7. Correr `makemigrations` y `migrate`

### Frontend
1. En `vite.config.js`: verificar que `allowedHosts: true` está configurado
2. En el contenedor principal de `App.jsx`, cambiar `min-h-screen` → `h-screen` y agregar `overflow-hidden` para que nav y header queden fijos y solo el `<main>` scrollee
3. Verificar que el scroll funciona correctamente en Home, Missions, Clients, Profile
4. Build y probar

### Validación
- [ ] El nav inferior NO se mueve al scrollear
- [ ] El header superior NO se mueve al scrollear
- [ ] Solo el contenido central scrollea
- [ ] El modelo Store existe en la BD
- [ ] Los status de ProductItem son: ANNOTATED, IN_REVIEW, SHIPPED

---

## Sesión 2: Calculadora (Nueva Vista)
**Objetivo:** Agregar una nueva pestaña "Calculadora" con modo Factor y modo Porcentaje.

### Frontend
1. Agregar nueva tab `CALCULATOR` en el nav inferior (icon: `calculate`), entre Clients y Profile
2. Crear estado para la calculadora:
   - `calcMode`: 'FACTOR' | 'PERCENTAGE' (default: 'FACTOR')
   - `calcFactor`: número (default: último guardado en localStorage, o 1.5)
   - `calcPrice`: string (input del usuario)
   - `calcTaxes`: número (default: último guardado, o 0.08)
   - `calcCommission`: número (default: último guardado, o 0.10)
   - `calcExchangeRate`: número (default: último guardado, o 17.5)
3. Crear función `renderCalculator()`:
   - Toggle visual para cambiar entre Factor y Porcentaje
   - **Modo Factor:**
     - Input: "Precio" (número)
     - Input editable: "Factor" (se guarda en localStorage al cambiar)
     - Resultado = Precio × Factor, mostrado grande y clicable
     - Al click en resultado → `navigator.clipboard.writeText()` + feedback visual "Copiado ✓"
   - **Modo Porcentaje:**
     - Input: "Monto" (número)
     - Tres inputs editables: Taxes (tx), Comisión (%), Tipo de Cambio (tc) — se guardan en localStorage
     - Resultado = Monto × (1 + Comisión) × (1 + Taxes) × TC
     - Al click en resultado → copiar + feedback visual
4. Diseño: estilo premium con tarjetas, colores diferenciados para cada modo, animación suave al copiar
5. Guardar las constantes en localStorage cada vez que cambien

### Validación
- [ ] La calculadora aparece como nueva tab en el nav
- [ ] Modo Factor multiplica correctamente y copia al portapapeles
- [ ] Modo Porcentaje calcula con las 3 constantes y copia al portapapeles
- [ ] Las constantes persisten al recargar (localStorage)
- [ ] El nav sigue teniendo 5 tabs equilibradas visualmente

---

## Sesión 3: Mejoras en Vista de Productos por Cliente (Parte 1)
**Objetivo:** Optimizar galería de productos, imágenes completas, fecha de misión, contadores.

### Backend
1. Modificar `ProductItemSerializer` para incluir `mission_name` y `mission_date` como campos de solo lectura:
   - `mission_name = serializers.CharField(source='mission.name', read_only=True, default=None)`
   - `mission_date = serializers.DateTimeField(source='mission.start_time', read_only=True, default=None)`

### Frontend — Galería de Productos
1. **Optimizar espacio de imágenes:**
   - Reducir la altura de las imágenes de `h-32` a `h-20`
   - Cambiar `object-cover` por `object-contain` para que se vea la imagen completa
   - Agregar fondo gris claro detrás de la imagen para cuando no cubra todo el espacio
2. **Mostrar fecha de misión:**
   - Debajo del nombre del producto, mostrar la fecha de misión en formato corto (ej: "Mission 3/1/2026")
3. **Contador de productos por estatus:**
   - En la parte superior de la galería (debajo del header del cliente), agregar una fila de badges:
     - `Anotado: X` (color amber)
     - `En Revisión: X` (color orange)
     - No contar Enviado
   - Estos badges son clickeables para filtrar la vista
4. **Botón para ver imagen completa:**
   - Agregar un botón de expansión (icon: `fullscreen`) sobre cada imagen
   - Al hacer click → mostrar modal fullscreen con la imagen
   - El modal tiene botón X para cerrar y se cierra al hacer click fuera

### Validación
- [ ] Las imágenes se ven completas (no cortadas) en las miniaturas
- [ ] Se ve la fecha de la misión en cada producto
- [ ] Los contadores de status funcionan arriba de la galería
- [ ] Se puede ver la imagen en tamaño completo

---

## Sesión 4: Mejoras en Vista de Productos por Cliente (Parte 2)
**Objetivo:** Cambiar tabs de galería, mejorar Edit Product Info, dropbox de tiendas, tags como listado.

### Frontend — Tabs de la Galería
1. Cambiar las 2 tabs actuales `Products` / `Tickets` por:
   - **"Revisión"** → muestra productos con status `IN_REVIEW` 
   - **"Anotado"** → muestra productos con status `ANNOTATED`
   - Quitar tab "Tickets" por ahora
   - Si un producto tiene status `SHIPPED`, no aparece en ninguna de las dos (o aparece con un indicador de completado)

### Frontend — Edit Product Info Modal
1. Cambiar labels:
   - "Real Store Price" → **"Store Price (USD)"**
   - "Charged Price (PS)" → **"Final Price (MXN)"** — este campo es **de solo lectura**, se calcula automáticamente
2. Agregar toggle Factor/Porcentaje dentro del modal (igual que en la calculadora):
   - Si Factor: Final Price = Store Price × Factor
   - Si Porcentaje: Final Price = Store Price × (1 + %) × (1 + tx) × tc
   - Los valores de Factor/tx/%/tc se toman del localStorage (mismos que la calculadora)
   - El Final Price se actualiza en tiempo real al cambiar Store Price o las constantes
3. **Tags como listado:**
   - En lugar de un input de texto separado por comas, mostrar un listado de tags como chips/badges
   - Cada tag tiene un botón X para eliminarlo
   - Input de texto + botón "+ Add" para agregar un nuevo tag
   - Al guardar, se juntan en string separado por comas para enviar al backend
4. **Dropdown de Tienda:**
   - Dropdown/select con buscador para seleccionar tienda
   - Hacer fetch de `/stores/` para obtener la lista
   - Si el usuario es AV, puede agregar una tienda nueva con un botón "+ Add Store" que abre un mini-input inline
   - Al seleccionar tienda, se guarda el `store` FK en el producto
5. **Status dropdown:**
   - Cambiar opciones de: PENDING/BOUGHT/PAID/SHIPPED → **Anotado / En Revisión / Enviado**

### Validación
- [ ] Las tabs muestran Revisión y Anotado correctamente
- [ ] Final Price se calcula automáticamente al cambiar Store Price
- [ ] Los tags se muestran como chips con botón X y se pueden agregar nuevos
- [ ] El dropdown de tiendas funciona con buscador
- [ ] Se pueden crear tiendas nuevas desde el AV
- [ ] Los status del dropdown son Anotado, En Revisión, Enviado

---

## Sesión 5: Copiar Fotos + Desglose de Cuenta + CSV
**Objetivo:** Copiar imágenes al portapapeles, generar desglose formateado por cliente en misiones, exportar CSV.

### Frontend — Copiar Fotos (Feature #2)
1. Al hacer click sobre la imagen de un producto (en la galería):
   - Fetch de la imagen como blob
   - Usar `navigator.clipboard.write([new ClipboardItem({'image/png': blob})])`
   - Mostrar feedback visual "📋 Imagen copiada" durante 2 segundos
   - Funciona tanto para PS como para AV

### Frontend — Desglose de Cuenta (Feature #7)
1. En `renderMissions()`, dentro de la sección expandida de una misión **completada**:
   - Por cada cliente en la misión, agregar botón **"📋 Copiar Desglose"**
   - Al hacer click, generar texto con formato:
     ```
     DESGLOSE DE TU CUENTA:

     * [nombre producto] – $[final_price formateado con comas]
     * [nombre producto] – $[final_price formateado con comas]

     TOTAL TIENDA: $[suma total formateado con comas]

     Para poder pasar a caja ocupo la confirmacion de tu pago 💳 🤗
     ```
   - Copiar al portapapeles con `navigator.clipboard.writeText()`
   - Cambiar color de fondo de la tarjeta del cliente a verde claro para indicar que ya se copió
   - Usar estado local `copiedClients` (Set de IDs) para rastrear cuáles ya se copiaron

2. Botón **"📊 Export CSV"** en la misión:
   - Generar CSV con columnas: `Cliente, Producto, Store Price (USD), Final Price (MXN), Status, Tienda, Tags`
   - Incluir todos los clientes y sus productos de esa misión
   - Descargar automáticamente como archivo `.csv`

### Backend — Desactivar Clientes al Terminar Misión (Feature #7)
1. En `MissionViewSet.perform_update()`:
   - Cuando el status cambia a `COMPLETED`:
     - Obtener todos los clientes de la misión
     - Setear su status a `'Pending'`
     - `mission.clients.all().update(status='Pending')`
2. En el frontend `endMission()`:
   - Después de terminar la misión, refrescar la lista de clientes (re-fetch)

### Validación
- [ ] Click en imagen de producto copia al portapapeles
- [ ] Botón de copiar desglose genera el texto correcto
- [ ] El texto formatead incluye los precios finales (MXN) con formato de moneda
- [ ] Al copiar, la tarjeta del cliente cambia de color
- [ ] El CSV se descarga correctamente con todos los datos
- [ ] Al terminar una misión, los clientes pasan a status Pending

---

## Sesión 6: Sección de Peticiones AV ↔ PS en Home
**Objetivo:** Crear sistema de peticiones en tiempo real entre AV y PS.

### Backend
1. Crear modelo `Request` en `api/models.py`:
   - `description` TextField
   - `created_by` FK → User
   - `mission` FK → Mission (nullable)
   - `status` CharField choices: `PENDING`, `ACKNOWLEDGED` (Enterado), `NO_STOCK`, `DISCARDED`, `MODIFIED`
   - `product` FK → ProductItem (nullable, para vincular a producto específico)
   - `note` TextField (opcional, nota de modificación)
   - `created_at` DateTimeField(auto_now_add)
   - `updated_at` DateTimeField(auto_now)
2. Crear `RequestSerializer` y `RequestViewSet`
3. En `RequestViewSet.get_queryset()`: filtrar por misión activa
4. Registrar ruta `requests` en `api/urls.py`
5. Correr `makemigrations` y `migrate`

### Frontend
1. En `renderHome()`, después de la lista de clientes en misión:
   - Sección "Peticiones" con scroll invisible (`scrollbar-width: none`, `max-h-[250px]`, `overflow-y-auto`)
   - Cada petición muestra:
     - Descripción
     - Quién la creó (AV/PS)
     - Timestamp relativo (hace 5 min, etc.)
     - 4 botones de acción:
       - **Enterado** (icon: `check`) → status: ACKNOWLEDGED
       - **No Existencia** (icon: `block`) → status: NO_STOCK
       - **Descartar** (icon: `delete`) → status: DISCARDED
       - **Modificar** (icon: `edit`) → abre input para editar descripción
2. Input tipo mini chat para agregar nuevas peticiones:
   - Input de texto + botón enviar en la parte inferior de la sección
   - Ambos roles pueden agregar
3. **Polling cada 10 segundos** para actualizar peticiones:
   - `useEffect` con `setInterval` que hace fetch de `/requests/?mission=<id>`
   - Solo cuando hay misión activa
4. Las peticiones se colorean según status:
   - PENDING: blanco/neutro
   - ACKNOWLEDGED: azul claro
   - NO_STOCK: rojo claro
   - DISCARDED: gris tachado
   - MODIFIED: amarillo

### Validación
- [ ] Las peticiones aparecen en Home cuando hay misión activa
- [ ] Ambos roles pueden crear peticiones
- [ ] Los 4 botones de acción funcionan
- [ ] Las peticiones se actualizan automáticamente (polling)
- [ ] El scroll es invisible y no ocupa mucho espacio
- [ ] Las peticiones se filtran por misión activa

---

## Sesión 7: Interacción Completa AV ↔ PS (Revisión de Productos)
**Objetivo:** Sistema completo de revisión de productos con notificaciones parpadeantes y alternativas.

### Backend
1. Crear modelo `ProductReview` en `api/models.py`:
   - `product` FK → ProductItem
   - `requested_by` FK → User (el AV que solicita la revisión)
   - `review_note` TextField (nota del AV: "Verificar talla M", "Hay existencia?")
   - `review_type` CharField choices: `CHECK_SIZE` (Verificar talla/tamaño), `CHECK_STOCK` (Existencia), `CHECK_OTHER`
   - `status` CharField choices: `PENDING`, `CONFIRMED`, `NO_STOCK`, `ALTERNATIVE_SENT`, `REPLACED`, `DISCARDED`
   - `ps_response` TextField (respuesta del PS, nullable)
   - `created_at`, `updated_at`
2. Crear modelo `ReviewAlternative` para fotos de alternativas:
   - `review` FK → ProductReview
   - `image` ImageField(upload_to='alternatives/')
   - `description` CharField (opcional)
   - `is_selected` BooleanField (default: False)
3. Crear serializers y viewsets para ambos modelos
4. Endpoints custom:
   - `POST /reviews/<id>/confirm/` → PS confirma existencia
   - `POST /reviews/<id>/no-stock/` → PS indica no hay stock
   - `POST /reviews/<id>/send-alternative/` → PS sube fotos alternativas
   - `POST /reviews/<id>/select-alternative/<alt_id>/` → AV selecciona alternativa (reemplaza o descarta original)
5. Correr migraciones

### Frontend
1. **Galería de productos — indicadores de revisión:**
   - Los productos con un `ProductReview` en status `PENDING` tienen animación CSS de parpadeo (border pulsante)
   - Estos productos aparecen **primero** en la lista (sort)
   - Debajo de cada producto con revisión: nota del AV en un mini-card amarillo

2. **PS: Acciones de revisión** (cuando el PS ve un producto con review pendiente):
   - Botón **"✓ Confirmar"** → marca como CONFIRMED
   - Botón **"✗ No existe"** → marca como NO_STOCK
   - Botón **"📸 Enviar Alternativa"** → abre modal para subir fotos de alternativas con descripción
   
3. **AV: Gestión de alternativas** (cuando PS envía alternativas):
   - El producto parpadea con notificación de "Alternativas disponibles"
   - Al abrir, ve las fotos de alternativas del PS
   - Puede:
     - **Seleccionar alternativa** → reemplaza al producto original (se crea nuevo ProductItem con los datos de la alternativa)
     - **Quedarse con el original** → marca review como CONFIRMED
     - **Descartar todo** → marca review como DISCARDED y el producto se quita de la lista del cliente

4. **CSS animation para parpadeo:**
   ```css
   @keyframes pulse-border {
     0%, 100% { border-color: transparent; }
     50% { border-color: #f59e0b; }
   }
   .review-pending {
     animation: pulse-border 1.5s ease-in-out infinite;
   }
   ```

5. **Polling:**
   - Cada 10 segundos, re-fetch de reviews pendientes para el cliente actual
   - Cuando llega una nueva review, mostrar badge de notificación en el nav

### Validación
- [ ] El AV puede solicitar revisión de un producto
- [ ] El PS ve la nota del AV debajo del producto, parpadeando
- [ ] Los productos con revisión pendiente aparecen primero
- [ ] El PS puede confirmar existencia, reportar no-stock, o subir alternativas
- [ ] El AV ve las alternativas con fotos
- [ ] El AV puede seleccionar alternativa (reemplaza original) o descartar
- [ ] Las notificaciones parpadean correctamente
- [ ] El polling actualiza la vista en ambos roles

---

## Sesión 8: WebSockets con Django Channels (Tiempo Real Instantáneo)
**Objetivo:** Reemplazar el polling de 1 segundo por WebSockets para que los cambios se vean instantáneamente (~100ms).

> **Nota:** Actualmente se tiene polling global cada 1 segundo que funciona bien para ≤5 usuarios. Esta sesión es opcional y se recomienda solo si se necesita escalar a más usuarios o se quiere eliminar el polling por completo.

### Backend — Instalar Django Channels
1. Instalar dependencias:
   ```bash
   pip install channels daphne
   ```
2. En `settings.py`:
   - Agregar `'daphne'` al inicio de `INSTALLED_APPS` (antes de `django.contrib.admin`)
   - Agregar `'channels'` a `INSTALLED_APPS`
   - Cambiar `WSGI_APPLICATION` por `ASGI_APPLICATION = 'backend.asgi.application'`
   - Agregar channel layer en memoria para desarrollo:
     ```python
     CHANNEL_LAYERS = {
         'default': {
             'BACKEND': 'channels.layers.InMemoryChannelLayer'
         }
     }
     ```
3. Crear `backend/asgi.py`:
   ```python
   import os
   from django.core.asgi import get_asgi_application
   from channels.routing import ProtocolTypeRouter, URLRouter
   from channels.auth import AuthMiddlewareStack
   from api.routing import websocket_urlpatterns

   os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

   application = ProtocolTypeRouter({
       'http': get_asgi_application(),
       'websocket': AuthMiddlewareStack(
           URLRouter(websocket_urlpatterns)
       ),
   })
   ```

### Backend — Crear WebSocket Consumer
4. Crear archivo `api/consumers.py`:
   - Clase `UpdatesConsumer(AsyncWebsocketConsumer)`:
     - `connect()`: unirse al grupo `"updates"`
     - `disconnect()`: salir del grupo
     - `receive()`: recibir mensajes del frontend (no necesario por ahora)
     - `send_update()`: enviar notificación de cambio a todos los conectados
5. Crear archivo `api/routing.py`:
   ```python
   from django.urls import path
   from .consumers import UpdatesConsumer

   websocket_urlpatterns = [
       path('ws/updates/', UpdatesConsumer.as_asgi()),
   ]
   ```

### Backend — Emitir Eventos en las Views
6. Modificar `ClientViewSet`, `ProductItemViewSet`, `ReceiptViewSet`, `MissionViewSet`:
   - En `perform_create`, `perform_update`, `perform_destroy`:
     - Enviar mensaje al grupo `"updates"`:
       ```python
       from channels.layers import get_channel_layer
       from asgiref.sync import async_to_sync

       channel_layer = get_channel_layer()
       async_to_sync(channel_layer.group_send)(
           'updates',
           {'type': 'send_update', 'model': 'clients'}  # o 'missions', 'products'
       )
       ```

### Frontend — Conectar WebSocket
7. En `App.jsx`:
   - Al iniciar sesión, crear conexión WebSocket:
     ```javascript
     const ws = new WebSocket('wss://tu-url/ws/updates/');
     ws.onmessage = (event) => {
       const data = JSON.parse(event.data);
       if (data.model === 'clients') fetchClients();
       if (data.model === 'missions') fetchMissions();
       if (data.model === 'products' && selectedClient) refreshSelectedClient();
     };
     ```
   - Agregar reconexión automática si se pierde la conexión
   - Quitar el `setInterval(pollData, 1000)` (ya no hace falta)

### Validación
- [ ] El backend arranca con Daphne (ASGI) en vez de WSGI
- [ ] El WebSocket se conecta al abrir la app
- [ ] Al crear/editar/borrar un cliente, todos los usuarios conectados lo ven instantáneamente
- [ ] Al crear/editar una misión, todos lo ven instantáneamente
- [ ] Al agregar un producto, el otro usuario lo ve instantáneamente
- [ ] Si se pierde conexión, el WebSocket se reconecta automáticamente
- [ ] Funciona a través de Cloudflare Tunnel

---

## Notas Generales

> Al inicio de cada sesión, decir:
> **"Implementa la Sesión X del archivo roadmap_sessions.md"**
> El asistente leerá el archivo y seguirá los pasos.

> Después de cada sesión, probar con Cloudflare Tunnel:
> **"Sube la app con Cloudflare Tunnel"**

> Las sesiones 9 (Envíos) y 10 (Reportes) quedan pendientes de definición.
