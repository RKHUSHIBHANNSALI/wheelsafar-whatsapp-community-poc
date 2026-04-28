/* global React */
/* Step renderers — one per step of the wizard */

function StepCategory({ state, update }) {
  return (
    <div className="fade-in">
      <div className="step-header">
        <span className="step-kicker">{STEP_KICKER.category}</span>
        <h2>What are you selling?</h2>
        <p>Pick the category that fits best — we'll only ask questions relevant to it.</p>
      </div>
      <div className="choice-grid">
        {CATEGORIES.map(c => (
          <ChoiceCard key={c.id} id={c.id} label={c.label} sub={c.sub} icon={c.icon}
            active={state.category === c.id}
            onSelect={id => {
              if (state.category !== id) {
                update({ ...defaultState(), category: id, sellerName: state.sellerName, sellerPhone: state.sellerPhone, sellerEmail: state.sellerEmail });
              } else {
                update({ category: id });
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

function StepType({ state, update }) {
  const freeText = state.category === "accessories" || state.category === "technology";
  const types = TYPES_BY_CATEGORY[state.category];

  return (
    <div className="fade-in">
      <div className="step-header">
        <span className="step-kicker">{STEP_KICKER.type}</span>
        <h2>{freeText ? "Describe the item" : "Pick the type"}</h2>
        <p>{freeText
          ? "A short, searchable name. Think what buyers would scroll past looking for."
          : "This helps us ask the right follow-up questions about size and fit."}</p>
      </div>
      <Crumbs items={[{ label: "Category", value: categoryLabel(state.category) }]} />
      {freeText ? (
        <div className="panel">
          <Field label="Item type" hint="e.g. Crash guard, phone mount, action camera, intercom">
            <TextInput value={state.type} onChange={v => update({ type: v })} placeholder="Type or paste here" />
          </Field>
        </div>
      ) : (
        <>
          <div className="choice-grid">
            {types.map(t => (
              <ChoiceCard key={t.id} id={t.id} label={t.label} icon={t.icon}
                active={state.type === t.id} compact
                onSelect={id => update({ type: id })} />
            ))}
          </div>
          {state.category === "luggage" && state.type === "other" && (
            <div className="panel" style={{ marginTop: 16 }}>
              <Field label="Other luggage type">
                <TextInput value={state.customType} onChange={v => update({ customType: v })}
                  placeholder="e.g. Hydration pack, seat bag, rain cover…" />
              </Field>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StepSize({ state, update }) {
  const isMotorcycle = state.category === "motorcycle";
  const isLuggage = state.category === "luggage";
  const isBoots = state.category === "riding-gears" && state.type === "boots";
  const sizes = getSizeOptions(state.category, state.type, state.sizeSystem);

  return (
    <div className="fade-in">
      <div className="step-header">
        <span className="step-kicker">{STEP_KICKER.size}</span>
        <h2>{isMotorcycle ? "Which engine band?" : isLuggage ? "What's the capacity?" : "What size is it?"}</h2>
        <p>{isMotorcycle ? "We group motorcycles by CC band so buyers can filter easily."
          : isLuggage ? "Give the litre capacity — that's what buyers search by."
          : "Match what's printed on the tag — mismatched sizes are the #1 reason deals fall through."}</p>
      </div>
      <Crumbs items={[
        { label: "Category", value: categoryLabel(state.category) },
        !isMotorcycle && state.type ? { label: "Type", value: typeLabel(state) } : null,
      ].filter(Boolean)} />

      {isLuggage ? (
        <div className="panel">
          <Field label="Capacity" hint="Usually printed on the tag or listed on the brand's website">
            <TextInput value={state.size} onChange={v => update({ size: v })}
              type="text" inputMode="numeric" placeholder="20" prefix="L" />
          </Field>
        </div>
      ) : isBoots ? (
        <>
          <div className="panel">
            <Field label="Size system">
              <Segmented value={state.sizeSystem} onChange={v => update({ sizeSystem: v })}
                options={["UK","US","EU"]} />
            </Field>
          </div>
          <div className="panel">
            <Field label="Size">
              <PillGroup value={state.size} onChange={v => update({ size: v })} options={sizes} />
            </Field>
          </div>
        </>
      ) : (
        <div className="panel">
          <Field label="Size">
            <PillGroup value={state.size} onChange={v => update({ size: v })} options={sizes} />
          </Field>
        </div>
      )}
    </div>
  );
}

function StepDetails({ state, update }) {
  const isMotorcycle = state.category === "motorcycle";
  const isGear = state.category === "riding-gears";
  const isHelmet = isGear && state.type === "helmet";
  const isJacketPant = isGear && (state.type === "jacket" || state.type === "pant");
  const isGloves = isGear && state.type === "gloves";
  const isBoots = isGear && state.type === "boots";
  const isAccTech = state.category === "accessories" || state.category === "technology";
  const isLuggage = state.category === "luggage";

  return (
    <div className="fade-in">
      <div className="step-header">
        <span className="step-kicker">{STEP_KICKER.details}</span>
        <h2>The details that matter</h2>
        <p>The more specific you are here, the fewer follow-up messages you'll field.</p>
      </div>
      <Crumbs items={[
        { label: "Category", value: categoryLabel(state.category) },
        state.type ? { label: "Type", value: typeLabel(state) } : null,
        state.size ? { label: "Size", value: `${state.sizeSystem ? state.sizeSystem + " " : ""}${state.size}${isLuggage ? "L" : ""}` } : null,
      ].filter(Boolean)} />

      {/* Brand + model */}
      <div className="panel">
        <h3>Brand & model</h3>
        <div className="form-grid">
          <Field label="Brand">
            {isMotorcycle
              ? <Select value={state.brand} onChange={v => update({ brand: v })}
                  options={MOTORCYCLE_BRANDS} placeholder="Select brand" />
              : <TextInput value={state.brand} onChange={v => update({ brand: v })}
                  placeholder="e.g. Alpinestars, Rynox, Shoei" />}
          </Field>
          <Field label="Model">
            <TextInput value={state.model} onChange={v => update({ model: v })}
              placeholder="e.g. GT-Air II" />
          </Field>
          {isMotorcycle && (
            <Field label="Variant / colour / edition">
              <TextInput value={state.variant} onChange={v => update({ variant: v })}
                placeholder="e.g. Metallic Silver" />
            </Field>
          )}
          <Field label="Condition">
            <Select value={state.condition} onChange={v => update({ condition: v })}
              options={CONDITIONS} placeholder="How is it?" />
          </Field>
        </div>
      </div>

      {/* Motorcycle specifics */}
      {isMotorcycle && (
        <div className="panel">
          <h3>Motorcycle specifics</h3>
          <div className="form-grid">
            <Field label="Year of manufacture">
              <Select value={state.mfgYear} onChange={v => update({ mfgYear: v })} options={YEARS} placeholder="Select year" />
            </Field>
            <Field label="Year of registration">
              <Select value={state.regYear} onChange={v => update({ regYear: v })} options={YEARS} placeholder="Select year" />
            </Field>
            <Field label="Odometer">
              <TextInput value={state.odometer} onChange={v => update({ odometer: v })}
                type="text" inputMode="numeric" placeholder="25000" prefix="km" />
            </Field>
            <Field label="Number of owners">
              <Select value={state.owners} onChange={v => update({ owners: v })} options={OWNER_COUNTS} placeholder="Select" />
            </Field>
            <Field label="Fuel type">
              <Select value={state.fuelType} onChange={v => update({ fuelType: v })} options={FUEL_TYPES} placeholder="Select" />
            </Field>
            <Field label="Purchase year">
              <Select value={state.purchaseYear} onChange={v => update({ purchaseYear: v })} options={YEARS} placeholder="Select" />
            </Field>
          </div>
        </div>
      )}

      {/* Helmet specifics */}
      {isHelmet && (
        <div className="panel">
          <h3>Helmet specifics</h3>
          <div className="form-grid">
            <Field label="Shell material">
              <Select value={state.shell} onChange={v => update({ shell: v })} options={HELMET_SHELL} placeholder="Select" />
            </Field>
            <Field label="Bluetooth-ready">
              <Segmented value={state.bluetooth} onChange={v => update({ bluetooth: v })} options={["Yes","No"]} />
            </Field>
            <Field label="Safety ratings" full>
              <ChecklistPills value={state.safetyRatings} onChange={v => update({ safetyRatings: v })} options={SAFETY_RATINGS} />
            </Field>
            <Field label="Visor" full>
              <ChecklistPills value={state.visor} onChange={v => update({ visor: v })} options={VISOR_TYPES} />
            </Field>
          </div>
        </div>
      )}

      {/* Jacket / pants */}
      {isJacketPant && (
        <div className="panel">
          <h3>Fabric & protection</h3>
          <div className="form-grid">
            <Field label="Material" full>
              <PillGroup value={state.material} onChange={v => update({ material: v })} options={MATERIALS} />
            </Field>
            <Field label="Protection level">
              <Segmented value={state.protectionLevel} onChange={v => update({ protectionLevel: v })} options={["Level 1","Level 2"]} />
            </Field>
            <Field label="Waterproof">
              <Segmented value={state.waterproof} onChange={v => update({ waterproof: v })} options={["Yes","No"]} />
            </Field>
          </div>
        </div>
      )}

      {/* Gloves */}
      {isGloves && (
        <div className="panel">
          <h3>Glove specifics</h3>
          <div className="form-grid">
            <Field label="Type">
              <Select value={state.gloveType} onChange={v => update({ gloveType: v })} options={GLOVE_TYPES} placeholder="Select" />
            </Field>
            <Field label="Material">
              <Select value={state.material} onChange={v => update({ material: v })} options={MATERIALS} placeholder="Select" />
            </Field>
            <Field label="Protection level">
              <Segmented value={state.protectionLevel} onChange={v => update({ protectionLevel: v })} options={["Level 1","Level 2"]} />
            </Field>
          </div>
        </div>
      )}

      {/* Boots */}
      {isBoots && (
        <div className="panel">
          <h3>Boot specifics</h3>
          <div className="form-grid">
            <Field label="Length">
              <Select value={state.bootLength} onChange={v => update({ bootLength: v })}
                options={["Ankle","Half length","Full length"]} placeholder="Select" />
            </Field>
            <Field label="Waterproof">
              <Segmented value={state.waterproof} onChange={v => update({ waterproof: v })} options={["Yes","No"]} />
            </Field>
          </div>
        </div>
      )}

      {/* Acc / tech / luggage colour + used */}
      {(isAccTech || isLuggage) && (
        <div className="panel">
          <h3>Extra info</h3>
          <div className="form-grid">
            <Field label="Colour">
              <TextInput value={state.colour} onChange={v => update({ colour: v })} placeholder="Black, red, silver…" />
            </Field>
            <Field label="Purchase year">
              <Select value={state.purchaseYear} onChange={v => update({ purchaseYear: v })} options={YEARS} placeholder="Select" />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

function StepPrice({ state, update }) {
  return (
    <div className="fade-in">
      <div className="step-header">
        <span className="step-kicker">{STEP_KICKER.price}</span>
        <h2>Pricing & location</h2>
        <p>Pin where it is and what you want for it. Clear numbers get faster replies.</p>
      </div>
      <div className="panel">
        <div className="form-grid">
          <Field label="Asking price" hint="In Indian rupees">
            <TextInput value={state.price} onChange={v => update({ price: v })}
              type="text" inputMode="numeric" placeholder="5000" prefix="₹" />
          </Field>
          <Field label="Price type">
            <Segmented value={state.priceType} onChange={v => update({ priceType: v })}
              options={[{ value: "fixed", label: "Fixed" },{ value: "negotiable", label: "Negotiable" }]} />
          </Field>
          <Field label="Location" full>
            <TextInput value={state.location} onChange={v => update({ location: v })}
              placeholder="City · locality (e.g. Bengaluru, Indiranagar)" />
          </Field>
          <Field label="Sale timeline" full>
            <RadioList value={state.timeline} onChange={v => update({ timeline: v })}
              options={TIMELINES.map(t => ({ id: t, label: t }))} />
          </Field>
        </div>
      </div>
    </div>
  );
}

function StepPhotos({ state, update }) {
  const inputRef = React.useRef(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [dragId, setDragId] = React.useState(null);

  async function addFiles(fileList) {
    const files = Array.from(fileList || []).slice(0, 2 - (state.photos?.length || 0));
    const reads = await Promise.all(files.map(f => new Promise(res => {
      const reader = new FileReader();
      reader.onload = e => res({ id: Math.random().toString(36).slice(2), name: f.name, dataUrl: e.target.result });
      reader.readAsDataURL(f);
    })));
    const combined = [...(state.photos || []), ...reads].slice(0, 2);
    update({ photos: combined });
  }

  function remove(id) {
    update({ photos: state.photos.filter(p => p.id !== id) });
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  function reorder(from, to) {
    if (from === to) return;
    const arr = [...state.photos];
    const [m] = arr.splice(from, 1);
    arr.splice(to, 0, m);
    update({ photos: arr });
  }

  return (
    <div className="fade-in">
      <div className="step-header">
        <span className="step-kicker">{STEP_KICKER.photos}</span>
        <h2>Add up to two photos</h2>
        <p>One wide shot plus a close-up of any wear or detail is usually enough. The first photo leads the post.</p>
      </div>

      <div className={`photo-drop ${dragOver ? "dragover" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div className="icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        <h4>Drop photos here or click to choose</h4>
        <p>PNG or JPG · up to 2 photos · drag to reorder</p>
        <input ref={inputRef} type="file" accept="image/*" multiple
          style={{ display: "none" }} onChange={e => addFiles(e.target.files)} />
      </div>

      {state.photos?.length > 0 && (
        <div className="photo-grid">
          {state.photos.map((p, i) => (
            <div key={p.id}
              className={`photo-thumb ${dragId === p.id ? "dragging" : ""}`}
              draggable
              onDragStart={() => setDragId(p.id)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => {
                const from = state.photos.findIndex(x => x.id === dragId);
                const to = i;
                setDragId(null);
                reorder(from, to);
              }}
              onDragEnd={() => setDragId(null)}
            >
              <img src={p.dataUrl} alt={p.name} />
              <div className="label">{i === 0 ? "Lead" : "Photo 2"}</div>
              <button className="remove" onClick={e => { e.stopPropagation(); remove(p.id); }} aria-label="Remove">×</button>
              <div className="move-hint">Drag to reorder</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepReason({ state, update }) {
  return (
    <div className="fade-in">
      <div className="step-header">
        <span className="step-kicker">{STEP_KICKER.reason}</span>
        <h2>A few lines, in your own words</h2>
        <p>The human part. Buyers read this first after the specs — keep it honest and short.</p>
      </div>
      <div className="panel">
        <Field label="Description" hint="Condition notes, upgrades, fit quirks, what's included…">
          <TextArea value={state.description} onChange={v => update({ description: v })}
            rows={4} placeholder="e.g. Ridden for 14,000 km, serviced at authorised centre, comes with top box and original tool kit." />
        </Field>
      </div>
      <div className="panel">
        <Field label="Why are you selling it?" hint="Optional but builds trust">
          <TextArea value={state.reason} onChange={v => update({ reason: v })}
            rows={3} placeholder="e.g. Upgrading to a bigger bike. Moving cities. Clearing garage space." />
        </Field>
      </div>
    </div>
  );
}

function StepSeller({ state, update }) {
  return (
    <div className="fade-in">
      <div className="step-header">
        <span className="step-kicker">{STEP_KICKER.seller}</span>
        <h2>How should buyers reach you?</h2>
        <p>Your Wheelsafar-linked details are prefilled. Tweak anything that's changed.</p>
      </div>

      <div className="panel">
        <h3>Your details</h3>
        <div className="form-grid">
          <Field label="Full name">
            <TextInput value={state.sellerName} onChange={v => update({ sellerName: v })} placeholder="Full name" />
          </Field>
          <Field label="Phone">
            <TextInput value={state.sellerPhone} onChange={v => update({ sellerPhone: v })}
              placeholder="+91 98xxx xxxxx" />
          </Field>
          <Field label="Email (not shown in post)" full>
            <TextInput value={state.sellerEmail} onChange={v => update({ sellerEmail: v })}
              placeholder="you@example.com" />
          </Field>
        </div>
      </div>

      <div className="panel">
        <h3>Contact preference</h3>
        <RadioList value={state.contactPref} onChange={v => update({ contactPref: v })}
          options={CONTACT_PREFS} />
      </div>

      <div className="panel">
        <h3>Confirm & consent</h3>
        <CheckItem checked={state.consent} onChange={v => update({ consent: v })}
          sub="Required before we can post to the WhatsApp group.">
          I confirm that I own this item or am authorised to sell it, and I agree to have this listing posted in the Garage Sale WhatsApp group.
        </CheckItem>
      </div>
    </div>
  );
}

Object.assign(window, {
  StepCategory, StepType, StepSize, StepDetails, StepPrice,
  StepPhotos, StepReason, StepSeller,
});
