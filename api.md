# API del backend

API REST hecha con **Express 5** (Node.js). Responde JSON y corre por defecto en `http://localhost:3000`. Todas las rutas empiezan por `/api`.

## Autenticación

Al iniciar sesión o registrarse, la API devuelve un **token JWT** que dura **7 días**. Para las rutas protegidas se envía en la cabecera:

```
Authorization: Bearer <token>
```

| Código | Cuándo ocurre |
| --- | --- |
| `401` | Falta el token, es inválido o ya venció |
| `403` | El usuario no tiene el rol que exige la ruta |

## Rutas públicas

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/salud` | Comprueba que la API y la base de datos responden |
| GET | `/api/equipos` | Lista de equipos (para el formulario de registro) |
| POST | `/api/auth/registro` | Crea un hincha. Recibe `nombre`, `email`, `password` (mínimo 8 caracteres) y `equipo_id` |
| POST | `/api/auth/login` | Inicia sesión con `email` y `password` |
| GET | `/api/ranking/equipos` | Ranking de equipos (no expone datos personales) |

## Rutas con sesión (cualquier rol)

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/auth/me` | Datos del usuario: equipo, QR, puntos y posiciones |
| GET | `/api/tipos-residuo` | Lista de tipos de residuo |
| GET | `/api/estadios` | Lista de estadios |
| GET | `/api/partidos` | Lista de partidos (más recientes primero) |
| GET | `/api/ranking/hinchas?equipo_id=3` | Ranking de hinchas (máximo 50); `equipo_id` es opcional |
| GET | `/api/verificaciones/mias` | Últimos 10 reciclajes del usuario |

## Rutas del funcionario

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/verificaciones/hincha/:token` | Identifica al hincha a partir del código de su QR |
| POST | `/api/verificaciones` | Registra un reciclaje y suma los puntos |
| GET | `/api/verificaciones/recientes` | Últimas 10 verificaciones que registró este funcionario |

### `POST /api/verificaciones`

Cuerpo de la petición:

```json
{
  "qr_token": "uuid-del-qr-del-hincha",
  "codigo_escaneo": "uuid-unico-de-este-escaneo",
  "partido_id": 1,
  "tipo_residuo_id": 1,
  "cantidad": 5
}
```

- Los puntos los calcula el servidor: `cantidad × puntos_por_unidad`.
- Responde `201` con `duplicada: false` cuando registra una verificación nueva.
- Si el mismo `codigo_escaneo` llega otra vez, no inserta nada y responde `200` con `duplicada: true` y la verificación original.
- El registro se hace dentro de una transacción.

## Rutas del administrador

Todas están bajo `/api/admin` y exigen el rol `administrador`.

### Datos maestros (CRUD)

Los cuatro recursos tienen las mismas operaciones:

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/admin/{recurso}` | Listar |
| POST | `/api/admin/{recurso}` | Crear (responde `201` con el `id`) |
| PUT | `/api/admin/{recurso}/:id` | Actualizar |
| DELETE | `/api/admin/{recurso}/:id` | Eliminar (responde `204`) |

| Recurso | Campos |
| --- | --- |
| `equipos` | `nombre` (máx. 80), `ciudad` (máx. 60), `escudo_url` (opcional, máx. 500) |
| `estadios` | `nombre` (máx. 100), `ciudad` (máx. 60) |
| `partidos` | `estadio_id`, `equipo_local_id`, `equipo_visitante_id`, `fecha` (local y visitante deben ser distintos) |
| `tipos-residuo` | `nombre` (máx. 60), `puntos_por_unidad` (entero mayor a cero) |

### Usuarios

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/admin/usuarios` | Lista de usuarios con su rol y equipo |
| PUT | `/api/admin/usuarios/:id/rol` | Cambia el rol (`hincha`, `funcionario` o `administrador`). No permite cambiar el propio |

### Reportes

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/admin/reportes?desde=AAAA-MM-DD&hasta=AAAA-MM-DD` | Totales de un periodo (las fechas son opcionales) |

La respuesta trae cuatro bloques: `resumen` (verificaciones, unidades, puntos y hinchas), `porEquipo`, `porPartido` y `porResiduo`.

## Errores

Los errores de PostgreSQL se traducen a respuestas entendibles:

| Situación | Código HTTP | Mensaje |
| --- | --- | --- |
| Valor repetido (UNIQUE) | `409` | Ya existe un registro con ese valor |
| Registros relacionados (llave foránea) | `409` | No se puede completar: hay registros relacionados |
| No cumple una regla (CHECK) | `400` | Los datos no cumplen las reglas del sistema |
| Tipo de dato inválido | `400` | Formato de dato inválido |
| Cualquier otro | `500` | Error del servidor |

Las rutas que no existen responden `404` con `{"error": "Ruta no encontrada"}`.

## Estructura del código

```
backend/src/
├── index.js            Arranque del servidor y registro de rutas
├── db.js               Conexión a PostgreSQL
├── errores.js          Traducción de errores y validaciones comunes
├── middleware/auth.js  Verificación del token y de los roles
└── routes/
    ├── auth.js             Registro, login y perfil
    ├── equipos.js          Lista pública de equipos
    ├── catalogos.js        Residuos, estadios y partidos
    ├── verificaciones.js   Escaneo y registro de reciclajes
    ├── ranking.js          Ranking de equipos y de hinchas
    └── admin.js            Panel del administrador
```

{% hint style="info" %}
El backend solo acepta peticiones de origen `http://localhost:5173` (configuración de CORS en `index.js`). Si despliegan el frontend en otra dirección, hay que cambiarlo.
{% endhint %}
