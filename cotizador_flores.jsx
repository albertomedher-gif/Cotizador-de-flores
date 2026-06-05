import { useState } from "react";

const TARIFAS = {
  nacional: { base: 280, descuento5: 0.12, descuento10: 0.22 },
  usa: { base: 520, descuento5: 0.15, descuento10: 0.28 },
  europa: { base: 890, descuento5: 0.18, descuento10: 0.32 },
  internacional: { base: 750, descuento5: 0.16, descuento10: 0.30 },
};

const FREQ_LABEL = {
  puntual: "envío único",
  semanal: "cada semana",
  varias: "varias veces por semana",
  diario: "envíos diarios",
};

const DESTINO_LABEL = {
  nacional: "dentro de México",
  usa: "Estados Unidos / Canadá",
  europa: "Europa",
  internacional: "destino internacional",
};

function calcularTarifa(cajas, destino) {
  const t = TARIFAS[destino];
  let precioPorCaja = t.base;
  let nivel = "estandar";
  if (cajas >= 10) { precioPorCaja = t.base * (1 - t.descuento10); nivel = "vip"; }
  else if (cajas >= 5) { precioPorCaja = t.base * (1 - t.descuento5); nivel = "preferente"; }
  return { precioPorCaja: Math.round(precioPorCaja), total: Math.round(precioPorCaja * cajas), nivel };
}

const stepConfig = [
  {
    id: "cajas",
    pregunta: "¿Cuántas cajas quieres enviar?",
    opciones: [
      { val: 2, label: "1–4 cajas", icon: "📦", sub: "envíos pequeños" },
      { val: 7, label: "5–9 cajas", icon: "📦📦", sub: "precio preferente" },
      { val: 14, label: "10–19 cajas", icon: "📦📦📦", sub: "precio VIP" },
      { val: 25, label: "20+ cajas", icon: "🏭", sub: "máximo ahorro" },
    ],
  },
  {
    id: "destino",
    pregunta: "¿A dónde van tus flores?",
    opciones: [
      { val: "nacional", label: "Dentro de México", icon: "🇲🇽", sub: "entrega en 24–48 hrs" },
      { val: "usa", label: "EE.UU. / Canadá", icon: "🇺🇸", sub: "2–3 días hábiles" },
      { val: "europa", label: "Europa", icon: "🇪🇺", sub: "3–5 días hábiles" },
      { val: "internacional", label: "Otro destino", icon: "🌍", sub: "tiempo variable" },
    ],
  },
  {
    id: "frecuencia",
    pregunta: "¿Con qué frecuencia envías?",
    opciones: [
      { val: "puntual", label: "Envío único", icon: "1️⃣", sub: "lo necesito ya" },
      { val: "semanal", label: "Cada semana", icon: "📅", sub: "cliente frecuente" },
      { val: "varias", label: "Varias veces/semana", icon: "🔄", sub: "alto volumen" },
      { val: "diario", label: "Todos los días", icon: "⚡", sub: "máximo descuento" },
    ],
  },
];

