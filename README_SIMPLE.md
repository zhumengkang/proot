# 🎯 LibreTV 统一配置版本

## ✨ 核心特色

**一个文件控制全部** - 只需修改 `config/master-config.js`，所有其他文件自动同步！

## 🚀 快速开始

### 1. 唯一配置文件

编辑 `config/master-config.js`：

```javascript
const MASTER_CONFIG = {
    // 🔐 认证配置
    auth: {
        username: 'admin',              
        password: 'your_password_here', // 🔥 只需在这里修改密码
        enabled: true,
        // ...
    },
    
    // 🌐 代理配置  
    proxy: {
        debug: false,
        cacheEnabled: true,
        // ...
    }
};
```

### 2. 部署到任意平台

- ✅ GitHub Pages
- ✅ Netlify
- ✅ Vercel
- ✅ Cloudflare Pages  
- ✅ 自托管服务器

### 3. 完成 🎉

所有代理文件会自动从主配置读取密码，无需手动同步！

## 📋 自动同步的文件

| 文件 | 说明 | 同步方式 |
|------|------|----------|
| `js/auth-config.js` | 前端认证 | 🔄 自动同步 |
| `simple-proxy.js` | 简化代理 | 🔄 自动同步 |
| `netlify/functions/proxy.mjs` | Netlify代理 | 🔄 自动同步 |
| `api/proxy/[...path].mjs` | Vercel代理 | 🔄 自动同步 |
| `functions/proxy/[[path]].js` | Cloudflare代理 | 🔄 自动同步 |
| `server.mjs` | 自托管服务器 | 🔄 自动同步 |

## 🛠️ 工作原理

```
config/master-config.js (主配置)
         ↓
    ┌────┴────┐
    ↓         ↓
浏览器环境   Node.js环境
    ↓         ↓
前端文件   服务端代理
```

- **浏览器环境**：通过 `<script>` 标签直接加载
- **Node.js环境**：通过 `config-loader.mjs` 加载和解析

## 🔧 配置选项

### 认证配置
```javascript
auth: {
    username: 'admin',           // 用户名
    password: 'your_password',   // 密码
    enabled: true,               // 是否启用
    sessionDuration: 90天,        // 会话时长
    maxLoginAttempts: 5,         // 最大尝试次数
    lockoutDuration: 30分钟       // 锁定时间
}
```

### 代理配置
```javascript
proxy: {
    debug: false,               // 调试模式
    cacheEnabled: true,         // 启用缓存
    cacheTTL: 86400,           // 缓存时间
    maxRecursion: 5,           // 最大递归
    timeout: 10000,            // 超时时间
    userAgents: [...]          // User Agent列表
}
```

## 🎯 优势对比

| 特性 | 传统方式 | 统一配置方式 |
|------|----------|-------------|
| 配置文件数量 | 6+ | 1 |
| 密码同步 | 手动 | 自动 |
| 维护难度 | 困难 | 简单 |
| 出错风险 | 高 | 低 |
| 部署复杂度 | 复杂 | 简单 |

## ❓ 常见问题

**Q: 修改密码后需要重启吗？**
A: 不需要，刷新页面即可

**Q: 支持哪些平台？**
A: 支持所有静态托管平台

**Q: 如何调试？**  
A: 设置 `proxy.debug: true` 即可

**Q: 配置文件损坏怎么办？**
A: 系统会自动使用默认配置作为后备

---

🎉 **享受一键配置的便捷体验！**