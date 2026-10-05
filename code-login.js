const codeForm = document.querySelector("#code-form");
const codeError = document.querySelector("#code-error");
codeForm.addEventListener("submit", event => {
  event.preventDefault();
  const phone = document.querySelector("#code-phone").value.trim();
  const code = document.querySelector("#login-code").value.trim();
  if (!phone || code !== "123456") { codeError.textContent = "请输入手机号和正确的 6 位验证码。"; return; }
  localStorage.setItem("smartMallUser", JSON.stringify({ username: `phone_${phone.slice(-4)}`, provider: "验证码", loginAt: new Date().toISOString() }));
  window.location.href = "profile.html";
});
