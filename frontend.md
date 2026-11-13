# Frontend

Aplicación de una sola página hecha con **Vue 3** y **Vite**.

## Librerías principales

| Librería | Para qué se usa |
| --- | --- |
| Vue 3 | Interfaz |
| Vue Router | Navegación entre pantallas y protección por rol |
| Pinia | Estado de la sesión (`stores/auth.js`) |
| axios | Llamadas a la API (`services/api.js`) |
| qrcode | Dibuja el QR del hincha |
| html5-qrcode | Lee el QR con la cámara en el escáner |

## Estructura del código

```
frontend/src/
├── main.js
├── App.vue
├── router/index.js      Rutas y reglas de acceso
├── stores/auth.js       Sesión: token, usuario y rol
├── services/api.js      Cliente axios con el token incluido
├── views/               Una pantalla por archivo
├── components/admin/    Piezas del panel del administrador
└── assets/              Estilos y logo
```

## Pantallas y rutas

| Ruta | Pantalla | Quién entra |
| --- | --- | --- |
| `/` | Inicio (`HomeView`) | Todos |
| `/login` | Iniciar sesión (`LoginView`) | Solo quien no ha iniciado sesión |
| `/registro` | Registro de hincha (`RegistroView`) | Solo quien no ha iniciado sesión |
| `/perfil` | Perfil con QR, puntos e historial (`PerfilView`) | Usuarios con sesión |
| `/ranking` | Ranking de equipos y hinchas (`RankingView`) | Usuarios con sesión |
| `/escaner` | Escáner de QR (`EscanerView`) | Funcionario |
| `/admin` | Panel de administración (`AdminView`) | Administrador |

Después de iniciar sesión, cada rol llega a su pantalla principal: el hincha a `/perfil`, el funcionario a `/escaner` y el administrador a `/admin`.

## Panel del administrador

`AdminView` reúne tres componentes:

- **ReportesAdmin:** totales por equipo, partido y tipo de residuo en un periodo.
- **TablaCrud:** tabla reutilizable para crear, editar y borrar equipos, estadios, partidos y tipos de residuo.
- **UsuariosAdmin:** lista de usuarios y cambio de rol.

## Sesión y seguridad

- El token se guarda en `localStorage` y `axios` lo envía en cada petición.
- Si el token venció o es inválido (error 401), la sesión se cierra automáticamente.
- El router redirige a `/login` si la ruta exige sesión, y a la pantalla de inicio del usuario si su rol no tiene permiso.
- El frontend esconde lo que no corresponde al rol, pero **la validación real se hace en el backend**.

## Comandos

```bash
npm install       # instalar dependencias
npm run dev       # servidor de desarrollo (puerto 5173)
npm run build     # compilar para producción
npm run lint      # revisar el código con oxlint y ESLint
npm run format    # dar formato con Prettier
```
