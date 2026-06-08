const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Anthropic } = require('@anthropic-ai/sdk'); // 👈 Nueva dependencia de Claude

const app = express();
const SECRET = 'guia-ethernet-secret-2026';

app.use(express.json());
app.use(express.static(__dirname));

// Configuración de Supabase
const SUPABASE_URL = 'https://abaprnjnlwhqpmwelhyg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYXBybmpubHdocXBtd2VsaHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDY3MjAsImV4cCI6MjA5NjQyMjcyMH0.rRJFGX0NyWEapXKZklKwyqj_go0iJUUn0nVZa5AzoB8';

// Configuración de Claude (Lee la clave secreta desde las Variables de Railway)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Middleware para verificar la sesión del usuario mediante tokens JWT
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

// --- AUTENTICACIÓN: REGISTRO DE USUARIOS ---
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

// --- AUTENTICACIÓN: INICIO DE SESIÓN ---
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

// --- COMENTARIOS: OBTENER TODOS LOS MENSAJES (PÚBLICO) ---
app.get('/api/comentarios', async (req, res) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/comentarios?order=created_at.desc`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const data = await response.json();
  res.json(data);
});

// --- COMENTARIOS: GUARDAR NUEVO MENSAJE (PROTEGIDO) ---
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

// --- NUEVA RUTA: CHATBOT CON CLAUDE IA (PÚBLICO) ---
app.post('/api/chat', async (req, res) => {
  const { mensaje } = req.body;
  if (!mensaje) return res.status(400).json({ error: 'Mensaje requerido' });

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022", // Modelo de alta precisión para ingeniería de redes
      max_tokens: 300,
      system: "Eres un ingeniero de redes experto. Tu único objetivo es responder dudas sobre el ponchado de cables Ethernet (estándares T568A, T568B, herramientas como ponchadoras, jacks, conectores RJ45 y solución de problemas de red). Sé breve, amigable y directo en tus respuestas. Si te preguntan algo que no tenga relación con redes o cables, di amablemente que solo estás entrenado para ayudar con cables de red.",
      messages: [{ role: "user", content: mensaje }],
    });

    res.json({ respuesta: response.content[0].text });
  } catch (err) {
    console.error("Error con la API de Claude:", err);
    res.status(500).json({ error: 'Hubo un problema con la IA. Inténtalo más tarde.' });
  }
});

// --- INICIALIZACIÓN DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
