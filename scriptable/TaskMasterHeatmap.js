// Variables used by Scriptable.
// These must be at the very top of the file.
// icon-color: green; icon-glyph: chart-area;
//
// TaskMaster Heatmap Widget
// Light teal theme with paper texture + heatmap.
//
// SETUP
// 1. Create a new script in Scriptable, paste this whole file.
// 2. Edit CONFIG below (or leave empty and use Keychain prompts on first run).
// 3. Run once in the app to save credentials.
// 4. Add a Scriptable widget → choose this script → Medium or Large looks best.

const CONFIG = {
  // Your Render API base (no trailing slash)
  apiBase: "https://taskmaster-k8o7.onrender.com",

  // Put your login here inside Scriptable on the iPhone (do not commit real passwords)
  email: "omkarpatil9881@gmail.com",
  password: "",

  // 7 weeks — cleaner fit for medium home-screen widgets
  days: 49,

  title: "Tasks",
  credit: "by Omkar Patil",
};

// Light productivity theme — soft paper + deep teal
const COLORS = {
  bg: new Color("#f3f5f7"),
  card: new Color("#ffffff"),
  ink: new Color("#101820"),
  inkSoft: new Color("#4a5d6e"),
  inkFaint: new Color("#7d8fa0"),
  accent: new Color("#0c7a5f"),
  accentMid: new Color("#14967a"),
  accentSoft: new Color("#d9f3eb"),
  accentGlow: new Color("#0c7a5f", 0.12),
  border: new Color("#e2e8ee"),
  track: new Color("#e8eef2"),
  heat: [
    new Color("#e6ecf1"),
    new Color("#a8dccb"),
    new Color("#4db897"),
    new Color("#1a9474"),
    new Color("#0a5f4a"),
  ],
};

const KEYS = {
  email: "taskmaster.email",
  password: "taskmaster.password",
  token: "taskmaster.token",
  expires: "taskmaster.expires",
};

/** Scriptable throws if key is missing — always check contains() first. */
function kcGet(key) {
  return Keychain.contains(key) ? Keychain.get(key) : null;
}

function kcRemove(key) {
  if (Keychain.contains(key)) Keychain.remove(key);
}

async function main() {
  const widget = await buildWidget();
  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    await widget.presentMedium();
  }
  Script.complete();
}

async function buildWidget() {
  const size = config.widgetFamily || "medium";
  try {
    await wakeApi(); // Render free tier sleeps — wake before login/heatmap
    const token = await getAccessToken();
    const days = await fetchHeatmap(token);
    const stats = analyze(days);
    return renderWidget(size, days, stats);
  } catch (err) {
    return errorWidget(String(err));
  }
}

// ─── Auth ───────────────────────────────────────────────────────────

async function getAccessToken() {
  let email = (CONFIG.email || "").trim() || kcGet(KEYS.email) || "";
  let password = (CONFIG.password || "") || kcGet(KEYS.password) || "";

  // Alerts only work when running inside the Scriptable app (not as a widget)
  if ((!email || !password) && !config.runsInWidget) {
    if (!email) email = await promptText("TaskMaster email");
    if (!password) password = await promptSecure("TaskMaster password");
  }

  email = String(email).trim();
  password = String(password);

  if (!email || !password || email.includes("YOUR_EMAIL")) {
    throw new Error(
      "Set CONFIG.email and CONFIG.password at the top (same as website login)."
    );
  }

  // Always login fresh with CONFIG credentials (avoids stale Keychain JWT after Jwt__Key changes)
  kcRemove(KEYS.token);
  kcRemove(KEYS.expires);

  Keychain.set(KEYS.email, email);
  Keychain.set(KEYS.password, password);

  const res = await loginRequest(email, password);
  const token = (res && (res.accessToken || res.AccessToken) || "").trim();
  const expiresAt = (res && (res.expiresAtUtc || res.ExpiresAtUtc)) || "";

  if (!token) {
    throw new Error(
      "Login response had no accessToken. Body: " + JSON.stringify(res).slice(0, 180)
    );
  }

  Keychain.set(KEYS.token, token);
  Keychain.set(KEYS.expires, String(expiresAt));
  return token;
}

