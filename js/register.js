const registerForm = document.querySelector("#register-form");
const registerError = document.querySelector("#register-error");
registerForm.addEventListener("submit", async event => {
  event.preventDefault();
  const username = document.querySelector("#register-username").value.trim();
  const password = document.querySelector("#register-password").value;
  registerError.textContent = "正在创建账号...";
  try {
    const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    const result = await response.json();
    if (!response.ok) { registerError.textContent = result.error || "注册失败。"; return; }
    localStorage.setItem("smartMallUser", JSON.stringify({ ...result.user, loginAt: new Date().toISOString() }));
    window.location.href = "profile.html";
  } catch { registerError.textContent = "无法连接服务器，请稍后重试。"; }
});
