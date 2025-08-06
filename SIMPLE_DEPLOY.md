# LibreTV 简化部署指南

> 🎯 **新版本特色**：不再使用环境变量，改为直接在配置文件中设置固定的用户名和密码，支持静态部署。

## 🚀 快速开始

### 1. 配置密码

**方法一：使用配置页面（推荐）**
1. 在浏览器中打开 `static-deploy.html`
2. 输入您想要的密码
3. 点击"生成配置"
4. 复制生成的配置到对应文件中

**方法二：手动配置**
1. 编辑 `js/auth-config.js`：
```javascript
const AUTH_CONFIG = {
    username: 'admin',                // 您的用户名
    password: 'your_password_here',   // 您的密码
    // ... 其他配置
};
```

2. 编辑 `simple-proxy.js`：
```javascript
const SIMPLE_PROXY_CONFIG = {
    password: 'your_password_here',   // 与上面保持一致
    // ... 其他配置
};
```

**💡 重要提示：** 系统会自动计算密码哈希，您只需要设置明文密码即可，无需手动生成哈希值。

### 2. 部署

现在您可以将整个项目部署到任何支持静态文件的平台：

- **GitHub Pages**：推送到仓库，启用 Pages
- **Netlify**：连接 GitHub 仓库自动部署
- **Vercel**：导入仓库一键部署
- **自托管**：上传到任何 Web 服务器

## 📁 修改的文件

### 新增文件
- `js/auth-config.js` - 认证配置文件
- `simple-proxy.js` - 简化的代理服务
- `static-deploy.html` - 配置助手页面

### 修改的文件
- `index.html` - 移除环境变量，引入固定配置
- `player.html` - 移除环境变量，引入固定配置
- `js/password.js` - 改用固定配置的密码验证
- `js/proxy-auth.js` - 改用固定配置的认证

### 移除的依赖
- ❌ 不再需要环境变量 `PASSWORD`
- ❌ 不再需要服务器端中间件注入
- ❌ 不再需要边缘函数
- ❌ 不再需要平台特定的配置文件

## 🔧 配置选项

### 基本认证配置
```javascript
const AUTH_CONFIG = {
    enabled: true,                    // 是否启用密码保护
    username: 'admin',                // 用户名
    password: 'your_password',        // 密码（系统自动计算哈希）
    sessionDuration: 90 * 24 * 60 * 60 * 1000,  // 90天
    maxLoginAttempts: 5,              // 最大登录尝试次数
    lockoutDuration: 30 * 60 * 1000   // 锁定时间30分钟
};
```

### 代理服务配置
```javascript
const SIMPLE_PROXY_CONFIG = {
    password: 'your_password',        // 代理密码（与认证配置保持一致）
    debug: false,                     // 调试模式
    cacheEnabled: true,               // 启用缓存
    cacheTTL: 86400,                  // 缓存时间(秒)
    maxRecursion: 5,                  // 最大递归层数
    userAgents: [...]                 // User Agent 列表
};
```

## 🌐 部署平台对比

| 平台 | 配置难度 | 功能支持 | 推荐指数 |
|------|----------|----------|----------|
| GitHub Pages | ⭐ | 基础功能 | ⭐⭐⭐ |
| Netlify | ⭐ | 完整功能 | ⭐⭐⭐⭐⭐ |
| Vercel | ⭐ | 完整功能 | ⭐⭐⭐⭐⭐ |
| 自托管 | ⭐⭐ | 完整功能 | ⭐⭐⭐⭐ |

## 🔒 安全注意事项

1. **密码强度**：使用强密码，至少8位包含字母数字
2. **哈希安全**：密码哈希使用 SHA-256 算法
3. **会话管理**：支持会话过期和自动锁定
4. **代码安全**：不在前端明文存储密码
5. **传输安全**：建议使用 HTTPS 访问

## ❌ 删除配置页面

部署完成后，为了安全考虑，请删除以下文件：
- `static-deploy.html`
- `SIMPLE_DEPLOY.md`（本文件）

## 🆘 常见问题

### Q: 忘记密码怎么办？
A: 重新编辑 `js/auth-config.js` 和 `simple-proxy.js` 文件，设置新密码。

### Q: 代理功能不工作？
A: 检查 `simple-proxy.js` 中的密码哈希是否与 `auth-config.js` 一致。

### Q: 如何禁用密码保护？
A: 在 `js/auth-config.js` 中设置 `enabled: false`。

### Q: 可以设置多个用户吗？
A: 当前版本只支持单用户，如需多用户请使用原版环境变量方式。

### Q: 如何更新密码？
A: 修改配置文件中的密码和哈希值，用户需要重新登录。

## 📞 技术支持

如果遇到问题：
1. 检查浏览器控制台是否有错误信息
2. 确认所有配置文件的密码和哈希值一致
3. 验证部署平台是否支持 JavaScript
4. 查看网络请求是否正常

---

🎉 **享受您的 LibreTV 静态部署体验！**