async function loginRequest(email, password) {
  const url = `${CONFIG.apiBase}/api/auth/login`;
  const req = new Request(url);
  req.method = "POST";
  req.timeoutInterval = 60;
  req.headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  req.body = JSON.stringify({
    email: email,
    password: password,
  });

  const text = await req.loadString();
  const code = req.response ? req.response.statusCode : 0;
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_) {
    throw new Error(`Login non-JSON (HTTP ${code}): ${String(text).slice(0, 120)}`);
  }

  if (code < 200 || code >= 300) {
    const msg =
      (json && (json.message || json.title)) ||
      `Login failed HTTP ${code}`;
    throw new Error(String(msg));
  }
  return json;
}

async function promptText(title) {
  const a = new Alert();
  a.title = title;
  a.addTextField("you@email.com");
  a.addAction("Save");
  a.addCancelAction("Cancel");
  const i = await a.presentAlert();
  if (i === -1) return "";
  return a.textFieldValue(0).trim();
}

async function promptSecure(title) {
  const a = new Alert();
  a.title = title;
  a.addSecureTextField("");
  a.addAction("Save");
  a.addCancelAction("Cancel");
  const i = await a.presentAlert();
  if (i === -1) return "";
  return a.textFieldValue(0);
}

// ─── API ────────────────────────────────────────────────────────────

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function fetchHeatmap(token) {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (CONFIG.days - 1));
  const path = `/api/metrics/heatmap?from=${isoDate(from)}&to=${isoDate(to)}`;
  const data = await request("GET", path, { token });
  return data.days || [];
}

/** Hit /api/health a few times so Render wakes from sleep. */
async function wakeApi() {
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const req = new Request(`${CONFIG.apiBase}/api/health`);
      req.method = "GET";
      req.headers = { Accept: "application/json" };
      req.timeoutInterval = 60;
      const text = await req.loadString();
      const code = req.response && req.response.statusCode;
      if (code >= 200 && code < 300) {
        // ok
        return;
      }
      lastErr = `Health HTTP ${code}: ${text.slice(0, 80)}`;
    } catch (e) {
      lastErr = String(e);
      // Brief pause then retry (cold start)
      await wait(2500);
    }
  }
  throw new Error(
    `API unreachable after wake retries. Open ${CONFIG.apiBase}/api/health in Safari first, then run again. Detail: ${lastErr}`
  );
}

function wait(ms) {
  return new Promise((resolve) => Timer.schedule(ms / 1000, false, resolve));
}

async function request(method, path, { token, body } = {}) {
  const url = `${CONFIG.apiBase}${path}`;
  let lastErr = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const req = new Request(url);
    req.method = method;
    req.timeoutInterval = 60;

    // Scriptable often ignores headers mutated after assignment.
    // Build the full header object once (Bearer must be included here).
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) {
      headers.Authorization = "Bearer " + String(token).trim();
    }
    req.headers = headers;

    if (body) req.body = JSON.stringify(body);

    try {
      const text = await req.loadString();
      const code = req.response ? req.response.statusCode : 0;

      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch (_) {
        throw new Error(`Non-JSON response (HTTP ${code}): ${text.slice(0, 100)}`);
      }

      if (code === 401) {
        kcRemove(KEYS.token);
        kcRemove(KEYS.expires);
        const msg =
          (json && (json.message || json.title)) ||
          "Unauthorized on protected API (bad/expired token).";
        throw new Error(String(msg));
      }
      if (code < 200 || code >= 300) {
        const msg = (json && (json.message || json.title)) || `HTTP ${code}`;
        throw new Error(String(msg));
      }
      return json;
    } catch (e) {
      lastErr = String(e);
      // Don't retry client/auth errors
      if (
        lastErr.includes("Unauthorized") ||
        lastErr.includes("Invalid email") ||
        lastErr.includes("HTTP 4") ||
        lastErr.includes("Login failed")
      ) {
        throw e;
      }
      if (attempt < 3) await wait(2500);
    }
  }

  throw new Error(
    `API unreachable. In Safari open ${CONFIG.apiBase}/api/health then retry. ${lastErr}`
  );
}

