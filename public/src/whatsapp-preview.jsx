/* global React */

function WhatsAppPreview({ state, user }) {
  const msg = buildWhatsAppMessage(state);
  const hasContent = Boolean(state.category);
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Render bold **x** as <b>
  function renderText(txt) {
    const parts = txt.split(/(\*[^*]+\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
        return <b key={i}>{p.slice(1, -1)}</b>;
      }
      return <React.Fragment key={i}>{p}</React.Fragment>;
    });
  }

  const photos = state.photos || [];

  return (
    <div className="preview-card">
      <div className="preview-card-head">
        <div className="ws-logo">
          <img src="assets/whatsapp.svg" alt="" />
        </div>
        <div>
          <div className="title">Garage Sale by Wheelsafar</div>
          <div className="sub">WhatsApp group · 2,412 members</div>
        </div>
        <div className="live-dot" title="Live preview"></div>
      </div>
      <div className="wa-body">
        {!hasContent ? (
          <div className="preview-empty">
            <div className="icon">💬</div>
            Your post will build here as you fill the form.
          </div>
        ) : (
          <div className="wa-bubble">
            <div className="wa-sender">{user?.name || "You"} · Wheelsafar</div>
            {photos.length > 0 && (
              <div className={`wa-photos ${photos.length === 1 ? "one" : ""}`}>
                {photos.slice(0, 2).map(p => (
                  <div className="ph" key={p.id}>
                    <img src={p.dataUrl} alt="" />
                  </div>
                ))}
              </div>
            )}
            <div className="wa-text">{renderText(msg)}</div>
            <div className="wa-time">{timeStr} ✓✓</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Tips({ step }) {
  const tips = {
    category: { title: "Pick carefully", body: "Category drives the rest of the form — switching it later resets your answers." },
    type: { title: "Be specific", body: "The more specific the type, the faster buyers recognize what you're selling." },
    size: { title: "Double-check size", body: "Most buyer questions are size mismatches. Match what's actually on the tag." },
    details: { title: "Top 3 wins", body: "Year, condition and brand are what scroll-past buyers read first." },
    price: { title: "Round, honest pricing", body: "Round numbers get more replies. Add 'negotiable' if you'll flex ±10%." },
    photos: { title: "Two photos, well lit", body: "One wide, one tight detail. Avoid flash — daylight works best." },
    reason: { title: "Keep it human", body: "A real reason (\"upgrading\", \"moving cities\") builds trust faster than specs." },
    seller: { title: "Contact hygiene", body: "Buyers reply fastest to WhatsApp. Keep the number you actually check." },
  };
  const tip = tips[step];
  if (!tip) return null;
  return (
    <div className="tips-card">
      <h4>Tip — {tip.title}</h4>
      <p>{tip.body}</p>
    </div>
  );
}

Object.assign(window, { WhatsAppPreview, Tips });
