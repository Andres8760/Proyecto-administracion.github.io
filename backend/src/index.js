import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import authRoutes from './routes/auth.js';
import equiposRoutes from './routes/equipos.js';
import catalogosRoutes from './routes/catalogos.js';
import verificacionesRoutes from './routes/verificaciones.js';
import rankingRoutes from './routes/ranking.js';
import adminRoutes from './routes/admin.js';

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  console.error('Faltan JWT_SECRET o DATABASE_URL en backend/.env');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/salud', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS hora');
    res.json({ ok: true, hora: rows[0].hora });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api', catalogosRoutes);
app.use('/api/verificaciones', verificacionesRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API en http://localhost:${PORT}`);
});