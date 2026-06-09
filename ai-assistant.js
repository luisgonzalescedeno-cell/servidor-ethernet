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
  let isLoading = false;
  let isOpen = false;

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

      addMessage(
        "❌ Error: " + err.message,
        "bot"
      );

      console.error("AI Error:", err);

    } finally {

      isLoading = false;
      document.getElementById("ai-send").disabled = false;
    }
  }

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

    div.innerHTML = "Escribiendo...";

    msgs.appendChild(div);

    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideLoading() {

    const loading = document.getElementById("ai-loading");

    if (loading) {
      loading.remove();
    }
  }

  window.AIAssistant = {
    ask: (q) => sendMessage(q)
  };

})();
