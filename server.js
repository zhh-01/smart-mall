const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT) || 5502;
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const USERS_FILE = path.join(ROOT, "users.json");
const OAUTH_REDIRECT_BASE = process.env.OAUTH_REDIRECT_BASE || `http://localhost:${PORT}`;
const oauthStates = new Map();

// Supabase 数据库配置：设置了 URL 和 service key 时启用数据库存储，否则回落 users.json 文件
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const USE_DB = !!(SUPABASE_URL && SUPABASE_SERVICE_KEY);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg"
};

// ==================== 存储适配层 ====================
// 内部统一使用 camelCase 行对象：
//   { id, username, passwordHash, provider?, providerId?, nickname?, createdAt }
// 文件模式与数据库模式均通过统一的 async 接口访问。

function readUsersFile() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeUsersFile(users) {
  fs.writeFileSync(USERS_FILE, `${JSON.stringify(users, null, 2)}\n`, "utf8");
}

async function dbFetch(urlSuffix, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${urlSuffix}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`数据库请求失败(${response.status}): ${text.slice(0, 200)}`);
  }
  return response;
}

function fromDbRow(row) {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    provider: row.provider ?? null,
    providerId: row.provider_id ?? null,
    nickname: row.nickname ?? null,
    createdAt: row.created_at
  };
}

function toDbRow(user) {
  return {
    id: user.id,
    username: user.username,
    password_hash: user.passwordHash,
    provider: user.provider ?? null,
    provider_id: user.providerId ?? null,
    nickname: user.nickname ?? null,
    created_at: user.createdAt
  };
}

async function listUsers() {
  if (USE_DB) {
    const res = await dbFetch(`users?select=*`);
    const rows = await res.json();
    return rows.map(fromDbRow);
  }
  return readUsersFile();
}

async function insertUser(user) {
  if (USE_DB) {
    await dbFetch(`users`, {
      method: "POST",
      body: JSON.stringify([toDbRow(user)]),
      headers: { "Prefer": "return=representation" }
    });
    return user;
  }
  const users = readUsersFile();
  users.push(user);
  writeUsersFile(users);
  return user;
}

async function updateUser(id, patch) {
  if (USE_DB) {
    const dbPatch = {};
    if (patch.username !== undefined) dbPatch.username = patch.username;
    if (patch.passwordHash !== undefined) dbPatch.password_hash = patch.passwordHash;
    const res = await dbFetch(`users?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(dbPatch),
      headers: { "Prefer": "return=representation" }
    });
    const rows = await res.json();
    return rows.length ? fromDbRow(rows[0]) : null;
  }
  const users = readUsersFile();
  const idx = users.findIndex(u => u.id === id);
  if (idx < 0) return null;
  if (patch.username !== undefined) users[idx].username = patch.username;
  if (patch.passwordHash !== undefined) users[idx].passwordHash = patch.passwordHash;
  writeUsersFile(users);
  return users[idx];
}

async function deleteUser(id) {
  if (USE_DB) {
    await dbFetch(`users?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    return true;
  }
  const users = readUsersFile();
  const idx = users.findIndex(u => u.id === id);
  if (idx < 0) return false;
  users.splice(idx, 1);
  writeUsersFile(users);
  return true;
}

// ==================== 认证与工具函数 ====================

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expected] = storedHash.split(":");
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return expected && crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

