// Frontend logic: talks to the Flask backend via fetch().
let state = { symbols: [], rules: [], enabled: {}, facts: {}, query: "REF", nextId: 1 };
let defaults = null;

const $ = (id) => document.getElementById(id);

async function init() {
  const res = await fetch("/api/defaults");
  defaults = await res.json();
  loadDefaults();
}

function loadDefaults() {
  state.symbols = defaults.symbols;
  state.rules = JSON.parse(JSON.stringify(defaults.rules));
  state.enabled = {};
  state.rules.forEach((r) => (state.enabled[r.id] = true));
  state.facts = { ...defaults.facts };
  state.query = defaults.query;
  state.nextId = 3;
  renderAll();
  $("resultCard").classList.add("hidden");
}

function renderAll() {
  renderRules();
  renderFacts();
  renderSelects();
}

function renderRules() {
  const ul = $("rulesList");
  ul.innerHTML = "";
  state.rules.forEach((r, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <input type="checkbox" ${state.enabled[r.id] ? "checked" : ""} data-id="${r.id}">
      <span class="name">Rule ${i + 1}</span>
      <span class="formula">${r.if} &rArr; ${r.then}</span>
      <span class="desc">${r.text || "Custom rule"}</span>
      <button class="del" title="Remove" data-del="${r.id}">&times;</button>`;
    ul.appendChild(li);
  });
  ul.querySelectorAll("input[type=checkbox]").forEach((cb) =>
    cb.addEventListener("change", (e) => (state.enabled[e.target.dataset.id] = e.target.checked)));
  ul.querySelectorAll(".del").forEach((b) =>
    b.addEventListener("click", (e) => {
      const id = e.target.dataset.del;
      state.rules = state.rules.filter((r) => r.id !== id);
      delete state.enabled[id];
      renderRules();
    }));
}

function renderFacts() {
  const box = $("factsBox");
  box.innerHTML = "";
  state.symbols.forEach((s) => {
    const v = state.facts[s];
    const val = v === true ? "true" : v === false ? "false" : "unknown";
    const div = document.createElement("div");
    div.className = "fact";
    div.innerHTML = `<b>${s}</b>` + ["true", "false", "unknown"].map((o) =>
      `<label><input type="radio" name="fact-${s}" value="${o}" ${val === o ? "checked" : ""}> ${o === "true" ? "True" : o === "false" ? "False" : "Unknown"}</label>`
    ).join("");
    box.appendChild(div);
  });
  box.querySelectorAll("input[type=radio]").forEach((rb) =>
    rb.addEventListener("change", (e) => {
      const sym = e.target.name.replace("fact-", "");
      state.facts[sym] = e.target.value === "true" ? true : e.target.value === "false" ? false : null;
    }));
}

function renderSelects() {
  const opts = state.symbols.map((s) => `<option value="${s}">${s}</option>`).join("");
  $("newIf").innerHTML = opts;
  $("newThen").innerHTML = opts;
  $("newThen").value = state.symbols[state.symbols.length - 1];
  $("querySelect").innerHTML = opts;
  $("querySelect").value = state.query;
}

function addRule() {
  const a = $("newIf").value, b = $("newThen").value;
  if (a === b) { alert("Antecedent and consequent must be different."); return; }
  const id = "custom" + state.nextId++;
  state.rules.push({ id, if: a, then: b, text: "" });
  state.enabled[id] = true;
  renderRules();
}

async function verify() {
  state.query = $("querySelect").value;
  const payload = {
    rules: state.rules.filter((r) => state.enabled[r.id]),
    facts: state.facts,
    query: state.query,
  };
  const res = await fetch("/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) { alert(data.error || "Server error"); return; }
  showResult(data, payload);
}

const tf = (b) => (b ? "T" : "F");

function showResult(data, payload) {
  $("resultCard").classList.remove("hidden");
  const v = $("verdict"), d = $("verdictDetail");

  if (data.inconsistent) {
    v.className = "verdict warn";
    v.textContent = "Knowledge Base is inconsistent (no valid model).";
    d.textContent = "The rules and facts contradict each other, so every query is vacuously entailed. Fix the KB.";
  } else if (data.entails) {
    v.className = "verdict ok";
    v.textContent = `KB entails ${payload.query} (KB |= ${payload.query}): True`;
    d.textContent = `Verification successful: in all ${data.kb_true_count} row(s) where the KB holds, ${payload.query} is True. The outcome is structurally guaranteed.`;
  } else {
    const c = data.counterexample;
    v.className = "verdict fail";
    v.textContent = `KB does NOT entail ${payload.query}.`;
    d.textContent = "Counterexample discovered: " +
      Object.entries(c).map(([k, x]) => `${k}=${x ? "True" : "False"}`).join(", ");
  }

  const ruleCols = payload.rules;
  let html = "<tr>" + data.symbols.map((s) => `<th>${s}</th>`).join("") +
    ruleCols.map((r) => `<th>${r.if}&rArr;${r.then}</th>`).join("") +
    `<th>KB</th><th>Query (${payload.query})</th></tr>`;

  data.rows.forEach((row) => {
    const cls = row.counterexample ? "badrow" : row.kb ? "kbrow" : "";
    html += `<tr class="${cls}">` +
      data.symbols.map((s) => `<td class="${tf(row.model[s])}">${row.model[s] ? "True" : "False"}</td>`).join("") +
      ruleCols.map((r) => `<td class="${tf(row.rules[r.id])}">${row.rules[r.id] ? "True" : "False"}</td>`).join("") +
      `<td class="${tf(row.kb)}">${row.kb ? "True" : "False"}</td>` +
      `<td class="${tf(row.query)}">${row.query ? "True" : "False"}</td></tr>`;
  });
  $("truthTable").innerHTML = html;
  $("resultCard").scrollIntoView({ behavior: "smooth" });
}

$("addRuleBtn").addEventListener("click", addRule);
$("verifyBtn").addEventListener("click", verify);
$("resetBtn").addEventListener("click", loadDefaults);
init();
