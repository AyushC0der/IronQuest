
// ========================
//  LEVEL TABLE
// ========================
const LEVELS = [
  { level:1,  xp:0,    title:"Iron Novice" },
  { level:2,  xp:100,  title:"Bronze Squire" },
  { level:3,  xp:300,  title:"Steel Warrior" },
  { level:4,  xp:600,  title:"Iron Knight" },
  { level:5,  xp:1000, title:"Silver Champion" },
  { level:6,  xp:1500, title:"Gold Berserker" },
  { level:7,  xp:2200, title:"Platinum Warlord" },
  { level:8,  xp:3000, title:"Diamond Titan" },
  { level:9,  xp:4000, title:"Obsidian Colossus" },
  { level:10, xp:5500, title:"Legendary Iron God" },
];

const DEFAULT_EXERCISES = [
  "Bench Press","Squat","Deadlift","Overhead Press","Barbell Row",
  "Pull-Up","Dumbbell Curl","Tricep Dip","Leg Press","Lat Pulldown",
  "Romanian Deadlift","Incline Bench Press","Cable Row","Running","Cycling"
];

// ========================
//  STATE
// ========================
let S = {
  name: "Hero",
  xp: 0,
  stats: { str:0, end:0, aes:0 },
  prs: {},
  history: [],
  exercises: [...DEFAULT_EXERCISES]
};

function load() {
  try {
    const raw = localStorage.getItem("iq_v2");
    if (raw) S = JSON.parse(raw);
    // ensure exercises array exists
    if (!S.exercises || !S.exercises.length) S.exercises = [...DEFAULT_EXERCISES];
  } catch(e) {}
}
function save() { localStorage.setItem("iq_v2", JSON.stringify(S)); }

// ========================
//  LEVEL HELPERS
// ========================
function getLvData(xp) {
  let cur = LEVELS[0], nxt = LEVELS[1];
  for (let i=0;i<LEVELS.length;i++) {
    if (xp >= LEVELS[i].xp) { cur = LEVELS[i]; nxt = LEVELS[i+1]||null; }
  }
  return { cur, nxt };
}

// ========================
//  RENDER
// ========================
function render() {
  const { cur, nxt } = getLvData(S.xp);
  // nav
  document.getElementById("hero-name-display").textContent = S.name;
  document.getElementById("total-xp-display").textContent = S.xp.toLocaleString() + " XP Total";
  // level
  document.getElementById("lv-num").textContent = cur.level;
  document.getElementById("lv-title").textContent = cur.title;
  // xp bar
  let pct = 0, lbl = "";
  if (nxt) {
    const range = nxt.xp - cur.xp;
    const earned = S.xp - cur.xp;
    pct = Math.min(100, Math.round(earned/range*100));
    lbl = `${S.xp.toLocaleString()} / ${nxt.xp.toLocaleString()} XP to next level`;
  } else {
    pct = 100;
    lbl = `${S.xp.toLocaleString()} XP — Max Level`;
  }
  document.getElementById("xp-fill").style.width = pct+"%";
  document.getElementById("xp-lbl").textContent = lbl;
  // stats
  const cap = 500;
  ["str","end","aes"].forEach(s => {
    document.getElementById("sv-"+s).textContent = S.stats[s];
    document.getElementById("sb-"+s).style.width = Math.min(100,S.stats[s]/cap*100)+"%";
  });
  // PRs
  renderPRs();
  // History
  renderHistory();
  // Select
  renderExerciseSelect();
}

function renderPRs() {
  const list = document.getElementById("pr-list");
  const keys = Object.keys(S.prs);
  document.getElementById("pr-count").textContent = keys.length + " record"+(keys.length!==1?"s":"");
  if (!keys.length) {
    list.innerHTML = '<div class="no-data">No records yet — start lifting.</div>'; return;
  }
  list.innerHTML = keys.map(k => `
    <div class="pr-item">
      <span class="pr-item-name">${k}</span>
      <span class="pr-item-val">${S.prs[k]}<span> kg</span></span>
    </div>
  `).join('');
}

