/* global React */

const CATEGORIES = [
  { id: "motorcycle", label: "Motorcycle", sub: "Your complete bike",
    icon: "assets/home-bike.svg" },
  { id: "riding-gears", label: "Riding Gears", sub: "Helmet, jacket, pants, gloves, boots",
    icon: "assets/home-helmet.svg" },
  { id: "luggage", label: "Luggage", sub: "Tank bags, panniers, saddles",
    icon: "assets/home-accessory.svg" },
  { id: "accessories", label: "Accessories & Spares", sub: "Crash guards, mirrors, grips",
    icon: "assets/home-intercom.svg" },
  { id: "technology", label: "Technology & Gadgets", sub: "Intercoms, cameras, GPS",
    icon: "assets/home-intercom.svg" },
];

const TYPES_BY_CATEGORY = {
  "riding-gears": [
    { id: "helmet", label: "Helmet", icon: "assets/home-helmet.svg" },
    { id: "jacket", label: "Jacket", icon: "assets/home-jacket.svg" },
    { id: "pant", label: "Pant", icon: "assets/home-pant.svg" },
    { id: "gloves", label: "Gloves", icon: "assets/home-gloves.svg" },
    { id: "boots", label: "Boots", icon: "assets/home-boots.svg" },
  ],
  "luggage": [
    { id: "tank-bag", label: "Tank bag" },
    { id: "tail-bag", label: "Tail bag" },
    { id: "saddle-bags", label: "Saddle bags" },
    { id: "crash-bar-bags", label: "Crash bar bags" },
    { id: "topbox", label: "Topbox" },
    { id: "panniers", label: "Panniers" },
    { id: "backpack", label: "Backpack / hydration" },
    { id: "other", label: "Other" },
  ],
};

const MOTORCYCLE_BRANDS = [
  "Royal Enfield", "Honda", "Hero", "Bajaj", "TVS", "Yamaha",
  "Suzuki", "KTM", "Triumph", "BMW", "Ducati", "Kawasaki", "Harley-Davidson", "Other",
];

const CONDITIONS = ["Excellent", "Good", "Fair", "Needs work"];
const OWNER_COUNTS = ["1st Owner", "2nd Owner", "3rd Owner", "4+ Owners"];
const FUEL_TYPES = ["Petrol", "Diesel", "Electric"];
const TIMELINES = ["Urgent (within a week)", "Soon (this month)", "No rush — waiting for the right buyer"];
const CONTACT_PREFS = [
  { id: "whatsapp", label: "WhatsApp only", sub: "Buyers drop you a message" },
  { id: "call", label: "Call me directly", sub: "Voice-first contact" },
  { id: "both", label: "Either works", sub: "WhatsApp or calls, both fine" },
];

const YEARS = Array.from({ length: 26 }, (_, i) => `${2026 - i}`);

const MATERIALS = ["Mesh", "Cordura", "Gore-Tex", "Leather"];
const HELMET_SHELL = ["Fiberglass", "Polycarbonate", "Carbon", "Don't know"];
const SAFETY_RATINGS = ["ECE 22.05", "ECE 22.06", "DOT", "ISI", "SNELL"];
const VISOR_TYPES = ["Clear", "Tinted", "Pinlock included", "Pinlock ready"];
const GLOVE_TYPES = ["Street", "Touring", "Track", "Full gauntlet", "Short cuff"];

const MOCK_USER = {
  name: "Aarav Shah",
  email: "aarav.shah@gmail.com",
  phone: "+91 98203 44119",
  avatar: "AS",
};

function defaultState() {
  return {
    // Step 1 — category
    category: "",
    // Step 2 — type
    type: "",
    customType: "",
    // Step 3 — size
    size: "",
    sizeSystem: "",
    // Step 4 — details
    brand: "",
    model: "",
    variant: "",
    purchaseYear: "",
    mfgYear: "",
    regYear: "",
    odometer: "",
    owners: "",
    fuelType: "",
    condition: "",
    material: "",
    shell: "",
    safetyRatings: [],
    visor: [],
    bluetooth: "",
    colour: "",
    gloveType: "",
    protectionLevel: "",
    waterproof: "",
    bootLength: "",
    // Step 5 — pricing & location
    price: "",
    priceType: "fixed",
    location: "",
    timeline: "",
    // Step 6 — photos
    photos: [],     // [{ id, name, dataUrl }]
    // Step 7 — description & reason
    description: "",
    reason: "",
    // Step 8 — seller & consent
    sellerName: MOCK_USER.name,
    sellerPhone: MOCK_USER.phone,
    sellerEmail: MOCK_USER.email,
    contactPref: "whatsapp",
    consent: false,
  };
}

