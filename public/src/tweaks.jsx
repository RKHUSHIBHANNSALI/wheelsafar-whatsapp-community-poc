/* global React */

function TweaksPanel({ visible, onClose }) {
  const [tweaks, setTweaks] = React.useState(() => ({ ...(window.__TWEAKS__ || {}) }));

  function set(k, v) {
    const next = { ...tweaks, [k]: v };
    setTweaks(next);
    window.__TWEAKS__ = next;
    applyTweaks(next);
    window.parent?.postMessage?.({ type: "__edit_mode_set_keys", edits: { [k]: v } }, "*");
  }

  if (!visible) return null;
  return (
    <div className="tweaks-panel">
      <div className="head">
        <h4>Tweaks</h4>
        <button className="close" onClick={onClose}>×</button>
      </div>

      <label className="row">Accent colour
        <div className="swatch-row">
          {["#FFCC05","#FF6B35","#25D366","#4285F4","#FF2E63"].map(c => (
            <div key={c}
              className={`swatch ${tweaks.accent === c ? "active" : ""}`}
              style={{ background: c }}
              onClick={() => set("accent", c)}
            ></div>
          ))}
        </div>
      </label>

      <label className="row">Background
        <div className="seg">
          {[
            { v: "#050505", l: "Pure black" },
            { v: "#0A0A0A", l: "Shell" },
            { v: "#121212", l: "Soft" },
          ].map(o => (
            <button key={o.v} className={tweaks.background === o.v ? "active" : ""}
              onClick={() => set("background", o.v)}>{o.l}</button>
          ))}
        </div>
      </label>

      <label className="row">Hero CTA copy
        <input className="mini-input" value={tweaks.ctaCopy || ""}
          onChange={e => set("ctaCopy", e.target.value)} />
      </label>

      <label className="row">Density
        <div className="seg">
          {["comfortable","compact"].map(d => (
            <button key={d} className={tweaks.density === d ? "active" : ""}
              onClick={() => set("density", d)}>{d}</button>
          ))}
        </div>
      </label>

      <div className={`toggle ${tweaks.showPreviewDesktop ? "on" : ""}`}
        onClick={() => set("showPreviewDesktop", !tweaks.showPreviewDesktop)}>
        <span>WhatsApp preview rail (desktop)</span>
        <div className="switch"></div>
      </div>
    </div>
  );
}

function applyTweaks(tweaks) {
  const root = document.documentElement;
  if (tweaks.accent) root.style.setProperty("--ws-yellow", tweaks.accent);
  if (tweaks.background) root.style.setProperty("--ws-bg", tweaks.background);
  const densityGap = tweaks.density === "compact" ? "10px" : "14px";
  root.style.setProperty("--density-gap", densityGap);
  // Preview rail toggle
  document.body.classList.toggle("hide-preview-rail", !tweaks.showPreviewDesktop);
}

// Style: hide preview rail if tweaked off
const style = document.createElement("style");
style.textContent = `
  body.hide-preview-rail .wizard-shell { grid-template-columns: 1fr !important; max-width: 820px; }
  body.hide-preview-rail .preview-rail { display: none !important; }
`;
document.head.appendChild(style);

Object.assign(window, { TweaksPanel, applyTweaks });
