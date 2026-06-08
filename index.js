const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const SUPABASE_URL = 'https://abaprnjnlwhqpmwelhyg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYXBybmpubHdocXBtd2VsaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDY3MjAsImV4cCI6MjA5NjQyMjcyMH0.rRJFGX0NyWEapXKZklKwyqj_go0iJUUn0nVZa5AzoB8';

app.get('/api/comentarios', async (req, res) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/comentarios?order=created_at.desc`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const data = await response.json();
  res.json(data);
});

app.post('/api/comentarios', async (req, res) => {
  const { nombre, mensaje } = req.body;
  if (!nombre || !mensaje) {
    return res.status(400).json({ error: 'Nombre y mensaje son requeridos' });
  }
  const response = await fetch(`${SUPABASE_URL}/rest/v1/comentarios`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ nombre, mensaje })
  });
  if (response.ok) {
    res.json({ ok: true });
  } else {
    res.status(500).json({ error: 'Error guardando comentario' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