/* Steps visible per category */
function stepsFor(category) {
  const base = ["category"];
  if (!category) return base;
  if (category !== "motorcycle") base.push("type");
  if (category !== "accessories" && category !== "technology") base.push("size");
  base.push("details", "price", "photos", "reason", "seller");
  return base;
}

const STEP_LABELS = {
  category: "Category",
  type: "Type",
  size: "Size",
  details: "Details",
  price: "Price & location",
  photos: "Photos",
  reason: "Description",
  seller: "Contact",
};

const STEP_KICKER = {
  category: "01 — What you're selling",
  type: "02 — Pick the type",
  size: "03 — Size",
  details: "04 — Listing details",
  price: "05 — Pricing & location",
  photos: "06 — Photos",
  reason: "07 — Description & reason",
  seller: "08 — How buyers reach you",
};

function getSizeOptions(category, type) {
  if (category === "motorcycle") return ["0 – 250cc", "250 – 650cc", "650cc & above"];
  if (category === "riding-gears") {
    if (type === "boots") return ["5","6","7","8","9","10","11","12","13"];
    if (type === "helmet") return ["XS","S","M","L","XL","2XL"];
    return ["XS","S","M","L","XL","2XL","3XL","4XL"];
  }
  return [];
}

/* Generate the WhatsApp-ready message text from state */
function buildWhatsAppMessage(state) {
  if (!state.category) return "";
  const lines = [];
  const title =
    state.category === "motorcycle"
      ? `${state.brand || "Motorcycle"} ${state.model || ""}${state.variant ? ` ${state.variant}` : ""}`.trim()
      : state.category === "accessories" || state.category === "technology"
        ? `${state.brand ? state.brand + " " : ""}${state.type || (state.category === "technology" ? "Gadget" : "Accessory")}${state.model ? " · " + state.model : ""}`.trim()
        : `${state.brand ? state.brand + " " : ""}${typeLabel(state)}${state.model ? " · " + state.model : ""}`.trim();

  lines.push(`*${title || "New listing"}*`);
  if (state.price) lines.push(`💸 ₹${Number(state.price).toLocaleString("en-IN")}${state.priceType === "negotiable" ? " · negotiable" : " · fixed"}`);
  if (state.location) lines.push(`📍 ${state.location}`);
  lines.push("");

  const specs = [];
  if (state.category === "motorcycle") {
    if (state.mfgYear) specs.push(`Year: ${state.mfgYear}`);
    if (state.odometer) specs.push(`Odo: ${Number(state.odometer).toLocaleString("en-IN")} km`);
    if (state.owners) specs.push(state.owners);
    if (state.fuelType) specs.push(state.fuelType);
    if (state.condition) specs.push(`${state.condition} condition`);
  } else {
    if (state.size) specs.push(`Size: ${state.sizeSystem ? state.sizeSystem + " " : ""}${state.size}`);
    if (state.condition) specs.push(`${state.condition} condition`);
    if (state.material) specs.push(state.material);
    if (state.colour) specs.push(state.colour);
    if (state.purchaseYear) specs.push(`Bought ${state.purchaseYear}`);
  }
  if (specs.length) lines.push(specs.join(" · "));

  if (state.description) { lines.push(""); lines.push(state.description); }
  if (state.reason) { lines.push(""); lines.push(`Why selling: ${state.reason}`); }
  lines.push("");

  const seller = state.sellerName || MOCK_USER.name;
  const contactLine =
    state.contactPref === "call" ? `Call ${seller} · ${state.sellerPhone}` :
    state.contactPref === "both" ? `${seller} · ${state.sellerPhone} (WA or call)` :
    `WhatsApp ${seller} · ${state.sellerPhone}`;
  lines.push(`👉 ${contactLine}`);

  return lines.join("\n");
}

function typeLabel(state) {
  if (!state.type) return "";
  if (state.category === "luggage" && state.type === "other") {
    return state.customType || "Luggage";
  }
  const types = TYPES_BY_CATEGORY[state.category];
  if (!types) return state.type;
  const found = types.find(t => t.id === state.type);
  return found ? found.label : state.type;
}

function categoryLabel(id) {
  return CATEGORIES.find(c => c.id === id)?.label || id;
}

Object.assign(window, {
  CATEGORIES, TYPES_BY_CATEGORY, MOTORCYCLE_BRANDS, CONDITIONS, OWNER_COUNTS,
  FUEL_TYPES, TIMELINES, CONTACT_PREFS, YEARS, MATERIALS, HELMET_SHELL,
  SAFETY_RATINGS, VISOR_TYPES, GLOVE_TYPES, MOCK_USER,
  defaultState, stepsFor, STEP_LABELS, STEP_KICKER,
  getSizeOptions, buildWhatsAppMessage, typeLabel, categoryLabel,
});
