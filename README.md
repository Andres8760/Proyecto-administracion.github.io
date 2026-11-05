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

Después ejecuta también `backend/sql/datos_prueba.sql`. Agrega estadios, partidos y dos cuentas
para probar los demás roles (solo para desarrollo):

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | admin@futciclar.test | Admin12345 |
| Funcionario | funcionario@futciclar.test | Funcionario123 |

Los hinchas se crean desde la pantalla de registro.

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

## Roles y pantallas

| Rol | Pantallas |
| --- | --- |
| Hincha | Perfil con su QR, puntos e historial; ranking |
| Funcionario | Escáner: lee el QR del hincha y registra el reciclaje; ranking |
| Administrador | Panel: reportes, equipos, estadios, partidos, tipos de residuo y roles de usuarios; ranking |

Todo usuario nuevo se registra como `hincha`. El administrador cambia los roles desde la pestaña
**Usuarios** del panel.

Para probar el escáner sin cámara: inicia sesión como hincha, copia su código desde la base
(`SELECT qr_token FROM usuarios`) y pégalo en el campo "O escribe el código del QR" del escáner.
También se puede subir una foto o captura del QR.