// ─── Analytics ──────────────────────────────────────────────────────

function levelFromRate(rate, expected) {
  if (expected <= 0) return 0;
  if (rate <= 0) return 0;
  if (rate < 0.35) return 1;
  if (rate < 0.65) return 2;
  if (rate < 0.9) return 3;
  return 4;
}

function analyze(days) {
  const withWork = days.filter((d) => d.expected > 0);
  const totalExpected = days.reduce((s, d) => s + d.expected, 0);
  const totalCompleted = days.reduce((s, d) => s + d.completed, 0);
  const overallRate = totalExpected === 0 ? 0 : totalCompleted / totalExpected;

  const todayIso = isoDate(new Date());
  const today = days.find((d) => d.date === todayIso) || {
    expected: 0,
    completed: 0,
    rate: 0,
  };

  let currentStreak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (d.expected === 0) continue;
    if (d.rate >= 0.8) currentStreak += 1;
    else break;
  }

  let bestStreak = 0;
  let run = 0;
  for (const d of days) {
    if (d.expected === 0) continue;
    if (d.rate >= 0.8) {
      run += 1;
      bestStreak = Math.max(bestStreak, run);
    } else {
      run = 0;
    }
  }

  const perfect = withWork.filter((d) => d.rate >= 1).length;

  return {
    today,
    overallRate,
    currentStreak,
    bestStreak,
    perfect,
    totalCompleted,
    totalExpected,
  };
}

function pct(n) {
  return `${Math.round(n * 100)}%`;
}

// ─── Drawing ────────────────────────────────────────────────────────

function roundRect(ctx, rect, r, fill) {
  ctx.setFillColor(fill);
  const p = new Path();
  p.addRoundedRect(rect, r, r);
  ctx.addPath(p);
  ctx.fillPath();
}

/** Soft paper texture + teal corner glow for a less flat background */
function drawPaperTexture(width, height) {
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = true;
  ctx.respectScreenScale = true;

  // Base wash
  ctx.setFillColor(new Color("#f5f7f9"));
  ctx.fillRect(new Rect(0, 0, width, height));

  // Soft teal atmosphere (top-left + bottom-right)
  ctx.setFillColor(new Color("#0c7a5f", 0.07));
  ctx.fillEllipse(new Rect(-width * 0.15, -height * 0.35, width * 0.7, height * 0.9));
  ctx.setFillColor(new Color("#0c7a5f", 0.05));
  ctx.fillEllipse(new Rect(width * 0.45, height * 0.35, width * 0.7, height * 0.9));

  // Fine grid texture
  ctx.setStrokeColor(new Color("#1a2a35", 0.045));
  ctx.setLineWidth(1);
  const step = 18;
  for (let x = 0; x <= width; x += step) {
    const path = new Path();
    path.move(new Point(x, 0));
    path.addLine(new Point(x, height));
    ctx.addPath(path);
    ctx.strokePath();
  }
  for (let y = 0; y <= height; y += step) {
    const path = new Path();
    path.move(new Point(0, y));
    path.addLine(new Point(width, y));
    ctx.addPath(path);
    ctx.strokePath();
  }

  // Subtle dots
  ctx.setFillColor(new Color("#0c7a5f", 0.06));
  for (let y = 10; y < height; y += 28) {
    for (let x = 10; x < width; x += 28) {
      ctx.fillEllipse(new Rect(x, y, 2.5, 2.5));
    }
  }

  return ctx.getImage();
}

