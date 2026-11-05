import { Router } from 'express';
import { pool } from '../db.js';
import { auth } from '../middleware/auth.js';
import { responderError } from '../errores.js';

const router = Router();

// GET /api/ranking/equipos (RF-08). Público: no expone datos personales.
router.get('/equipos', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.nombre, r.escudo_url, r.puntos, r.posicion::INT AS posicion,
              (SELECT COUNT(*)::INT FROM usuarios u
                WHERE u.equipo_id = r.id AND u.rol = 'hincha') AS hinchas
         FROM ranking_equipos r
        ORDER BY r.posicion, r.nombre`
    );
    res.json(rows);
  } catch (e) {
    responderError(res, e);
  }
});

// GET /api/ranking/hinchas?equipo_id=3 (RF-09). Requiere sesión.
router.get('/hinchas', auth, async (req, res) => {
  const equipoId = Number(req.query.equipo_id) || null;
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.nombre, e.nombre AS equipo, r.puntos,
              r.posicion_general::INT AS posicion_general,
              r.posicion_en_equipo::INT AS posicion_en_equipo
         FROM ranking_hinchas r
         JOIN equipos e ON e.id = r.equipo_id
        WHERE $1::INT IS NULL OR r.equipo_id = $1
        ORDER BY r.puntos DESC, r.nombre
        LIMIT 50`,
      [equipoId]
    );
    res.json(rows);
  } catch (e) {
    responderError(res, e);
  }
});

export default router;
