import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

app.get('/api/equipos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nombre FROM equipos ORDER BY nombre');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`API en http://localhost:${process.env.PORT || 3000}`);
});