export default function Cotizador() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiMsg, setAiMsg] = useState("");

  const current = stepConfig[step];

  function selectOption(val) {
    const newAnswers = { ...answers, [current.id]: val };
    setAnswers(newAnswers);
    if (step < stepConfig.length - 1) {
      setTimeout(() => setStep(step + 1), 220);
    } else {
      generarCotizacion(newAnswers);
    }
  }

  async function generarCotizacion(data) {
    setLoading(true);
    const { cajas, destino, frecuencia } = data;
    const { precioPorCaja, total, nivel } = calcularTarifa(cajas, destino);

    const prompt = `Eres un asesor amable de envíos aéreos de flores para productores de Villa Guerrero, Estado de México. 
Genera un mensaje de cotización cálido, profesional y breve (máximo 5 líneas) con estos datos:
- Cajas: ${cajas} (nivel: ${nivel})
- Destino: ${DESTINO_LABEL[destino]}
- Frecuencia: ${FREQ_LABEL[frecuencia]}
- Precio por caja: $${precioPorCaja} MXN
- Total envío: $${total} MXN

Incluye: bienvenida al productor, resumen del precio, el beneficio del volumen si aplica, y una frase de cierre motivadora. 
Usa emojis de flores y aviones con moderación. No uses asteriscos ni markdown. Solo texto plano.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const json = await res.json();
      const msg = json.content?.find(b => b.type === "text")?.text || "";
      setAiMsg(msg);
    } catch {
      setAiMsg(`¡Gracias por tu confianza, productor de Villa Guerrero! Para ${cajas} cajas con envío ${DESTINO_LABEL[destino]}, tu precio preferencial es de $${precioPorCaja} MXN por caja — total: $${total} MXN. ¡Tu flor merece volar con el mejor servicio! 🌹✈️`);
    }

    setQuote({ cajas, destino, frecuencia, precioPorCaja, total, nivel });
    setLoading(false);
  }

  function reiniciar() {
    setStep(0);
    setAnswers({});
    setQuote(null);
    setAiMsg("");
    setLoading(false);
  }

  const nivelColor = { estandar: "#6b6860", preferente: "#0a6645", vip: "#1D9E75" };
  const nivelLabel = { estandar: "Tarifa estándar", preferente: "Precio preferente ✦", vip: "Precio VIP 🌟" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f5f2ec 0%,#e8f5ef 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Georgia', serif" }}>
      <div style={{ width: "100%", maxWidth: 500, background: "#fff", borderRadius: 24, boxShadow: "0 12px 48px rgba(10,74,56,0.13)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#0a4a38,#1D9E75)", padding: "28px 32px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>🌹</span>
            <div>
              <div style={{ color: "#7fe8c0", fontSize: 11, fontFamily: "system-ui", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>Cotizador · Envío Aéreo</div>
              <div style={{ color: "#fff", fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>Villa Guerrero, Edomex</div>
            </div>
          </div>
          {!quote && (
            <div style={{ display: "flex", gap: 6 }}>
              {stepConfig.map((s, i) => (
                <div key={s.id} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= step ? "#7fe8c0" : "rgba(255,255,255,0.25)", transition: "background 0.4s" }} />
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "28px 32px 32px" }}>
          {/* Step form */}
          {!quote && !loading && (
            <>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#0a4a38", marginBottom: 18, lineHeight: 1.3 }}>{current.pregunta}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {current.opciones.map(op => (
                  <button
                    key={op.val}
                    onClick={() => selectOption(op.val)}
                    style={{
                      background: answers[current.id] === op.val ? "#f0faf5" : "#fafaf8",
                      border: answers[current.id] === op.val ? "2px solid #1D9E75" : "1.5px solid #e8e6e0",
                      borderRadius: 14, padding: "14px 12px", textAlign: "left", cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#1D9E75"}
                    onMouseLeave={e => { if (answers[current.id] !== op.val) e.currentTarget.style.borderColor = "#e8e6e0"; }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{op.icon}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0a4a38", fontFamily: "system-ui" }}>{op.label}</div>
                    <div style={{ fontSize: 11, color: "#888", fontFamily: "system-ui", marginTop: 2 }}>{op.sub}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 16, animation: "spin 1.5s linear infinite", display: "inline-block" }}>✈️</div>
              <p style={{ color: "#0a4a38", fontFamily: "system-ui", fontSize: 15 }}>Calculando tu cotización...</p>
              <style>{`@keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }`}</style>
            </div>
          )}

          {/* Result */}
          {quote && !loading && (
            <>
              {/* AI message */}
              <div style={{ background: "#f0faf5", border: "1.5px solid #b6e8d4", borderRadius: 14, padding: "16px 18px", marginBottom: 20 }}>
                <p style={{ fontSize: 13.5, color: "#0a4a38", lineHeight: 1.7, fontFamily: "system-ui", margin: 0 }}>{aiMsg}</p>
              </div>

              {/* Price card */}
              <div style={{ background: "linear-gradient(135deg,#0a4a38,#1D9E75)", borderRadius: 16, padding: "20px 22px", marginBottom: 16, color: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 11, fontFamily: "system-ui", letterSpacing: "0.07em", textTransform: "uppercase", color: "#7fe8c0", marginBottom: 4 }}>Precio por caja</div>
                    <div style={{ fontSize: 34, fontWeight: 700 }}>${quote.precioPorCaja} <span style={{ fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.7)" }}>MXN</span></div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, fontFamily: "system-ui", letterSpacing: "0.07em", textTransform: "uppercase", color: "#7fe8c0", marginBottom: 4 }}>Total envío</div>
                    <div style={{ fontSize: 26, fontWeight: 700 }}>${quote.total} <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.7)" }}>MXN</span></div>
                  </div>
                </div>
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.2)", display: "flex", gap: 16, fontFamily: "system-ui", fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                  <span>📦 {quote.cajas} cajas</span>
                  <span>✈️ {DESTINO_LABEL[quote.destino]}</span>
                  <span>🔄 {FREQ_LABEL[quote.frecuencia]}</span>
                </div>
              </div>

              {/* Nivel badge */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <span style={{ background: quote.nivel === "vip" ? "#1D9E75" : "#f0faf5", color: quote.nivel === "vip" ? "#fff" : nivelColor[quote.nivel], fontFamily: "system-ui", fontSize: 12, fontWeight: 700, padding: "5px 16px", borderRadius: 20, border: `1.5px solid ${nivelColor[quote.nivel]}` }}>
                  {nivelLabel[quote.nivel]}
                </span>
              </div>

              <button
                onClick={reiniciar}
                style={{ width: "100%", background: "#0a4a38", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700, fontFamily: "system-ui", cursor: "pointer", letterSpacing: "0.03em" }}
              >
                Hacer otra cotización ↺
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
