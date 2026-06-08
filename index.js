const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const db = new Database('comentarios.db');

app.use(express.json());
app.use(express.static('public'));

db.exec(`
  CREATE TABLE IF NOT EXISTS comentarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha TEXT DEFAULT (datetime('now'))
  )
`);

app.get('/api/comentarios', (req, res) => {
  const comentarios = db.prepare('SELECT * FROM comentarios ORDER BY id DESC').all();
  res.json(comentarios);
});

app.post('/api/comentarios', (req, res) => {
  const { nombre, mensaje } = req.body;
  if (!nombre || !mensaje) {
    return res.status(400).json({ error: 'Nombre y mensaje son requeridos' });
  }
  const insert = db.prepare('INSERT INTO comentarios (nombre, mensaje) VALUES (?, ?)');
  const result = insert.run(nombre, mensaje);
  res.json({ ok: true, id: result.lastInsertRowid });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});