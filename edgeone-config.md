# EdgeOne Pages Functions 配置指南

## 概述

EdgeOne Pages Functions 基于边缘函数实现，提供了 EdgeOne 边缘节点的 Serverless 代码执行环境。支持 ES6 语法和标准的 Web Service Worker API。

## 环境变量配置

### 1. 在EdgeOne Pages控制台设置环境变量

在EdgeOne Pages项目的设置中，添加以下环境变量：

#### 必需的环境变量：
- **PASSWORD**: 普通用户访问密码（字符串）
- **ADMINPASSWORD**: 管理员设置页面访问密码（字符串，可选）

#### 可选的环境变量：
- **DEBUG**: 是否启用调试模式（true/false，默认false）
- **CACHE_TTL**: 缓存时间（秒，默认86400）
- **MAX_RECURSION**: M3U8递归处理层数（默认5）
- **USER_AGENTS_JSON**: User-Agent列表（JSON字符串数组）

### 2. 环境变量设置示例

在EdgeOne Pages控制台的"环境变量"设置中：

```
PASSWORD=your_password_here
ADMINPASSWORD=admin_password_here
DEBUG=false
CACHE_TTL=86400
MAX_RECURSION=5
USER_AGENTS_JSON=["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36","Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"]
```

### 3. 文件配置

#### 选项1: 使用通用中间件（推荐）
使用 `functions/_middleware.js` 文件，该文件已根据EdgeOne Pages Functions官方文档进行适配。

#### 选项2: 使用专用中间件
如果需要特殊的EdgeOne配置，可以使用 `functions/edgeone-middleware.js`

### 4. EventContext 对象结构

根据EdgeOne Pages Functions官方文档，context对象包含以下属性：

```javascript
{
  request: Request,        // 客户端请求对象
  env: Object,            // Pages 环境变量
  params: Object,         // 动态路由参数
  next: Function,         // 下一个处理函数
  waitUntil: Function     // 用于延长事件处理生命周期
}
```

### 5. 环境变量访问方式

EdgeOne Pages Functions支持以下环境变量访问方式：

```javascript
// 方式1: 直接属性访问（推荐）
const password = env.PASSWORD || "";

// 方式2: 方法调用（如果支持）
const password = env.get('PASSWORD') || "";

// 方式3: 通过context对象访问
const password = context.env.PASSWORD || "";
```

### 6. 部署步骤

1. 在EdgeOne Pages控制台创建新项目
2. 连接您的GitHub仓库
3. 在项目设置中添加环境变量：
   - `PASSWORD`: 您的访问密码
   - `ADMINPASSWORD`: 您的管理员密码（可选）
4. 部署项目

### 7. 动态路由支持

EdgeOne Pages Functions支持动态路由：

- 一级动态路径：`/functions/api/users/[id].js`
- 多级动态路径：`/functions/api/[[default]].js`

### 8. Function Handlers

支持以下Handlers方法：

- `onRequest(context)`: 匹配所有HTTP方法
- `onRequestGet(context)`: 匹配GET请求
- `onRequestPost(context)`: 匹配POST请求
- `onRequestPut(context)`: 匹配PUT请求
- `onRequestDelete(context)`: 匹配DELETE请求
- `onRequestPatch(context)`: 匹配PATCH请求
- `onRequestHead(context)`: 匹配HEAD请求
- `onRequestOptions(context)`: 匹配OPTIONS请求

### 9. Runtime APIs

EdgeOne Pages Functions支持以下Runtime APIs：

- **Cache**: 基于Web APIs标准Cache API
- **Cookies**: Cookie操作接口
- **Encoding**: TextEncoder、TextDecoder
- **Fetch**: 基于Web APIs标准Fetch API
- **Headers**: HTTP头部操作
- **Request**: HTTP请求对象
- **Response**: HTTP响应对象
- **ReadableStream**: 可读流
- **Web Crypto**: 加密操作接口
- **Web Standards**: 标准化的Web APIs

### 10. 地理位置功能

EdgeOne Pages Functions支持获取用户地理位置：

```javascript
export function onRequest({request}) {
  const geo = request.eo.geo;
  return new Response(JSON.stringify({geo: geo}), {
    headers: {'content-type': 'application/json'}
  });
}
```

### 11. 故障排除

#### 11.1 密码功能不工作的检查步骤

1. **检查环境变量设置**
   - 访问 `/api/test-env` 查看环境变量是否正确设置
   - 确认变量名大小写正确：`PASSWORD` 和 `ADMINPASSWORD`

2. **检查中间件文件**
   - 确认 `functions/_middleware.js` 文件存在
   - 查看EdgeOne Pages的日志输出

3. **检查HTML占位符**
   - 确认HTML文件中包含 `window.__ENV__.PASSWORD = "{{PASSWORD}}";`
   - 确认HTML文件中包含 `window.__ENV__.ADMINPASSWORD = "{{ADMINPASSWORD}}";`

4. **检查浏览器控制台**
   - 打开浏览器开发者工具
   - 查看Console标签页中的调试信息
   - 检查是否有JavaScript错误

5. **测试环境变量API**
   - 访问 `https://your-domain.edgeone.app/api/test-env`
   - 查看返回的JSON数据，确认环境变量状态

#### 11.2 常见问题

**问题1: 设置了环境变量但密码功能不工作**
- 解决方案：检查EdgeOne Pages的日志，确认中间件是否被调用
- 访问 `/api/test-env` 确认环境变量是否正确读取

**问题2: 密码输入框不显示**
- 解决方案：检查 `js/password.js` 文件是否正确加载
- 确认 `window.__ENV__.PASSWORD` 的值是否正确设置

**问题3: 密码验证失败**
- 解决方案：检查密码哈希是否正确生成
- 确认SHA-256哈希长度是否为64位

**问题4: 代理功能不工作**
- 解决方案：检查 `functions/proxy/[[path]].js` 文件是否存在
- 确认环境变量 `DEBUG` 是否设置为 `true` 以查看调试信息

### 12. 测试

部署后，访问您的EdgeOne Pages域名，应该会看到密码输入框（如果设置了密码）。

访问 `/api/geo` 可以测试地理位置功能。
访问 `/api/test-env` 可以测试环境变量设置。

### 13. 密码设置说明

#### 13.1 基本密码设置
在EdgeOne Pages控制台中，您需要设置以下环境变量：

```
PASSWORD=your_password_here
```

这将在网站首页显示密码输入框，用户需要输入正确的密码才能访问内容。

#### 13.2 管理员密码设置
如果您需要管理员功能，可以额外设置：

```
ADMINPASSWORD=admin_password_here
```

这将启用管理员设置页面，管理员可以配置更多选项。

#### 13.3 密码安全
- 密码会使用SHA-256进行哈希处理
- 建议使用强密码（包含字母、数字、特殊字符）
- 不要在代码中硬编码密码，始终使用环境变量

#### 13.4 密码验证流程
1. 用户在浏览器中输入密码
2. 前端JavaScript对密码进行SHA-256哈希
3. 将哈希值与服务器注入的哈希值进行比较
4. 如果匹配，则允许访问；否则显示错误信息

## 注意事项

- EdgeOne Pages Functions基于V8 JavaScript引擎设计
- 支持ES6语法和标准Web APIs
- 不支持使用addEventListener，请基于Function Handlers监听客户端请求
- 当前EdgeOne CLI调试环境中不支持使用fetch访问EdgeOne节点缓存或回源
- 确保环境变量名称大小写正确
- 密码会使用SHA-256进行哈希处理
- 如果问题持续存在，请查看EdgeOne Pages的官方文档或联系技术支持 