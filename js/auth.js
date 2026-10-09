const accountLink = document.querySelector("#account-link");
const currentUser = JSON.parse(localStorage.getItem("smartMallUser") || "null");

if (accountLink && currentUser) {
  accountLink.textContent = "个人中心";
  accountLink.href = "profile.html";
}

if (document.body.dataset.authRequired === "true" && !currentUser) {
  window.location.replace("login.html");
}

const avatarToggle = document.querySelector("#avatar-toggle");
const accountDrawer = document.querySelector("#account-drawer");
const accountOverlay = document.querySelector("#account-overlay");
const accountClose = document.querySelector("#account-close");
const accountGreeting = document.querySelector("#account-greeting");
const accountLoginLink = document.querySelector("#account-login-link");
const accountLogout = document.querySelector("#account-logout");

function toggleAccountDrawer(open) {
  accountDrawer.classList.toggle("open", open);
  accountOverlay.classList.toggle("visible", open);
  avatarToggle.setAttribute("aria-expanded", String(open));
}

if (avatarToggle && accountDrawer && accountOverlay) {
  if (currentUser) {
    accountGreeting.textContent = `你好，${currentUser.username}`;
    accountLoginLink.hidden = true;
  } else {
    accountLogout.hidden = true;
  }

  avatarToggle.addEventListener("click", () => toggleAccountDrawer(true));
  accountClose.addEventListener("click", () => toggleAccountDrawer(false));
  accountOverlay.addEventListener("click", () => toggleAccountDrawer(false));
  accountLogout.addEventListener("click", () => {
    localStorage.removeItem("smartMallUser");
    window.location.href = "login.html";
  });
}