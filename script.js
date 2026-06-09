const USERS_KEY = "antiaburrimiento_users_v1";
const SESSION_KEY = "antiaburrimiento_session_v1";
const ANSWERS_KEY = "antiaburrimiento_answers_v1";

let authMode = "login";
let currentUser = null;
let lastRoulette = "Tocá el botón y vemos qué sale 👀";
let lastTripPlain = "";

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getAnswers() {
  return JSON.parse(localStorage.getItem(ANSWERS_KEY) || "[]");
}

function saveAnswers(answers) {
  localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
}

function setAuthMode(mode) {
  authMode = mode;
  document.getElementById("loginTab").classList.toggle("active", mode === "login");
  document.getElementById("registerTab").classList.toggle("active", mode === "register");
  document.getElementById("authButton").textContent = mode === "login" ? "Ingresar" : "Crear usuario";
  document.getElementById("authMessage").textContent = "";
}

function handleAuth(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("authMessage");

  if (username.length < 2 || password.length < 3) {
    msg.textContent = "Usá un usuario de 2 letras y una clave de mínimo 3 caracteres.";
    return;
  }

  const users = getUsers();

  if (authMode === "register") {
    if (users[username]) {
      msg.textContent = "Ese usuario ya existe. Probá ingresar.";
      return;
    }

    users[username] = { password, createdAt: new Date().toISOString() };
    saveUsers(users);
    localStorage.setItem(SESSION_KEY, username);
    startApp(username);
    return;
  }

  if (!users[username] || users[username].password !== password) {
    msg.textContent = "Usuario o clave incorrectos.";
    return;
  }

  localStorage.setItem(SESSION_KEY, username);
  startApp(username);
}

function startApp(username) {
  currentUser = username;
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("currentUserLabel").textContent = `Entraste como: ${username}`;
  renderSaved();
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  currentUser = null;
  document.getElementById("app").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
}

function addAnswer(type, content) {
  if (!currentUser) return;

  const cleanContent = String(content || "").trim();
  if (!cleanContent) {
    alert("No hay nada para guardar todavía.");
    return;
  }

  const answers = getAnswers();
  answers.unshift({
    user: currentUser,
    type,
    content: cleanContent,
    date: new Date().toLocaleString("es-AR")
  });

  saveAnswers(answers);
  renderSaved();
  alert("Guardado ✅");
}

function renderSaved() {
  const container = document.getElementById("savedList");
  if (!container) return;

  const answers = getAnswers();

  if (!answers.length) {
    container.innerHTML = `<div class="result">Todavía no hay respuestas guardadas.</div>`;
    return;
  }

  container.innerHTML = answers.map(item => `
    <div class="saved-item">
      <strong>${escapeHTML(item.user)}</strong> · ${escapeHTML(item.type)}
      <p>${escapeHTML(item.content)}</p>
      <small>${escapeHTML(item.date)}</small>
    </div>
  `).join("");
}

function clearMyAnswers() {
  if (!currentUser) return;

  const ok = confirm("¿Seguro querés borrar tus respuestas guardadas?");
  if (!ok) return;

  const answers = getAnswers().filter(item => item.user !== currentUser);
  saveAnswers(answers);
  renderSaved();
}

