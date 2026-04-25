/* global React */

function Landing({ onStart }) {
  const tweaks = window.__TWEAKS__ || {};

  return (
    <div className="fade-in">
      <section className="hero">
        <div className="hero-grid hero-grid-solo">
          <div>
            <span className="eyebrow">
              <span className="dot"></span>
              Garage sale · Wheelsafar community
            </span>
            <h1 className="ws-display">
              Sell your <span className="accent">bike, gear</span>
              <br/>or kit to <em>2,400+ riders</em>
              <br/>in the group.
            </h1>
            <p className="lede">
              One short form. The listing lands instantly in the Garage Sale WhatsApp group — structured, scannable, and ready for buyers who already ride.
            </p>
            <div className="hero-cta-row">
              <button className="btn btn-primary btn-lg" onClick={onStart}>
                {tweaks.ctaCopy || "List it on the group"} →
              </button>
              <a href="#how" className="btn btn-ghost btn-lg" onClick={e => { e.preventDefault(); document.getElementById("how")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
                How it works
              </a>
            </div>
            <div className="hero-meta">
              <div><strong>&lt; 3 min</strong>To post a listing</div>
              <div><strong>2,400+</strong>Riders in the group</div>
              <div><strong>Instant</strong>To WhatsApp</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="categories">
        <div className="section-head">
          <span className="ws-caption caption">What you can list</span>
          <h2 className="ws-h1">Five categories. Built around how riders actually buy.</h2>
          <p className="ws-body">Pick one to start — the form adjusts automatically to only the fields that matter for what you're selling.</p>
        </div>
        <div className="cat-grid">
          {CATEGORIES.map(c => (
            <button className="cat-card" key={c.id} onClick={onStart}>
              <div className="cat-icon">
                <img src={c.icon} alt="" />
              </div>
              <div>
                <div className="cat-label">{c.label}</div>
                <div className="cat-sub">{c.sub}</div>
              </div>
              <div className="cat-arrow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="section" id="how">
        <div className="section-head">
          <span className="ws-caption caption">How it works</span>
          <h2 className="ws-h1">Four clean steps, zero back-and-forth.</h2>
        </div>
        <div className="steps-row">
          <div className="step-card">
            <div className="step-num">STEP 01</div>
            <h3>Sign in with Google</h3>
            <p>We link your Wheelsafar identity so buyers know who they're talking to.</p>
          </div>
          <div className="step-card">
            <div className="step-num">STEP 02</div>
            <h3>Answer a few questions</h3>
            <p>The form branches based on what you're selling. You only see fields that matter.</p>
          </div>
          <div className="step-card">
            <div className="step-num">STEP 03</div>
            <h3>Preview the post</h3>
            <p>We draft a clean WhatsApp message as you type. You see it before it sends.</p>
          </div>
          <div className="step-card">
            <div className="step-num">STEP 04</div>
            <h3>It lands in the group</h3>
            <p>Your listing goes into the Garage Sale WhatsApp group. Buyers contact you directly.</p>
          </div>
        </div>
      </section>

      <section className="section" id="rules">
        <div className="section-head">
          <span className="ws-caption caption">Listing rules</span>
          <h2 className="ws-h1">Keep the group useful for everyone.</h2>
        </div>
        <div className="rules-strip">
          <div>
            <h3>Allowed</h3>
            <ul>
              <li>Motorcycles you own, with clean paperwork</li>
              <li>Riding gear — helmets, jackets, pants, gloves, boots</li>
              <li>Luggage — tank bags, saddles, panniers</li>
              <li>Accessories, spare parts, gadgets (intercoms, cams, GPS)</li>
              <li>Honest photos and real pricing</li>
            </ul>
          </div>
          <div>
            <h3>Not allowed</h3>
            <ul>
              <li className="no">Items you don't own or aren't authorized to sell</li>
              <li className="no">Stolen, unregistered, or disputed motorcycles</li>
              <li className="no">Counterfeit gear or fake branded parts</li>
              <li className="no">Anything unrelated to motorcycling</li>
              <li className="no">Duplicate or spammy postings</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="cta-band-inner">
          <div>
            <h2>Your garage, their next ride.</h2>
            <p>Short, clean listings that actually sell. Takes under three minutes from start to group.</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={onStart}>
            {tweaks.ctaCopy || "Start listing"} →
          </button>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { Landing });
