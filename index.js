const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const SECRET = 'guia-ethernet-secret-2026';

app.use(express.json());
app.use(express.static(__dirname));

const SUPABASE_URL = 'https://abaprnjnlwhqpmwelhyg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYXBybmpubHdocXBtd2VsaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDY3MjAsImV4cCI6MjA5NjQyMjcyMH0.rRJFGX0NyWEapXKZklKwyqj_go0iJUUn0nVZa5AzoB8';

function verificarToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'No autorizado' });
  const token = auth.split(' ')[1];
  try {
    req.usuario = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

app.post('/api/registro', async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  const hash = await bcrypt.hash(password, 10);
  const check = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?email=eq.${email}`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const existe = await check.json();
  if (existe.length > 0)
    return res.status(400).json({ error: 'El email ya está registrado' });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/usuarios`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json', 'Prefer': 'return=representation'
    },
    body: JSON.stringify({ nombre, email, password: hash })
  });
  const usuario = await response.json();
  const token = jwt.sign({ id: usuario[0].id, nombre, email }, SECRET, { expiresIn: '7d' });
  res.json({ ok: true, token, nombre });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?email=eq.${email}`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const usuarios = await response.json();
  if (usuarios.length === 0)
    return res.status(400).json({ error: 'Email no encontrado' });
  const usuario = usuarios[0];
  const valido = await bcrypt.compare(password, usuario.password);
  if (!valido)
    return res.status(400).json({ error: 'Contraseña incorrecta' });
  const token = jwt.sign({ id: usuario.id, nombre: usuario.nombre, email }, SECRET, { expiresIn: '7d' });
  res.json({ ok: true, token, nombre: usuario.nombre });
});

app.get('/api/comentarios', async (req, res) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/comentarios?order=created_at.desc`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const data = await response.json();
  res.json(data);
});

app.post('/api/comentarios', verificarToken, async (req, res) => {
  const { mensaje } = req.body;
  if (!mensaje)
    return res.status(400).json({ error: 'Mensaje requerido' });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/comentarios`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json', 'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ nombre: req.usuario.nombre, mensaje })
  });
  if (response.ok) res.json({ ok: true });
  else res.status(500).json({ error: 'Error guardando comentario' });
});

// ── ASISTENTE IA ──────────────────────────────────────────────
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const requestCounts = new Map();
app.post('/api/ai', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const win = 60 * 60 * 1000;
  const r = requestCounts.get(ip) || { count: 0, resetAt: now + win };
  if (now > r.resetAt) { r.count = 0; r.resetAt = now + win; }
  if (r.count >= 30) return res.status(429).json({ error: 'Límite alcanzado. Intenta en una hora.' });
  r.count++;
  requestCounts.set(ip, r);

  const { system, messages } = req.body;
  if (!messages || !Array.isArray(messages))
    return res.status(400).json({ error: 'Formato inválido' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 600,
        system: system || 'Eres un asistente experto en redes.',
        messages: messages.slice(-10)
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('[IA] Anthropic error:', JSON.stringify(data));
      return res.status(response.status).json({ error: data.error?.message || 'Error de Anthropic' });
    }
    res.json(data);
  } catch (err) {
    console.error('[IA] catch:', err.message);
    res.status(500).json({ error: 'Error interno: ' + err.message });
  }
});
// ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});