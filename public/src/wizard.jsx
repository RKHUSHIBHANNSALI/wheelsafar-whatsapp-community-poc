/* global React */

function Wizard({ state, update, onExit, onSubmit }) {
  const visibleSteps = stepsFor(state.category);
  const [current, setCurrent] = React.useState("category");
  const [sheetOpen, setSheetOpen] = React.useState(false);

  React.useEffect(() => {
    if (!visibleSteps.includes(current)) setCurrent("category");
  }, [state.category]);

  const idx = Math.max(visibleSteps.indexOf(current), 0);
  const isLast = current === "seller";

  function validStep(step) {
    if (step === "category") return !!state.category;
    if (step === "type") {
      const isFree = state.category === "accessories" || state.category === "technology";
      if (isFree) return (state.type || "").trim().length >= 2;
      if (state.category === "luggage" && state.type === "other") return state.customType.trim().length >= 2;
      return !!state.type;
    }
    if (step === "size") {
      if (state.category === "luggage") return String(state.size).length > 0;
      if (state.category === "riding-gears" && state.type === "boots") return !!state.size && !!state.sizeSystem;
      return !!state.size;
    }
    if (step === "details") {
      if (state.category === "motorcycle") return !!state.brand && !!state.model && !!state.mfgYear && !!state.condition;
      return !!state.brand && !!state.condition;
    }
    if (step === "price") return Number(state.price) > 0 && state.location.trim().length > 1;
    if (step === "photos") return (state.photos?.length || 0) >= 1;
    if (step === "reason") return state.description.trim().length >= 10;
    if (step === "seller") return state.sellerName.trim().length >= 2 && state.sellerPhone.trim().length >= 8 && state.consent;
    return true;
  }

  function next() {
    const nextIdx = idx + 1;
    if (nextIdx < visibleSteps.length) setCurrent(visibleSteps[nextIdx]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function prev() {
    if (idx > 0) setCurrent(visibleSteps[idx - 1]);
    else onExit();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const StepEl = {
    category: StepCategory, type: StepType, size: StepSize, details: StepDetails,
    price: StepPrice, photos: StepPhotos, reason: StepReason, seller: StepSeller,
  }[current];

  return (
    <div className="wizard-page fade-in">
      <div className="wizard-shell">
        <div>
          <div className="wiz-top">
            <div className="wiz-top-title">
              Step <strong>{idx + 1}</strong> of <strong>{visibleSteps.length}</strong> · {STEP_LABELS[current]}
            </div>
            <div className="save-pill"><span className="dot"></span>Draft saved</div>
          </div>

          <div className="progress-track">
            {visibleSteps.map((s, i) => (
              <div key={s} className={`progress-seg ${i < idx ? "done" : i === idx ? "current" : ""}`}></div>
            ))}
          </div>

          <StepEl state={state} update={update} />

          <div className="wiz-actions">
            <button className="btn btn-ghost" onClick={prev}>
              ← {idx === 0 ? "Back to landing" : "Previous"}
            </button>
            {isLast ? (
              <button className="btn btn-primary" disabled={!validStep(current)} onClick={onSubmit}>
                Post to WhatsApp group →
              </button>
            ) : (
              <button className="btn btn-primary" disabled={!validStep(current)} onClick={next}>
                Continue →
              </button>
            )}
          </div>
        </div>

        <aside className="preview-rail">
          <WhatsAppPreview state={state} user={{ name: state.sellerName }} />
          <Tips step={current} />
        </aside>
      </div>

      {/* Mobile preview FAB */}
      <button className="preview-fab" onClick={() => setSheetOpen(true)} aria-label="Preview WhatsApp post">
        <img src="assets/whatsapp.svg" alt="" />
      </button>
      <div className={`preview-sheet-backdrop ${sheetOpen ? "open" : ""}`} onClick={() => setSheetOpen(false)}></div>
      <div className={`preview-sheet ${sheetOpen ? "open" : ""}`}>
        <div className="handle"></div>
        <button className="close" onClick={() => setSheetOpen(false)}>×</button>
        <div style={{ padding: "16px 16px 32px" }}>
          <WhatsAppPreview state={state} user={{ name: state.sellerName }} />
        </div>
      </div>
    </div>
  );
}

function Confirmation({ state, listing, onNew, onBackHome }) {
  const forwardStatus = listing?.forward_status === "failed" ? "failed" : "done";

  return (
    <div className="confirm-page fade-in">
      <div className="confirm-hero">
        <div className="tick-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h1>Listing saved</h1>
        <p>We've recorded your listing and it's now on its way to the Garage Sale WhatsApp group.</p>
      </div>

      <div className="confirm-status-row">
        <div className="status-chip done">
          <div className="dot-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div>
            <div className="label">Saved</div>
            <div className="val">Listing #{String(Math.floor(Math.random() * 9000) + 1000)}</div>
          </div>
        </div>
        <div className={`status-chip ${forwardStatus === "done" ? "done" : "pending"}`}>
          <div className="dot-icon">
            {forwardStatus === "done" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : <span className="spin" style={{ borderTopColor: "var(--ws-yellow)", borderColor: "rgba(255,204,5,0.3)" }}></span>}
          </div>
          <div>
            <div className="label">WhatsApp post</div>
            <div className="val">
              {forwardStatus === "done"
                ? `Posted to ${listing?.forward_target || "group"}`
                : `Failed: ${listing?.forward_response?.detail || "forwarding error"}`}
            </div>
          </div>
        </div>
        <div className="status-chip pending">
          <div className="dot-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div>
            <div className="label">Admin review</div>
            <div className="val">Passive · removes only if flagged</div>
          </div>
        </div>
      </div>

      <WhatsAppPreview state={state} user={{ name: state.sellerName }} />

      <div className="confirm-actions">
        <button className="btn btn-primary" onClick={onNew}>List another item</button>
        <button className="btn btn-ghost" onClick={onBackHome}>Back to home</button>
      </div>
    </div>
  );
}

Object.assign(window, { Wizard, Confirmation });
