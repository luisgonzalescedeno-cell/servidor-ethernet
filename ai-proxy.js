// =====================================================
// Backend proxy para la API de Anthropic
// Archivo: ai-proxy.js (o integra en tu server.js)
// =====================================================
// Instalación: npm install express cors node-fetch dotenv
// Uso: node ai-proxy.js
// O integra la ruta en tu servidor Express existente
// =====================================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ⚠️ Crea un archivo .env con: ANTHROPIC_API_KEY=sk-ant-...
const API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

// Rate limiting simple (opcional pero recomendado)
const requestCounts = new Map();
const RATE_LIMIT = 20; // máx peticiones por IP por hora

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hora

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  const data = requestCounts.get(ip);
  if (now > data.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (data.count >= RATE_LIMIT) return false;

  data.count++;
  return true;
}

// Ruta principal del proxy
app.post("/api/ai", async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Límite de peticiones alcanzado. Intenta en una hora." });
  }

  const { system, messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Formato inválido" });
  }

  // Limitar historial a últimas 10 interacciones para controlar costos
  const trimmedMessages = messages.slice(-10);

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // Haiku: rápido y económico para chat
        max_tokens: 600,
        system: system || "Eres un asistente de redes experto.",
        messages: trimmedMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Proxy] Error Anthropic:", err);
      return res.status(response.status).json({ error: "Error de la API" });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("[Proxy] Error:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Health check
app.get("/api/ai/health", (req, res) => {
  res.json({ status: "ok", keyLoaded: !!API_KEY });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🤖 AI Proxy corriendo en http://localhost:${PORT}`);
  console.log(`✅ API Key cargada: ${API_KEY ? "SÍ" : "NO ❌ - Revisa tu .env"}`);
});

module.exports = app;