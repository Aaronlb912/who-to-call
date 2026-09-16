const STORE = "who-to-call-v1";

const q = document.getElementById("q");
const form = document.getElementById("search-form");
const rows = document.getElementById("rows");
const table = document.getElementById("results-table");
const status = document.getElementById("status");
const empty = document.getElementById("empty");
const detail = document.getElementById("detail");
const topicForm = document.getElementById("topic-form");
const topicTitle = document.getElementById("topic-form-title");
const topicErr = document.getElementById("topic-err");
const topicSave = document.getElementById("topic-save");
const topicCancel = document.getElementById("topic-cancel");
const cityForm = document.getElementById("city-form");
const cityErr = document.getElementById("city-err");
const fileMsg = document.getElementById("file-msg");
const loadFile = document.getElementById("load-file");

let fixture = { city: {}, topics: [] };
let city = {};
let topics = [];
let selectedId = null;
let editingId = null;

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(u8) {
  let c = 0xffffffff;
  for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function u16(n) {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n, true);
  return b;
}

function u32(n) {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n, true);
  return b;
}

function concatBytes(parts) {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function zipStore(files) {
  const encoder = new TextEncoder();
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const crc = crc32(file.data);
    const local = concatBytes([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(file.data.length),
      u32(file.data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      file.data,
    ]);
    locals.push(local);
    centrals.push(
      concatBytes([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(file.data.length),
        u32(file.data.length),
        u16(nameBytes.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        nameBytes,
      ])
    );
    offset += local.length;
  }
  const localBlob = concatBytes(locals);
  const centralBlob = concatBytes(centrals);
  return concatBytes([
    localBlob,
    centralBlob,
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralBlob.length),
    u32(localBlob.length),
    u16(0),
  ]);
}

function saveBlob(filename, blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function haystack(topic) {
  return [topic.problem, topic.words, topic.desk, topic.phone, topic.window, topic.notes]
    .join(" ")
    .toLowerCase();
}

function matches(topic, query) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;
  const hay = haystack(topic);
  return words.every((w) => hay.includes(w));
}

function persist() {
  localStorage.setItem(STORE, JSON.stringify({ city, topics }));
}

function placeLine() {
  const town = city.city || "";
  const state = city.state || "";
  const zip = city.zip || "";
  return [town, state].filter(Boolean).join(", ") + (zip ? ` ${zip}` : "");
}

function parsePlace(text) {
  const t = text.trim();
  const m = t.match(/^(.*),\s*([^,]+?)\s+(\d[\d-]*)$/);
  if (m) return { city: m[1].trim(), state: m[2].trim(), zip: m[3].trim() };
  const m2 = t.match(/^(.*),\s*([^,]+)$/);
  if (m2) return { city: m2[1].trim(), state: m2[2].trim(), zip: "" };
  return { city: t, state: "", zip: "" };
}

function paintCity() {
  document.getElementById("place-line").textContent = city.place || "";
  document.getElementById("desk-line").textContent = city.desk || "City Clerk";
  document.title = `Who do I call | ${city.desk || "City Clerk"}`;
  const addr = [city.desk || "City Clerk", city.street, placeLine()]
    .filter(Boolean)
    .join(", ");
  document.getElementById("foot-addr").textContent = addr;
  document.getElementById("foot-contact").textContent = [city.phone, city.email]
    .filter(Boolean)
    .join(" - ");
  document.getElementById("foot-hours").textContent = city.hours || "";
  document.getElementById("city-place").value = city.place || "";
  document.getElementById("city-desk").value = city.desk || "";
  document.getElementById("city-street").value = city.street || "";
  document.getElementById("city-place-line").value = placeLine();
  document.getElementById("city-phone").value = city.phone || "";
  document.getElementById("city-email").value = city.email || "";
  document.getElementById("city-hours").value = city.hours || "";
}

function renderDetail(topic) {
  if (!topic) {
    const query = q.value.trim();
    if (!query) {
      detail.innerHTML = `<p class="detail-hint">Type a problem, then click a row. The desk and hours open here.</p>`;
    } else {
      detail.innerHTML = `<p class="detail-hint">No desk selected.</p>`;
    }
    return;
  }
  detail.innerHTML = `
    <div class="card-head">
      <p class="meta">${esc(topic.desk)}</p>
      <h2>${esc(topic.problem)}</h2>
    </div>
    <dl>
      <dt>Phone</dt>
      <dd class="phone">${esc(topic.phone)}</dd>
      <dt>Window</dt>
      <dd>${esc(topic.window)}</dd>
      <dt>Hours</dt>
      <dd>${esc(topic.hours)}</dd>
      <dt>What to tell them</dt>
      <dd>${esc(topic.notes)}</dd>
    </dl>
    <p class="detail-actions">
      <button type="button" id="print-btn">Print this card</button>
      <button type="button" class="secondary" id="edit-btn">Edit</button>
      <button type="button" class="secondary" id="remove-btn">Remove</button>
    </p>
  `;
  document.getElementById("print-btn").addEventListener("click", () => window.print());
  document.getElementById("edit-btn").addEventListener("click", () => startEdit(topic));
  document.getElementById("remove-btn").addEventListener("click", () => removeTopic(topic.id));
}

function render() {
  const query = q.value;
  const trimmed = query.trim();
  const shown = trimmed ? topics.filter((t) => matches(t, query)) : [];
  const still = shown.find((t) => t.id === selectedId);
  if (!still) {
    selectedId = null;
    renderDetail(null);
  } else {
    renderDetail(still);
  }

  rows.replaceChildren();
  for (const topic of shown) {
    const tr = document.createElement("tr");
    tr.tabIndex = 0;
    tr.dataset.id = topic.id;
    tr.setAttribute("role", "button");
    tr.setAttribute("aria-label", `${topic.problem}: ${topic.desk}, ${topic.phone}`);
    tr.setAttribute("aria-selected", topic.id === selectedId ? "true" : "false");
    tr.innerHTML = `
      <td>${esc(topic.problem)}</td>
      <td>${esc(topic.desk)}</td>
      <td>${esc(topic.phone)}</td>
    `;
    tr.addEventListener("click", () => select(topic.id));
    tr.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        select(topic.id);
      }
    });
    rows.appendChild(tr);
  }

  table.hidden = shown.length === 0;
  empty.hidden = shown.length > 0;
  if (!trimmed) {
    empty.textContent = "";
    empty.innerHTML = `Type a problem in the box. Try <strong>pothole</strong>, <strong>birth</strong>, or <strong>dog license</strong>.`;
    status.textContent = `${topics.length} problems on file. Type to see who to call.`;
  } else if (shown.length === 0) {
    empty.textContent = `Nothing here matches “${trimmed}”. Try another word, or add this problem below.`;
    status.textContent = "0 matches.";
  } else if (shown.length === 1) {
    status.textContent = `1 match for “${trimmed}”.`;
  } else {
    status.textContent = `${shown.length} matches for “${trimmed}”.`;
  }
}

