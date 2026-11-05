import { Router } from 'express';
import { pool } from '../db.js';
import { auth } from '../middleware/auth.js';
import { responderError } from '../errores.js';

// Listas que usan varias pantallas (escáner, panel del administrador)
const router = Router();

router.get('/tipos-residuo', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, puntos_por_unidad FROM tipos_residuo ORDER BY nombre'
    );
    res.json(rows);
  } catch (e) {
    responderError(res, e);
  }
});

router.get('/estadios', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nombre, ciudad FROM estadios ORDER BY nombre');
    res.json(rows);
  } catch (e) {
    responderError(res, e);
  }
});

router.get('/partidos', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.fecha, p.estadio_id, p.equipo_local_id, p.equipo_visitante_id,
              el.nombre AS equipo_local, ev.nombre AS equipo_visitante, es.nombre AS estadio
         FROM partidos p
         JOIN equipos el ON el.id = p.equipo_local_id
         JOIN equipos ev ON ev.id = p.equipo_visitante_id
         JOIN estadios es ON es.id = p.estadio_id
        ORDER BY p.fecha DESC`
    );
    res.json(rows);
  } catch (e) {
    responderError(res, e);
  }
});

export default router;
