[<- Volver al README principal](../readme.md)

## 10. Instrucciones de instalación

El código de aplicación vive bajo `code/`: backend NestJS 11 (con MongoDB 8.3 vía Mongoose y
migraciones `migrate-mongo`) en `code/backend`, y frontend Angular 22 en `code/frontend`. La base
de datos MongoDB 8.3 se ejecuta **dockerizada** (`code/docker-compose.yml`). Los comandos se
ejecutan **desde la raíz del repositorio** salvo que se indique otra ruta.

```text
.
├── code/
│   ├── backend/            # NestJS 11 + Mongoose + migrate-mongo
│   ├── frontend/           # Angular 22
│   └── docker-compose.yml  # MongoDB 8.3 dockerizado
└── sections_readme/
```

### 10.1. Herramientas necesarias

Para ejecutar el proyecto en un servidor local necesitas:

- **Git**.
- **Docker** con **Docker Compose v2** (para MongoDB 8.3).
- **Node.js** LTS (**20**, **22** o **24**; recomendada la **24**), gestionado con **nvm**.

Instalación de Node con **nvm** (permite tener varias versiones a la vez):

```bash
# 1. Instalar nvm (consulta la última versión en https://github.com/nvm-sh/nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc        # o ~/.zshrc; o abre una terminal nueva

# 2. Instalar y fijar la versión de Node del proyecto
nvm install 24
nvm alias default 24
node -v && npm -v
```

Cada subproyecto incluye un `.nvmrc` (Node 24); ejecutando `nvm use` dentro de `code/backend` o
`code/frontend` se selecciona automáticamente esa versión. El CLI de Angular no se instala de
forma global: se usa el local del proyecto a través de los scripts de npm.

### 10.2. Preparar el entorno (dependencias y configuración)

Base de datos (variables del contenedor MongoDB):

```bash
cd code
cp .env.example .env    # usuario, contraseña, base de datos, puerto y ruta del volumen
```

`code/.env` (ignorado por git) lo lee `docker-compose.yml`; `code/.env.example` es la plantilla
versionada con datos genéricos. Ajusta las contraseñas reales. El usuario de aplicación se crea
automáticamente al levantar el contenedor (ver la sección de arranque).

Backend:

```bash
cd code/backend
nvm use                 # Node 24 (.nvmrc)
npm install
cp .env.example .env    # crea tu .env desde la plantilla y edita los valores reales
```

`.env` (ignorado por git) contiene los datos privados de conexión; `.env.example` es la plantilla
versionada sin secretos. Las credenciales de `MONGODB_URI` son las del **usuario de aplicación**
(`MONGO_APP_*` de `code/.env`), y `authSource` es la base de datos del proyecto (donde se crea ese
usuario). Variables:

```bash
MONGODB_URI=mongodb://bookings_app:change_me_app@localhost:27017/bookings?authSource=bookings
MONGODB_DB=bookings
PORT=3000
NODE_ENV=development
```

Frontend:

```bash
cd code/frontend
nvm use
npm install
```

---

## Cómo levantar el backend y el frontend

Cada bloque se ejecuta en su propia terminal.

### 1. Base de datos (MongoDB dockerizada)

```bash
cd code
docker compose up -d mongo     # MongoDB 8.3 en mongodb://localhost:27017
```

Al arrancar por primera vez (con el volumen vacío), `code/mongo-init/create-app-user.sh` crea el
**usuario de aplicación con privilegios mínimos** (`readWrite` + `dbAdmin` **solo** sobre la base
de datos del proyecto). El usuario **root** (`MONGO_INITDB_ROOT_*`) queda reservado a la
administración del contenedor: **la API y las migraciones NO usan root**, usan el usuario de
aplicación (`MONGO_APP_*`).

Los datos persisten en `code/mongo-data`. Comprobación: `docker compose ps`.

> El script de creación del usuario solo se ejecuta en esa **primera inicialización**. Si ya habías
> arrancado el contenedor antes de añadirlo, párala y elimina el volumen para re-inicializar:
> `docker compose down && rm -rf code/mongo-data` (borra los datos locales).

### 2. Migraciones (crea colecciones, índices y validadores)

```bash
cd code/backend
npx migrate-mongo status       # migraciones pendientes
npx migrate-mongo up           # aplica el esquema
```

### 3. Backend (API NestJS)

```bash
cd code/backend
nvm use
npm run start:dev              # API en http://localhost:3000 (recarga en caliente)
```

### 4. Frontend (Angular)

```bash
cd code/frontend
nvm use
npm start                      # App en http://localhost:4200
```

### Levantar todo (resumen)

```bash
# Terminal 1 — base de datos
cd code && docker compose up -d mongo

# Terminal 2 — backend
cd code/backend && nvm use && npm run start:dev

# Terminal 3 — frontend
cd code/frontend && nvm use && npm start
```

Con los tres en marcha: frontend en `:4200` consumiendo la API en `:3000`, y la API conectada a
MongoDB (contenedor Docker) en `:27017`.
