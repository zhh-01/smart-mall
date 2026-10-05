const profileUser = JSON.parse(localStorage.getItem("smartMallUser") || "null");
document.querySelector("#profile-name").textContent = profileUser?.username || "用户";
document.querySelector("#profile-username").textContent = profileUser?.username || "-";
document.querySelector("#logout-button").addEventListener("click", () => {
  localStorage.removeItem("smartMallUser");
  window.location.href = "login.html";
});