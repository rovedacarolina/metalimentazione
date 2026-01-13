// -----------------------------
// NAV mobile + active link
// -----------------------------
const toggle = document.getElementById("toggle");
const menu = document.getElementById("menu");

if (toggle && menu) {
  toggle.addEventListener("click", () => menu.classList.toggle("open"));
}

const path = location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".menu a").forEach(a => {
  if (a.getAttribute("href") === path) a.classList.add("active");
});

// -----------------------------
// GAMIFICATION (localStorage)
// -----------------------------
const STORAGE_KEY = "bf_user_data";

function getUserData(){
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : { points: 0, votes: [] };
}
function saveUserData(data){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// livelli e soglie
const LEVELS = [
  { name: "Starter", min: 0, next: 30 },
  { name: "Taster", min: 30, next: 70 },
  { name: "Explorer", min: 70, next: 120 },
  { name: "Visionary", min: 120, next: null }
];

function getLevelInfo(points){
  let current = LEVELS[0];
  for (const lvl of LEVELS){
    if (points >= lvl.min) current = lvl;
  }
  return current;
}

// controlla se episodio già votato
function hasVotedEpisode(data, episode){
  return data.votes.some(v => v.episode === episode);
}

function addVote({ episode, choice, points }){
  const data = getUserData();
  if (hasVotedEpisode(data, episode)) return { ok:false, reason:"already" };

  data.points += points;
  data.votes.push({
    episode, choice, points,
    date: new Date().toISOString()
  });
  saveUserData(data);
  return { ok:true };
}

// -----------------------------
// Render PROFILO + progress bar
// -----------------------------
function renderProfile(){
  const totalPointsEl = document.getElementById("totalPoints");
  const userLevelEl = document.getElementById("userLevel");
  const votesCountEl = document.getElementById("votesCount");
  const votesListEl = document.getElementById("votesList");
  const resetBtn = document.getElementById("resetBtn");

  const progressFill = document.getElementById("progressFill");
  const progressLabel = document.getElementById("progressLabel");
  const progressValue = document.getElementById("progressValue");
  const nextLevelText = document.getElementById("nextLevelText");

  if (!totalPointsEl || !votesListEl) return;

  const data = getUserData();
  const levelInfo = getLevelInfo(data.points);

  totalPointsEl.textContent = data.points;
  userLevelEl.textContent = levelInfo.name;
  votesCountEl.textContent = data.votes.length;

  // progress
  if (progressFill && progressLabel && progressValue){
    if (levelInfo.next === null){
      progressFill.style.width = "100%";
      progressLabel.textContent = "Visionary";
      progressValue.textContent = `${data.points} pt`;
      nextLevelText.textContent = "Livello massimo raggiunto 🎉";
    } else {
      const start = levelInfo.min;
      const end = levelInfo.next;
      const pct = ((data.points - start) / (end - start)) * 100;
      progressFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
      progressLabel.textContent = levelInfo.name;
      progressValue.textContent = `${data.points} / ${end} pt`;
      const nextLvl = LEVELS.find(l => l.min === end);
      nextLevelText.textContent = `Prossimo livello: ${nextLvl?.name || "—"} (${end} pt)`;
    }
  }

  // storico voti
  votesListEl.innerHTML = "";
  if (data.votes.length === 0){
    votesListEl.innerHTML = `<p style="color:var(--muted);">Non hai ancora votato.</p>`;
  } else {
    data.votes.slice().reverse().forEach(v => {
      const row = document.createElement("div");
      row.className = "card";
      row.style.boxShadow = "none";
      row.style.padding = "12px";

      const date = new Date(v.date).toLocaleString("it-IT", {
        day:"2-digit", month:"2-digit", year:"numeric",
        hour:"2-digit", minute:"2-digit"
      });

      row.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:8px; align-items:center;">
          <div>
            <strong>${v.episode}</strong>
            <div style="color:var(--muted); font-size:.9rem;">
              Scelta: <b>${v.choice}</b> • ${date}
            </div>
          </div>
          <div style="font-weight:900; color:var(--teal);">+${v.points} pt</div>
        </div>
      `;
      votesListEl.appendChild(row);
    });
  }

  if (resetBtn){
    resetBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      renderProfile();
    });
  }
}
renderProfile();

// -----------------------------
// Pagina VOTO: timer + voto realistico
// -----------------------------
function setupVoting(){
  const timerEl = document.getElementById("timer");
  const confirmEl = document.getElementById("voteConfirm");
  const alreadyMsg = document.getElementById("alreadyVotedMsg");
  const voteButtons = document.querySelectorAll("[data-vote]");

  if (!timerEl || voteButtons.length === 0) return;

  let seconds = 120; // 2 minuti
  const tick = () => {
    const mm = String(Math.floor(seconds / 60)).padStart(2,"0");
    const ss = String(seconds % 60).padStart(2,"0");
    timerEl.textContent = `${mm}:${ss}`;
    if (seconds <= 0){
      clearInterval(intv);
      timerEl.textContent = "Voto chiuso";
      voteButtons.forEach(b => b.disabled = true);
    }
    seconds--;
  };
  tick();
  const intv = setInterval(tick, 1000);

  // controllo già votato episodio
  const episode = voteButtons[0].getAttribute("data-episode");
  const data = getUserData();
  if (hasVotedEpisode(data, episode)){
    alreadyMsg.style.display = "block";
    voteButtons.forEach(b => b.disabled = true);
    return;
  }

  voteButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const episode = btn.getAttribute("data-episode") || "Puntata";
      const choice = btn.getAttribute("data-choice") || "A/B";
      const points = Number(btn.getAttribute("data-points") || 10);

      const res = addVote({ episode, choice, points });
      if (!res.ok){
        alreadyMsg.style.display = "block";
        voteButtons.forEach(b => b.disabled = true);
        return;
      }

      voteButtons.forEach(b => b.disabled = true);
      if (confirmEl) confirmEl.classList.add("show");
    });
  });
}
setupVoting();

window.addEventListener("DOMContentLoaded", () => {

  // -----------------------------
  // NAV mobile + active link
  // -----------------------------
  const toggle = document.getElementById("toggle");
  const menu = document.getElementById("menu");

  if (toggle && menu) {
    toggle.addEventListener("click", () => menu.classList.toggle("open"));
  }

  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".menu a").forEach(a => {
    if (a.getAttribute("href") === path) a.classList.add("active");
  });

  // -----------------------------
  // MODAL ISCRIZIONE
  // -----------------------------
  const openSignup = document.getElementById("openSignup");
  const signupModal = document.getElementById("signupModal");
  const closeSignup = document.getElementById("closeSignup");
  const closeSignupX = document.getElementById("closeSignupX");
  const signupForm = document.getElementById("signupForm");

  function showModal(){
    if (!signupModal) return;
    signupModal.classList.add("show");
    signupModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function hideModal(){
    if (!signupModal) return;
    signupModal.classList.remove("show");
    signupModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  if (openSignup) openSignup.addEventListener("click", showModal);
  if (closeSignup) closeSignup.addEventListener("click", hideModal);
  if (closeSignupX) closeSignupX.addEventListener("click", hideModal);

  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape") hideModal();
  });

  // -----------------------------
  // SUBMIT FORM (demo)
  // -----------------------------
  if (signupForm){
    signupForm.addEventListener("submit", (e)=>{
      e.preventDefault();

      const formData = new FormData(signupForm);
      const user = Object.fromEntries(formData.entries());
      localStorage.setItem("bf_signup_user", JSON.stringify(user));

      const btn = signupForm.querySelector("button[type='submit']");
      btn.textContent = "Iscrizione inviata ✓";
      btn.disabled = true;

      setTimeout(()=>{
        window.location.href = "confirm.html";
      }, 700);
    });
  }

});

// ===== Mobile menu =====
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggle");
  const menu = document.getElementById("menu");

  if (toggle && menu) {
    const openMenu = () => {
      menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", menu.classList.contains("is-open"));
    };

    // click/tap
    toggle.addEventListener("click", openMenu);
    toggle.addEventListener("touchstart", (e) => {
      // evita doppio trigger su iOS
      e.preventDefault();
      openMenu();
    }, { passive: false });

    // chiudi quando clicchi un link
    menu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => menu.classList.remove("is-open"));
    });

    // chiudi se ridimensioni (es. ruoti telefono)
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) menu.classList.remove("is-open");
    });
  }
});
