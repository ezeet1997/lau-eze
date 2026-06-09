let currentUser = null;

const randomItem = arr => arr[Math.floor(Math.random() * arr.length)];

const challenges = [
  "📷 Sacarse una foto con algo azul",
  "🎤 Mandar un audio contando una anécdota graciosa",
  "🎥 Grabar un video de 5 segundos saludando como famoso/a",
  "📷 Foto haciendo cara de sueño",
  "🎵 Compartir una canción que escucharías hoy",
  "☕ Mostrar qué estás tomando",
  "📷 Foto con algo rojo",
  "✈️ Inventar un viaje ficticio para los dos",
  "😂 Mandar el meme más malo que encuentres",
  "🎬 Proponer una película para ver"
];

const rouletteOptions = [
  "🎬 Ver una peli",
  "☕ Tomar un café",
  "🎤 Mandar un audio de 1 minuto",
  "📖 Contar una anécdota vergonzosa",
  "🎵 Compartir una canción",
  "✈️ Planear un viaje ficticio",
  "📷 Sacarse una foto random",
  "🎥 Subir un video corto",
  "📄 Subir un documento random",
  "🤣 Mandar un meme",
  "❓ Responder una pregunta incómoda",
  "🍿 Elegir una serie para empezar"
];

const photoChallenges = [
  "📷 Sacate una foto haciendo una cara rara",
  "📷 Sacate una foto con algo rojo",
  "📷 Sacate una foto señalando el techo",
  "📷 Sacate una foto imitando pose de modelo",
  "📷 Sacate una foto mostrando tus zapatillas",
  "📷 Sacate una foto en el lugar más raro cerca tuyo",
  "📷 Sacate una foto formando un corazón con las manos",
  "📷 Sacate una foto mirando por una ventana",
  "📷 Sacate una foto con cara de sueño",
  "📷 Sacate una foto haciendo pulgar arriba 👍"
];

const movies = [
  { emoji: "🚢❄️💔", answer: "Titanic" },
  { emoji: "🍫🏭👦", answer: "Charlie y la fábrica de chocolate" },
  { emoji: "🧙‍♂️💍🌋", answer: "El Señor de los Anillos" },
  { emoji: "🦁👑🌅", answer: "El Rey León" },
  { emoji: "🕷️🧑‍🦱🏙️", answer: "Spider-Man" },
  { emoji: "🚗⏰⚡", answer: "Volver al Futuro" },
  { emoji: "🐠🔎🌊", answer: "Buscando a Nemo" },
  { emoji: "🦖🏝️🚙", answer: "Jurassic Park" }
];

const knowQuestions = [
  "¿Qué comida elegiría la otra persona?",
  "¿Qué película elegiría hoy?",
  "¿Qué destino elegiría para viajar?",
  "¿Qué canción pondría ahora mismo?",
  "¿Qué plan le daría más fiaca?",
  "¿Qué emoji usa más?",
  "¿Qué frase dice siempre?",
  "¿Qué pediría para merendar?"
];

let currentMovie = movies[0];
let iceScore = 0;
let iceBestUnsaved = 0;
let iceInterval = null;
let iceGameState = null;

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (!data.ok) {
    document.getElementById("loginMsg").textContent = data.message || "Error al entrar";
    return;
  }

  currentUser = data.user;
  showApp();
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  location.reload();
});

document.querySelectorAll(".post-form").forEach(form => {
  form.addEventListener("submit", submitPost);
});

async function checkSession() {
  const res = await fetch("/api/me");
  const data = await res.json();

  if (data.user) {
    currentUser = data.user;
    showApp();
  }
}

function showApp() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("currentUserLabel").textContent = `Entraste como: ${currentUser.displayName}`;
  setHiddenInputs();
  loadAll();
}

function setHiddenInputs() {
  document.getElementById("challengeInput").value = document.getElementById("currentChallenge").textContent;
  document.getElementById("rouletteInput").value = document.getElementById("rouletteDisplay").textContent;
  document.getElementById("photoInput").value = document.getElementById("photoChallenge").textContent;
  document.getElementById("movieInput").value = document.getElementById("movieEmoji").textContent;
  document.getElementById("knowInput").value = document.getElementById("knowQuestion").textContent;
}

