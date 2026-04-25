/* global React */
function SiteNav({ route, onNavigate, user, onSignIn, onSignOut }) {
  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <a href="#/" onClick={e => { e.preventDefault(); onNavigate("/"); }} className="brand">
          <img src="assets/yellow_wheelsafar_logo.svg" alt="Wheelsafar" />
        </a>
        <nav className="nav-links">
          <a className={route === "/" ? "active" : ""} href="#/" onClick={e => { e.preventDefault(); onNavigate("/"); }}>Garage sale</a>
          <a href="#rules" onClick={e => { e.preventDefault(); document.getElementById("rules")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Rules</a>
          <a href="#how" onClick={e => { e.preventDefault(); document.getElementById("how")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>How it works</a>
          <a href="https://wheelsafar.com" target="_blank" rel="noopener">Main site ↗</a>
        </nav>
        {user ? (
          <div className="signed-in-chip">
            <div className="avatar">{user.avatar}</div>
            <span className="name">{user.name.split(" ")[0]}</span>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: "6px 12px", fontSize: 12, marginLeft: 8 }}
              onClick={onSignOut}
            >
              Logout
            </button>
          </div>
        ) : (
          <button className="nav-cta" onClick={onSignIn}>
            List your item
          </button>
        )}
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>© 2026 Wheelsafar · Garage sale · built for riders</div>
      <div style={{ display: "flex", gap: 18 }}>
        <a href="#">Rules</a>
        <a href="#">Community guidelines</a>
        <a href="#">support@wheelsafar.com</a>
      </div>
    </footer>
  );
}

function GoogleSSOModal({ authConfig, onClose, onSignIn }) {
  const [loading, setLoading] = React.useState(false);
  const [errorText, setErrorText] = React.useState("");

  React.useEffect(() => {
    if (!authConfig?.enabled || !authConfig?.google_client_id) return;
    function initialize() {
      if (!window.google?.accounts?.id) {
        setTimeout(initialize, 250);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: authConfig.google_client_id,
        callback: async (response) => {
          try {
            setLoading(true);
            setErrorText("");
            const result = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id_token: response.credential }),
            });
            const payload = await result.json();
            if (!result.ok || !payload.ok) {
              throw new Error(payload?.detail || payload?.error || "Google sign-in failed.");
            }
            const name = payload.user?.name || "Wheelsafar user";
            const user = {
              name,
              email: payload.user?.email || "",
              phone: "",
              avatar: name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "WS",
              picture: payload.user?.picture || "",
            };
            onSignIn(user);
          } catch (error) {
            setErrorText(error.message || "Google sign-in failed.");
          } finally {
            setLoading(false);
          }
        },
        auto_select: false,
      });
      const holder = document.getElementById("google-signin-modal");
      if (holder) {
        window.google.accounts.id.renderButton(holder, {
          theme: "filled_black",
          size: "large",
          text: "signin_with",
          shape: "pill",
          width: 320,
        });
      }
    }
    initialize();
  }, [authConfig, onSignIn]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="ws-mark">
          <img src="assets/wheelsafar_icon.svg" alt="" />
        </div>
        <h3>Sign in to list an item</h3>
        <p>Before your listing goes to the WhatsApp group, we verify you with your Google account linked to Wheelsafar.</p>
        {!authConfig?.enabled ? <p className="fine" style={{ color: "var(--ws-error)" }}>Google SSO not configured on backend.</p> : null}
        <div id="google-signin-modal" className="google-btn" style={{ minHeight: 44, display: "grid", placeItems: "center" }}>
          {loading ? <span className="spin" style={{ borderTopColor: "#202020", borderColor: "rgba(32,32,32,0.2)" }}></span> : "Loading Google…"}
        </div>
        {errorText ? <p className="fine" style={{ color: "var(--ws-error)" }}>{errorText}</p> : null}
        <p className="fine">By continuing, you agree to Wheelsafar's <a href="#">community rules</a> and confirm that listings are your own.</p>
      </div>
    </div>
  );
}

Object.assign(window, { SiteNav, SiteFooter, GoogleSSOModal });
