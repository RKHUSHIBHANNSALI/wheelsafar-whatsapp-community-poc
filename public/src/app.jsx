/* global React, ReactDOM */

function App() {
  const [route, setRoute] = React.useState(() => location.hash.replace("#","") || "/");
  const [user, setUser] = React.useState(null);
  const [signInOpen, setSignInOpen] = React.useState(false);
  const [authConfig, setAuthConfig] = React.useState({ enabled: false, google_client_id: "" });
  const [submitError, setSubmitError] = React.useState("");
  const [formState, setFormState] = React.useState(() => {
    try {
      const saved = localStorage.getItem("ws_garage_draft");
      if (saved) return { ...defaultState(), ...JSON.parse(saved) };
    } catch (e) {}
    return defaultState();
  });
  const [confirmState, setConfirmState] = React.useState(null);
  const [tweaksOpen, setTweaksOpen] = React.useState(false);

  // Route sync
  React.useEffect(() => {
    function onHash() { setRoute(location.hash.replace("#","") || "/"); }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function navigate(to) { location.hash = to; }

  React.useEffect(() => {
    async function loadAuthConfig() {
      try {
        const response = await fetch("/api/auth/config");
        const payload = await response.json();
        setAuthConfig(payload || { enabled: false, google_client_id: "" });
      } catch (_error) {
        setAuthConfig({ enabled: false, google_client_id: "" });
      }
    }
    loadAuthConfig();
    try {
      const raw = localStorage.getItem("ws_google_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
      }
    } catch (_error) {}
  }, []);

  // Tweaks wiring
  React.useEffect(() => {
    applyTweaks(window.__TWEAKS__ || {});
    function onMsg(e) {
      const d = e.data;
      if (!d) return;
      if (d.type === "__activate_edit_mode") setTweaksOpen(true);
      if (d.type === "__deactivate_edit_mode") setTweaksOpen(false);
    }
    window.addEventListener("message", onMsg);
    window.parent?.postMessage?.({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Persist draft
  React.useEffect(() => {
    try { localStorage.setItem("ws_garage_draft", JSON.stringify(formState)); } catch (e) {}
  }, [formState]);

  function update(patch) { setFormState(prev => ({ ...prev, ...patch })); }

  function handleStart() {
    if (!user) {
      setSignInOpen(true);
      return;
    }
    else navigate("/form");
  }
  function handleSignIn(u) {
    setSubmitError("");
    setUser(u);
    setSignInOpen(false);
    localStorage.setItem("ws_google_user", JSON.stringify(u));
    setFormState(prev => ({
      ...prev,
      sellerName: u.name || prev.sellerName,
      sellerPhone: u.phone || prev.sellerPhone,
      sellerEmail: u.email || prev.sellerEmail,
    }));
    navigate("/form");
  }
  function handleSignOut() {
    setUser(null);
    setSignInOpen(false);
    localStorage.removeItem("ws_google_user");
    try {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }
    } catch (_error) {}
    navigate("/");
  }
  async function handleSubmit() {
    setSubmitError("");
    const payload = {
      category: formState.category || "",
      type: formState.type || "",
      custom_type_title: formState.customType || "",
      size: String(formState.size || ""),
      size_system: formState.sizeSystem || "",
      brand: formState.brand || "",
      model: [formState.model || "", formState.variant || ""].join(" ").trim(),
      purchase_year: formState.purchaseYear || "",
      condition: formState.condition || "",
      colour: formState.colour || "",
      price: String(formState.price || ""),
      price_type: formState.priceType || "fixed",
      used: "",
      owner_count: formState.owners || "",
      year: formState.purchaseYear || "",
      location: formState.location || "",
      sale_timeline: formState.timeline || "",
      mfg: formState.mfgYear || "",
      odo: String(formState.odometer || ""),
      reg: formState.regYear || "",
      description: formState.description || "",
      photos_names: (formState.photos || []).map((photo) => photo.name).slice(0, 2),
      reason: formState.reason || "",
      seller_name: formState.sellerName || "",
      seller_phone: formState.sellerPhone || "",
      location_consent: Boolean(formState.consent),
      call_preference: formState.contactPref || "",
    };

    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok && response.status !== 202) {
        throw new Error(
          typeof result?.detail === "string" ? result.detail : "Failed to submit listing."
        );
      }
      setConfirmState({ form: formState, listing: result.listing || null });
      navigate("/done");
      localStorage.removeItem("ws_garage_draft");
    } catch (error) {
      setSubmitError(error.message || "Failed to submit listing.");
      alert(error.message || "Failed to submit listing.");
    }
  }
  function handleNewListing() {
    setFormState(defaultState());
    setConfirmState(null);
    setSubmitError("");
    navigate("/form");
  }

  return (
    <>
      <SiteNav route={route} onNavigate={navigate} user={user} onSignIn={handleStart} onSignOut={handleSignOut} />
      {route === "/" && <Landing onStart={handleStart} />}
      {route === "/form" && (
        user
          ? <Wizard state={formState} update={update} onExit={() => navigate("/")} onSubmit={handleSubmit} />
          : <div style={{ padding: 60, textAlign: "center" }}>
              <p>Please sign in to continue.</p>
              <button className="btn btn-primary" onClick={() => setSignInOpen(true)}>Sign in with Google</button>
            </div>
      )}
      {route === "/done" && confirmState && (
        <Confirmation state={confirmState.form} listing={confirmState.listing} onNew={handleNewListing} onBackHome={() => navigate("/")} />
      )}
      <SiteFooter />
      {submitError ? <div style={{ position: "fixed", bottom: 16, left: 16, background: "#2b1111", border: "1px solid #8b0000", padding: "10px 14px", borderRadius: 12 }}>{submitError}</div> : null}
      {signInOpen && <GoogleSSOModal authConfig={authConfig} onClose={() => setSignInOpen(false)} onSignIn={handleSignIn} />}
      <TweaksPanel visible={tweaksOpen} onClose={() => setTweaksOpen(false)} />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<App />);