async function submitPost(e) {
  e.preventDefault();

  const form = e.currentTarget;
  const fd = new FormData(form);
  fd.append("section", form.dataset.section);
  fd.append("points", form.dataset.points || "5");

  const res = await fetch("/api/posts", {
    method: "POST",
    body: fd
  });

  const data = await res.json();

  if (!data.ok) {
    alert(data.message || "No se pudo guardar.");
    return;
  }

  form.reset();
  setHiddenInputs();
  await loadAll();
  alert("Guardado ✅");
}

async function loadAll() {
  await Promise.all([
    loadRanking(),
    loadPosts("desafios"),
    loadPosts("aburrimiento"),
    loadPosts("fotos"),
    loadPosts("peliculas"),
    loadPosts("conocerse"),
    loadGallery(),
    loadIceScores()
  ]);
}

async function loadRanking() {
  const res = await fetch("/api/ranking");
  const data = await res.json();

  document.getElementById("rankingBox").innerHTML = data.users.map((u, i) => `
    <div class="rank-card">
      <div class="avatar">${i === 0 ? "🥇" : "🥈"}</div>
      <strong>${escapeHTML(u.displayName)}</strong>
      <span>${u.points} puntos</span>
    </div>
  `).join("");
}

async function loadPosts(section) {
  const res = await fetch(`/api/posts?section=${encodeURIComponent(section)}`);
  const data = await res.json();

  const box = document.getElementById(`posts-${section}`);
  if (!box) return;

  if (!data.posts.length) {
    box.innerHTML = `<div class="result">Todavía no hay respuestas.</div>`;
    return;
  }

  box.innerHTML = data.posts.map(renderPost).join("");
}

function renderPost(p) {
  let media = "";

  if (p.fileUrl) {
    if (p.fileType === "foto") {
      media = `<img class="post-media" src="${p.fileUrl}" alt="${escapeHTML(p.fileName || "foto")}">`;
    } else if (p.fileType === "video") {
      media = `<video class="post-media" src="${p.fileUrl}" controls></video>`;
    } else if (p.fileType === "audio") {
      media = `<audio class="post-media" src="${p.fileUrl}" controls></audio>`;
    } else {
      media = `<p><a href="${p.fileUrl}" target="_blank">📄 Descargar ${escapeHTML(p.fileName || "documento")}</a></p>`;
    }
  }

  return `
    <div class="post">
      <div class="post-header">
        <span>${escapeHTML(p.displayName)}</span>
        <span>+${p.points} pts</span>
      </div>
      ${p.challenge ? `<small>Reto: ${escapeHTML(p.challenge)}</small>` : ""}
      ${p.text ? `<p>${linkify(escapeHTML(p.text))}</p>` : ""}
      ${media}
      <small>${escapeHTML(p.createdAt)}</small>
    </div>
  `;
}

async function loadGallery() {
  const res = await fetch("/api/posts");
  const data = await res.json();

  const files = data.posts.filter(p => p.fileUrl);
  const gallery = document.getElementById("gallery");

  if (!files.length) {
    gallery.innerHTML = `<div class="result">Todavía no hay archivos.</div>`;
    return;
  }

  gallery.innerHTML = files.map(p => {
    if (p.fileType === "foto") {
      return `<div class="gallery-item"><img src="${p.fileUrl}"><small>${escapeHTML(p.displayName)}</small></div>`;
    }
    if (p.fileType === "video") {
      return `<div class="gallery-item"><video src="${p.fileUrl}" controls></video><small>${escapeHTML(p.displayName)}</small></div>`;
    }
    if (p.fileType === "audio") {
      return `<div class="gallery-item"><audio src="${p.fileUrl}" controls></audio><small>${escapeHTML(p.displayName)}</small></div>`;
    }
    return `<div class="gallery-item"><a href="${p.fileUrl}" target="_blank">📄 ${escapeHTML(p.fileName || "documento")}</a><br><small>${escapeHTML(p.displayName)}</small></div>`;
  }).join("");
}

function generateChallenge() {
  const value = randomItem(challenges);
  document.getElementById("currentChallenge").textContent = value;
  document.getElementById("challengeInput").value = value;
}

function spinRoulette() {
  const display = document.getElementById("rouletteDisplay");
  let count = 0;

  const interval = setInterval(() => {
    display.textContent = randomItem(rouletteOptions);
    count++;

    if (count > 15) {
      clearInterval(interval);
      const final = randomItem(rouletteOptions);
      display.textContent = final;
      document.getElementById("rouletteInput").value = final;
    }
  }, 75);
}

