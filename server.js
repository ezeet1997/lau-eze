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
  last_seen TEXT,
  streak INTEGER DEFAULT 0,
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
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  game TEXT NOT NULL,
  score INTEGER NOT NULL,
  points INTEGER DEFAULT 0,
  meta TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  status TEXT,
  url TEXT,
  notes TEXT,
  file_url TEXT,
  file_type TEXT,
  file_name TEXT,
  unlock_at TEXT,
  points INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  target_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  emoji TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, item_id)
);
`);

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!columns.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
ensureColumn("users", "avatar_url", "TEXT");
ensureColumn("users", "last_seen", "TEXT");
ensureColumn("users", "streak", "INTEGER DEFAULT 0");
ensureColumn("game_scores", "points", "INTEGER DEFAULT 0");
ensureColumn("game_scores", "meta", "TEXT");
ensureColumn("items", "file_url", "TEXT");
ensureColumn("items", "file_type", "TEXT");
ensureColumn("items", "file_name", "TEXT");
ensureColumn("items", "unlock_at", "TEXT");
ensureColumn("items", "points", "INTEGER DEFAULT 0");

function ensureUser(username, displayName, plainPassword) {
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  const hash = bcrypt.hashSync(plainPassword, 10);
  if (!existing) {
    db.prepare("INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)")
      .run(username, displayName, hash);
  }
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
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname.replace(/[^\w.\-]+/g, "_"))
});
const upload = multer({ storage, limits: { fileSize: 80 * 1024 * 1024 } });

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
  const u = db.prepare("SELECT id, username, display_name AS displayName, avatar_url AS avatarUrl, points, streak FROM users WHERE id = ?")
    .get(req.session.user.id);
  if (u) req.session.user = u;
  return u;
}
function addPoints(userId, points) {
  points = Number(points || 0);
  if (points) db.prepare("UPDATE users SET points = points + ? WHERE id = ?").run(points, userId);
}
function removePoints(userId, points) {
  points = Number(points || 0);
  if (points) db.prepare("UPDATE users SET points = MAX(points - ?, 0) WHERE id = ?").run(points, userId);
}
function deleteUploadFile(fileUrl) {
  if (!fileUrl) return;
  const clean = fileUrl.replace(/^\/uploads\//, "");
  const fullPath = path.join(UPLOAD_DIR, clean);
  if (fullPath.startsWith(UPLOAD_DIR) && fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
}
function todayStr() { return new Date().toISOString().slice(0,10); }
function yesterdayStr() { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); }
function updateStreak(userId) {
  const u = db.prepare("SELECT last_seen, streak FROM users WHERE id=?").get(userId);
  const today = todayStr(), yesterday = yesterdayStr();
  let streak = u?.streak || 0;
  if (u?.last_seen === today) return;
  streak = u?.last_seen === yesterday ? streak + 1 : 1;
  db.prepare("UPDATE users SET last_seen=?, streak=? WHERE id=?").run(today, streak, userId);
}

app.post("/api/login", (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  if (!["eze", "lau"].includes(username)) return res.status(401).json({ ok:false, message:"Solo pueden entrar Eze y Lau." });
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user || !bcrypt.compareSync(String(req.body.password || ""), user.password_hash)) {
    return res.status(401).json({ ok:false, message:"Usuario o clave incorrectos" });
  }
  req.session.user = { id:user.id, username:user.username, displayName:user.display_name, avatarUrl:user.avatar_url, points:user.points, streak:user.streak };
  updateStreak(user.id);
  refreshSessionUser(req);
  res.json({ ok:true, user:req.session.user });
});
app.post("/api/logout", (req, res) => req.session.destroy(() => res.json({ ok:true })));
app.get("/api/me", (req, res) => {
  if (!req.session.user) return res.json({ ok:true, user:null });
  res.json({ ok:true, user: refreshSessionUser(req) });
});

app.post("/api/profile/avatar", requireLogin, upload.single("avatar"), (req, res) => {
  if (!req.file) return res.status(400).json({ ok:false, message:"Subí una imagen." });
  if (!req.file.mimetype.startsWith("image/")) { fs.unlinkSync(req.file.path); return res.status(400).json({ ok:false, message:"El avatar debe ser una imagen." }); }
  const old = db.prepare("SELECT avatar_url FROM users WHERE id=?").get(req.session.user.id);
  if (old?.avatar_url) deleteUploadFile(old.avatar_url);
  const url = `/uploads/fotos/${req.file.filename}`;
  db.prepare("UPDATE users SET avatar_url=? WHERE id=?").run(url, req.session.user.id);
  res.json({ ok:true, user: refreshSessionUser(req) });
});

app.get("/api/ranking", requireLogin, (req, res) => {
  const users = db.prepare("SELECT id, username, display_name AS displayName, points, avatar_url AS avatarUrl, streak FROM users ORDER BY points DESC").all();
  res.json({ ok:true, users });
});

app.get("/api/posts", requireLogin, (req, res) => {
  const section = req.query.section || "";
  const params = [];
  let where = "";
  if (section) { where = "WHERE p.section = ?"; params.push(section); }
  const posts = db.prepare(`
    SELECT p.id,p.section,p.challenge,p.text,p.file_url AS fileUrl,p.file_type AS fileType,p.file_name AS fileName,p.points,p.created_at AS createdAt,
           u.username,u.display_name AS displayName,u.avatar_url AS avatarUrl
    FROM posts p JOIN users u ON u.id=p.user_id ${where}
    ORDER BY p.id DESC LIMIT 300
  `).all(...params);
  res.json({ ok:true, posts });
});
app.post("/api/posts", requireLogin, upload.single("file"), (req, res) => {
  const section = String(req.body.section || "general");
  const challenge = String(req.body.challenge || "");
  const text = String(req.body.text || "");
  const points = Number(req.body.points || 5);
  let fileUrl=null,fileType=null,fileName=null;
  if (req.file) {
    const folder = getUploadFolder(req.file.mimetype);
    fileUrl = `/uploads/${folder}/${req.file.filename}`;
    fileType = getFileKind(req.file.mimetype);
    fileName = req.file.originalname;
  }
  if (!text.trim() && !fileUrl) return res.status(400).json({ ok:false, message:"Tenés que escribir algo o subir un archivo." });
  const info = db.prepare("INSERT INTO posts (user_id,section,challenge,text,file_url,file_type,file_name,points) VALUES (?,?,?,?,?,?,?,?)")
    .run(req.session.user.id, section, challenge, text, fileUrl, fileType, fileName, points);
  addPoints(req.session.user.id, points);
  res.json({ ok:true, id:info.lastInsertRowid, user: refreshSessionUser(req) });
});
app.delete("/api/posts/:id", requireLogin, (req, res) => {
  const p = db.prepare("SELECT * FROM posts WHERE id=?").get(Number(req.params.id));
  if (!p) return res.status(404).json({ ok:false, message:"No encontrado" });
  if (p.user_id !== req.session.user.id) return res.status(403).json({ ok:false, message:"Solo podés borrar tus propias publicaciones." });
  if (p.file_url) deleteUploadFile(p.file_url);
  db.prepare("DELETE FROM posts WHERE id=?").run(p.id);
  removePoints(req.session.user.id, p.points);
  res.json({ ok:true, user: refreshSessionUser(req) });
});

app.post("/api/game-score", requireLogin, (req, res) => {
  const game = String(req.body.game || "juego");
  const score = Number(req.body.score || 0);
  const points = Number(req.body.points || 0);
  const meta = JSON.stringify(req.body.meta || {});
  db.prepare("INSERT INTO game_scores (user_id,game,score,points,meta) VALUES (?,?,?,?,?)")
    .run(req.session.user.id, game, score, points, meta);
  addPoints(req.session.user.id, points);
  res.json({ ok:true, user: refreshSessionUser(req) });
});
app.get("/api/game-scores", requireLogin, (req, res) => {
  const game = req.query.game || "";
  const params = [];
  let where = "";
  if (game) { where = "WHERE gs.game=?"; params.push(game); }
  const scores = db.prepare(`
    SELECT gs.id,gs.game,gs.score,gs.points,gs.meta,gs.created_at AS createdAt,
           u.username,u.display_name AS displayName,u.avatar_url AS avatarUrl
    FROM game_scores gs JOIN users u ON u.id=gs.user_id ${where}
    ORDER BY gs.score DESC, gs.id DESC LIMIT 100
  `).all(...params);
  res.json({ ok:true, scores });
});

app.get("/api/items", requireLogin, (req, res) => {
  const type = req.query.type || "";
  const params = [];
  let where = "";
  if (type) { where = "WHERE i.type=?"; params.push(type); }
  const items = db.prepare(`
    SELECT i.*, u.username, u.display_name AS displayName, u.avatar_url AS avatarUrl
    FROM items i JOIN users u ON u.id=i.user_id ${where}
    ORDER BY i.id DESC LIMIT 500
  `).all(...params);
  const reactions = db.prepare(`
    SELECT r.*, u.username FROM reactions r JOIN users u ON u.id=r.user_id
    WHERE target_type='item'
  `).all();
  const votes = db.prepare("SELECT * FROM votes").all();
  res.json({ ok:true, items, reactions, votes, now: new Date().toISOString() });
});
app.post("/api/items", requireLogin, upload.single("file"), (req, res) => {
  const type = String(req.body.type || "item");
  const title = String(req.body.title || "").trim();
  if (!title) return res.status(400).json({ ok:false, message:"Falta título." });
  const category = String(req.body.category || "");
  const status = String(req.body.status || "");
  const url = String(req.body.url || "");
  const notes = String(req.body.notes || "");
  const unlockAt = String(req.body.unlockAt || "");
  const points = Number(req.body.points || 5);
  let fileUrl=null,fileType=null,fileName=null;
  if (req.file) {
    const folder = getUploadFolder(req.file.mimetype);
    fileUrl = `/uploads/${folder}/${req.file.filename}`;
    fileType = getFileKind(req.file.mimetype);
    fileName = req.file.originalname;
  }
  const info = db.prepare(`
    INSERT INTO items (user_id,type,title,category,status,url,notes,file_url,file_type,file_name,unlock_at,points)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(req.session.user.id,type,title,category,status,url,notes,fileUrl,fileType,fileName,unlockAt,points);
  addPoints(req.session.user.id, points);
  res.json({ ok:true, id:info.lastInsertRowid, user: refreshSessionUser(req) });
});
app.delete("/api/items/:id", requireLogin, (req, res) => {
  const item = db.prepare("SELECT * FROM items WHERE id=?").get(Number(req.params.id));
  if (!item) return res.status(404).json({ ok:false, message:"No encontrado" });
  if (item.user_id !== req.session.user.id) return res.status(403).json({ ok:false, message:"Solo podés borrar tus propios items." });
  if (item.file_url) deleteUploadFile(item.file_url);
  db.prepare("DELETE FROM reactions WHERE target_type='item' AND target_id=?").run(item.id);
  db.prepare("DELETE FROM votes WHERE item_id=?").run(item.id);
  db.prepare("DELETE FROM items WHERE id=?").run(item.id);
  removePoints(req.session.user.id, item.points);
  res.json({ ok:true, user: refreshSessionUser(req) });
});
app.post("/api/react", requireLogin, (req, res) => {
  const targetType = String(req.body.targetType || "item");
  const targetId = Number(req.body.targetId);
  const emoji = String(req.body.emoji || "❤️");
  db.prepare("INSERT INTO reactions (user_id,target_type,target_id,emoji) VALUES (?,?,?,?)")
    .run(req.session.user.id, targetType, targetId, emoji);
  res.json({ ok:true });
});
app.post("/api/vote", requireLogin, (req, res) => {
  const itemId = Number(req.body.itemId);
  const value = String(req.body.value || "");
  db.prepare("INSERT INTO votes (user_id,item_id,value) VALUES (?,?,?) ON CONFLICT(user_id,item_id) DO UPDATE SET value=excluded.value, created_at=CURRENT_TIMESTAMP")
    .run(req.session.user.id, itemId, value);
  res.json({ ok:true });
});

app.get("/api/stats", requireLogin, (req, res) => {
  const users = db.prepare("SELECT id, username, display_name AS displayName, points, streak FROM users").all();
  const postStats = db.prepare("SELECT section, COUNT(*) AS total FROM posts GROUP BY section").all();
  const fileStats = db.prepare("SELECT file_type AS type, COUNT(*) AS total FROM posts WHERE file_type IS NOT NULL GROUP BY file_type").all();
  const itemStats = db.prepare("SELECT type, COUNT(*) AS total FROM items GROUP BY type").all();
  const gameStats = db.prepare("SELECT game, COUNT(*) AS total, MAX(score) AS best FROM game_scores GROUP BY game").all();
  res.json({ ok:true, users, postStats, fileStats, itemStats, gameStats });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`Laura vs Eze V4 running on port ${PORT}`));
