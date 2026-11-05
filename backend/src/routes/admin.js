import { Router } from 'express';
import { pool } from '../db.js';
import { auth, requireRol } from '../middleware/auth.js';
import { responderError, enteroPositivo } from '../errores.js';

// Todo este módulo es solo para el administrador (RN-07)
const router = Router();
router.use(auth, requireRol('administrador'));

// ---------------------------------------------------------------
// CRUD de datos maestros (RF-10, RF-11)
// Cada recurso declara su tabla y sus campos; las rutas se generan igual
// para todos. Los nombres de tabla y columna salen de esta lista fija,
// nunca de lo que manda el cliente, así que no hay riesgo de inyección.
// ---------------------------------------------------------------
const texto = (max, obligatorio = true) => (v) => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) return obligatorio ? { error: 'es obligatorio' } : { valor: null };
  if (s.length > max) return { error: `máximo ${max} caracteres` };
  return { valor: s };
};
const entero = (v) => {
  const n = enteroPositivo(v);
  return n ? { valor: n } : { error: 'debe ser un número entero mayor a cero' };
};
const fecha = (v) => {
  const d = new Date(v);
  return v && !Number.isNaN(d.getTime()) ? { valor: d.toISOString() } : { error: 'fecha inválida' };
};

const RECURSOS = {
  equipos: {
    tabla: 'equipos',
    campos: { nombre: texto(80), ciudad: texto(60), escudo_url: texto(500, false) },
    listar: 'SELECT id, nombre, ciudad, escudo_url FROM equipos ORDER BY nombre',
  },
  estadios: {
    tabla: 'estadios',
    campos: { nombre: texto(100), ciudad: texto(60) },
    listar: 'SELECT id, nombre, ciudad FROM estadios ORDER BY nombre',
  },
  partidos: {
    tabla: 'partidos',
    campos: {
      estadio_id: entero,
      equipo_local_id: entero,
      equipo_visitante_id: entero,
      fecha,
    },
    listar: `SELECT p.id, p.fecha, p.estadio_id, p.equipo_local_id, p.equipo_visitante_id,
                    el.nombre AS equipo_local, ev.nombre AS equipo_visitante, es.nombre AS estadio
               FROM partidos p
               JOIN equipos el ON el.id = p.equipo_local_id
               JOIN equipos ev ON ev.id = p.equipo_visitante_id
               JOIN estadios es ON es.id = p.estadio_id
              ORDER BY p.fecha DESC`,
    validar: (d) =>
      d.equipo_local_id === d.equipo_visitante_id
        ? 'El equipo local y el visitante deben ser distintos'
        : null,
  },
  'tipos-residuo': {
    tabla: 'tipos_residuo',
    campos: { nombre: texto(60), puntos_por_unidad: entero },
    listar: 'SELECT id, nombre, puntos_por_unidad FROM tipos_residuo ORDER BY nombre',
  },
};

function leerDatos(recurso, body) {
  const datos = {};
  for (const [campo, validar] of Object.entries(recurso.campos)) {
    const r = validar(body?.[campo]);
    if (r.error) return { error: `${campo}: ${r.error}` };
    datos[campo] = r.valor;
  }
  const extra = recurso.validar?.(datos);
  return extra ? { error: extra } : { datos };
}

