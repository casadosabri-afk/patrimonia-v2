const express = require("express");
const helmet = require("helmet");
const Database = require("better-sqlite3");
const multer = require("multer");
const PDFDocument = require("pdfkit");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const app = express();
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";
const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(DATA_DIR, "documents");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, "patrimonia.sqlite"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
 role TEXT NOT NULL CHECK(role IN ('admin','manager','advisor')), password_hash TEXT NOT NULL,
 active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS households (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
 advisor_id INTEGER REFERENCES users(id), goals TEXT NOT NULL DEFAULT '', horizon TEXT NOT NULL DEFAULT '',
 risk_profile TEXT NOT NULL DEFAULT '', review_date TEXT, notes TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS members (
 id INTEGER PRIMARY KEY AUTOINCREMENT, household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
 first_name TEXT NOT NULL, last_name TEXT NOT NULL, birth_date TEXT, email TEXT, phone TEXT, relationship TEXT
);
CREATE TABLE IF NOT EXISTS assets (
 id INTEGER PRIMARY KEY AUTOINCREMENT, household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
 member_id INTEGER REFERENCES members(id) ON DELETE SET NULL, category TEXT NOT NULL, name TEXT NOT NULL,
 institution TEXT NOT NULL DEFAULT '', identifier TEXT NOT NULL DEFAULT '', quantity REAL, unit_price REAL,
 value REAL NOT NULL DEFAULT 0, valuation_date TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'Manuelle',
 notes TEXT NOT NULL DEFAULT '', created_by INTEGER REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS debts (
 id INTEGER PRIMARY KEY AUTOINCREMENT, household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
 member_id INTEGER REFERENCES members(id) ON DELETE SET NULL, name TEXT NOT NULL, lender TEXT NOT NULL DEFAULT '',
 original_amount REAL NOT NULL DEFAULT 0, remaining_amount REAL NOT NULL DEFAULT 0,
 monthly_payment REAL NOT NULL DEFAULT 0, end_date TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS tasks (
 id INTEGER PRIMARY KEY AUTOINCREMENT, household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
 assigned_to INTEGER REFERENCES users(id), title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
 due_date TEXT, priority TEXT NOT NULL DEFAULT 'normal', status TEXT NOT NULL DEFAULT 'todo',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS appointments (
 id INTEGER PRIMARY KEY AUTOINCREMENT, household_id INTEGER REFERENCES households(id) ON DELETE CASCADE,
 assigned_to INTEGER REFERENCES users(id), title TEXT NOT NULL, starts_at TEXT NOT NULL,
 duration_minutes INTEGER NOT NULL DEFAULT 60, location TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS documents (
 id INTEGER PRIMARY KEY AUTOINCREMENT, household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
 uploaded_by INTEGER REFERENCES users(id), original_name TEXT NOT NULL, stored_name TEXT NOT NULL UNIQUE,
 mime_type TEXT NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_household_advisor ON households(advisor_id);
CREATE INDEX IF NOT EXISTS idx_task_household ON tasks(household_id);
CREATE INDEX IF NOT EXISTS idx_asset_household ON assets(household_id);
`);

function hashPassword(password, salt) {
 const actualSalt = salt || crypto.randomBytes(16).toString("hex");
 const digest = crypto.scryptSync(password, actualSalt, 64).toString("hex");
 return actualSalt + ":" + digest;
}
function verifyPassword(password, encoded) {
 const parts = String(encoded || "").split(":");
 if (parts.length !== 2) return false;
 const expected = Buffer.from(parts[1], "hex");
 const actual = crypto.scryptSync(password, parts[0], 64);
 return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
function seed() {
 const count = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
 if (!count) {
  const adminPassword = process.env.PATRIMONIA_ADMIN_PASSWORD || "ChangeMe123!";
  const insert = db.prepare("INSERT INTO users(name,email,role,password_hash) VALUES(?,?,?,?)");
  const tx = db.transaction(() => {
   insert.run("Administrateur", "admin@patrimonia.local", "admin", hashPassword(adminPassword));
   insert.run("Camille Durand", "camille@patrimonia.local", "advisor", hashPassword("Camille2026!"));
   insert.run("Alex Martin", "alex@patrimonia.local", "advisor", hashPassword("Alex2026!"));
   const advisor = db.prepare("SELECT id FROM users WHERE email=?").get("camille@patrimonia.local").id;
   const h = db.prepare("INSERT INTO households(name,advisor_id,goals,horizon,risk_profile,review_date) VALUES(?,?,?,?,?,?)");
   const martin = h.run("Famille Martin", advisor, "Préparer la retraite; protéger la famille", "10 ans", "Équilibré", "2026-11-18").lastInsertRowid;
   const bernard = h.run("Lucie Bernard", advisor, "Constituer un apport immobilier", "5 ans", "Modéré", "2026-12-02").lastInsertRowid;
   const member = db.prepare("INSERT INTO members(household_id,first_name,last_name,relationship) VALUES(?,?,?,?)");
   member.run(martin, "Alice", "Martin", "Titulaire"); member.run(martin, "Marc", "Martin", "Conjoint");
   member.run(bernard, "Lucie", "Bernard", "Titulaire");
   const asset = db.prepare("INSERT INTO assets(household_id,category,name,institution,identifier,quantity,unit_price,value,valuation_date,source) VALUES(?,?,?,?,?,?,?,?,?,?)");
   asset.run(martin, "Financial", "ETF Monde (démo)", "Assurance-vie Horizon", "DEMO-ETF", 120, 104.5, 12540, "2026-10-22", "Valeur fictive");
   asset.run(martin, "Real estate", "Résidence principale", "", "", null, null, 540000, "2026-10-01", "Estimation manuelle");
   db.prepare("INSERT INTO debts(household_id,name,lender,original_amount,remaining_amount,monthly_payment,end_date) VALUES(?,?,?,?,?,?,?)").run(martin, "Prêt résidence principale", "Banque Démo", 300000, 182000, 1450, "2041-06-01");
   db.prepare("INSERT INTO tasks(household_id,assigned_to,title,due_date,priority,status) VALUES(?,?,?,?,?,?)").run(martin, advisor, "Préparer la revue patrimoniale", "2026-11-18", "high", "todo");
   db.prepare("INSERT INTO appointments(household_id,assigned_to,title,starts_at,duration_minutes,location) VALUES(?,?,?,?,?,?)").run(martin, advisor, "Revue patrimoniale", "2026-11-18T10:30", 60, "Cabinet");
  });
  tx();
 }
}
seed();
// Provision Sabri's administrator account without publishing a reusable password.
if (!db.prepare("SELECT id FROM users WHERE email=?").get("sabri@patrimonia.local")) {
 const initialSabriPassword = crypto.randomBytes(18).toString("base64url");
 db.prepare("INSERT INTO users(name,email,role,password_hash) VALUES(?,?,?,?)")
  .run("Sabri Casado", "sabri@patrimonia.local", "admin", hashPassword(initialSabriPassword));
 if (process.env.PATRIMONIA_BOOTSTRAP_PASSWORD_FILE) {
  fs.writeFileSync(process.env.PATRIMONIA_BOOTSTRAP_PASSWORD_FILE, initialSabriPassword, { encoding: "utf8", mode: 0o600 });
 } else {
  console.log("Compte administrateur Sabri Casado — identifiant: sabri@patrimonia.local");
  console.log("Mot de passe initial à conserver: " + initialSabriPassword);
 }
}

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use((req,res,next)=>{ req.cookies=Object.fromEntries(String(req.headers.cookie||"").split(";").map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf("=");return [decodeURIComponent(x.slice(0,i)),decodeURIComponent(x.slice(i+1))]})); next(); });
app.use("/prototype-preview", express.static(path.join(__dirname, "prototype-preview")));

function auth(req, res, next) {
 const token = req.cookies && req.cookies.patrimonia_session;
 if (!token) return res.status(401).json({ error: "Connexion requise." });
 const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
 const session = db.prepare("SELECT users.id,users.name,users.email,users.role,users.active,sessions.expires_at FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token_hash=?").get(tokenHash);
 if (!session || !session.active || session.expires_at < Date.now()) {
  db.prepare("DELETE FROM sessions WHERE token_hash=?").run(tokenHash);
  res.clearCookie("patrimonia_session", { httpOnly: true, sameSite: "strict", path: "/" });
  return res.status(401).json({ error: "Session expirée. Reconnecte-toi." });
 }
 req.user = session;
 next();
}
function requireRole(...roles) {
 return (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ error: "Action réservée à un autre rôle." });
}
function householdAllowed(req, householdId) {
 if (req.user.role !== "advisor") return true;
 return !!db.prepare("SELECT 1 FROM households WHERE id=? AND advisor_id=?").get(householdId, req.user.id);
}
function visibleHouseholds(req) {
 return req.user.role === "advisor" ?
  db.prepare("SELECT * FROM households WHERE advisor_id=? ORDER BY name").all(req.user.id) :
  db.prepare("SELECT * FROM households ORDER BY name").all();
}
function requireHousehold(req, res, next) {
 const id = Number(req.params.householdId || req.params.id || req.body.household_id);
 if (!id || !householdAllowed(req, id)) return res.status(404).json({ error: "Dossier introuvable." });
 req.householdId = id;
 next();
}
function clean(input, fields) {
 const result = {};
 for (const field of fields) if (input[field] !== undefined) result[field] = input[field];
 return result;
}
function insertFields(table, fields, data) {
 const picked = clean(data, fields);
 const names = Object.keys(picked);
 if (!names.length) throw new Error("Aucune donnée à enregistrer.");
 const sql = "INSERT INTO " + table + "(" + names.join(",") + ") VALUES(" + names.map(() => "?").join(",") + ")";
 return db.prepare(sql).run(...names.map(n => picked[n])).lastInsertRowid;
}

app.post("/api/login", (req, res) => {
 const body = req.body || {};
 const user = db.prepare("SELECT * FROM users WHERE lower(email)=lower(?)").get(String(body.email || "").trim());
 if (!user || !user.active || !verifyPassword(String(body.password || ""), user.password_hash)) return res.status(401).json({ error: "Adresse e-mail ou mot de passe incorrect." });
 const token = crypto.randomBytes(32).toString("base64url");
 const days = Math.max(1, Math.min(30, Number(process.env.SESSION_DAYS || 7)));
 db.prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").run(crypto.createHash("sha256").update(token).digest("hex"), user.id, Date.now() + days * 86400000);
 res.cookie("patrimonia_session", token, { httpOnly: true, sameSite: "strict", secure: false, path: "/", maxAge: days * 86400000 });
 res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});
app.get("/api/me", auth, (req, res) => res.json({ id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role }));
app.post("/api/logout", auth, (req, res) => {
 const token = req.cookies && req.cookies.patrimonia_session;
 if (token) db.prepare("DELETE FROM sessions WHERE token_hash=?").run(crypto.createHash("sha256").update(token).digest("hex"));
 res.clearCookie("patrimonia_session", { httpOnly: true, sameSite: "strict", path: "/" });
 res.json({ ok: true });
});
app.get("/api/dashboard", auth, (req, res) => {
 const homes = visibleHouseholds(req);
 const ids = homes.map(x => x.id);
 const owned = ids.length ? ids.join(",") : "NULL";
 const financial = db.prepare("SELECT COALESCE(SUM(value),0) n FROM assets WHERE household_id IN (" + owned + ") AND category IN ('Financial','financial','Placement')").get().n;
 const realEstate = db.prepare("SELECT COALESCE(SUM(value),0) n FROM assets WHERE household_id IN (" + owned + ") AND category IN ('Real estate','Immobilier')").get().n;
 const debt = db.prepare("SELECT COALESCE(SUM(remaining_amount),0) n FROM debts WHERE household_id IN (" + owned + ")").get().n;
 const tasks = db.prepare("SELECT COUNT(*) n FROM tasks WHERE status!='done' AND (household_id IS NULL OR household_id IN (" + owned + "))").get().n;
 res.json({ households: homes.length, financial, realEstate, debt, netWorth: financial + realEstate - debt, openTasks: tasks });
});
app.get("/api/households", auth, (req, res) => {
 const rows = visibleHouseholds(req);
 const result = rows.map(h => ({
  ...h,
  members: db.prepare("SELECT id,first_name,last_name,birth_date,email,phone,relationship FROM members WHERE household_id=? ORDER BY id").all(h.id),
  assets_total: db.prepare("SELECT COALESCE(SUM(value),0) n FROM assets WHERE household_id=?").get(h.id).n,
  debt_total: db.prepare("SELECT COALESCE(SUM(remaining_amount),0) n FROM debts WHERE household_id=?").get(h.id).n,
  advisor_name: h.advisor_id ? db.prepare("SELECT name FROM users WHERE id=?").get(h.advisor_id).name : null
 }));
 res.json(result);
});
app.post("/api/households", auth, requireRole("admin", "manager"), (req, res) => {
 const data = clean(req.body, ["name","status","advisor_id","goals","horizon","risk_profile","review_date","notes"]);
 if (!String(data.name || "").trim()) return res.status(400).json({ error: "Le nom du foyer est obligatoire." });
 const id = insertFields("households", ["name","status","advisor_id","goals","horizon","risk_profile","review_date","notes"], data);
 const memberInsert = db.prepare("INSERT INTO members(household_id,first_name,last_name,birth_date,email,phone,relationship) VALUES(?,?,?,?,?,?,?)");
 for (const m of Array.isArray(req.body.members) ? req.body.members : []) {
  if (m.first_name && m.last_name) memberInsert.run(id,m.first_name,m.last_name,m.birth_date || null,m.email || null,m.phone || null,m.relationship || null);
 }
 if (data.review_date) ensureReviewTask(id, data.review_date, data.advisor_id || null);
 res.status(201).json(db.prepare("SELECT * FROM households WHERE id=?").get(id));
});
app.get("/api/households/:id", auth, requireHousehold, (req,res) => {
 const h=db.prepare("SELECT * FROM households WHERE id=?").get(req.householdId);
 h.members=db.prepare("SELECT * FROM members WHERE household_id=?").all(h.id);
 h.assets=db.prepare("SELECT * FROM assets WHERE household_id=? ORDER BY valuation_date DESC").all(h.id);
 h.debts=db.prepare("SELECT * FROM debts WHERE household_id=?").all(h.id);
 h.tasks=db.prepare("SELECT * FROM tasks WHERE household_id=? ORDER BY due_date").all(h.id);
 res.json(h);
});
app.put("/api/households/:id", auth, requireHousehold, requireRole("admin","manager","advisor"), (req,res) => {
 const allowed=["name","status","goals","horizon","risk_profile","review_date","notes"];
 if (req.user.role!=="advisor") allowed.push("advisor_id");
 const data=clean(req.body,allowed);
 const old=db.prepare("SELECT * FROM households WHERE id=?").get(req.householdId);
 if (req.user.role==="advisor" && req.body.advisor_id!==undefined && Number(req.body.advisor_id)!==req.user.id) return res.status(403).json({error:"Un conseiller ne peut pas réattribuer un foyer."});
 const entries=Object.entries(data);
 if(entries.length) db.prepare("UPDATE households SET "+entries.map(([k])=>k+"=?").join(",")+",updated_at=CURRENT_TIMESTAMP WHERE id=?").run(...entries.map(e=>e[1]),req.householdId);
 if (data.review_date && data.review_date!==old.review_date) ensureReviewTask(req.householdId,data.review_date,old.advisor_id);
 res.json(db.prepare("SELECT * FROM households WHERE id=?").get(req.householdId));
});
app.delete("/api/households/:id", auth, requireRole("admin"), requireHousehold, (req,res) => {
 db.prepare("DELETE FROM households WHERE id=?").run(req.householdId); res.json({ok:true});
});
app.post("/api/households/:id/members", auth, requireHousehold, (req,res) => {
 const m=req.body||{}; if(!m.first_name||!m.last_name) return res.status(400).json({error:"Prénom et nom requis."});
 const r=db.prepare("INSERT INTO members(household_id,first_name,last_name,birth_date,email,phone,relationship) VALUES(?,?,?,?,?,?,?)").run(req.householdId,m.first_name,m.last_name,m.birth_date||null,m.email||null,m.phone||null,m.relationship||null);
 res.status(201).json(db.prepare("SELECT * FROM members WHERE id=?").get(r.lastInsertRowid));
});
app.put("/api/members/:id", auth, (req,res) => {
 const member=db.prepare("SELECT * FROM members WHERE id=?").get(Number(req.params.id)); if(!member||!householdAllowed(req,member.household_id)) return res.status(404).json({error:"Personne introuvable."});
 const data=clean(req.body,["first_name","last_name","birth_date","email","phone","relationship"]); const e=Object.entries(data);
 if(e.length) db.prepare("UPDATE members SET "+e.map(([k])=>k+"=?").join(",")+" WHERE id=?").run(...e.map(x=>x[1]),member.id);
 res.json(db.prepare("SELECT * FROM members WHERE id=?").get(member.id));
});
app.delete("/api/members/:id", auth, (req,res) => { const m=db.prepare("SELECT * FROM members WHERE id=?").get(Number(req.params.id)); if(!m||!householdAllowed(req,m.household_id)) return res.status(404).json({error:"Personne introuvable."}); db.prepare("DELETE FROM members WHERE id=?").run(m.id); res.json({ok:true}); });

app.get("/api/households/:householdId/assets", auth, requireHousehold, (req,res)=>res.json(db.prepare("SELECT * FROM assets WHERE household_id=? ORDER BY valuation_date DESC").all(req.householdId)));
app.post("/api/households/:householdId/assets", auth, requireHousehold, (req,res)=>{
 const data=clean(req.body,["member_id","category","name","institution","identifier","quantity","unit_price","value","valuation_date","source","notes"]);
 if(!data.name||!data.category||!data.valuation_date) return res.status(400).json({error:"Type, libellé et date de valorisation requis."});
 data.created_by=req.user.id; const id=insertFields("assets",["household_id","member_id","category","name","institution","identifier","quantity","unit_price","value","valuation_date","source","notes","created_by"],{household_id:req.householdId,...data});
 res.status(201).json(db.prepare("SELECT * FROM assets WHERE id=?").get(id));
});
app.put("/api/assets/:id", auth, (req,res)=>{
 const a=db.prepare("SELECT * FROM assets WHERE id=?").get(Number(req.params.id)); if(!a||!householdAllowed(req,a.household_id)) return res.status(404).json({error:"Actif introuvable."});
 const data=clean(req.body,["member_id","category","name","institution","identifier","quantity","unit_price","value","valuation_date","source","notes"]); const e=Object.entries(data);
 if(e.length) db.prepare("UPDATE assets SET "+e.map(([k])=>k+"=?").join(",")+" WHERE id=?").run(...e.map(x=>x[1]),a.id);
 res.json(db.prepare("SELECT * FROM assets WHERE id=?").get(a.id));
});
app.delete("/api/assets/:id", auth, (req,res)=>{
 const a=db.prepare("SELECT * FROM assets WHERE id=?").get(Number(req.params.id)); if(!a||!householdAllowed(req,a.household_id)) return res.status(404).json({error:"Actif introuvable."});
 db.prepare("DELETE FROM assets WHERE id=?").run(a.id); res.json({ok:true});
});
app.get("/api/households/:householdId/debts", auth, requireHousehold, (req,res)=>res.json(db.prepare("SELECT * FROM debts WHERE household_id=? ORDER BY end_date").all(req.householdId)));
app.post("/api/households/:householdId/debts", auth, requireHousehold, (req,res)=>{
 const d=req.body||{}; if(!d.name) return res.status(400).json({error:"Le libellé du prêt est requis."});
 const r=db.prepare("INSERT INTO debts(household_id,member_id,name,lender,original_amount,remaining_amount,monthly_payment,end_date) VALUES(?,?,?,?,?,?,?,?)").run(req.householdId,d.member_id||null,d.name,d.lender||"",Number(d.original_amount)||0,Number(d.remaining_amount)||0,Number(d.monthly_payment)||0,d.end_date||null);
 res.status(201).json(db.prepare("SELECT * FROM debts WHERE id=?").get(r.lastInsertRowid));
});
app.put("/api/debts/:id", auth, (req,res)=>{
 const d=db.prepare("SELECT * FROM debts WHERE id=?").get(Number(req.params.id)); if(!d||!householdAllowed(req,d.household_id)) return res.status(404).json({error:"Emprunt introuvable."});
 const data=clean(req.body,["name","lender","original_amount","remaining_amount","monthly_payment","end_date","member_id"]); const e=Object.entries(data);
 if(e.length) db.prepare("UPDATE debts SET "+e.map(([k])=>k+"=?").join(",")+",updated_at=CURRENT_TIMESTAMP WHERE id=?").run(...e.map(x=>x[1]),d.id);
 res.json(db.prepare("SELECT * FROM debts WHERE id=?").get(d.id));
});
app.delete("/api/debts/:id", auth, (req,res)=>{const d=db.prepare("SELECT * FROM debts WHERE id=?").get(Number(req.params.id));if(!d||!householdAllowed(req,d.household_id))return res.status(404).json({error:"Emprunt introuvable."});db.prepare("DELETE FROM debts WHERE id=?").run(d.id);res.json({ok:true});});

function ensureReviewTask(householdId,date,advisorId) {
 const reviewDay=Date.parse(date+"T00:00:00Z");
 if(Number.isNaN(reviewDay)) return;
 const today=new Date(); const todayDay=Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate());
 const daysRemaining=Math.floor((reviewDay-todayDay)/86400000);
 if(daysRemaining>30) return;
 const existing=db.prepare("SELECT id FROM tasks WHERE household_id=? AND title='Préparer la revue patrimoniale' AND status!='done' ORDER BY id DESC LIMIT 1").get(householdId);
 if(existing) db.prepare("UPDATE tasks SET due_date=?,assigned_to=COALESCE(?,assigned_to) WHERE id=?").run(date,advisorId,existing.id);
 else db.prepare("INSERT INTO tasks(household_id,assigned_to,title,description,due_date,priority,status) VALUES(?,?,?,?,?,?,?)").run(householdId,advisorId,"Préparer la revue patrimoniale","Tâche générée automatiquement à 30 jours de la revue.",date,"normal","todo");
}
function reconcileReviewTasks() {
 const rows=db.prepare("SELECT id,review_date,advisor_id FROM households WHERE review_date IS NOT NULL AND review_date!=''").all();
 for(const row of rows) ensureReviewTask(row.id,row.review_date,row.advisor_id);
}
reconcileReviewTasks();
setInterval(reconcileReviewTasks,24*60*60*1000).unref();
app.get("/api/tasks", auth, (req,res)=>{
 const scope=req.user.role==="advisor"?" AND (household_id IS NULL OR household_id IN (SELECT id FROM households WHERE advisor_id=?))":"";
 const args=req.user.role==="advisor"?[req.user.id]:[];
 res.json(db.prepare("SELECT tasks.*,households.name household_name,users.name assigned_name FROM tasks LEFT JOIN households ON households.id=tasks.household_id LEFT JOIN users ON users.id=tasks.assigned_to WHERE 1=1"+scope+" ORDER BY due_date IS NULL,due_date,id DESC").all(...args));
});
app.post("/api/tasks", auth, (req,res)=>{
 const d=req.body||{}; if(!String(d.title||"").trim()) return res.status(400).json({error:"Le titre est obligatoire."});
 if(d.household_id&&!householdAllowed(req,Number(d.household_id)))return res.status(404).json({error:"Dossier introuvable."});
 const assignee=req.user.role==="advisor"?req.user.id:(d.assigned_to||null);
 const id=insertFields("tasks",["household_id","assigned_to","title","description","due_date","priority","status"],{household_id:d.household_id||null,assigned_to:assignee,title:d.title,description:d.description||"",due_date:d.due_date||null,priority:d.priority||"normal",status:d.status||"todo"});
 res.status(201).json(db.prepare("SELECT * FROM tasks WHERE id=?").get(id));
});
app.put("/api/tasks/:id", auth, (req,res)=>{
 const t=db.prepare("SELECT tasks.*,households.advisor_id FROM tasks LEFT JOIN households ON households.id=tasks.household_id WHERE tasks.id=?").get(Number(req.params.id));
 if(!t||(req.user.role==="advisor"&&t.household_id&&t.advisor_id!==req.user.id))return res.status(404).json({error:"Tâche introuvable."});
 const d=clean(req.body,["title","description","due_date","priority","status","assigned_to"]);
 if(req.user.role==="advisor")delete d.assigned_to;
 const e=Object.entries(d); if(e.length)db.prepare("UPDATE tasks SET "+e.map(([k])=>k+"=?").join(",")+" WHERE id=?").run(...e.map(x=>x[1]),t.id);
 res.json(db.prepare("SELECT * FROM tasks WHERE id=?").get(t.id));
});
app.delete("/api/tasks/:id", auth, (req,res)=>{
 const t=db.prepare("SELECT tasks.*,households.advisor_id FROM tasks LEFT JOIN households ON households.id=tasks.household_id WHERE tasks.id=?").get(Number(req.params.id));
 if(!t||(req.user.role==="advisor"&&t.household_id&&t.advisor_id!==req.user.id))return res.status(404).json({error:"Tâche introuvable."});
 db.prepare("DELETE FROM tasks WHERE id=?").run(t.id);res.json({ok:true});
});
app.get("/api/appointments", auth, (req,res)=>{
 const scope=req.user.role==="advisor"?" WHERE (appointments.household_id IS NULL OR households.advisor_id=?)":"";
 res.json(db.prepare("SELECT appointments.*,households.name household_name FROM appointments LEFT JOIN households ON households.id=appointments.household_id"+scope+" ORDER BY starts_at").all(...(req.user.role==="advisor"?[req.user.id]:[])));
});
app.post("/api/appointments", auth, (req,res)=>{
 const d=req.body||{};if(!d.title||!d.starts_at)return res.status(400).json({error:"Intitulé et date requis."});
 if(d.household_id&&!householdAllowed(req,Number(d.household_id)))return res.status(404).json({error:"Dossier introuvable."});
 const id=insertFields("appointments",["household_id","assigned_to","title","starts_at","duration_minutes","location","notes"],{household_id:d.household_id||null,assigned_to:req.user.role==="advisor"?req.user.id:(d.assigned_to||null),title:d.title,starts_at:d.starts_at,duration_minutes:Number(d.duration_minutes)||60,location:d.location||"",notes:d.notes||""});
 res.status(201).json(db.prepare("SELECT * FROM appointments WHERE id=?").get(id));
});
app.put("/api/appointments/:id", auth, (req,res)=>{
 const a=db.prepare("SELECT appointments.*,households.advisor_id FROM appointments LEFT JOIN households ON households.id=appointments.household_id WHERE appointments.id=?").get(Number(req.params.id));
 if(!a||(req.user.role==="advisor"&&a.household_id&&a.advisor_id!==req.user.id))return res.status(404).json({error:"Rendez-vous introuvable."});
 const d=clean(req.body,["title","starts_at","duration_minutes","location","notes"]);const e=Object.entries(d);
 if(e.length)db.prepare("UPDATE appointments SET "+e.map(([k])=>k+"=?").join(",")+" WHERE id=?").run(...e.map(x=>x[1]),a.id);
 res.json(db.prepare("SELECT * FROM appointments WHERE id=?").get(a.id));
});
app.delete("/api/appointments/:id", auth, (req,res)=>{
 const a=db.prepare("SELECT appointments.*,households.advisor_id FROM appointments LEFT JOIN households ON households.id=appointments.household_id WHERE appointments.id=?").get(Number(req.params.id));
 if(!a||(req.user.role==="advisor"&&a.household_id&&a.advisor_id!==req.user.id))return res.status(404).json({error:"Rendez-vous introuvable."});
 db.prepare("DELETE FROM appointments WHERE id=?").run(a.id);res.json({ok:true});
});
app.get("/api/users", auth, requireRole("admin","manager"), (req,res)=>res.json(db.prepare("SELECT id,name,email,role,active,created_at FROM users ORDER BY name").all()));
app.post("/api/users", auth, requireRole("admin"), (req,res)=>{
 const d=req.body||{};if(!d.name||!d.email||!d.password||!["admin","manager","advisor"].includes(d.role))return res.status(400).json({error:"Nom, e-mail, mot de passe et rôle requis."});
 try {const id=db.prepare("INSERT INTO users(name,email,role,password_hash) VALUES(?,?,?,?)").run(d.name,d.email,d.role,hashPassword(d.password)).lastInsertRowid;res.status(201).json(db.prepare("SELECT id,name,email,role,active FROM users WHERE id=?").get(id));} catch(e){res.status(409).json({error:"Cette adresse e-mail existe déjà."});}
});
app.put("/api/users/:id", auth, requireRole("admin"), (req,res)=>{
 const id=Number(req.params.id),d=req.body||{},fields=clean(d,["name","email","role","active"]);const e=Object.entries(fields);
 if(fields.role&&!["admin","manager","advisor"].includes(fields.role))return res.status(400).json({error:"Rôle invalide."});
 if(e.length)db.prepare("UPDATE users SET "+e.map(([k])=>k+"=?").join(",")+" WHERE id=?").run(...e.map(x=>x[1]),id);
 if(d.password)db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(hashPassword(d.password),id);
 const result=db.prepare("SELECT id,name,email,role,active FROM users WHERE id=?").get(id);if(!result)return res.status(404).json({error:"Utilisateur introuvable."});res.json(result);
});
app.post("/api/password", auth, (req,res)=>{
 const old=db.prepare("SELECT password_hash FROM users WHERE id=?").get(req.user.id);
 if(!verifyPassword(String(req.body.current_password||""),old.password_hash))return res.status(400).json({error:"Mot de passe actuel incorrect."});
 const next=String(req.body.new_password||"");if(next.length<12)return res.status(400).json({error:"Le nouveau mot de passe doit contenir au moins 12 caractères."});
 db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(hashPassword(next),req.user.id);
 db.prepare("DELETE FROM sessions WHERE user_id=?").run(req.user.id);
 res.clearCookie("patrimonia_session",{httpOnly:true,sameSite:"strict",path:"/"});
 res.json({ok:true,message:"Mot de passe modifié. Reconnecte-toi."});
});

const upload = multer({
 storage:multer.diskStorage({destination:UPLOAD_DIR,filename:(req,file,cb)=>cb(null,crypto.randomUUID())}),
 limits:{fileSize:(Number(process.env.MAX_UPLOAD_MB)||12)*1024*1024},
 fileFilter:(req,file,cb)=>cb(null,["application/pdf","image/jpeg","image/png","image/webp"].includes(file.mimetype))
});
app.get("/api/households/:householdId/documents", auth, requireHousehold, (req,res)=>res.json(db.prepare("SELECT id,household_id,uploaded_by,original_name,mime_type,size,created_at FROM documents WHERE household_id=? ORDER BY created_at DESC").all(req.householdId)));
app.post("/api/households/:householdId/documents", auth, requireHousehold, upload.single("file"), (req,res)=>{
 if(!req.file)return res.status(400).json({error:"Choisis un PDF ou une image JPEG, PNG ou WebP."});
 const id=db.prepare("INSERT INTO documents(household_id,uploaded_by,original_name,stored_name,mime_type,size) VALUES(?,?,?,?,?,?)").run(req.householdId,req.user.id,path.basename(req.file.originalname),req.file.filename,req.file.mimetype,req.file.size).lastInsertRowid;
 res.status(201).json(db.prepare("SELECT id,household_id,uploaded_by,original_name,mime_type,size,created_at FROM documents WHERE id=?").get(id));
});
app.get("/api/documents/:id/download", auth, (req,res)=>{
 const d=db.prepare("SELECT * FROM documents WHERE id=?").get(Number(req.params.id));
 if(!d||!householdAllowed(req,d.household_id))return res.status(404).json({error:"Document introuvable."});
 res.download(path.join(UPLOAD_DIR,d.stored_name),d.original_name);
});
app.delete("/api/documents/:id", auth, (req,res)=>{
 const d=db.prepare("SELECT * FROM documents WHERE id=?").get(Number(req.params.id));
 if(!d||!householdAllowed(req,d.household_id))return res.status(404).json({error:"Document introuvable."});
 fs.rmSync(path.join(UPLOAD_DIR,d.stored_name),{force:true});db.prepare("DELETE FROM documents WHERE id=?").run(d.id);res.json({ok:true});
});
app.get("/api/exports/positions.csv", auth, (req,res)=>{
 const rows=visibleHouseholds(req),ids=rows.map(h=>h.id),scope=ids.length?ids.join(","):"NULL";
 const data=db.prepare("SELECT households.name household,assets.category,assets.name,assets.institution,assets.identifier,assets.quantity,assets.unit_price,assets.value,assets.valuation_date,assets.source FROM assets JOIN households ON households.id=assets.household_id WHERE assets.household_id IN ("+scope+") ORDER BY households.name,assets.name").all();
 const quote=x=>'"'+String(x==null?"":x).replace(/"/g,'""')+'"';
 const csv="Foyer,Catégorie,Actif,Enveloppe,Identifiant,Quantité,Cours,Valeur,Date de valorisation,Source\r\n"+data.map(r=>Object.values(r).map(quote).join(",")).join("\r\n");
 res.type("text/csv").set("Content-Disposition",'attachment; filename="positions-patrimonia.csv"').send("\ufeff"+csv);
});
app.get("/api/exports/households/:id.pdf", auth, requireHousehold, (req,res)=>{
 const h=db.prepare("SELECT * FROM households WHERE id=?").get(req.householdId);
 const assets=db.prepare("SELECT * FROM assets WHERE household_id=? ORDER BY category,name").all(h.id);
 const debts=db.prepare("SELECT * FROM debts WHERE household_id=? ORDER BY name").all(h.id);
 const members=db.prepare("SELECT * FROM members WHERE household_id=? ORDER BY id").all(h.id);
 const assetTotal=assets.reduce((a,x)=>a+Number(x.value||0),0),debtTotal=debts.reduce((a,x)=>a+Number(x.remaining_amount||0),0);
 res.setHeader("Content-Type","application/pdf");res.setHeader("Content-Disposition",'attachment; filename="synthese-foyer-'+h.id+'.pdf"');
 const pdf=new PDFDocument({margin:48});pdf.pipe(res);pdf.fontSize(20).fillColor("#15283b").text("PATRIMONIA", {continued:true}).fontSize(10).fillColor("#718096").text("   Synthèse patrimoniale");
 pdf.moveDown().fontSize(18).fillColor("#203247").text(h.name);pdf.moveDown().fontSize(10).fillColor("#526477").text("Édité le "+new Date().toLocaleDateString("fr-FR"));
 pdf.moveDown().fontSize(13).fillColor("#203247").text("Profil et suivi");pdf.fontSize(10).fillColor("#526477").text("Objectifs : "+(h.goals||"—")).text("Horizon : "+(h.horizon||"—")).text("Profil de risque : "+(h.risk_profile||"—")).text("Prochaine revue : "+(h.review_date||"—"));
 pdf.moveDown().fontSize(13).fillColor("#203247").text("Personnes du foyer");members.forEach(m=>pdf.fontSize(10).fillColor("#526477").text("• "+m.first_name+" "+m.last_name+(m.relationship?" — "+m.relationship:"")));
 pdf.moveDown().fontSize(13).fillColor("#203247").text("Actifs");assets.forEach(a=>pdf.fontSize(10).fillColor("#526477").text(a.name+" — "+a.category+" — "+Number(a.value).toLocaleString("fr-FR")+" € — valorisé le "+a.valuation_date+" ("+a.source+")"));
 pdf.moveDown().fontSize(13).fillColor("#203247").text("Emprunts et dettes");debts.forEach(d=>pdf.fontSize(10).fillColor("#526477").text(d.name+" — capital restant dû "+Number(d.remaining_amount).toLocaleString("fr-FR")+" €"));
 pdf.moveDown().fontSize(13).fillColor("#203247").text("Synthèse");pdf.fontSize(11).fillColor("#526477").text("Total actifs : "+assetTotal.toLocaleString("fr-FR")+" €").text("Dettes : "+debtTotal.toLocaleString("fr-FR")+" €").text("Patrimoine net : "+(assetTotal-debtTotal).toLocaleString("fr-FR")+" €");
 pdf.end();
});
app.get("/api/health", (req,res)=>res.json({ok:true,app:"PATRIMONIA ERP"}));
app.use((req,res)=>{
 if(req.path.startsWith("/api/"))return res.status(404).json({error:"Route API inconnue."});
 res.sendFile(path.join(__dirname,"web","index.html"));
});
app.use((err,req,res,next)=>{
 console.error(err);
 if(err instanceof multer.MulterError)return res.status(400).json({error:"Le fichier dépasse la taille autorisée."});
 res.status(500).json({error:"Erreur interne. Consulte le terminal local pour le détail."});
});
app.listen(PORT,HOST,()=>console.log("PATRIMONIA ERP prêt sur http://"+HOST+":"+PORT));
