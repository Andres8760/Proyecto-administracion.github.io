import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { auth } from '../middleware/auth.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  const { nombre, email, password, equipo_id } = req.body ?? {};
  const equipoId = Number(equipo_id);

  if (!nombre?.trim() || !email || !password || !equipo_id) {
    return res.status(400).json({ error: 'Faltan datos: nombre, email, password y equipo_id' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'El correo no es válido' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });
  }
  if (!Number.isInteger(equipoId)) {
    return res.status(400).json({ error: 'equipo_id inválido' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);

    // El rol NO se recibe del cliente: siempre nace como 'hincha'
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, equipo_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, email, rol, equipo_id`,
      [nombre.trim(), email.trim().toLowerCase(), password_hash, equipoId]
    );

    const usuario = rows[0];
    res.status(201).json({ token: firmarToken(usuario), usuario });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Ese correo ya está registrado' });
    }
    if (e.code === '23503') {
      return res.status(400).json({ error: 'El equipo no existe' });
    }
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan email y password' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, email, rol, equipo_id, password_hash
         FROM usuarios WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    const u = rows[0];
    const ok = u && (await bcrypt.compare(password, u.password_hash));

    // Mismo mensaje si falla el correo o la contraseña
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const { password_hash, ...usuario } = u;
    res.json({ token: firmarToken(usuario), usuario });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.rol, u.equipo_id, e.nombre AS equipo
         FROM usuarios u
         LEFT JOIN equipos e ON e.id = u.equipo_id
        WHERE u.id = $1`,
      [req.user.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;