function renderHistory() {
  const list = document.getElementById("log-list");
  document.getElementById("log-count").textContent = S.history.length + " entr"+(S.history.length!==1?"ies":"y");
  if (!S.history.length) {
    list.innerHTML = '<div class="empty-log">Complete your first set to begin your legend.</div>'; return;
  }
  list.innerHTML = [...S.history].reverse().map(h => `
    <div class="log-entry ${h.isPR?'is-pr':''}">
      <div class="log-entry-ex">
        <div class="log-ex-name">${h.exercise}</div>
        <div class="log-ex-meta">${h.weight}kg &times; ${h.reps} reps &times; ${h.sets} sets</div>
      </div>
      <div class="log-entry-right">
        <div class="log-xp">+${h.xp.toLocaleString()} XP</div>
        ${h.isPR ? '<span class="log-pr-tag">🔥 New PR</span>' : ''}
      </div>
    </div>
  `).join('');
}

function renderExerciseSelect() {
  const sel = document.getElementById("exercise-select");
  const cur = sel.value;
  sel.innerHTML = '<option value="">— Select exercise —</option>' +
    S.exercises.map(e => `<option value="${e}" ${e===cur?'selected':''}>${e}</option>`).join('');
}

function renderManageChips() {
  const chips = document.getElementById("ex-chips");
  if (!S.exercises.length) {
    chips.innerHTML = '<div class="no-ex">No exercises added yet.</div>'; return;
  }
  chips.innerHTML = S.exercises.map((e,i) => `
    <div class="ex-chip">
      <span class="ex-chip-name">${e}</span>
      <button class="ex-chip-del" onclick="removeExercise(${i})" title="Remove">✕</button>
    </div>
  `).join('');
}

// ========================
//  EXERCISE MANAGEMENT
// ========================
function openManageModal() {
  renderManageChips();
  document.getElementById("manage-modal").classList.add("open");
}
function closeManageModal() {
  document.getElementById("manage-modal").classList.remove("open");
  renderExerciseSelect();
}

function addExercise() {
  const inp = document.getElementById("new-ex-input");
  const val = inp.value.trim();
  if (!val) return;
  const name = val.charAt(0).toUpperCase() + val.slice(1);
  if (!S.exercises.includes(name)) {
    S.exercises.push(name);
    save();
  }
  inp.value = "";
  renderManageChips();
}

function removeExercise(idx) {
  S.exercises.splice(idx, 1);
  save();
  renderManageChips();
}

// ========================
//  VOLUME PREVIEW
// ========================
function updatePreview() {
  const w = parseFloat(document.getElementById("i-weight").value)||0;
  const r = parseInt(document.getElementById("i-reps").value)||0;
  const s = parseInt(document.getElementById("i-sets").value)||0;
  const xp = w*r*s;
  const prev = document.getElementById("vol-preview");
  const xpEl = document.getElementById("vol-xp");
  if (w>0 && r>0 && s>0) {
    prev.classList.add("active");
    xpEl.textContent = Math.round(xp).toLocaleString()+" XP";
  } else {
    prev.classList.remove("active");
    xpEl.textContent = "0 XP";
  }
}

// ========================
//  LOG WORKOUT
// ========================
function logWorkout() {
  const exercise = document.getElementById("exercise-select").value;
  const weight = parseFloat(document.getElementById("i-weight").value)||0;
  const reps = parseInt(document.getElementById("i-reps").value)||0;
  const sets = parseInt(document.getElementById("i-sets").value)||0;

  let valid = true;
  if (!exercise) { flashSel(); valid=false; }
  if (weight<=0) { shake("i-weight"); valid=false; }
  if (reps<=0) { shake("i-reps"); valid=false; }
  if (sets<=0) { shake("i-sets"); valid=false; }
  if (!valid) return;

  const baseXP = Math.round(weight*reps*sets);
  let bonusXP = 0, isPR = false;
  const key = exercise.toLowerCase();

  if (S.prs[key] === undefined || weight > S.prs[key]) {
    if (S.prs[key] !== undefined) { isPR = true; bonusXP = 50; }
    S.prs[key] = weight;
  }

  const totalXP = baseXP + bonusXP;
  const oldXP = S.xp;
  S.xp += totalXP;

  distributeStats(exercise, weight, reps, sets);
  S.history.push({ exercise, weight, reps, sets, xp:totalXP, isPR });

  const { cur: newLvData } = getLvData(S.xp);
  const { cur: oldLvData } = getLvData(oldXP);
  const didLevelUp = newLvData.level > oldLvData.level;

  save();
  render();

  // Clear inputs
  document.getElementById("i-weight").value = "";
  document.getElementById("i-reps").value = "";
  document.getElementById("i-sets").value = "";
  updatePreview();

  // Notifications
  if (isPR) showToast("pr", "🔥", "New Personal Record!", `${exercise} — ${weight} kg`);
  if (didLevelUp) {
    setTimeout(() => {
      showToast("lv", "⚡", "Level Up!", `You are now ${newLvData.title}`);
      spawnSparks();
    }, isPR ? 1600 : 0);
  }
}

