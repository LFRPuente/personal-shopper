# Docker Agent Guide

Esta guia documenta como esta montado `personal-shopper` y que reglas debe seguir cualquier agente para hacer cambios y desplegarlos sin romper otros servicios del servidor.

## Estado actual

- Dominio publico: `https://ps.servidorfs.com/`
- Proxy publico: `Nginx Proxy Manager` (`npm-app-1`)
- Frontend expuesto solo a traves de NPM
- Backend, Postgres y Redis sin puertos publicados al host
- DNS de `ps.servidorfs.com` creado en Cloudflare como `CNAME -> servidorfs.com` con proxy habilitado

## Arquitectura actual

### Stack de `personal-shopper`

- Archivo principal: [/Users/homeserver/Documents/personal-shopper/docker-compose.yml](/Users/homeserver/Documents/personal-shopper/docker-compose.yml)
- Servicios:
  - `frontend`
  - `backend`
  - `postgres`
  - `redis`

### Redes

- Red interna del stack: `personal-shopper_default`
  - Subred Docker privada, no es la LAN real
  - Aqui viven `postgres`, `redis`, `backend` y `frontend`
- Red compartida con NPM: `npm_default`
  - Subred `172.18.0.0/16`
  - Solo `frontend` esta conectado aqui
  - Alias del frontend en esta red: `ps-frontend`

### Flujo de trafico

- Cliente -> Cloudflare -> NPM -> `ps-frontend:80` -> `backend:8000`
- El `frontend` hace proxy interno de:
  - `/api/` -> `backend:8000/api/`
  - `/media/` -> `backend:8000/media/`
  - `/ws/` -> `backend:8000/ws/`

Archivos clave:

- Compose: [/Users/homeserver/Documents/personal-shopper/docker-compose.yml](/Users/homeserver/Documents/personal-shopper/docker-compose.yml)
- Proxy interno del frontend: [/Users/homeserver/Documents/personal-shopper/frontend/nginx.conf](/Users/homeserver/Documents/personal-shopper/frontend/nginx.conf)
- Config Django: [/Users/homeserver/Documents/personal-shopper/backend/backend/settings.py](/Users/homeserver/Documents/personal-shopper/backend/backend/settings.py)

## Reglas que no se deben romper

1. No publicar puertos nuevos del stack al host salvo que el usuario lo pida explicitamente.
2. No conectar `backend`, `postgres` o `redis` a `npm_default`.
3. Solo `frontend` puede tocar `npm_default`.
4. No apuntar NPM a `192.168.3.100:puerto` para `personal-shopper`.
5. Para `personal-shopper`, NPM debe apuntar a `ps-frontend:80`.
6. No usar una IP fija `172.18.x.x` en NPM; usar alias o nombre de contenedor.
7. No tocar otros proxy hosts o stacks salvo que sea parte explicita de la tarea.
8. No editar credenciales de NPM o Cloudflare salvo que sea imprescindible y este aprobado.

## Estado de NPM relevante

- Proxy host de `personal-shopper`:
  - Dominio: `ps.servidorfs.com`
  - Upstream: `ps-frontend:80`
- Certificado de NPM para `personal-shopper`:
  - `ps.servidorfs.com`
- Varios servicios legacy del servidor fueron corregidos para usar `host.docker.internal` en NPM en lugar de `192.168.3.100`
  - Ejemplos actuales:
    - `home.servidorfs.com`
    - `n8n.servidorfs.com`
    - `chat.servidorfs.com`
    - `waha.servidorfs.com`
    - `stremio.servidorfs.com`

Regla importante:

- No revertir esos upstreams a `192.168.3.100` sin verificar antes desde dentro de `npm-app-1`.

## Estado de Django relevante

Configuracion actual:

- `ALLOWED_HOSTS` incluye `ps.servidorfs.com`
- `CSRF_TRUSTED_ORIGINS` incluye `https://ps.servidorfs.com`
- `SECURE_PROXY_SSL_HEADER` y `USE_X_FORWARDED_HOST` estan activos
- Base de datos por Docker en este stack: `Postgres`
- Channels por Docker en este stack: `Redis`

Regla importante:

- Si cambias el dominio publico, ajusta tambien `DJANGO_ALLOWED_HOSTS` y `DJANGO_CSRF_TRUSTED_ORIGINS`.

## Estado de almacenamiento

Estado actual real:

- `personal-shopper` usa volumenes Docker nombrados
- No esta montado actualmente sobre el disco externo de 20 TB

Volumenes actuales:

- `personal-shopper_personal_shopper_postgres_data`
- `personal-shopper_personal_shopper_redis_data`
- `personal-shopper_personal_shopper_media_data`
- `personal-shopper_personal_shopper_static_data`

Regla importante:

- No asumir que los datos viven en una carpeta del host.
- Si la tarea es mover datos al disco de 20 TB, tratarlo como tarea separada y con validacion propia.

## Como hacer cambios de codigo sin romper el despliegue

### Cambios de frontend

1. Editar el codigo en [/Users/homeserver/Documents/personal-shopper/frontend](/Users/homeserver/Documents/personal-shopper/frontend)
2. Reconstruir solo el frontend:

```bash
cd /Users/homeserver/Documents/personal-shopper
docker compose up -d --build frontend
```

3. Validar:

```bash
docker compose ps
docker exec npm-app-1 node -e "const http=require('http');const req=http.request({host:'ps-frontend',port:80,path:'/',method:'HEAD',timeout:4000},res=>{console.log(res.statusCode);res.resume();});req.on('error',e=>{console.error(e.code||e.message)});req.end();"
curl -I --resolve ps.servidorfs.com:443:127.0.0.1 https://ps.servidorfs.com/
```

