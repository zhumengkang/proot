import { sha256 } from '../js/sha256.js';

// EdgeOne Pages Functions 适配版本
export async function onRequest(context) {
  const { request, env } = context;
  
  // EdgeOne 支持类似的中间件处理方式
  // 但需要手动处理静态文件的响应
  
  // 如果是静态资源请求，直接返回
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // 检查是否是HTML页面请求
  const isHtmlRequest = 
    pathname === '/' || 
    pathname.endsWith('.html') || 
    (!pathname.includes('.') && !pathname.startsWith('/api/') && !pathname.startsWith('/proxy/'));
  
  if (!isHtmlRequest) {
    // 非HTML请求，让其他handler处理
    return new Response('Not Found', { status: 404 });
  }
  
  // 获取HTML内容 - 这里需要根据实际情况调整
  // EdgeOne可能需要不同的方式来获取静态HTML文件
  let html = '';
  try {
    // 尝试获取静态HTML文件
    // 注意：这里可能需要根据EdgeOne的具体实现调整
    const htmlResponse = await fetch(`${url.origin}${pathname}`, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('User-Agent') || 'EdgeOne-Function'
      }
    });
    
    if (htmlResponse.ok) {
      html = await htmlResponse.text();
    } else {
      // 如果获取失败，返回基本的HTML模板
      html = `<!DOCTYPE html>
<html>
<head>
  <title>LibreTV</title>
</head>
<body>
  <script>
    window.__ENV__ = {};
    window.__ENV__.PASSWORD = "{{PASSWORD}}";
    window.__ENV__.ADMINPASSWORD = "{{ADMINPASSWORD}}";
  </script>
</body>
</html>`;
    }
  } catch (error) {
    // 如果发生错误，使用基本模板
    html = `<!DOCTYPE html>
<html>
<head>
  <title>LibreTV</title>
</head>
<body>
  <script>
    window.__ENV__ = {};
    window.__ENV__.PASSWORD = "{{PASSWORD}}";
    window.__ENV__.ADMINPASSWORD = "{{ADMINPASSWORD}}";
  </script>
</body>
</html>`;
  }
  
  // 处理普通密码
  const password = env.PASSWORD || "";
  let passwordHash = "";
  if (password) {
    passwordHash = await sha256(password);
  }
  html = html.replace('window.__ENV__.PASSWORD = "{{PASSWORD}}";', 
    `window.__ENV__.PASSWORD = "${passwordHash}";`);

  // 处理管理员密码
  const adminPassword = env.ADMINPASSWORD || "";
  let adminPasswordHash = "";
  if (adminPassword) {
    adminPasswordHash = await sha256(adminPassword);
  }
  html = html.replace('window.__ENV__.ADMINPASSWORD = "{{ADMINPASSWORD}}";',
    `window.__ENV__.ADMINPASSWORD = "${adminPasswordHash}";`);
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    },
    status: 200
  });
}
