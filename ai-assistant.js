(function () {
  

  const SYSTEM_PROMPT = `Eres un asistente experto en redes de computadoras, específicamente en el ponchado de cables Ethernet. Ayudas con:
- Estándares T568A y T568B
- Pasos para ponchar cables RJ45
- Tipos de cables (directo, cruzado)
- Herramientas (ponchadora, pelacables, tester)
- Normas TIA/EIA
Responde siempre en español, de forma clara y concisa. Máximo 3 párrafos.`;

  let conversationHistory = [];
  let isOpen = false;
  let isLoading = false;

  const style = document.createElement("style");
  style.textContent = `
    #ai-btn {
      position: fixed; bottom: 24px; right: 24px;
      width: 56px; height: 56px; border-radius: 50%;
      background: #3a5bd9; color: white; border: none;
      cursor: pointer; font-size: 24px;
      box-shadow: 0 4px 14px rgba(58,91,217,0.5);
      z-index: 9999; display: flex; align-items: center;
      justify-content: center; transition: transform 0.2s, background 0.2s;
    }
    #ai-btn:hover { background: #2a4bc9; transform: scale(1.05); }
    #ai-btn .ai-badge {
      position: absolute; top: -4px; right: -4px;
      background: #f59e0b; color: #000; font-size: 9px;
      font-weight: 700; padding: 2px 5px; border-radius: 20px;
    }
    #ai-panel {
      position: fixed; bottom: 90px; right: 24px;
      width: 360px; max-height: 520px;
      background: #1a1a2e; border: 1px solid #2d2d4e;
      border-radius: 16px; display: flex; flex-direction: column;
      z-index: 9998; overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      transform: translateY(20px); opacity: 0;
      pointer-events: none; transition: all 0.25s ease;
    }
    #ai-panel.open { transform: translateY(0); opacity: 1; pointer-events: all; }
    #ai-header {
      padding: 14px 16px; background: #16213e;
      border-bottom: 1px solid #2d2d4e;
      display: flex; align-items: center; justify-content: space-between;
    }
    #ai-header-left { display: flex; align-items: center; gap: 10px; }
    #ai-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #3a5bd9, #7c3aed);
      display: flex; align-items: center; justify-content: center; font-size: 16px;
    }
    #ai-title { font-weight: 600; font-size: 14px; color: #e2e8f0; }
    #ai-subtitle { font-size: 11px; color: #64748b; }
    #ai-close { background: none; border: none; color: #64748b; cursor: pointer; font-size: 18px; padding: 4px; }
    #ai-close:hover { color: #e2e8f0; }
    #ai-quick-btns {
      padding: 10px 12px; display: flex; gap: 6px;
      flex-wrap: wrap; border-bottom: 1px solid #2d2d4e;
    }
    .ai-quick-btn {
      background: #2d2d4e; color: #94a3b8;
      border: 1px solid #3d3d6e; border-radius: 20px;
      padding: 4px 10px; font-size: 11px; cursor: pointer;
      transition: all 0.15s; white-space: nowrap;
    }
    .ai-quick-btn:hover { background: #3a5bd9; color: white; border-color: #3a5bd9; }
    #ai-messages {
      flex: 1; overflow-y: auto; padding: 12px;
      display: flex; flex-direction: column; gap: 10px;
      scrollbar-width: thin; scrollbar-color: #2d2d4e transparent;
    }
    .ai-msg { max-width: 85%; padding: 9px 12px; border-radius: 12px; font-size: 13px; line-height: 1.5; }
    .ai-msg.bot { background: #2d2d4e; color: #cbd5e1; align-self: flex-start; border-bottom-left-radius: 4px; }
    .ai-msg.user { background: #3a5bd9; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
    .ai-dots span {
      display: inline-block; width: 6px; height: 6px;
      background: #64748b; border-radius: 50%; margin: 0 2px;
      animation: ai-bounce 1.2s infinite;
    }
    .ai-dots span:nth-child(2) { animation-delay: 0.2s; }
    .ai-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes ai-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
    #ai-input-area {
      padding: 10px 12px; border-top: 1px solid #2d2d4e;
      display: flex; gap: 8px; align-items: flex-end;
    }
    #ai-input {
      flex: 1; background: #2d2d4e; border: 1px solid #3d3d6e;
      border-radius: 10px; color: #e2e8f0; font-size: 13px;
      padding: 8px 12px; resize: none; min-height: 36px;
      max-height: 96px; outline: none; font-family: inherit; line-height: 1.4;
    }
    #ai-input:focus { border-color: #3a5bd9; }
    #ai-input::placeholder { color: #475569; }
    #ai-send {
      width: 36px; height: 36px; background: #3a5bd9; border: none;
      border-radius: 10px; color: white; cursor: pointer; font-size: 16px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background 0.15s;
    }
    #ai-send:hover:not(:disabled) { background: #2a4bc9; }
    #ai-send:disabled { background: #2d2d4e; color: #475569; cursor: not-allowed; }
    @media (max-width: 420px) {
      #ai-panel { width: calc(100vw - 32px); right: 16px; bottom: 80px; }
      #ai-btn { bottom: 16px; right: 16px; }
    }
  `;
  document.head.appendChild(style);

  const btn = document.createElement("button");
  btn.id = "ai-btn";
  btn.innerHTML = `🤖<span class="ai-badge">IA</span>`;
  btn.title = "Asistente IA";

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
      <button id="ai-close" title="Cerrar">✕</button>
    </div>
    <div id="ai-quick-btns">
      <button class="ai-quick-btn" data-q="¿Cuál es la diferencia entre T568A y T568B?">T568A vs T568B</button>
      <button class="ai-quick-btn" data-q="¿Cómo hago un cable directo?">Cable directo</button>
      <button class="ai-quick-btn" data-q="¿Qué herramientas necesito para ponchar?">Herramientas</button>
      <button class="ai-quick-btn" data-q="¿Cuándo uso cable cruzado?">Cable cruzado</button>
    </div>
    <div id="ai-messages">
      <div class="ai-msg bot">¡Hola! 👋 Soy tu asistente experto en redes. Puedo ayudarte con el ponchado de cables Ethernet, estándares y el quiz. ¿En qué te puedo ayudar?</div>
    </div>
    <div id="ai-input-area">
      <textarea id="ai-input" placeholder="Escribe tu pregunta..." rows="1"></textarea>
      <button id="ai-send" title="Enviar">➤</button>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  btn.addEventListener("click", () => {
    isOpen = !isOpen;
    panel.classList.toggle("open", isOpen);
    if (isOpen) document.getElementById("ai-input").focus();
  });

  document.getElementById("ai-close").addEventListener("click", () => {
    isOpen = false;
    panel.classList.remove("open");
  });

  document.getElementById("ai-send").addEventListener("click", () => sendMessage());

  document.getElementById("ai-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  document.querySelectorAll(".ai-quick-btn").forEach((b) => {
    b.addEventListener("click", () => sendMessage(b.dataset.q));
  });

  function addMessage(text, role) {
    const msgs = document.getElementById("ai-messages");
    const div = document.createElement("div");
    div.className = `ai-msg ${role}`;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function showLoading() {
    const msgs = document.getElementById("ai-messages");
    const div = document.createElement("div");
    div.className = "ai-msg bot";
    div.id = "ai-loading-msg";
    div.innerHTML = `<div class="ai-dots"><span></span><span></span><span></span></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideLoading() {
    const el = document.getElementById("ai-loading-msg");
    if (el) el.remove();
  }

  async function sendMessage(customText) {
    if (isLoading) return;
    const input = document.getElementById("ai-input");
    const text = customText || input.value.trim();
    if (!text) return;

    input.value = "";
    addMessage(text, "user");
    conversationHistory.push({ role: "user", content: text });

    isLoading = true;
    document.getElementById("ai-send").disabled = true;
    showLoading();

    if (!isOpen) { isOpen = true; panel.classList.add("open"); }

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: conversationHistory,
        }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Error " + res.status);
      }

      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sin respuesta del servidor.";
      conversationHistory.push({ role: "assistant", content: reply });
      hideLoading();
      addMessage(reply, "bot");
    } catch (err) {
      hideLoading();
      addMessage("❌ Error: " + err.message, "bot");
      console.error("[AI]", err);
    } finally {
      isLoading = false;
      document.getElementById("ai-send").disabled = false;
    }
  }

  window.AIAssistant = {
    ask: (q) => sendMessage(q),
    open: () => { isOpen = true; panel.classList.add("open"); },
    close: () => { isOpen = false; panel.classList.remove("open"); },
    explainAnswer: (question, answer) =>
      sendMessage(`En el quiz, la respuesta correcta a "${question}" es "${answer}". ¿Por qué es correcta?`),
  };
})();