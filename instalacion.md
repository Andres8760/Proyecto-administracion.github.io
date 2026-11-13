# Instalación y ejecución

## Requisitos

- Node.js 22.18 o superior (el frontend lo exige en su `package.json`)
- PostgreSQL con pgAdmin (opcional) o la herramienta `psql`

## 1. Crear la base de datos

Con pgAdmin:

1. Clic derecho en *Databases* → *Create* → *Database…* y ponle de nombre `futciclar`.
2. Clic derecho en la base `futciclar` → *Query Tool*.
3. Abre `backend/sql/schema.sql`, pega todo su contenido y ejecútalo (F5).

Con terminal:

```bash
psql -U postgres -c "CREATE DATABASE futciclar"
psql -U postgres -d futciclar -f backend/sql/schema.sql
```

`schema.sql` crea las tablas y carga datos de ejemplo (6 equipos y 3 tipos de residuo).

Después ejecuta también `backend/sql/datos_prueba.sql`. Agrega estadios, partidos y dos cuentas para probar los demás roles. Se puede correr varias veces sin duplicar datos.

{% hint style="warning" %}
Las cuentas de prueba son **solo para desarrollo**. Nunca deben existir en un sistema real.
{% endhint %}

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | admin@futciclar.test | Admin12345 |
| Funcionario | funcionario@futciclar.test | Funcionario123 |

Los hinchas se crean desde la pantalla de registro.

## 2. Configurar y correr el backend

Crea el archivo `backend/.env` con estas variables:

```env
DATABASE_URL=postgresql://postgres:TU_CONTRASENA@localhost:5432/futciclar
JWT_SECRET=una_cadena_larga_y_secreta
PORT=3000
```

| Variable | Obligatoria | Para qué sirve |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Cadena de conexión a PostgreSQL |
| `JWT_SECRET` | Sí | Clave con la que se firman los tokens de sesión |
| `PORT` | No | Puerto de la API (por defecto 3000) |

Si falta `DATABASE_URL` o `JWT_SECRET`, el servidor se detiene al arrancar con un mensaje de error.

{% hint style="danger" %}
El archivo `.env` contiene contraseñas y **no debe subirse a GitHub**. El `.gitignore` del proyecto ya lo excluye.
{% endhint %}

```bash
cd backend
npm install
npm run dev
```

Para comprobar que funciona, abre <http://localhost:3000/api/salud>. Debe responder `{"ok": true, ...}`.

## 3. Correr el frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Abre <http://localhost:5173>.

El frontend reenvía las peticiones que empiezan por `/api` al backend (por defecto `http://localhost:3000`). Si el puerto 3000 está ocupado en tu computador, crea `frontend/.env.local` con:

```env
VITE_API_URL=http://localhost:OTRO_PUERTO
```

## Probar el escáner sin cámara

1. Inicia sesión como hincha y copia su código desde la base de datos: `SELECT qr_token FROM usuarios`.
2. Inicia sesión como funcionario y pega el código en el campo **"O escribe el código del QR"**.

También se puede subir una foto o captura del QR.

## Demo en GitHub Pages

Los archivos `index.html`, `script.js` y `styles.css` de la raíz son una versión de demostración que replica las pantallas con **datos simulados** guardados en el navegador (`localStorage`). No usa el backend ni la base de datos.
