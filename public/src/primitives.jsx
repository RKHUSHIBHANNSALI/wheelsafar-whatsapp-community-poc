/* global React */

function Field({ label, hint, children, full, required = false }) {
  return (
    <div className={`field ${full ? "full" : ""}`}>
      <span className="field-label">
        {label}
        {required ? <span className="required-marker" aria-hidden="true"> *</span> : null}
      </span>
      {children}
      {hint && <span className="help">{hint}</span>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", inputMode, prefix }) {
  const input = (
    <input
      className="input"
      type={type}
      inputMode={inputMode}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
    />
  );
  if (prefix) {
    return (
      <div className="input-prefix">
        <span>{prefix}</span>
        {input}
      </div>
    );
  }
  return input;
}

function TextArea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      className="textarea"
      value={value ?? ""}
      placeholder={placeholder}
      rows={rows}
      onChange={e => onChange(e.target.value)}
    />
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select className="select" value={value ?? ""} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder || "Select"}</option>
      {options.map(opt => {
        const v = typeof opt === "string" ? opt : opt.value;
        const l = typeof opt === "string" ? opt : opt.label;
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
  );
}

function PillGroup({ value, onChange, options }) {
  return (
    <div className="pill-grid">
      {options.map(opt => {
        const v = typeof opt === "string" ? opt : opt.value;
        const l = typeof opt === "string" ? opt : opt.label;
        return (
          <button
            key={v}
            type="button"
            className={`pill-opt ${value === v ? "active" : ""}`}
            onClick={() => onChange(v)}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

function ChoiceCard({ id, label, sub, icon, active, onSelect, compact }) {
  return (
    <button type="button" className={`choice-card ${active ? "active" : ""}`} onClick={() => onSelect(id)}>
      {icon && (
        <div className="c-icon">
          <img src={icon} alt="" />
        </div>
      )}
      <div>
        <div className="c-label">{label}</div>
        {sub && !compact && <div className="c-sub">{sub}</div>}
      </div>
      <div className="c-check">
        {active && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
      </div>
    </button>
  );
}

function RadioList({ value, onChange, options }) {
  return (
    <div className="radio-list">
      {options.map(opt => (
        <div key={opt.id}
          className={`radio-item ${value === opt.id ? "active" : ""}`}
          onClick={() => onChange(opt.id)}
        >
          <div className="dot-wrap"></div>
          <div>
            <div className="label">{opt.label}</div>
            {opt.sub && <div className="sub">{opt.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChecklistPills({ value = [], onChange, options }) {
  const toggle = v => {
    if (value.includes(v)) onChange(value.filter(x => x !== v));
    else onChange([...value, v]);
  };
  return (
    <div className="pill-grid">
      {options.map(opt => {
        const v = typeof opt === "string" ? opt : opt.value;
        const l = typeof opt === "string" ? opt : opt.label;
        return (
          <button key={v} type="button"
            className={`pill-opt ${value.includes(v) ? "active" : ""}`}
            onClick={() => toggle(v)}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

function CheckItem({ checked, onChange, children, sub }) {
  return (
    <div className={`check-item ${checked ? "checked" : ""}`} onClick={() => onChange(!checked)}>
      <div className="box">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <div className="t">{children}{sub && <small>{sub}</small>}</div>
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented">
      {options.map(opt => {
        const v = typeof opt === "string" ? opt : opt.value;
        const l = typeof opt === "string" ? opt : opt.label;
        return (
          <button key={v} type="button"
            className={value === v ? "active" : ""}
            onClick={() => onChange(v)}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

function Crumbs({ items }) {
  return (
    <div className="crumbs">
      {items.filter(Boolean).map((item, i) => (
        <div className="crumb" key={i}>
          {item.label}: <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  Field, TextInput, TextArea, Select, PillGroup, ChoiceCard, RadioList,
  ChecklistPills, CheckItem, Segmented, Crumbs,
});
