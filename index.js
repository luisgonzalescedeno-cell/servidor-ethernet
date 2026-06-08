const express = require('express');
const { Pool } = require('pg');

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Inicializar la tabla forzando una limpieza estructural
const initDb = async () => {
  try {
    // ⚠️ FORZAMOS EL BORRADO de la tabla vieja con errores
    await pool.query('DROP TABLE IF EXISTS comentarios CASCADE;');
    
    // Creamos la tabla completamente nueva y limpia
    await pool.query(`
      CREATE TABLE comentarios (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        mensaje TEXT NOT NULL,
        fecha TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("Tabla de comentarios RECREADA DE CERO con éxito en PostgreSQL.");
  } catch (err) {
    console.error("Error al inicializar la base de datos:", err);
  }
};
initDb();

app.get('/api/comentarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM comentarios ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error("Error en GET /api/comentarios:", err);
    res.status(500).json({ error: 'Error al obtener los comentarios' });
  }
});

app.post('/api/comentarios', async (req, res) => {
  const { nombre, mensaje } = req.body;
  if (!nombre || !mensaje) {
    return res.status(400).json({ error: 'Nombre y mensaje son requeridos' });
  }
  try {
    const queryText = 'INSERT INTO comentarios (nombre, mensaje) VALUES ($1, $2) RETURNING id';
    const result = await pool.query(queryText, [nombre, mensaje]);
    res.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error("Error en POST /api/comentarios:", err);
    res.status(500).json({ error: 'Error al guardar el comentario' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