### Cambios de backend

1. Editar el codigo en [/Users/homeserver/Documents/personal-shopper/backend](/Users/homeserver/Documents/personal-shopper/backend)
2. Reconstruir solo el backend:

```bash
cd /Users/homeserver/Documents/personal-shopper
docker compose up -d --build backend
```

3. Validar:

```bash
docker compose ps
curl -I --resolve ps.servidorfs.com:443:127.0.0.1 https://ps.servidorfs.com/api/
```

### Cambios de dependencias o de imagen

Si cambias `Dockerfile`, dependencias Python, `package.json`, `nginx.conf` o el `docker-compose.yml`, reconstruye el servicio afectado o el stack completo:

```bash
cd /Users/homeserver/Documents/personal-shopper
docker compose up -d --build
```

## Validacion minima obligatoria despues de cualquier despliegue

Siempre validar estas 3 capas:

### 1. Stack del proyecto

```bash
cd /Users/homeserver/Documents/personal-shopper
docker compose ps
```

Debe quedar `Up`:

- `frontend`
- `backend`
- `postgres`
- `redis`

### 2. Reachability desde NPM

```bash
docker exec npm-app-1 node -e "const http=require('http');const req=http.request({host:'ps-frontend',port:80,path:'/',method:'HEAD',timeout:4000},res=>{console.log(res.statusCode);res.resume();});req.on('error',e=>{console.error(e.code||e.message)});req.end();"
```

Debe responder `200`.

### 3. Dominio publico

```bash
curl -I --resolve ps.servidorfs.com:443:127.0.0.1 https://ps.servidorfs.com/
curl -I --resolve ps.servidorfs.com:443:127.0.0.1 https://ps.servidorfs.com/api/
```

Ambos deben responder `200`.

## Verificacion de no interferencia con otros servicios

Antes y despues de cualquier cambio grande, verificar al menos:

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}' | rg 'npm-app-1|n8n|homarr|chatwoot-chatwoot-1|personal-shopper|NAMES'
```

Y revisar por dominio:

```bash
curl -I --resolve home.servidorfs.com:443:127.0.0.1 https://home.servidorfs.com/
curl -I --resolve n8n.servidorfs.com:443:127.0.0.1 https://n8n.servidorfs.com/
curl -I --resolve chat.servidorfs.com:443:127.0.0.1 https://chat.servidorfs.com/
```

Si alguno falla, detenerse antes de seguir.

## Cambios de NPM

### Para `personal-shopper`

Estado correcto:

- `forward_host = ps-frontend`
- `forward_port = 80`
- `allow_websocket_upgrade = true`

No hacer:

- no apuntar a `192.168.3.100`
- no apuntar a `172.18.x.x` fija

### Para servicios legacy ya existentes

En este servidor varios proxy hosts de NPM ya dependen de:

- `forward_host = host.docker.internal`

No revertirlos a `192.168.3.100` sin probar antes desde `npm-app-1`:

```bash
docker exec npm-app-1 node -e "const http=require('http');const req=http.request({host:'host.docker.internal',port:5678,path:'/',method:'HEAD',timeout:4000},res=>{console.log(res.statusCode);res.resume();});req.on('error',e=>{console.error(e.code||e.message)});req.end();"
```

## DNS y Cloudflare

El subdominio `ps.servidorfs.com` ya existe en Cloudflare.

Regla importante:

- No imprimir ni copiar tokens en respuestas.
- Si una tarea requiere tocar DNS, usar el token ya configurado localmente por el usuario y mantener el cambio minimo.

Ubicacion de referencia del stack de Cloudflare:

- [/Users/homeserver/docker/cloudflare/docker-compose.yml](/Users/homeserver/docker/cloudflare/docker-compose.yml)

## Rollback rapido

### Rollback de codigo del proyecto

Si un cambio de `personal-shopper` rompe solo este stack:

```bash
cd /Users/homeserver/Documents/personal-shopper
docker compose down
git status
git diff
```

Luego restaurar el cambio correcto y reconstruir.

### Rollback de NPM

Existe un respaldo de la base de NPM creado durante esta intervencion:

- [/Users/homeserver/docker/npm/data/database.sqlite.bak.20260311192411](/Users/homeserver/docker/npm/data/database.sqlite.bak.20260311192411)

No restaurarlo a ciegas.

Si NPM se rompe:

1. confirmar `nginx -t` dentro de `npm-app-1`
2. revisar logs de `npm-app-1`
3. revertir solo el proxy host afectado si es posible
4. usar el backup de SQLite solo como ultimo recurso

## No hacer

- No ejecutar comandos globales sobre todos los stacks Docker.
- No usar `docker system prune`.
- No hacer `docker compose down` fuera de [/Users/homeserver/Documents/personal-shopper](/Users/homeserver/Documents/personal-shopper) salvo que el usuario lo pida.
- No mover volumenes a otro disco dentro de una tarea de codigo o de proxy.
- No modificar `personal-shopper` y al mismo tiempo reestructurar `NPM`, `Cloudflare` y almacenamiento si no es estrictamente necesario.

## Resumen operativo

Si un agente solo necesita cambiar codigo y volver a subir:

1. editar codigo en el repo
2. `docker compose up -d --build frontend` o `backend`
3. validar `docker compose ps`
4. validar `ps-frontend` desde `npm-app-1`
5. validar `https://ps.servidorfs.com/`
6. validar que `home`, `n8n` y `chat` sigan respondiendo

Si una tarea requiere tocar proxy o DNS:

1. confirmar que el cambio es realmente necesario
2. preferir agregar antes que reemplazar
3. no tocar hosts existentes salvo necesidad real
4. validar los servicios legacy despues del cambio
