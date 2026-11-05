import { Router } from 'express';
import { pool } from '../db.js';
import { auth, requireRol } from '../middleware/auth.js';
import { responderError, UUID_RE, enteroPositivo } from '../errores.js';

const router = Router();

// GET /api/verificaciones/hincha/:token
// RF-05: el funcionario escanea el QR y el sistema identifica al hincha.
router.get('/hincha/:token', auth, requireRol('funcionario'), async (req, res) => {
  const { token } = req.params;

  // CA-06: un QR que no es un token válido no consulta nada
  if (!UUID_RE.test(token)) {
    return res.status(404).json({ error: 'QR no válido' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, e.nombre AS equipo
         FROM usuarios u
         JOIN equipos e ON e.id = u.equipo_id
        WHERE u.qr_token = $1 AND u.rol = 'hincha'`,
      [token]
    );
    if (!rows[0]) return res.status(404).json({ error: 'QR no válido' });
    res.json(rows[0]);
  } catch (e) {
    responderError(res, e);
  }
});

// POST /api/verificaciones
// RF-06 y RF-07: registra el reciclaje y suma los puntos.
router.post('/', auth, requireRol('funcionario'), async (req, res) => {
  const { qr_token, codigo_escaneo } = req.body ?? {};
  const partidoId = enteroPositivo(req.body?.partido_id);
  const tipoId = enteroPositivo(req.body?.tipo_residuo_id);
  const cantidad = enteroPositivo(req.body?.cantidad);

  if (!UUID_RE.test(qr_token ?? '')) return res.status(404).json({ error: 'QR no válido' });
  if (!UUID_RE.test(codigo_escaneo ?? '')) {
    return res.status(400).json({ error: 'Falta el código del escaneo' });
  }
  if (!partidoId || !tipoId) {
    return res.status(400).json({ error: 'Elige el partido y el tipo de residuo' });
  }
  // CA-05: la cantidad debe ser un entero mayor a cero
  if (!cantidad) {
    return res.status(400).json({ error: 'La cantidad debe ser un número entero mayor a cero' });
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const hincha = (
      await cliente.query(
        `SELECT u.id, u.nombre, u.equipo_id, e.nombre AS equipo
           FROM usuarios u
           JOIN equipos e ON e.id = u.equipo_id
          WHERE u.qr_token = $1 AND u.rol = 'hincha'`,
        [qr_token]
      )
    ).rows[0];
    if (!hincha) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ error: 'QR no válido' });
    }

    const tipo = (
      await cliente.query('SELECT nombre, puntos_por_unidad FROM tipos_residuo WHERE id = $1', [
        tipoId,
      ])
    ).rows[0];
    if (!tipo) {
      await cliente.query('ROLLBACK');
      return res.status(400).json({ error: 'El tipo de residuo no existe' });
    }

    // RN-02: los puntos los calcula el servidor con el valor vigente, nunca el navegador
    const puntos = cantidad * tipo.puntos_por_unidad;

    // RN-05 / CA-10: si el mismo escaneo llega dos veces, la segunda no inserta nada
    const insertada = (
      await cliente.query(
        `INSERT INTO verificaciones
           (codigo_escaneo, usuario_id, equipo_id, funcionario_id, partido_id,
            tipo_residuo_id, cantidad, puntos)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (codigo_escaneo) DO NOTHING
         RETURNING id, puntos, fecha_hora`,
        [codigo_escaneo, hincha.id, hincha.equipo_id, req.user.id, partidoId, tipoId, cantidad, puntos]
      )
    ).rows[0];

    await cliente.query('COMMIT');

    if (!insertada) {
      const previa = (
        await pool.query(
          'SELECT id, puntos, fecha_hora FROM verificaciones WHERE codigo_escaneo = $1',
          [codigo_escaneo]
        )
      ).rows[0];
      return res.json({ duplicada: true, verificacion: previa, hincha, residuo: tipo.nombre, cantidad });
    }

    res.status(201).json({ duplicada: false, verificacion: insertada, hincha, residuo: tipo.nombre, cantidad });
  } catch (e) {
    await cliente.query('ROLLBACK').catch(() => {});
    responderError(res, e);
  } finally {
    cliente.release();
  }
});

const SELECT_HISTORIAL = `
  SELECT v.id, v.fecha_hora, v.cantidad, v.puntos, t.nombre AS residuo,
         el.nombre || ' vs. ' || ev.nombre AS partido,
         u.nombre AS hincha, eq.nombre AS equipo
    FROM verificaciones v
    JOIN tipos_residuo t ON t.id = v.tipo_residuo_id
    JOIN partidos p ON p.id = v.partido_id
    JOIN equipos el ON el.id = p.equipo_local_id
    JOIN equipos ev ON ev.id = p.equipo_visitante_id
    JOIN usuarios u ON u.id = v.usuario_id
    JOIN equipos eq ON eq.id = v.equipo_id`;

// GET /api/verificaciones/mias: últimos reciclajes del hincha que inició sesión
router.get('/mias', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_HISTORIAL} WHERE v.usuario_id = $1 ORDER BY v.fecha_hora DESC LIMIT 10`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    responderError(res, e);
  }
});

// GET /api/verificaciones/recientes: últimas que registró este funcionario
router.get('/recientes', auth, requireRol('funcionario'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_HISTORIAL} WHERE v.funcionario_id = $1 ORDER BY v.fecha_hora DESC LIMIT 10`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    responderError(res, e);
  }
});

export default router;