/** Clean heatmap grid (the layout you liked) */
function drawHeatmap(days, width, height) {
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  if (!days.length) return ctx.getImage();

  const first = parseLocalDate(days[0].date);
  const lead = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (const d of days) cells.push(d);

  const weeks = Math.ceil(cells.length / 7);
  const gap = 4;
  const cell = Math.max(
    8,
    Math.min(
      Math.floor((width - gap * (weeks - 1)) / weeks),
      Math.floor((height - gap * 6) / 7)
    )
  );
  const radius = Math.max(2, Math.floor(cell * 0.32));
  const gridH = 7 * cell + 6 * gap;
  const offsetY = Math.floor((height - gridH) / 2);

  for (let i = 0; i < cells.length; i++) {
    const day = cells[i];
    if (!day) continue;
    const week = Math.floor(i / 7);
    const dow = i % 7;
    roundRect(
      ctx,
      new Rect(week * (cell + gap), offsetY + dow * (cell + gap), cell, cell),
      radius,
      COLORS.heat[levelFromRate(day.rate, day.expected)]
    );
  }
  return ctx.getImage();
}

function parseLocalDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fit(el, lines) {
  el.lineLimit = lines || 1;
  el.minimumScaleFactor = 0.7;
}

// ─── Widget layouts ─────────────────────────────────────────────────

function applyChrome(w) {
  w.setPadding(12, 14, 12, 14);
  w.backgroundColor = COLORS.bg;
  w.backgroundImage = drawPaperTexture(900, 500);
  w.url = "https://taskmaster-web-peach.vercel.app/app";
}

function renderWidget(size, days, stats) {
  const w = new ListWidget();
  applyChrome(w);

  if (size === "small") layoutSmall(w, days, stats);
  else if (size === "large") layoutLarge(w, days, stats);
  else layoutMedium(w, days, stats);

  return w;
}

function brandHeader(parent) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const left = row.addStack();
  left.layoutHorizontally();
  left.centerAlignContent();
  left.spacing = 6;

  const badge = left.addStack();
  badge.size = new Size(18, 18);
  badge.cornerRadius = 5;
  badge.backgroundColor = COLORS.accent;
  badge.centerAlignContent();
  const t = badge.addText("T");
  t.font = Font.boldSystemFont(10);
  t.textColor = Color.white();
  t.centerAlignText();

  const title = left.addText(CONFIG.title);
  title.font = Font.boldSystemFont(13);
  title.textColor = COLORS.ink;
  fit(title, 1);

  row.addSpacer();

  const credit = row.addText(CONFIG.credit);
  credit.font = Font.mediumSystemFont(9);
  credit.textColor = COLORS.inkFaint;
  credit.rightAlignText();
  fit(credit, 1);
}

function layoutSmall(w, days, stats) {
  brandHeader(w);
  w.addSpacer(8);

  const big = w.addText(pct(stats.today.rate));
  big.font = Font.boldSystemFont(24);
  big.textColor = COLORS.accent;
  fit(big, 1);

  const sub = w.addText(`${stats.today.completed}/${stats.today.expected} today · ${stats.currentStreak}d streak`);
  sub.font = Font.mediumSystemFont(10);
  sub.textColor = COLORS.inkSoft;
  fit(sub, 1);

  w.addSpacer(8);
  const img = drawHeatmap(days.slice(-28), 300, 90);
  const image = w.addImage(img);
  image.imageSize = new Size(130, 40);
  image.leftAlignImage();
}

/**
 * Medium layout that fitted correctly:
 * header → chips → heatmap (unchanged structure)
 * Style upgrades come from texture background + chip polish.
 */
function layoutMedium(w, days, stats) {
  brandHeader(w);
  w.addSpacer(8);

  const statsLine = w.addStack();
  statsLine.layoutHorizontally();
  statsLine.centerAlignContent();

  function chip(label, value, accent) {
    const s = statsLine.addStack();
    s.layoutHorizontally();
    s.centerAlignContent();
    s.setPadding(5, 8, 5, 8);
    s.cornerRadius = 8;
    s.backgroundColor = accent ? COLORS.accentSoft : new Color("#ffffff", 0.92);
    s.borderColor = accent ? new Color("#b8e5d6") : COLORS.border;
    s.borderWidth = 1;

    const l = s.addText(label + " ");
    l.font = Font.mediumSystemFont(9);
    l.textColor = COLORS.inkFaint;

    const v = s.addText(value);
    v.font = Font.boldSystemFont(12);
    v.textColor = accent ? COLORS.accent : COLORS.ink;
  }

  chip("Today", `${stats.today.completed}/${stats.today.expected}`, true);
  statsLine.addSpacer(6);
  chip("Rate", pct(stats.overallRate), false);
  statsLine.addSpacer(6);
  chip("Streak", `${stats.currentStreak}d`, true);

  w.addSpacer(8);

  const img = drawHeatmap(days, 620, 150);
  const image = w.addImage(img);
  image.imageSize = new Size(300, 62);
  image.leftAlignImage();
}

