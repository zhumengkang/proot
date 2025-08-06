# EdgeOne Pages Functions 部署指南

## 快速开始

### 1. 创建EdgeOne Pages项目

1. 访问 [EdgeOne控制台](https://console.edgeone.com/)
2. 创建新的Pages项目
3. 连接您的GitHub仓库（包含LibreTV代码）

### 2. 设置环境变量

在EdgeOne Pages项目设置中，添加以下环境变量：

#### 必需变量：
```
PASSWORD=your_password_here
```

#### 可选变量：
```
ADMINPASSWORD=admin_password_here
DEBUG=false
CACHE_TTL=86400
MAX_RECURSION=5
USER_AGENTS_JSON=["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"]
```

### 3. 部署

1. 提交代码到GitHub
2. EdgeOne会自动检测并部署
3. 等待部署完成

### 4. 测试

访问以下URL测试功能：

- 主页面：`https://your-domain.edgeone.app/`
- 环境变量测试：`https://your-domain.edgeone.app/api/test-env`
- 地理位置测试：`https://your-domain.edgeone.app/api/geo`

## 环境变量说明

### PASSWORD
- **类型**: 字符串
- **必需**: 是
- **说明**: 网站访问密码，用户需要输入此密码才能访问内容
- **示例**: `PASSWORD=mypassword123`

### ADMINPASSWORD
- **类型**: 字符串
- **必需**: 否
- **说明**: 管理员密码，用于访问管理员设置页面
- **示例**: `ADMINPASSWORD=admin123`

### DEBUG
- **类型**: 布尔值
- **必需**: 否
- **默认值**: false
- **说明**: 是否启用调试模式，启用后会输出详细日志
- **示例**: `DEBUG=true`

### CACHE_TTL
- **类型**: 数字
- **必需**: 否
- **默认值**: 86400
- **说明**: 缓存时间（秒），24小时 = 86400秒
- **示例**: `CACHE_TTL=3600`

### MAX_RECURSION
- **类型**: 数字
- **必需**: 否
- **默认值**: 5
- **说明**: M3U8播放列表递归处理的最大层数
- **示例**: `MAX_RECURSION=3`

### USER_AGENTS_JSON
- **类型**: JSON字符串数组
- **必需**: 否
- **说明**: 代理请求时使用的User-Agent列表
- **示例**: `USER_AGENTS_JSON=["UA1","UA2"]`

## 文件结构

```
LibreTV/
├── functions/
│   ├── _middleware.js          # 主中间件（处理密码）
│   ├── edgeone-middleware.js   # EdgeOne专用中间件
│   ├── proxy/
│   │   └── [[path]].js        # 代理功能
│   └── api/
│       ├── geo.js             # 地理位置API
│       └── test-env.js        # 环境变量测试API
├── js/
│   └── sha256.js              # SHA-256哈希函数
└── edgeone-config.md          # 详细配置文档
```

## 故障排除

### 密码功能不工作

1. **检查环境变量**
   - 访问 `/api/test-env` 查看环境变量状态
   - 确认 `PASSWORD` 变量已正确设置

2. **检查中间件**
   - 确认 `functions/_middleware.js` 文件存在
   - 查看EdgeOne Pages的日志输出

3. **检查HTML占位符**
   - 确认HTML文件包含密码占位符
   - 检查浏览器控制台是否有错误

### 代理功能不工作

1. **检查代理文件**
   - 确认 `functions/proxy/[[path]].js` 文件存在
   - 设置 `DEBUG=true` 查看详细日志

2. **检查CORS设置**
   - 确认代理响应包含正确的CORS头
   - 检查浏览器网络面板中的错误

### 部署失败

1. **检查代码语法**
   - 确认所有JavaScript文件语法正确
   - 检查ES6语法兼容性

2. **检查文件路径**
   - 确认所有import路径正确
   - 检查文件名大小写

## 性能优化

### 1. 缓存设置
- 设置合适的 `CACHE_TTL` 值
- 避免频繁的代理请求

### 2. 调试模式
- 生产环境设置 `DEBUG=false`
- 仅在需要时启用调试

### 3. User-Agent轮换
- 设置多个User-Agent避免被限制
- 使用 `USER_AGENTS_JSON` 环境变量

## 安全建议

1. **密码安全**
   - 使用强密码（字母+数字+特殊字符）
   - 定期更换密码
   - 不要在代码中硬编码密码

2. **环境变量**
   - 不要在公开仓库中提交环境变量
   - 使用EdgeOne的环境变量功能

3. **访问控制**
   - 考虑使用管理员密码保护设置页面
   - 监控访问日志

## 联系支持

如果遇到问题：

1. 查看EdgeOne Pages的官方文档
2. 检查项目日志
3. 联系EdgeOne技术支持
4. 在GitHub上提交Issue

## 更新日志

### v1.0.0
- 初始EdgeOne Pages Functions适配
- 支持密码保护功能
- 支持M3U8代理功能
- 支持地理位置API 