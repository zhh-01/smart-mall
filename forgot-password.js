const forgotForm = document.querySelector("#forgot-form");
const forgotError = document.querySelector("#forgot-error");
forgotForm.addEventListener("submit", async event => {
  event.preventDefault();
  const username = document.querySelector("#forgot-username").value.trim();
  const password = document.querySelector("#forgot-password").value;
  forgotError.textContent = "正在重置密码...";
  try {
    const usersResponse = await fetch("/api/users");
    const usersResult = await usersResponse.json();
    const user = usersResult.users.find(item => item.username.toLowerCase() === username.toLowerCase());
    if (!user) { forgotError.textContent = "没有找到该用户名。"; return; }
    const response = await fetch(`/api/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (!response.ok) { forgotError.textContent = "密码重置失败。"; return; }
    forgotError.textContent = "密码已重置，请返回登录。";
  } catch { forgotError.textContent = "无法连接服务器，请稍后重试。"; }
});
