(function () {

  const SYSTEM_PROMPT = `Eres un asistente experto en redes de computadoras, específicamente en el ponchado de cables Ethernet.

Ayudas con:
- Estándares T568A y T568B
- Pasos para ponchar cables RJ45
- Tipos de cables (directo, cruzado)
- Herramientas (ponchadora, pelacables, tester)
- Normas TIA/EIA

Responde siempre en español, de forma clara y concisa.
Máximo 3 párrafos.`;

  let conversationHistory = [];
  let isOpen = false;
  let isLoading = false;

  /* =======================
     ESTILOS
  ======================= */

  const style = document.createElement("style");

  style.textContent = `
    #ai-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #3a5bd9;
      color: white;
      border: none;
      cursor: pointer;
      font-size: 24px;
      box-shadow: 0 4px 14px rgba(58,91,217,0.5);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #ai-btn:hover {
      transform: scale(1.05);
    }

    #ai-btn .ai-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #f59e0b;
      color: black;
      font-size: 9px;
      font-weight: bold;
      padding: 2px 5px;
      border-radius: 20px;
    }

    #ai-panel {
      position: fixed;
      bottom: 90px;
      right: 24px;
      width: 360px;
      max-height: 520px;
      background: #1a1a2e;
      border: 1px solid #2d2d4e;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 9998;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);

      transform: translateY(20px);
      opacity: 0;
      pointer-events: none;

      transition: all .25s ease;
    }

    #ai-panel.open {
      transform: translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    #ai-header {
      padding: 14px 16px;
      background: #16213e;
      border-bottom: 1px solid #2d2d4e;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    #ai-header-left {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    #ai-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg,#3a5bd9,#7c3aed);
      display: flex;
      justify-content: center;
      align-items: center;
    }

    #ai-title {
      color: white;
      font-weight: 600;
      font-size: 14px;
    }

    #ai-subtitle {
      color: #94a3b8;
      font-size: 11px;
    }

    #ai-close {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 18px;
      cursor: pointer;
    }

    #ai-messages {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .ai-msg {
      max-width: 85%;
      padding: 10px 12px;
      border-radius: 12px;
      line-height: 1.5;
      font-size: 13px;
      white-space: pre-wrap;
    }

    .ai-msg.bot {
      background: #2d2d4e;
      color: #e2e8f0;
      align-self: flex-start;
    }

    .ai-msg.user {
      background: #3a5bd9;
      color: white;
      align-self: flex-end;
    }

    #ai-quick-btns {
      padding: 10px;
      border-bottom: 1px solid #2d2d4e;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .ai-quick-btn {
      background: #2d2d4e;
      color: #94a3b8;
      border: 1px solid #3d3d6e;
      border-radius: 20px;
      padding: 4px 10px;
      cursor: pointer;
      font-size: 11px;
    }

    .ai-quick-btn:hover {
      background: #3a5bd9;
      color: white;
    }

    #ai-input-area {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid #2d2d4e;
    }

    #ai-input {
      flex: 1;
      resize: none;
      border: 1px solid #3d3d6e;
      border-radius: 10px;
      background: #2d2d4e;
      color: white;
      padding: 8px 12px;
      outline: none;
    }

    #ai-send {
      width: 40px;
      border: none;
      border-radius: 10px;
      background: #3a5bd9;
      color: white;
      cursor: pointer;
    }

    #ai-send:disabled {
      opacity: .5;
      cursor: not-allowed;
    }

    .ai-dots span {
      display:inline-block;
      width:6px;
      height:6px;
      margin:0 2px;
      border-radius:50%;
      background:#94a3b8;
      animation: bounce 1.2s infinite;
    }

    .ai-dots span:nth-child(2){
      animation-delay:.2s;
    }

    .ai-dots span:nth-child(3){
      animation-delay:.4s;
    }

    @keyframes bounce {
      0%,60%,100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }
  `;

  document.head.appendChild(style);

  /* =======================
     HTML
  ======================= */

  const btn = document.createElement("button");

  btn.id = "ai-btn";

  btn.innerHTML = `🤖<span class="ai-badge">IA</span>`;

  const panel = document.createElement("div");

  panel.id = "ai-panel";

  panel.innerHTML = `
    <div id="ai-header">
      <div id="ai-header-left">
        <div id="ai-avatar">🤖</div>
        <div>
          <div id="ai-title">Asistente de Redes</div>
          <div id="ai-subtitle">Experto en ponchado Ethernet</div>
        </div>
      </div>

      <button id="ai-close">✕</button>
    </div>

    <div id="ai-quick-btns">
      <button class="ai-quick-btn" data-q="¿Cuál es la diferencia entre T568A y T568B?">T568A vs T568B</button>

      <button class="ai-quick-btn" data-q="¿Cómo hago un cable directo?">Cable directo</button>

      <button class="ai-quick-btn" data-q="¿Qué herramientas necesito para ponchar?">Herramientas</button>

      <button class="ai-quick-btn" data-q="¿Cuándo uso cable cruzado?">Cable cruzado</button>
    </div>

    <div id="ai-messages">
      <div class="ai-msg bot">
        ¡Hola! 👋 Soy tu asistente experto en redes.
        ¿En qué puedo ayudarte?
      </div>
    </div>

    <div id="ai-input-area">
      <textarea id="ai-input" rows="1" placeholder="Escribe tu pregunta..."></textarea>

      <button id="ai-send">➤</button>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  /* =======================
     EVENTOS
  ======================= */

  btn.onclick = () => {
    isOpen = !isOpen;
    panel.classList.toggle("open", isOpen);
  };

  document.getElementById("ai-close").onclick = () => {
    isOpen = false;
    panel.classList.remove("open");
  };

  document.getElementById("ai-send").onclick = sendMessage;

  document.getElementById("ai-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  document.querySelectorAll(".ai-quick-btn").forEach(btn => {
    btn.onclick = () => sendMessage(btn.dataset.q);
  });

  /* =======================
     FUNCIONES
  ======================= */

  function addMessage(text, role) {

    const msgs = document.getElementById("ai-messages");

    const div = document.createElement("div");

    div.className = `ai-msg ${role}`;

    div.textContent = text;

    msgs.appendChild(div);

    msgs.scrollTop = msgs.scrollHeight;
  }

  function showLoading() {

    const msgs = document.getElementById("ai-messages");

    const div = document.createElement("div");

    div.id = "ai-loading";

    div.className = "ai-msg bot";

    div.innerHTML = `
      <div class="ai-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;

    msgs.appendChild(div);

    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideLoading() {

    const loading = document.getElementById("ai-loading");

    if (loading) {
      loading.remove();
    }
  }

  async function sendMessage(customText) {

    if (isLoading) return;

    const input = document.getElementById("ai-input");

    const text = customText || input.value.trim();

    if (!text) return;

    input.value = "";

    addMessage(text, "user");

    conversationHistory.push({
      role: "user",
      content: text
    });

    isLoading = true;

    document.getElementById("ai-send").disabled = true;

    showLoading();

    try {

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: conversationHistory
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error del servidor");
      }

      const reply =
        data.content?.[0]?.text ||
        "No se recibió respuesta.";

      conversationHistory.push({
        role: "assistant",
        content: reply
      });

      hideLoading();

      addMessage(reply, "bot");

    } catch (err) {

      hideLoading();

      addMessage("❌ Error: " + err.message, "bot");

      console.error("AI Error:", err);

    } finally {

      isLoading = false;

      document.getElementById("ai-send").disabled = false;
    }
  }

  /* =======================
     API GLOBAL
  ======================= */

  window.AIAssistant = {

    ask: (q) => sendMessage(q),

    open: () => {
      isOpen = true;
      panel.classList.add("open");
    },

    close: () => {
      isOpen = false;
      panel.classList.remove("open");
    }
  };

})();