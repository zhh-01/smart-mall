# 寻羽小市

一个无需第三方依赖的商城网站，包含首页、商品列表、商品详情、登录、个人中心和消息中心，并提供 Node.js 后端用户 API。

## 本地运行

在项目目录执行：

```powershell
node server.js
```

或：

```powershell
npm start
```

浏览器访问 `http://127.0.0.1:5501/`。

同一局域网的其他设备可访问：

```text
http://本机局域网IP:5501/
```

## 部署到静态托管

前端静态页面可以直接上传到 GitHub Pages、Netlify、Vercel Static 等静态托管服务；但用户登录 API 需要同时运行 `server.js`，不能仅依靠静态托管。

Netlify 已通过 `netlify.toml` 配置发布目录。

## 项目说明

- 页面和资源均使用相对路径，可部署在子目录中。
- 登录用户保存在项目根目录的 `users.json`，密码以 `scrypt` 哈希保存，不保存明文密码。
- 购物袋和消息数据目前保存在浏览器 `localStorage`，仍属于前端演示功能。
- 生产环境建议把 `users.json` 替换为数据库，并加入 HTTPS、会话令牌、限流、管理员鉴权和输入校验。

## 后端 API

- `GET /api/health`：健康检查
- `POST /api/auth/register`：注册，JSON `{ "username": "alice", "password": "1234" }`
- `POST /api/auth/login`：登录，返回用户公开信息
- `GET /api/users`：获取用户公开列表
- `GET /api/users/:id`：获取单个用户公开信息
- `PATCH /api/users/:id`：更新用户名或密码
- `DELETE /api/users/:id`：删除用户

## 微信 / QQ 真实登录配置

第三方登录必须先在微信开放平台和 QQ 互联申请应用，不能仅凭前端按钮获取真实用户信息。启动后端前设置环境变量：

```powershell
$env:WECHAT_APP_ID = "你的微信 AppID"
$env:WECHAT_APP_SECRET = "你的微信 AppSecret"
$env:QQ_APP_ID = "你的 QQ AppID"
$env:QQ_APP_KEY = "你的 QQ AppKey"
$env:OAUTH_REDIRECT_BASE = "https://你的域名"
npm start
```

需要在平台后台登记回调地址：

- `https://你的域名/api/auth/oauth/callback/wechat`
- `https://你的域名/api/auth/oauth/callback/qq`

未配置凭据时，按钮会显示配置提示，不会伪造第三方登录结果。