function publicUser(user) {
  return { id: user.id, username: user.username, createdAt: user.createdAt };
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function redirect(response, location) {
  response.writeHead(302, { Location: location, "Cache-Control": "no-store" });
  response.end();
}

function oauthConfig(provider) {
  if (provider === "wechat") {
    return {
      appId: process.env.WECHAT_APP_ID,
      appSecret: process.env.WECHAT_APP_SECRET,
      authorize: "https://open.weixin.qq.com/connect/qrconnect",
      callback: `${OAUTH_REDIRECT_BASE}/api/auth/oauth/callback/wechat`
    };
  }
  return {
    appId: process.env.QQ_APP_ID,
    appSecret: process.env.QQ_APP_KEY,
    authorize: "https://graph.qq.com/oauth2.0/authorize",
    callback: `${OAUTH_REDIRECT_BASE}/api/auth/oauth/callback/qq`
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  const text = await response.text();
  if (!response.ok) throw new Error(`第三方接口请求失败: ${response.status}`);
  return JSON.parse(text);
}

async function handleOAuthCallback(provider, code, state) {
  const config = oauthConfig(provider);
  if (!config.appId || !config.appSecret || !code || !oauthStates.has(state)) throw new Error("OAuth 参数无效或已过期。");
  oauthStates.delete(state);
  let openId;
  let nickname;
  if (provider === "wechat") {
    const token = await fetchJson(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${encodeURIComponent(config.appId)}&secret=${encodeURIComponent(config.appSecret)}&code=${encodeURIComponent(code)}&grant_type=authorization_code`);
    if (token.errcode) throw new Error(token.errmsg || "微信授权失败。");
    openId = token.openid;
    const profile = await fetchJson(`https://api.weixin.qq.com/sns/userinfo?access_token=${encodeURIComponent(token.access_token)}&openid=${encodeURIComponent(openId)}&lang=zh_CN`);
    nickname = profile.nickname;
  } else {
    const tokenResponse = await fetch(`https://graph.qq.com/oauth2.0/token?grant_type=authorization_code&client_id=${encodeURIComponent(config.appId)}&client_secret=${encodeURIComponent(config.appSecret)}&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(config.callback)}`);
    const tokenText = await tokenResponse.text();
    const token = Object.fromEntries(new URLSearchParams(tokenText));
    if (!token.access_token) throw new Error("QQ 授权失败。");
    const openIdText = await (await fetch(`https://graph.qq.com/oauth2.0/me?access_token=${encodeURIComponent(token.access_token)}`)).text();
    const openIdMatch = openIdText.match(/"openid"\s*:\s*"([^"]+)"/);
    openId = openIdMatch?.[1];
    const profile = await fetchJson(`https://graph.qq.com/user/get_user_info?access_token=${encodeURIComponent(token.access_token)}&oauth_consumer_key=${encodeURIComponent(config.appId)}&openid=${encodeURIComponent(openId)}`);
    nickname = profile.nickname;
  }
  if (!openId) throw new Error("第三方账户标识缺失。");
  const users = await listUsers();
  let user = users.find(item => item.provider === provider && item.providerId === openId);
  if (!user) {
    user = { id: crypto.randomUUID(), username: `${provider}_${openId.slice(-8)}`, nickname: nickname || "新用户", provider, providerId: openId, createdAt: new Date().toISOString(), passwordHash: "" };
    await insertUser(user);
  }
  return user;
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) reject(new Error("请求体过大"));
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("请求数据不是有效 JSON"));
      }
    });
    request.on("error", reject);
  });
}

