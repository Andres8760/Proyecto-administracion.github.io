# Futciclar

Aplicación web para que los hinchas del fútbol colombiano reciclen y sumen puntos para su equipo.
Proyecto del grupo futgroup, curso Administración de la Información, Universidad Santiago de Cali.

- **frontend/**: Vue 3 + Vite (puerto 5173)
- **backend/**: Node.js + Express (puerto 3000)
- **Base de datos**: PostgreSQL

## Cómo correr el proyecto

### 1. Crear la base de datos

Con PostgreSQL instalado, abre **pgAdmin**:

1. Clic derecho en *Databases* → *Create* → *Database…* y ponle de nombre `futciclar`.
2. Clic derecho en la base `futciclar` → *Query Tool*.
3. Abre el archivo `backend/sql/schema.sql`, pega todo su contenido y ejecútalo (F5).

O desde una terminal con `psql`:

```
psql -U postgres -c "CREATE DATABASE futciclar"
psql -U postgres -d futciclar -f backend/sql/schema.sql
```

El script crea las tablas y carga datos de ejemplo (6 equipos y 3 tipos de residuo).

### 2. Configurar el backend

Copia `backend/.env.example` como `backend/.env` y cambia `TU_CONTRASENA` por la contraseña del usuario `postgres`.

```
cd backend
npm install
npm run dev
```

Prueba en el navegador: http://localhost:3000/api/salud debe responder `{"ok": true, ...}`.

### 3. Correr el frontend

En otra terminal:

```
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173

## Roles

Todo usuario nuevo se registra como `hincha`. Para probar otros roles, cámbialo en la base de datos:

```sql
UPDATE usuarios SET rol = 'funcionario' WHERE email = 'tu@correo.com';
```