function downloadSaved() {
  const answers = getAnswers();
  const data = JSON.stringify(answers, null, 2);
  const blob = new Blob([data], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "respuestas-centro-anti-aburrimiento.json";
  a.click();

  URL.revokeObjectURL(url);
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const rpsOptions = ["piedra", "papel", "tijera"];

function playRPS(userChoice) {
  const cpu = randomItem(rpsOptions);
  let result = "";

  if (userChoice === cpu) {
    result = "Empate técnico. Hay que jugar de nuevo 😌";
  } else if (
    (userChoice === "piedra" && cpu === "tijera") ||
    (userChoice === "papel" && cpu === "piedra") ||
    (userChoice === "tijera" && cpu === "papel")
  ) {
    result = "Ganaste. Punto para vos 🏆";
  } else {
    result = "Perdiste. Punto para la página 😂";
  }

  const text = `Vos elegiste ${userChoice}. La página eligió ${cpu}. ${result}`;
  document.getElementById("rpsResult").innerHTML =
    `Vos elegiste <b>${userChoice}</b>. La página eligió <b>${cpu}</b>.<br>${result}`;

  addAnswer("Piedra, Papel o Tijera", text);
}

const movies = [
  { emoji: "🍫🏭👦", answer: "Charlie y la fábrica de chocolate" },
  { emoji: "🧙‍♂️💍🌋", answer: "El Señor de los Anillos" },
  { emoji: "🦁👑🌅", answer: "El Rey León" },
  { emoji: "🚢❄️💔", answer: "Titanic" },
  { emoji: "🕷️🧑‍🦱🏙️", answer: "Spider-Man" },
  { emoji: "🧊👸⛄", answer: "Frozen" },
  { emoji: "🦖🏝️🚙", answer: "Jurassic Park" },
  { emoji: "👽📞🏠", answer: "E.T." },
  { emoji: "🚗⏰⚡", answer: "Volver al Futuro" },
  { emoji: "🐠🔎🌊", answer: "Buscando a Nemo" }
];

let currentMovie = movies[0];

function newMovie() {
  currentMovie = randomItem(movies);
  document.getElementById("movieEmoji").textContent = currentMovie.emoji;
  document.getElementById("movieGuess").value = "";
  document.getElementById("movieAnswer").classList.add("hidden");
  document.getElementById("movieAnswer").textContent = "";
}

function saveMovieGuess() {
  const guess = document.getElementById("movieGuess").value;
  addAnswer("Adivinar película", `Emojis: ${currentMovie.emoji} | Respuesta escrita: ${guess}`);
}

function showMovieAnswer() {
  const answer = document.getElementById("movieAnswer");
  answer.textContent = currentMovie.answer;
  answer.classList.remove("hidden");
}

const trivia = [
  { q: "¿Cuál es el planeta más grande del sistema solar?", a: "Júpiter" },
  { q: "¿Cuántos lados tiene un hexágono?", a: "6" },
  { q: "¿Cuál es el país con forma de bota?", a: "Italia" },
  { q: "¿Qué animal es conocido como el rey de la selva?", a: "El león" },
  { q: "¿Cuántos colores tiene el arcoíris?", a: "7" },
  { q: "¿Qué órgano bombea la sangre?", a: "El corazón" },
  { q: "¿En qué continente está Egipto?", a: "África" },
  { q: "¿Cuál es el océano más grande?", a: "El Pacífico" }
];

let currentTrivia = trivia[0];

function newTrivia() {
  currentTrivia = randomItem(trivia);
  document.getElementById("triviaQuestion").textContent = currentTrivia.q;
  document.getElementById("triviaGuess").value = "";
  document.getElementById("triviaAnswer").classList.add("hidden");
  document.getElementById("triviaAnswer").textContent = "";
}

function saveTriviaGuess() {
  const guess = document.getElementById("triviaGuess").value;
  addAnswer("Cultura general", `Pregunta: ${currentTrivia.q} | Respuesta escrita: ${guess}`);
}

function showTriviaAnswer() {
  const answer = document.getElementById("triviaAnswer");
  answer.textContent = currentTrivia.a;
  answer.classList.remove("hidden");
}

const knowQuestions = [
  "¿Qué elegiría la otra persona para cenar?",
  "¿Qué género de película elegiría primero?",
  "¿Qué destino elegiría para viajar?",
  "¿Qué canción pondría ahora mismo?",
  "¿Qué preferiría: café, helado o pizza?",
  "¿Qué emoji usa más?",
  "¿Qué plan le daría más fiaca?",
  "¿Qué plan aceptaría aunque diga que no?",
  "¿Qué comida podría comer mil veces?",
  "¿Qué frase dice siempre?"
];

function newKnowQuestion() {
  document.getElementById("knowQuestion").textContent = randomItem(knowQuestions);
  document.getElementById("knowAnswer").value = "";
}

function saveKnowAnswer() {
  const q = document.getElementById("knowQuestion").textContent;
  const a = document.getElementById("knowAnswer").value;
  addAnswer("Quién conoce mejor al otro", `Pregunta: ${q} | Respuesta: ${a}`);
}

const rouletteOptions = [
  "🎬 Ver una peli",
  "☕ Tomar un café",
  "🎤 Mandar un audio de 1 minuto",
  "📖 Contar una anécdota vergonzosa",
  "🎵 Compartir una canción",
  "✈️ Planear un viaje ficticio",
  "📷 Sacarse una foto random",
  "🍿 Elegir una serie para empezar",
  "🤣 Mandar un meme",
  "❓ Hacer una pregunta random",
  "🍔 Mostrar qué estás comiendo o tomando",
  "🧦 Mandar foto de las zapatillas o medias",
  "🪟 Sacarse una foto mirando por una ventana",
  "🎧 Pasar la última canción escuchada"
];

function spinRoulette() {
  const display = document.getElementById("rouletteDisplay");
  let count = 0;

  const interval = setInterval(() => {
    display.textContent = randomItem(rouletteOptions);
    count++;

    if (count > 14) {
      clearInterval(interval);
      lastRoulette = randomItem(rouletteOptions);
      display.textContent = lastRoulette;
    }
  }, 80);
}

function saveRouletteResult() {
  addAnswer("Ruleta Aburrimiento 0%", lastRoulette);
}

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
  "📷 Sacate una foto haciendo pulgar arriba 👍",
  "📷 Sacate una foto con el objeto más viejo que encuentres",
  "📷 Sacate una foto con algo que te represente",
  "📷 Sacate una foto en modo serio profesional",
  "📷 Sacate una foto como si estuvieras en una película",
  "📷 Sacate una foto con algo azul"
];

function newPhotoChallenge() {
  document.getElementById("photoChallenge").textContent = randomItem(photoChallenges);
}

function savePhotoChallenge() {
  addAnswer("Desafío de foto", document.getElementById("photoChallenge").textContent);
}

const moviePlans = [
  "🤣 Comedia liviana, de esas para no pensar mucho",
  "😱 Suspenso, pero no tan turbio",
  "🚀 Ciencia ficción con pochoclos obligatorios",
  "🔎 Misterio para adivinar el final",
  "🎭 Drama, pero con permiso para llorar",
  "❤️ Romántica tranqui, sin ponerse intensos",
  "🧙 Fantasía o aventura",
  "👻 Terror, pero con derecho a taparse la cara"
];

function chooseMoviePlan() {
  document.getElementById("moviePlan").textContent = randomItem(moviePlans);
}

function saveMoviePlan() {
  const plan = document.getElementById("moviePlan").textContent;
  const comment = document.getElementById("movieComment").value;
  addAnswer("Selector de película", `${plan} | Propuesta: ${comment}`);
}

const seriesPlans = [
  "📺 Serie corta: máximo 10 capítulos",
  "🍿 Serie para maratonear sin culpa",
  "🤣 Comedia de capítulos cortos",
  "🔎 Suspenso para engancharse",
  "🧠 Documental interesante",
  "🎭 Drama con buen final, por favor",
  "🧟 Algo raro, distinto o medio bizarro",
  "✨ Serie que todos recomiendan y nunca empezamos"
];

function chooseSeriesPlan() {
  document.getElementById("seriesPlan").textContent = randomItem(seriesPlans);
}

function saveSeriesPlan() {
  const plan = document.getElementById("seriesPlan").textContent;
  const comment = document.getElementById("seriesComment").value;
  addAnswer("Selector de serie", `${plan} | Propuesta: ${comment}`);
}

const trips = [
  {
    place: "🇯🇵 Tokio",
    food: "Ramen",
    photo: "Foto obligatoria en Shibuya",
    plan: "Comprar algo raro en una máquina expendedora"
  },
  {
    place: "🇮🇹 Roma",
    food: "Pizza y helado",
    photo: "Foto obligatoria en el Coliseo",
    plan: "Caminar sin mapa hasta perderse"
  },
  {
    place: "🇨🇱 Chile",
    food: "Completo o empanadas",
    photo: "Foto con la cordillera",
    plan: "Cruzar la frontera como aventura épica"
  },
  {
    place: "🇦🇷 Bariloche",
    food: "Chocolate",
    photo: "Foto frente al lago",
    plan: "Elegir una cafetería y quedarse ahí horas"
  },
  {
    place: "🇫🇷 París",
    food: "Croissant",
    photo: "Foto con la Torre Eiffel",
    plan: "Actuar como turistas profesionales"
  },
  {
    place: "🇺🇾 Uruguay",
    food: "Chivito",
    photo: "Foto en la rambla",
    plan: "Mate, caminata y charla random"
  }
];

function newTrip() {
  const trip = randomItem(trips);
  lastTripPlain = `${trip.place} | Comer: ${trip.food} | ${trip.photo} | Plan: ${trip.plan}`;
  document.getElementById("tripResult").innerHTML = `
    <b>${trip.place}</b><br>
    🍽️ Comer: ${trip.food}<br>
    📸 ${trip.photo}<br>
    🎯 Plan: ${trip.plan}
  `;
}

function saveTrip() {
  const comment = document.getElementById("tripComment").value;
  addAnswer("Viaje ficticio", `${lastTripPlain || "Viaje sin generar"} | Extra: ${comment}`);
}

window.addEventListener("load", () => {
  const session = localStorage.getItem(SESSION_KEY);
  if (session) startApp(session);
});