for (const [ruta, recurso] of Object.entries(RECURSOS)) {
  const columnas = Object.keys(recurso.campos);

  router.get(`/${ruta}`, async (req, res) => {
    try {
      res.json((await pool.query(recurso.listar)).rows);
    } catch (e) {
      responderError(res, e);
    }
  });

  router.post(`/${ruta}`, async (req, res) => {
    const { error, datos } = leerDatos(recurso, req.body);
    if (error) return res.status(400).json({ error });
    try {
      const marcas = columnas.map((_, i) => `$${i + 1}`).join(', ');
      const { rows } = await pool.query(
        `INSERT INTO ${recurso.tabla} (${columnas.join(', ')}) VALUES (${marcas}) RETURNING id`,
        columnas.map((c) => datos[c])
      );
      res.status(201).json(rows[0]);
    } catch (e) {
      responderError(res, e);
    }
  });

  router.put(`/${ruta}/:id`, async (req, res) => {
    const id = enteroPositivo(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const { error, datos } = leerDatos(recurso, req.body);
    if (error) return res.status(400).json({ error });
    try {
      const sets = columnas.map((c, i) => `${c} = $${i + 1}`).join(', ');
      const { rowCount } = await pool.query(
        `UPDATE ${recurso.tabla} SET ${sets} WHERE id = $${columnas.length + 1}`,
        [...columnas.map((c) => datos[c]), id]
      );
      if (!rowCount) return res.status(404).json({ error: 'No existe' });
      res.json({ id });
    } catch (e) {
      responderError(res, e);
    }
  });

  router.delete(`/${ruta}/:id`, async (req, res) => {
    const id = enteroPositivo(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    try {
      const { rowCount } = await pool.query(`DELETE FROM ${recurso.tabla} WHERE id = $1`, [id]);
      if (!rowCount) return res.status(404).json({ error: 'No existe' });
      res.status(204).end();
    } catch (e) {
      responderError(res, e);
    }
  });
}

// ---------------------------------------------------------------
// Usuarios y roles
// ---------------------------------------------------------------
router.get('/usuarios', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.rol, e.nombre AS equipo, u.creado_en
         FROM usuarios u
         LEFT JOIN equipos e ON e.id = u.equipo_id
        ORDER BY u.creado_en DESC`
    );
    res.json(rows);
  } catch (e) {
    responderError(res, e);
  }
});

router.put('/usuarios/:id/rol', async (req, res) => {
  const id = enteroPositivo(req.params.id);
  const { rol } = req.body ?? {};
  if (!id) return res.status(400).json({ error: 'id inválido' });
  if (!['hincha', 'funcionario', 'administrador'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }
  if (id === req.user.id) {
    return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
  }
  try {
    const { rowCount } = await pool.query('UPDATE usuarios SET rol = $1 WHERE id = $2', [rol, id]);
    if (!rowCount) return res.status(404).json({ error: 'No existe' });
    res.json({ id, rol });
  } catch (e) {
    if (e.code === '23514') {
      return res.status(400).json({ error: 'Para ser hincha, el usuario necesita un equipo favorito' });
    }
    responderError(res, e);
  }
});

// ---------------------------------------------------------------
// Reportes (RF-12): totales por equipo, partido y residuo en un periodo
// ---------------------------------------------------------------
router.get('/reportes', async (req, res) => {
  const desde = req.query.desde ? new Date(req.query.desde) : null;
  const hasta = req.query.hasta ? new Date(`${req.query.hasta}T23:59:59`) : null;
  if ((desde && Number.isNaN(desde.getTime())) || (hasta && Number.isNaN(hasta.getTime()))) {
    return res.status(400).json({ error: 'Fechas inválidas' });
  }
  const params = [desde, hasta];
  const filtro = `($1::timestamptz IS NULL OR v.fecha_hora >= $1)
              AND ($2::timestamptz IS NULL OR v.fecha_hora <= $2)`;

  try {
    const [resumen, porEquipo, porPartido, porResiduo] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::INT AS verificaciones,
                COALESCE(SUM(v.cantidad), 0)::INT AS unidades,
                COALESCE(SUM(v.puntos), 0)::INT AS puntos,
                COUNT(DISTINCT v.usuario_id)::INT AS hinchas
           FROM verificaciones v WHERE ${filtro}`,
        params
      ),
      pool.query(
        `SELECT e.nombre, COUNT(*)::INT AS verificaciones,
                SUM(v.cantidad)::INT AS unidades, SUM(v.puntos)::INT AS puntos
           FROM verificaciones v JOIN equipos e ON e.id = v.equipo_id
          WHERE ${filtro}
          GROUP BY e.nombre ORDER BY puntos DESC`,
        params
      ),
      pool.query(
        `SELECT el.nombre || ' vs. ' || ev.nombre AS nombre, es.nombre AS estadio, p.fecha,
                COUNT(*)::INT AS verificaciones, SUM(v.cantidad)::INT AS unidades,
                SUM(v.puntos)::INT AS puntos
           FROM verificaciones v
           JOIN partidos p ON p.id = v.partido_id
           JOIN equipos el ON el.id = p.equipo_local_id
           JOIN equipos ev ON ev.id = p.equipo_visitante_id
           JOIN estadios es ON es.id = p.estadio_id
          WHERE ${filtro}
          GROUP BY p.id, el.nombre, ev.nombre, es.nombre ORDER BY p.fecha DESC`,
        params
      ),
      pool.query(
        `SELECT t.nombre, COUNT(*)::INT AS verificaciones,
                SUM(v.cantidad)::INT AS unidades, SUM(v.puntos)::INT AS puntos
           FROM verificaciones v JOIN tipos_residuo t ON t.id = v.tipo_residuo_id
          WHERE ${filtro}
          GROUP BY t.nombre ORDER BY unidades DESC`,
        params
      ),
    ]);

    res.json({
      resumen: resumen.rows[0],
      porEquipo: porEquipo.rows,
      porPartido: porPartido.rows,
      porResiduo: porResiduo.rows,
    });
  } catch (e) {
    responderError(res, e);
  }
});

export default router;
