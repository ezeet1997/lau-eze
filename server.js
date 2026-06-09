require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "laura-vs-eze.db"));

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  section TEXT NOT NULL,
  challenge TEXT,
  text TEXT,
  file_url TEXT,
  file_type TEXT,
  file_name TEXT,
  points INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS game_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  game TEXT NOT NULL,
  score INTEGER NOT NULL,
  points INTEGER DEFAULT 0,
  meta TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`);

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!columns.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
ensureColumn("users", "avatar_url", "TEXT");
ensureColumn("game_scores", "points", "INTEGER DEFAULT 0");
ensureColumn("game_scores", "meta", "TEXT");

function ensureUser(username, displayName, plainPassword) {
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) return;
  const hash = bcrypt.hashSync(plainPassword, 10);
  db.prepare("INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)")
    .run(username, displayName, hash);
}

ensureUser("eze", "Eze", process.env.EZE_PASSWORD || "1234");
ensureUser("lau", "Lau", process.env.LAU_PASSWORD || "1234");

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "laura-vs-eze-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: false }
}));

app.use("/uploads", express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = getUploadFolder(file.mimetype);
    const finalDir = path.join(UPLOAD_DIR, folder);
    fs.mkdirSync(finalDir, { recursive: true });
    cb(null, finalDir);
  },
  filename: (req, file, cb) => {
    const safeOriginal = file.originalname.replace(/[^\w.\-]+/g, "_");
    cb(null, Date.now() + "_" + safeOriginal);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 80 * 1024 * 1024 }
});

function getUploadFolder(mime) {
  if (mime.startsWith("image/")) return "fotos";
  if (mime.startsWith("video/")) return "videos";
  if (mime.startsWith("audio/")) return "audios";
  return "documentos";
}

function getFileKind(mime) {
  if (!mime) return "documento";
  if (mime.startsWith("image/")) return "foto";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "documento";
}

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ ok: false, message: "No autorizado" });
  next();
}

function refreshSessionUser(req) {
  const user = db.prepare("SELECT id, username, display_name AS displayName, avatar_url AS avatarUrl, points FROM users WHERE id = ?")
    .get(req.session.user.id);
  if (user) req.session.user = user;
  return user;
}

function addPoints(userId, points) {
  points = Number(points || 0);
  if (!points) return;
  db.prepare("UPDATE users SET points = points + ? WHERE id = ?").run(points, userId);
}

function removePoints(userId, points) {
  points = Number(points || 0);
  if (!points) return;
  db.prepare("UPDATE users SET points = MAX(points - ?, 0) WHERE id = ?").run(points, userId);
}

function deleteUploadFile(fileUrl) {
  if (!fileUrl) return;
  const clean = fileUrl.replace(/^\/uploads\//, "");
  const fullPath = path.join(UPLOAD_DIR, clean);
  if (fullPath.startsWith(UPLOAD_DIR) && fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
}

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(String(username || "").trim().toLowerCase());
  if (!user || !bcrypt.compareSync(String(password || ""), user.password_hash)) {
    return res.status(401).json({ ok: false, message: "Usuario o clave incorrectos" });
  }
  req.session.user = { id: user.id, username: user.username, displayName: user.display_name, avatarUrl: user.avatar_url, points: user.points };
  res.json({ ok: true, user: req.session.user });
});

app.post("/api/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));

app.get("/api/me", (req, res) => {
  if (!req.session.user) return res.json({ ok: true, user: null });
  const user = refreshSessionUser(req);
  res.json({ ok: true, user });
});

app.post("/api/profile/avatar", requireLogin, upload.single("avatar"), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, message: "Subí una imagen." });
  if (!req.file.mimetype.startsWith("image/")) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ ok: false, message: "El avatar tiene que ser una imagen." });
  }
  const user = db.prepare("SELECT avatar_url FROM users WHERE id = ?").get(req.session.user.id);
  if (user?.avatar_url) deleteUploadFile(user.avatar_url);
  const fileUrl = `/uploads/fotos/${req.file.filename}`;
  db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(fileUrl, req.session.user.id);
  const fresh = refreshSessionUser(req);
  res.json({ ok: true, user: fresh });
});

app.get("/api/ranking", requireLogin, (req, res) => {
  const users = db.prepare("SELECT username, display_name AS displayName, points, avatar_url AS avatarUrl FROM users ORDER BY points DESC").all();
  res.json({ ok: true, users });
});

app.get("/api/posts", requireLogin, (req, res) => {
  const section = req.query.section || "";
  const params = [];
  let where = "";
  if (section) { where = "WHERE p.section = ?"; params.push(section); }
  const posts = db.prepare(`
    SELECT p.id, p.section, p.challenge, p.text, p.file_url AS fileUrl, p.file_type AS fileType,
           p.file_name AS fileName, p.points, p.created_at AS createdAt,
           u.username, u.display_name AS displayName, u.avatar_url AS avatarUrl
    FROM posts p JOIN users u ON u.id = p.user_id
    ${where}
    ORDER BY p.id DESC
    LIMIT 300
  `).all(...params);
  res.json({ ok: true, posts, currentUserId: req.session.user.id });
});

app.post("/api/posts", requireLogin, upload.single("file"), (req, res) => {
  const user = req.session.user;
  const section = String(req.body.section || "general");
  const challenge = String(req.body.challenge || "");
  const text = String(req.body.text || "");
  const points = Number(req.body.points || 5);
  let fileUrl = null, fileType = null, fileName = null;
  if (req.file) {
    const folder = getUploadFolder(req.file.mimetype);
    fileUrl = `/uploads/${folder}/${req.file.filename}`;
    fileType = getFileKind(req.file.mimetype);
    fileName = req.file.originalname;
  }
  if (!text.trim() && !fileUrl) return res.status(400).json({ ok: false, message: "Tenés que escribir algo o subir un archivo." });
  const info = db.prepare(`
    INSERT INTO posts (user_id, section, challenge, text, file_url, file_type, file_name, points)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user.id, section, challenge, text, fileUrl, fileType, fileName, points);
  addPoints(user.id, points);
  refreshSessionUser(req);
  res.json({ ok: true, id: info.lastInsertRowid });
});