function distributeStats(exercise, weight, reps, sets) {
  const n = exercise.toLowerCase();
  const raw = Math.round(weight*reps*sets/30);
  if (/bench|press|push|shoulder|chest|tricep|row|pull|lat|curl|bicep/.test(n)) {
    S.stats.str += raw; S.stats.aes += Math.round(raw*0.4);
  } else if (/squat|deadlift|leg|lunge|hip|glute/.test(n)) {
    S.stats.str += Math.round(raw*0.8); S.stats.end += Math.round(raw*0.4);
  } else if (/run|cardio|cycle|swim|jump|burpee|skip|sprint/.test(n)) {
    S.stats.end += raw; S.stats.aes += Math.round(raw*0.2);
  } else {
    S.stats.str += Math.round(raw*0.4); S.stats.end += Math.round(raw*0.4); S.stats.aes += Math.round(raw*0.4);
  }
}

// ========================
//  TOAST SYSTEM
// ========================
function showToast(type, icon, title, sub) {
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${icon}</span><div class="toast-content"><div class="toast-title">${title}</div><div class="toast-sub">${sub}</div></div>`;
  document.getElementById("toast-container").appendChild(el);
  setTimeout(() => {
    el.classList.add("leaving");
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

// ========================
//  SPARKS
// ========================
function spawnSparks() {
  const layer = document.getElementById("sparks-layer");
  const colors = ["#e8ff47","#47c8ff","#ff6b35","#fff"];
  for (let i=0;i<40;i++) {
    const sp = document.createElement("div");
    sp.className = "sp";
    sp.style.left = (40+Math.random()*20)+"vw";
    sp.style.top = (30+Math.random()*20)+"vh";
    const ang = Math.random()*Math.PI*2;
    const d = 80+Math.random()*160;
    sp.style.setProperty("--dx", Math.cos(ang)*d+"px");
    sp.style.setProperty("--dy", Math.sin(ang)*d+"px");
    sp.style.background = colors[Math.floor(Math.random()*colors.length)];
    sp.style.animationDelay = Math.random()*0.4+"s";
    layer.appendChild(sp);
    setTimeout(()=>sp.remove(),1400);
  }
}

// ========================
//  SHAKE / FLASH
// ========================
function shake(id) {
  const el = document.getElementById(id);
  el.classList.remove("invalid");
  void el.offsetWidth;
  el.classList.add("invalid");
  setTimeout(()=>el.classList.remove("invalid"),600);
}
function flashSel() {
  const el = document.getElementById("exercise-select");
  el.style.borderColor = "var(--str)";
  setTimeout(()=>el.style.borderColor="",800);
}

// ========================
//  NAME MODAL
// ========================
function openNameModal() {
  document.getElementById("name-input").value = S.name;
  document.getElementById("name-modal").classList.add("open");
  setTimeout(()=>document.getElementById("name-input").focus(),250);
}
function closeNameModal() { document.getElementById("name-modal").classList.remove("open"); }
function saveName() {
  const v = document.getElementById("name-input").value.trim();
  if (v) { S.name = v; save(); render(); }
  closeNameModal();
}

// ========================
//  MODAL BG CLOSE
// ========================
function bgClose(e, id) {
  if (e.target === e.currentTarget) {
    document.getElementById(id).classList.remove("open");
    if (id==="manage-modal") renderExerciseSelect();
  }
}

// ========================
//  INIT
// ========================
load();
render();