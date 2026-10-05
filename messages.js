const defaultConversations = [
  { id: "store", name: "寻羽小市", category: "服务消息", avatar: "assets/logo.png", unread: 2, messages: [{ from: "them", text: "你好，欢迎来到寻羽小市。有什么可以帮你？", time: "10:24" }, { from: "them", text: "本周精选商品已经更新，去看看有没有喜欢的好物吧。", time: "10:25" }] },
  { id: "lin", name: "林满月", category: "好友互动", avatar: "assets/avatar.svg", unread: 1, messages: [{ from: "them", text: "上次你分享的香氛蜡烛真的很好闻。", time: "昨天" }] },
  { id: "yu", name: "羽织", category: "好友互动", avatar: "assets/avatar.svg", unread: 0, messages: [{ from: "them", text: "周末一起逛逛新上架的器物？", time: "周一" }] }
];
const storageKey = "smartMallConversations";
let conversations = JSON.parse(localStorage.getItem(storageKey) || "null") || defaultConversations;
let activeId = conversations[0].id;
const conversationList = document.querySelector("#conversation-list");
const chatMessages = document.querySelector("#chat-messages");
const chatName = document.querySelector("#chat-name");
const chatStatus = document.querySelector("#chat-status");
const chatCategory = document.querySelector("#chat-category");
const unreadCount = document.querySelector("#unread-count");

function activeConversation() { return conversations.find(item => item.id === activeId); }

function renderConversationList(filter = "") {
  const normalized = filter.trim().toLowerCase();
  conversationList.innerHTML = conversations.filter(item => item.name.toLowerCase().includes(normalized)).map(item => {
    const lastMessage = item.messages[item.messages.length - 1];
    return `<button class="conversation-item ${item.id === activeId ? "active" : ""}" data-id="${item.id}"><img src="${item.avatar}" alt="${item.name}"><span class="conversation-copy"><strong>${item.name}</strong><small>${lastMessage.text}</small></span><span class="conversation-meta">${lastMessage.time}${item.unread ? `<b>${item.unread}</b>` : ""}</span></button>`;
  }).join("") || "<p class=\"message-empty\">没有找到相关会话</p>";
  conversationList.querySelectorAll(".conversation-item").forEach(button => button.addEventListener("click", () => { activeId = button.dataset.id; const item = activeConversation(); item.unread = 0; persist(); renderConversationList(document.querySelector("#conversation-search").value); renderChat(); }));
  unreadCount.textContent = conversations.reduce((sum, item) => sum + item.unread, 0);
}

function renderChat() {
  const item = activeConversation();
  chatName.textContent = item.name;
  chatStatus.textContent = item.id === "store" ? "在线 · 通常会在几分钟内回复" : "最近在线";
  chatCategory.textContent = item.category;
  chatMessages.innerHTML = item.messages.map(message => `<div class="chat-row ${message.from === "me" ? "mine" : "theirs"}"><div class="chat-bubble">${message.text}<time>${message.time}</time></div></div>`).join("");
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function persist() { localStorage.setItem(storageKey, JSON.stringify(conversations)); }

document.querySelector("#conversation-search").addEventListener("input", event => renderConversationList(event.target.value));
document.querySelector("#message-form").addEventListener("submit", event => {
  event.preventDefault();
  const input = document.querySelector("#message-input");
  const text = input.value.trim();
  if (!text) return;
  activeConversation().messages.push({ from: "me", text, time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) });
  input.value = "";
  persist();
  renderConversationList(document.querySelector("#conversation-search").value);
  renderChat();
});

renderConversationList();
renderChat();