function layoutLarge(w, days, stats) {
  brandHeader(w);
  w.addSpacer(6);

  const hero = w.addText("Your consistency");
  hero.font = Font.boldSystemFont(17);
  hero.textColor = COLORS.ink;
  fit(hero, 1);

  const blurb = w.addText(insightText(stats));
  blurb.font = Font.mediumSystemFont(11);
  blurb.textColor = COLORS.inkSoft;
  blurb.lineLimit = 2;
  blurb.minimumScaleFactor = 0.8;

  w.addSpacer(8);

  const row = w.addStack();
  row.layoutHorizontally();
  row.spacing = 6;

  function tallChip(label, value, accent) {
    const s = row.addStack();
    s.layoutVertically();
    s.setPadding(8, 10, 8, 10);
    s.cornerRadius = 10;
    s.backgroundColor = accent ? COLORS.accentSoft : new Color("#ffffff", 0.92);
    s.borderColor = accent ? new Color("#b8e5d6") : COLORS.border;
    s.borderWidth = 1;
    const l = s.addText(label);
    l.font = Font.mediumSystemFont(8);
    l.textColor = COLORS.inkFaint;
    const v = s.addText(value);
    v.font = Font.boldSystemFont(14);
    v.textColor = accent ? COLORS.accent : COLORS.ink;
  }

  tallChip("TODAY", `${stats.today.completed}/${stats.today.expected}`, true);
  tallChip("RATE", pct(stats.overallRate), false);
  tallChip("STREAK", `${stats.currentStreak}d`, true);
  tallChip("BEST", `${stats.bestStreak}d`, false);

  w.addSpacer(8);

  const img = drawHeatmap(days, 700, 200);
  const image = w.addImage(img);
  image.imageSize = new Size(320, 90);
  image.leftAlignImage();

  w.addSpacer(6);
  const foot = w.addText(CONFIG.credit + " · tap to open");
  foot.font = Font.mediumSystemFont(9);
  foot.textColor = COLORS.inkFaint;
  fit(foot, 1);
}

function insightText(stats) {
  if (stats.currentStreak >= 7) {
    return `${stats.currentStreak}-day streak. Consistency is compounding.`;
  }
  if (stats.today.expected > 0 && stats.today.rate >= 1) {
    return "Today is complete. Protect the streak tomorrow.";
  }
  if (stats.today.expected > 0 && stats.today.completed === 0) {
    return "No completions yet today. One finish lights the grid.";
  }
  if (stats.overallRate >= 0.7) {
    return `${pct(stats.overallRate)} overall · best streak ${stats.bestStreak}d.`;
  }
  return `${stats.totalCompleted}/${stats.totalExpected} done in range. Keep building.`;
}

function errorWidget(message) {
  const w = new ListWidget();
  applyChrome(w);

  const t = w.addText(CONFIG.title);
  t.font = Font.boldSystemFont(14);
  t.textColor = COLORS.accent;

  w.addSpacer(8);
  const e = w.addText(message);
  e.font = Font.mediumSystemFont(11);
  e.textColor = COLORS.inkSoft;
  e.lineLimit = 7;
  e.minimumScaleFactor = 0.75;

  w.addSpacer(10);
  const credit = w.addText(CONFIG.credit);
  credit.font = Font.mediumSystemFont(8);
  credit.textColor = COLORS.inkFaint;

  return w;
}

await main();