function newPhotoChallenge() {
  const value = randomItem(photoChallenges);
  document.getElementById("photoChallenge").textContent = value;
  document.getElementById("photoInput").value = value;
}

function newMovie() {
  currentMovie = randomItem(movies);
  document.getElementById("movieEmoji").textContent = currentMovie.emoji;
  document.getElementById("movieInput").value = currentMovie.emoji;
  document.getElementById("movieAnswer").classList.add("hidden");
}

function showMovieAnswer() {
  const box = document.getElementById("movieAnswer");
  box.textContent = currentMovie.answer;
  box.classList.remove("hidden");
}

function newKnowQuestion() {
  const value = randomItem(knowQuestions);
  document.getElementById("knowQuestion").textContent = value;
  document.getElementById("knowInput").value = value;
}

async function saveIceScore() {
  if (!iceBestUnsaved) {
    alert("Primero jugá una partida.");
    return;
  }

  await fetch("/api/game-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      game: "atrapa-helados",
      score: iceBestUnsaved,
      points: Math.min(50, iceBestUnsaved)
    })
  });

  iceBestUnsaved = 0;
  await loadAll();
  alert("Récord guardado ✅");
}

async function loadIceScores() {
  const res = await fetch("/api/game-scores?game=atrapa-helados");
  const data = await res.json();

  const box = document.getElementById("iceScores");
  if (!data.scores.length) {
    box.innerHTML = `<div class="result">Todavía no hay récords.</div>`;
    return;
  }

  box.innerHTML = data.scores.map(s => `
    <div class="post">
      <div class="post-header">
        <span>${escapeHTML(s.displayName)}</span>
        <span>${s.score} 🍦</span>
      </div>
      <small>${escapeHTML(s.createdAt)}</small>
    </div>
  `).join("");
}

function startIceGame() {
  const canvas = document.getElementById("iceGame");
  const ctx = canvas.getContext("2d");

  iceScore = 0;
  let timeLeft = 30;
  let basket = { x: canvas.width / 2 - 45, y: canvas.height - 55, w: 90, h: 28 };
  let ice = { x: Math.random() * (canvas.width - 30), y: -30, r: 17, speed: 4 };

  document.getElementById("iceScore").textContent = iceScore;
  document.getElementById("iceTime").textContent = timeLeft;

  if (iceInterval) clearInterval(iceInterval);

  function moveBasket(clientX) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    basket.x = (clientX - rect.left) * scaleX - basket.w / 2;
    basket.x = Math.max(0, Math.min(canvas.width - basket.w, basket.x));
  }

  canvas.onmousemove = e => moveBasket(e.clientX);
  canvas.ontouchmove = e => {
    e.preventDefault();
    moveBasket(e.touches[0].clientX);
  };

  let lastTick = Date.now();

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = "28px sans-serif";
    ctx.fillText("🍦", ice.x, ice.y);

    ctx.fillStyle = "rgba(255,255,255,.92)";
    ctx.fillRect(basket.x, basket.y, basket.w, basket.h);
    ctx.fillStyle = "rgba(255,119,183,.95)";
    ctx.fillRect(basket.x + 8, basket.y + 6, basket.w - 16, basket.h - 12);

    ice.y += ice.speed;

    if (
      ice.y + ice.r > basket.y &&
      ice.x > basket.x &&
      ice.x < basket.x + basket.w
    ) {
      iceScore++;
      document.getElementById("iceScore").textContent = iceScore;
      ice = { x: Math.random() * (canvas.width - 30), y: -30, r: 17, speed: 4 + iceScore * 0.15 };
    }

    if (ice.y > canvas.height) {
      ice = { x: Math.random() * (canvas.width - 30), y: -30, r: 17, speed: 4 + iceScore * 0.15 };
    }

    if (Date.now() - lastTick >= 1000) {
      timeLeft--;
      lastTick = Date.now();
      document.getElementById("iceTime").textContent = timeLeft;
    }

    if (timeLeft <= 0) {
      clearInterval(iceInterval);
      iceInterval = null;
      iceBestUnsaved = Math.max(iceBestUnsaved, iceScore);
      ctx.font = "28px sans-serif";
      ctx.fillStyle = "#fff";
      ctx.fillText("Fin del juego 🍦", 120, 250);
      return;
    }
  }

  iceInterval = setInterval(draw, 1000 / 60);
}

function escapeHTML(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function linkify(text) {
  return String(text).replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank">$1</a>'
  );
}

checkSession();
