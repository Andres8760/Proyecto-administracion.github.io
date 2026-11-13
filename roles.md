# Roles y pantallas

El sistema tiene **un solo tipo de usuario con un rol**: `hincha`, `funcionario` o `administrador`. Todo usuario nuevo se registra como `hincha`. El administrador cambia los roles desde la pestaña **Usuarios** del panel.

| Rol | Pantallas |
| --- | --- |
| Hincha | Perfil con su QR, puntos e historial; ranking |
| Funcionario | Escáner: lee el QR del hincha y registra el reciclaje; ranking |
| Administrador | Panel: reportes, equipos, estadios, partidos, tipos de residuo y roles de usuarios; ranking |

## Reglas del sistema

Cada rol solo entra a sus pantallas (regla RN-07), y esto se valida tanto en el frontend como en el backend.

- **Registro:** el rol nunca lo manda el navegador; siempre nace como `hincha`.
- **Puntos:** los calcula el servidor con el valor vigente del tipo de residuo (`cantidad × puntos_por_unidad`), nunca el navegador (RN-02).
- **Escaneo único:** un mismo escaneo se confirma una sola vez; si llega repetido, no suma puntos de nuevo (RN-05).
- **Verificaciones permanentes:** una verificación confirmada no se puede modificar ni borrar (RN-06).
- **Cantidad:** debe ser un número entero mayor a cero.
- **Cambio de rol:** un administrador no puede cambiar su propio rol, y para ser hincha el usuario necesita un equipo favorito.

## Flujo del funcionario

1. **Escanear:** lee el QR con la cámara, sube una imagen del QR o escribe el código a mano.
2. **Confirmar:** el sistema muestra el nombre y el equipo del hincha; el funcionario elige partido, tipo de residuo y cantidad.
3. **Listo:** se registra la verificación y se muestran los puntos sumados.
