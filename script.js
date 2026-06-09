const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

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

  document.getElementById("rpsResult").innerHTML =
    `Vos elegiste <b>${userChoice}</b>. La página eligió <b>${cpu}</b>.<br>${result}`;
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
  document.getElementById("movieAnswer").classList.add("hidden");
  document.getElementById("movieAnswer").textContent = "";
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
  document.getElementById("triviaAnswer").classList.add("hidden");
  document.getElementById("triviaAnswer").textContent = "";
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
      display.textContent = randomItem(rouletteOptions);
    }
  }, 80);
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
  document.getElementById("tripResult").innerHTML = `
    <b>${trip.place}</b><br>
    🍽️ Comer: ${trip.food}<br>
    📸 ${trip.photo}<br>
    🎯 Plan: ${trip.plan}
  `;
}