function select(id) {
  selectedId = id;
  render();
}

function newId() {
  return `top-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function clearTopicForm() {
  editingId = null;
  topicTitle.textContent = "Add a problem";
  topicSave.textContent = "Add to the list";
  topicCancel.hidden = true;
  topicErr.hidden = true;
  topicErr.textContent = "";
  document.getElementById("top-problem").value = "";
  document.getElementById("top-words").value = "";
  document.getElementById("top-desk").value = "";
  document.getElementById("top-phone").value = "";
  document.getElementById("top-window").value = "";
  document.getElementById("top-hours").value = "";
  document.getElementById("top-notes").value = "";
}

function startEdit(topic) {
  editingId = topic.id;
  topicTitle.textContent = "Edit this problem";
  topicSave.textContent = "Save changes";
  topicCancel.hidden = false;
  topicErr.hidden = true;
  document.getElementById("top-problem").value = topic.problem;
  document.getElementById("top-words").value = topic.words;
  document.getElementById("top-desk").value = topic.desk;
  document.getElementById("top-phone").value = topic.phone;
  document.getElementById("top-window").value = topic.window;
  document.getElementById("top-hours").value = topic.hours;
  document.getElementById("top-notes").value = topic.notes;
  topicForm.scrollIntoView({ block: "start" });
}

function readTopicFields() {
  return {
    problem: document.getElementById("top-problem").value.trim(),
    words: document.getElementById("top-words").value.trim(),
    desk: document.getElementById("top-desk").value.trim(),
    phone: document.getElementById("top-phone").value.trim(),
    window: document.getElementById("top-window").value.trim(),
    hours: document.getElementById("top-hours").value.trim(),
    notes: document.getElementById("top-notes").value.trim(),
  };
}

function removeTopic(id) {
  const topic = topics.find((t) => t.id === id);
  if (!topic) return;
  if (!confirm(`Remove “${topic.problem}”?`)) return;
  topics = topics.filter((t) => t.id !== id);
  if (selectedId === id) selectedId = null;
  if (editingId === id) clearTopicForm();
  persist();
  render();
}

function normalizeTopic(raw, i) {
  if (!raw || typeof raw !== "object") return null;
  const problem = String(raw.problem ?? "").trim();
  const desk = String(raw.desk ?? "").trim();
  const phone = String(raw.phone ?? "").trim();
  const hours = String(raw.hours ?? "").trim();
  if (!problem || !desk || !phone || !hours) return null;
  return {
    id: String(raw.id ?? `imported-${i}`),
    problem,
    words: String(raw.words ?? "").trim(),
    desk,
    phone,
    window: String(raw.window ?? "").trim(),
    hours,
    notes: String(raw.notes ?? "").trim(),
  };
}

function applyBundle(bundle) {
  if (bundle.city && typeof bundle.city === "object") {
    city = { ...city, ...bundle.city };
  }
  topics = (bundle.topics || []).map((t, i) => normalizeTopic(t, i)).filter(Boolean);
  selectedId = null;
  clearTopicForm();
  paintCity();
  persist();
  render();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  render();
});

q.addEventListener("input", render);

topicForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const fields = readTopicFields();
  const missing = [];
  if (!fields.problem) missing.push("problem");
  if (!fields.desk) missing.push("desk");
  if (!fields.phone) missing.push("phone");
  if (!fields.hours) missing.push("hours");
  if (missing.length) {
    topicErr.textContent = `Fill ${missing.join(", ")} before saving.`;
    topicErr.hidden = false;
    return;
  }
  topicErr.hidden = true;
  if (editingId) {
    const topic = topics.find((t) => t.id === editingId);
    if (topic) Object.assign(topic, fields);
    selectedId = editingId;
    q.value = fields.problem;
  } else {
    const topic = { id: newId(), ...fields };
    topics.push(topic);
    selectedId = topic.id;
    q.value = fields.problem;
  }
  persist();
  render();
  clearTopicForm();
});

topicCancel.addEventListener("click", () => {
  clearTopicForm();
});

cityForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const place = document.getElementById("city-place").value.trim();
  const desk = document.getElementById("city-desk").value.trim();
  if (!place || !desk) {
    cityErr.textContent = "City line and desk name are required.";
    cityErr.hidden = false;
    return;
  }
  cityErr.hidden = true;
  const parsed = parsePlace(document.getElementById("city-place-line").value);
  city = {
    place,
    desk,
    street: document.getElementById("city-street").value.trim(),
    city: parsed.city,
    state: parsed.state,
    zip: parsed.zip,
    phone: document.getElementById("city-phone").value.trim(),
    email: document.getElementById("city-email").value.trim(),
    hours: document.getElementById("city-hours").value.trim(),
  };
  persist();
  paintCity();
  fileMsg.textContent = "City saved in this browser.";
});

document.getElementById("download-btn").addEventListener("click", () => {
  const blob = new Blob(
    [JSON.stringify({ city, topics }, null, 2)],
    { type: "application/json" }
  );
  saveBlob("topics.json", blob);
  fileMsg.textContent = "Downloaded topics.json. Put it next to index.html in your copy of the folder.";
});

document.getElementById("kit-btn").addEventListener("click", async () => {
  const enc = new TextEncoder();
  try {
    const [html, css, js, readme] = await Promise.all([
      fetch("index.html").then((r) => {
        if (!r.ok) throw new Error("html");
        return r.text();
      }),
      fetch("styles.css").then((r) => {
        if (!r.ok) throw new Error("css");
        return r.text();
      }),
      fetch("app.js").then((r) => {
        if (!r.ok) throw new Error("js");
        return r.text();
      }),
      fetch("README.txt").then((r) => (r.ok ? r.text() : "")),
    ]);
    const json = JSON.stringify({ city, topics }, null, 2) + "\n";
    const zip = zipStore([
      { name: "who-to-call/index.html", data: enc.encode(html) },
      { name: "who-to-call/styles.css", data: enc.encode(css) },
      { name: "who-to-call/app.js", data: enc.encode(js) },
      { name: "who-to-call/topics.json", data: enc.encode(json) },
      { name: "who-to-call/README.txt", data: enc.encode(readme) },
    ]);
    saveBlob("who-to-call.zip", new Blob([zip], { type: "application/zip" }));
    fileMsg.textContent = "Downloaded who-to-call.zip. Unzip and copy the who-to-call folder into your site.";
  } catch {
    fileMsg.textContent = "Could not build the folder download. Copy site/public/ from the repo instead.";
  }
});

document.getElementById("load-btn").addEventListener("click", () => {
  loadFile.click();
});

loadFile.addEventListener("change", async () => {
  const file = loadFile.files[0];
  loadFile.value = "";
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const bundle = Array.isArray(parsed) ? { topics: parsed } : parsed;
    const list = bundle.topics;
    if (!Array.isArray(list)) throw new Error("no topics array");
    const cleaned = list.map((t, i) => normalizeTopic(t, i)).filter(Boolean);
    if (!cleaned.length) {
      fileMsg.textContent = "That file had no usable rows. Each one needs a problem, desk, phone, and hours.";
      return;
    }
    applyBundle({ city: bundle.city, topics: cleaned });
    fileMsg.textContent = `Loaded ${cleaned.length} problems from ${file.name}.`;
  } catch {
    fileMsg.textContent = "Could not read that file. Use a JSON export from this page.";
  }
});

document.getElementById("restore-btn").addEventListener("click", () => {
  if (!confirm("Replace what is in this browser with the sample Galion list?")) return;
  localStorage.removeItem(STORE);
  city = structuredClone(fixture.city);
  topics = structuredClone(fixture.topics);
  selectedId = null;
  clearTopicForm();
  paintCity();
  persist();
  render();
  fileMsg.textContent = "Sample list restored.";
});

const data = await fetch("topics.json").then((r) => {
  if (!r.ok) throw new Error("topics.json missing");
  return r.json();
});

fixture = {
  city: data.city || {},
  topics: (data.topics || []).map((t, i) => normalizeTopic(t, i)).filter(Boolean),
};

let stored = null;
try {
  stored = JSON.parse(localStorage.getItem(STORE) || "null");
} catch {
  stored = null;
}

if (stored && Array.isArray(stored.topics) && stored.topics.length) {
  city = { ...fixture.city, ...(stored.city || {}) };
  topics = stored.topics.map((t, i) => normalizeTopic(t, i)).filter(Boolean);
} else {
  city = structuredClone(fixture.city);
  topics = structuredClone(fixture.topics);
}

paintCity();
render();
