# Futciclar

Aplicación web para que los hinchas del fútbol colombiano reciclen y sumen puntos para su equipo. Proyecto del grupo **futgroup**, curso Administración de la Información, Universidad Santiago de Cali.

## ¿Cómo funciona?

1. El **hincha** se registra, elige su equipo y obtiene un **código QR** personal.
2. En el estadio, un **funcionario** escanea el QR del hincha y registra qué recicló (tipo de residuo y cantidad) en un partido.
3. El sistema calcula los puntos y los suma al hincha y a su equipo.
4. Todos pueden ver el **ranking** de equipos y de hinchas.
5. El **administrador** gestiona equipos, estadios, partidos, tipos de residuo y usuarios, y consulta reportes.

## Tecnologías

| Parte | Tecnología | Puerto |
| --- | --- | --- |
| Frontend | Vue 3 + Vite | 5173 |
| Backend | Node.js + Express | 3000 |
| Base de datos | PostgreSQL | 5432 |

## Estructura del repositorio

```
├── backend/     API REST (Express) y scripts SQL
├── frontend/    Aplicación Vue 3
├── docs/        Esta documentación (se publica en GitBook)
├── index.html, script.js, styles.css   Demo para GitHub Pages con datos simulados
└── README.md
```

## Contenido de esta documentación

- [Instalación y ejecución](instalacion.md)
- [Roles y pantallas](roles.md)
- [Base de datos](base-de-datos.md)
- [API del backend](api.md)
- [Frontend](frontend.md)
