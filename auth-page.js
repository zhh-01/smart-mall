const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");

async function requestApi(path, options) {
  try {
    const response = await fetch(path, options);
    if (response.status !== 404) return response;
  } catch {
    // Try the development API port below when the page is served statically.
  }

  const fallbackUrl = `${window.location.protocol}//${window.location.hostname}:5503${path}`;
  return fetch(fallbackUrl, options);
}

async function socialLogin(provider) {
  loginError.textContent = `正在跳转${provider}授权...`;
  try {
    const response = await requestApi(`/api/auth/oauth/${provider === "微信" ? "wechat" : "qq"}`, { redirect: "manual" });
    if (response.type === "opaqueredirect" || response.status === 0 || response.redirected) return;
    const result = await response.json();
    if (!response.ok) {
      loginError.textContent = result.error || `${provider}授权暂不可用。`;
      return;
    }
    if (result.url) window.location.href = result.url;
  } catch {
    loginError.textContent = "无法连接后端，请确认 OAuth 服务已启动并完成配置。";
  }
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const username = formData.get("username").trim();
  const password = formData.get("password");

  if (!username || password.length < 4) {
    loginError.textContent = "请输入用户名，并填写至少 4 位密码。";
    return;
  }

  loginError.textContent = "正在登录...";
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const result = await response.json();
    if (!response.ok) {
      loginError.textContent = result.error || "登录失败，请稍后重试。";
      return;
    }
    localStorage.setItem("smartMallUser", JSON.stringify({ ...result.user, loginAt: result.loginAt }));
    window.location.href = "profile.html";
  } catch {
    loginError.textContent = "无法连接服务器，请确认后端服务已启动。";
  }
});

document.querySelector("#wechat-login").addEventListener("click", () => socialLogin("微信"));
document.querySelector("#qq-login").addEventListener("click", () => socialLogin("QQ"));