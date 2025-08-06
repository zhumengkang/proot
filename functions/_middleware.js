import { sha256 } from '../js/sha256.js';

// EdgeOne适配版本
export async function onRequest(context) {
  // EdgeOne的上下文结构可能不同，这里做兼容处理
  const { request, env, next } = context;
  
  // 如果EdgeOne使用不同的上下文结构，可能需要调整为：
  // const { request, next } = context;
  // const env = process.env; // 或其他环境变量获取方式
  
  const response = await next();
  const contentType = response.headers.get("content-type") || "";
  
  if (contentType.includes("text/html")) {
    let html = await response.text();
    
    // 处理普通密码 - 适配EdgeOne环境变量
    const password = env?.PASSWORD || process.env.PASSWORD || "";
    let passwordHash = "";
    if (password) {
      passwordHash = await sha256(password);
    }
    html = html.replace('window.__ENV__.PASSWORD = "{{PASSWORD}}";', 
      `window.__ENV__.PASSWORD = "${passwordHash}";`);

    // 处理管理员密码 - 适配EdgeOne环境变量
    const adminPassword = env?.ADMINPASSWORD || process.env.ADMINPASSWORD || "";
    let adminPasswordHash = "";
    if (adminPassword) {
      adminPasswordHash = await sha256(adminPassword);
    }
    html = html.replace('window.__ENV__.ADMINPASSWORD = "{{ADMINPASSWORD}}";',
      `window.__ENV__.ADMINPASSWORD = "${adminPasswordHash}";`);
    
    return new Response(html, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    });
  }
  
  return response;
}

// EdgeOne可能需要不同的导出方式
// 如果上面的export不工作，可能需要：
// module.exports = { onRequest };