async function handleApi(request, response, url) {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS"
    });
    response.end();
    return true;
  }

  if (url.pathname === "/api/health" && request.method === "GET") {
    sendJson(response, 200, { ok: true, service: "xunyu-market-api", storage: USE_DB ? "supabase" : "json-file" });
    return true;
  }

  const oauthStart = url.pathname.match(/^\/api\/auth\/oauth\/(wechat|qq)$/);
  if (oauthStart && request.method === "GET") {
    const provider = oauthStart[1];
    const config = oauthConfig(provider);
    if (!config.appId || !config.appSecret) {
      sendJson(response, 503, { error: `请先配置 ${provider === "wechat" ? "微信" : "QQ"} OAuth 凭据。` });
      return true;
    }
    const state = crypto.randomBytes(24).toString("hex");
    oauthStates.set(state, { provider, expires: Date.now() + 10 * 60 * 1000 });
    const params = new URLSearchParams({ appid: config.appId, client_id: config.appId, redirect_uri: config.callback, response_type: "code", scope: provider === "wechat" ? "snsapi_login" : "get_user_info", state });
    redirect(response, `${config.authorize}?${params.toString()}${provider === "wechat" ? "#wechat_redirect" : ""}`);
    return true;
  }

  const oauthCallback = url.pathname.match(/^\/api\/auth\/oauth\/callback\/(wechat|qq)$/);
  if (oauthCallback && request.method === "GET") {
    try {
      const user = await handleOAuthCallback(oauthCallback[1], url.searchParams.get("code"), url.searchParams.get("state"));
      redirect(response, `/oauth-complete.html?user=${encodeURIComponent(JSON.stringify(publicUser(user)))}`);
    } catch (error) {
      redirect(response, `/login.html?oauth_error=${encodeURIComponent(error.message)}`);
    }
    return true;
  }

  if (url.pathname === "/api/auth/register" && request.method === "POST") {
    try {
      const { username, password } = await readBody(request);
      const cleanUsername = String(username || "").trim();
      if (cleanUsername.length < 2 || String(password || "").length < 4) {
        sendJson(response, 400, { error: "用户名至少 2 个字符，密码至少 4 位。" });
        return true;
      }
      const users = await listUsers();
      if (users.some(user => user.username.toLowerCase() === cleanUsername.toLowerCase())) {
        sendJson(response, 409, { error: "用户名已存在。" });
        return true;
      }
      const user = {
        id: crypto.randomUUID(),
        username: cleanUsername,
        passwordHash: hashPassword(String(password)),
        createdAt: new Date().toISOString()
      };
      await insertUser(user);
      sendJson(response, 201, { user: publicUser(user) });
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return true;
  }

  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    try {
      const { username, password } = await readBody(request);
      const users = await listUsers();
      const user = users.find(item => item.username.toLowerCase() === String(username || "").trim().toLowerCase());
      if (!user || !verifyPassword(String(password || ""), user.passwordHash)) {
        sendJson(response, 401, { error: "用户名或密码错误。" });
        return true;
      }
      sendJson(response, 200, { user: publicUser(user), loginAt: new Date().toISOString() });
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return true;
  }

  if (url.pathname === "/api/users" && request.method === "GET") {
    try {
      const users = await listUsers();
      sendJson(response, 200, { users: users.map(publicUser) });
    } catch (error) {
      sendJson(response, 500, { error: error.message });
    }
    return true;
  }

  const userMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
  if (userMatch) {
    const userId = userMatch[1];
    try {
      if (request.method === "GET") {
        const users = await listUsers();
        const user = users.find(item => item.id === userId);
        if (!user) { sendJson(response, 404, { error: "用户不存在。" }); return true; }
        sendJson(response, 200, { user: publicUser(user) });
        return true;
      }
      if (request.method === "PATCH") {
        const users = await listUsers();
        if (!users.some(item => item.id === userId)) { sendJson(response, 404, { error: "用户不存在。" }); return true; }
        const body = await readBody(request);
        const patch = {};
        if (body.username) patch.username = String(body.username).trim();
        if (body.password) patch.passwordHash = hashPassword(String(body.password));
        const updated = await updateUser(userId, patch);
        sendJson(response, 200, { user: publicUser(updated) });
        return true;
      }
      if (request.method === "DELETE") {
        const users = await listUsers();
        if (!users.some(item => item.id === userId)) { sendJson(response, 404, { error: "用户不存在。" }); return true; }
        await deleteUser(userId);
        sendJson(response, 204, {});
        return true;
      }
    } catch (error) {
      sendJson(response, 400, { error: error.message });
      return true;
    }
  }

  sendJson(response, 404, { error: "API 路径不存在。" });
  return true;
}

function serveStatic(request, response, url) {
  let relativePath = decodeURIComponent(url.pathname);
  if (relativePath === "/") relativePath = "/index.html";
  if (relativePath === "/users.json" || relativePath === "/server.js" || relativePath === "/package.json") {
    response.writeHead(404);
    response.end("Not Found");
    return;
  }
  const filePath = path.resolve(ROOT, `.${relativePath}`);
  if (!filePath.startsWith(`${ROOT}${path.sep}`) && filePath !== ROOT) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      const fallback = path.join(ROOT, "404.html");
      fs.readFile(fallback, (fallbackError, content) => {
        response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        response.end(fallbackError ? "Not Found" : content);
      });
      return;
    }
    const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
    fs.createReadStream(filePath).pipe(response);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) {
    await handleApi(request, response, url);
    return;
  }
  serveStatic(request, response, url);
});

server.listen(PORT, HOST, () => {
  console.log(`寻羽小市服务已启动: http://localhost:${PORT} (storage=${USE_DB ? "supabase" : "json-file"})`);
});
