# LibreTV 简化版本更新日志

## 🎯 简化版本 (2024-01-XX)

### ✨ 主要变更

**彻底简化部署方式，不再依赖环境变量**

- ❌ **移除**: 所有环境变量依赖 (`PASSWORD` 等)
- ❌ **移除**: 复杂的服务器端中间件
- ❌ **移除**: 平台特定的边缘函数
- ❌ **移除**: 动态环境变量注入

- ✅ **新增**: 固定配置文件方式 (`js/auth-config.js`)
- ✅ **新增**: 简化的代理服务 (`simple-proxy.js`)
- ✅ **新增**: 可视化配置工具 (`static-deploy.html`)
- ✅ **新增**: 配置测试页面 (`test-config.html`)

### 📁 文件变更

#### 新增文件
- `js/auth-config.js` - 固定认证配置
- `simple-proxy.js` - 简化代理服务
- `static-deploy.html` - 部署配置助手
- `test-config.html` - 配置测试工具
- `SIMPLE_DEPLOY.md` - 简化部署指南
- `CHANGELOG_SIMPLE.md` - 本更新日志

#### 修改文件
- `index.html` - 移除环境变量占位符，引入固定配置
- `player.html` - 移除环境变量占位符，引入固定配置
- `js/password.js` - 改用固定配置进行密码验证
- `js/proxy-auth.js` - 改用固定配置进行代理认证
- `README.md` - 添加简化部署说明

#### 删除文件
- `edgeone/` 目录下所有文件
- `edgeone.toml`
- `EDGEONE_DEPLOYMENT.md`
- `PLATFORM_COMPATIBILITY.md`

### 🚀 新部署流程

1. **配置密码**
   - 打开 `static-deploy.html`
   - 输入密码生成配置
   - 复制配置到 `js/auth-config.js` 和 `simple-proxy.js`

2. **直接部署**
   - 上传到任何静态托管服务
   - 无需设置环境变量
   - 无需复杂配置

3. **支持平台**
   - GitHub Pages ✅
   - Netlify ✅  
   - Vercel ✅
   - 自托管服务器 ✅

### 🔧 配置结构

#### 认证配置 (`js/auth-config.js`)
```javascript
const AUTH_CONFIG = {
    enabled: true,
    username: 'admin',
    password: 'your_password',
    passwordHash: 'generated_hash',
    sessionDuration: 90 * 24 * 60 * 60 * 1000,
    maxLoginAttempts: 5,
    lockoutDuration: 30 * 60 * 1000
};
```

#### 代理配置 (`simple-proxy.js`)
```javascript
const SIMPLE_PROXY_CONFIG = {
    password: 'your_password',
    passwordHash: 'generated_hash',
    debug: false,
    cacheEnabled: true,
    cacheTTL: 86400,
    userAgents: [...]
};
```

### 🔒 安全性

- ✅ 密码使用 SHA-256 哈希存储
- ✅ 支持会话管理和自动过期
- ✅ 支持登录尝试限制和锁定
- ✅ 不在前端明文存储密码
- ✅ 支持自定义会话有效期

### 📈 优势

1. **部署简单**: 无需复杂配置，直接上传文件
2. **兼容性好**: 支持所有静态托管平台
3. **维护方便**: 配置集中在少数几个文件中
4. **安全可靠**: 保持原有的安全特性
5. **易于理解**: 去除复杂的环境变量逻辑

### ⚠️ 注意事项

1. **密码配置**: 部署前必须修改默认密码
2. **哈希生成**: 确保密码哈希值正确生成
3. **配置同步**: `auth-config.js` 和 `simple-proxy.js` 中的密码必须一致
4. **安全清理**: 部署后删除 `static-deploy.html` 等配置文件

### 🛠️ 工具支持

- **配置助手**: `static-deploy.html` 提供可视化配置
- **测试工具**: `test-config.html` 验证配置正确性
- **密码生成**: 内置密码哈希生成功能
- **部署指南**: 详细的 `SIMPLE_DEPLOY.md` 文档

### 📦 兼容性

- **浏览器**: 支持现代浏览器 (ES6+)
- **平台**: 支持所有静态托管平台
- **功能**: 保持原有所有核心功能
- **API**: 代理API完全兼容

### 🔄 从环境变量版本迁移

1. 复制现有的 `PASSWORD` 环境变量值
2. 使用配置助手生成新的配置文件
3. 删除平台上的环境变量设置
4. 重新部署简化版本

---

**🎉 现在您可以享受更简单的 LibreTV 部署体验！**