app.delete("/api/posts/:id", requireLogin, (req, res) => {
  const id = Number(req.params.id);
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
  if (!post) return res.status(404).json({ ok: false, message: "No encontrado" });
  if (post.user_id !== req.session.user.id) return res.status(403).json({ ok: false, message: "Solo podés borrar tus propias publicaciones." });
  if (post.file_url) deleteUploadFile(post.file_url);
  db.prepare("DELETE FROM posts WHERE id = ?").run(id);
  removePoints(req.session.user.id, post.points);
  refreshSessionUser(req);
  res.json({ ok: true });
});

app.post("/api/game-score", requireLogin, (req, res) => {
  const user = req.session.user;
  const game = String(req.body.game || "juego");
  const score = Number(req.body.score || 0);
  const points = Number(req.body.points || 0);
  const meta = JSON.stringify(req.body.meta || {});
  db.prepare("INSERT INTO game_scores (user_id, game, score, points, meta) VALUES (?, ?, ?, ?, ?)")
    .run(user.id, game, score, points, meta);
  addPoints(user.id, points);
  refreshSessionUser(req);
  res.json({ ok: true });
});

app.get("/api/game-scores", requireLogin, (req, res) => {
  const game = req.query.game || "";
  const params = [];
  let where = "";
  if (game) { where = "WHERE gs.game = ?"; params.push(game); }
  const scores = db.prepare(`
    SELECT gs.id, gs.game, gs.score, gs.points, gs.meta, gs.created_at AS createdAt,
           u.username, u.display_name AS displayName, u.avatar_url AS avatarUrl
    FROM game_scores gs JOIN users u ON u.id = gs.user_id
    ${where}
    ORDER BY gs.score DESC, gs.id DESC
    LIMIT 100
  `).all(...params);
  res.json({ ok: true, scores });
});

app.delete("/api/game-scores/:id", requireLogin, (req, res) => {
  const id = Number(req.params.id);
  const score = db.prepare("SELECT * FROM game_scores WHERE id = ?").get(id);
  if (!score) return res.status(404).json({ ok: false, message: "No encontrado" });
  if (score.user_id !== req.session.user.id) return res.status(403).json({ ok: false, message: "Solo podés borrar tus propios puntajes." });
  db.prepare("DELETE FROM game_scores WHERE id = ?").run(id);
  removePoints(req.session.user.id, score.points);
  refreshSessionUser(req);
  res.json({ ok: true });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`Laura vs Eze running on port ${PORT}`));
