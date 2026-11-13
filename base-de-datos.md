# Base de datos

Motor: **PostgreSQL**. El script `backend/sql/schema.sql` crea todo lo que se describe aquí.

## Tablas

| Tabla | Qué guarda |
| --- | --- |
| `equipos` | Equipos de fútbol (nombre único, ciudad, escudo opcional) |
| `estadios` | Estadios (nombre, ciudad) |
| `partidos` | Partidos: estadio, equipo local, equipo visitante y fecha |
| `tipos_residuo` | Tipos de residuo y los puntos que vale cada unidad |
| `usuarios` | Hinchas, funcionarios y administradores |
| `verificaciones` | Cada reciclaje confirmado por un funcionario |
| `misiones` | *Propuesta:* misiones con puntos extra |
| `misiones_cumplidas` | *Propuesta:* misiones que cumplió cada hincha |

{% hint style="info" %}
`misiones` y `misiones_cumplidas` están marcadas en el script como **propuesta pendiente de validar con el grupo**. Hoy ninguna ruta del backend las usa.
{% endhint %}

### `usuarios`

| Columna | Detalle |
| --- | --- |
| `id` | Llave primaria |
| `nombre` | Obligatorio |
| `email` | Único (no se repite) |
| `password_hash` | Solo se guarda el hash (bcrypt), nunca la contraseña |
| `rol` | `hincha`, `funcionario` o `administrador` (por defecto `hincha`) |
| `equipo_id` | Equipo favorito; **obligatorio si el rol es hincha** |
| `qr_token` | UUID único y no deducible, usado para el QR |
| `acepta_datos` | Autorización de tratamiento de datos (Ley 1581) |
| `creado_en` | Fecha de creación |

### `verificaciones`

| Columna | Detalle |
| --- | --- |
| `codigo_escaneo` | UUID único: evita confirmar dos veces el mismo escaneo |
| `usuario_id` | El hincha que recicló |
| `equipo_id` | Equipo del hincha **al momento de confirmar** |
| `funcionario_id` | Quien registró la verificación |
| `partido_id` | Partido en el que se recicló |
| `tipo_residuo_id` | Tipo de residuo |
| `cantidad` | Entero mayor a cero |
| `puntos` | Valor calculado, se guarda tal cual |
| `fecha_hora` | Momento del registro |

Tiene índices por `usuario_id`, `equipo_id` y `partido_id`.

## Restricciones importantes

- Un partido no puede tener el mismo equipo como local y visitante.
- Los puntos por unidad de un tipo de residuo deben ser mayores a cero.
- Las llaves foráneas usan `ON DELETE RESTRICT`: no se puede borrar un equipo, estadio o partido que tenga registros relacionados.
- **Trigger `verificacion_permanente`:** impide hacer `UPDATE` o `DELETE` sobre `verificaciones`. Una verificación confirmada es inmutable.

## Vistas del ranking

Los puntos **no se guardan** en `equipos` ni en `usuarios`: se calculan sumando los movimientos. Así el puntaje de un equipo siempre es igual a la suma de sus verificaciones.

| Vista | Qué devuelve |
| --- | --- |
| `movimientos_puntos` | Une los puntos de `verificaciones` y de `misiones_cumplidas` |
| `ranking_equipos` | Puntos y posición de cada equipo |
| `ranking_hinchas` | Puntos, posición general y posición dentro de su equipo |

## Datos iniciales

`schema.sql` inserta 6 equipos (América de Cali, Atlético Nacional, Deportivo Cali, Independiente Santa Fe, Junior, Millonarios) y 3 tipos de residuo:

| Residuo | Puntos por unidad |
| --- | --- |
| Plástico | 10 |
| Vidrio | 15 |
| Papel | 5 |

`datos_prueba.sql` agrega 4 estadios, 4 partidos de ejemplo y las cuentas de administrador y funcionario de prueba.
