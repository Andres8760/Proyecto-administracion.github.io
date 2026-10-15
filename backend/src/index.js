import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

app.get('/api/salud', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS hora');
    res.json({ ok: true, hora: rows[0].hora });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`API en http://localhost:${process.env.PORT || 3000}`);
});