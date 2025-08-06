// 简化的代理服务 - 自动从主配置同步

// 从主配置获取配置
let SIMPLE_PROXY_CONFIG = null;

// 加载主配置
async function loadProxyConfig() {
    try {
        // 尝试从window.MASTER_CONFIG获取（浏览器环境）
        if (typeof window !== 'undefined' && window.MASTER_CONFIG) {
            SIMPLE_PROXY_CONFIG = {
                password: window.MASTER_CONFIG.auth.password,
                debug: window.MASTER_CONFIG.proxy.debug,
                cacheEnabled: window.MASTER_CONFIG.proxy.cacheEnabled,
                cacheTTL: window.MASTER_CONFIG.proxy.cacheTTL,
                maxRecursion: window.MASTER_CONFIG.proxy.maxRecursion,
                userAgents: window.MASTER_CONFIG.proxy.userAgents
            };
        } else {
            // 默认配置（如果无法加载主配置）
            SIMPLE_PROXY_CONFIG = {
                password: '123qwe!@#QWE',
                debug: false,
                cacheEnabled: true,
                cacheTTL: 86400,
                maxRecursion: 5,
                userAgents: [
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
                    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                ]
            };
        }
    } catch (error) {
        console.error('❌ 无法加载主配置，使用默认配置:', error);
        // 使用默认配置
        SIMPLE_PROXY_CONFIG = {
            password: '123qwe!@#QWE',
            debug: false,
            cacheEnabled: true,
            cacheTTL: 86400,
            maxRecursion: 5,
            userAgents: [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        };
    }
}

// 立即加载配置
loadProxyConfig();

// 自动生成密码哈希
async function generatePasswordHash(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 初始化密码哈希
let passwordHashPromise = null;
async function getPasswordHash() {
    // 确保配置已加载
    if (!SIMPLE_PROXY_CONFIG) {
        await loadProxyConfig();
    }
    
    if (!passwordHashPromise && SIMPLE_PROXY_CONFIG?.password) {
        passwordHashPromise = generatePasswordHash(SIMPLE_PROXY_CONFIG.password);
    }
    return await passwordHashPromise;
}

// 工具函数
function logDebug(message) {
    if (SIMPLE_PROXY_CONFIG?.debug) {
        console.log(`[简化代理] ${message}`);
    }
}

function getRandomUserAgent() {
    const agents = SIMPLE_PROXY_CONFIG?.userAgents || ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'];
    return agents[Math.floor(Math.random() * agents.length)];
}

function createErrorResponse(message, status = 400) {
    return new Response(JSON.stringify({ 
        error: message,
        timestamp: new Date().toISOString(),
        service: 'Simple Proxy'
    }), {
        status: status,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

// 密码验证函数
async function validatePassword(request) {
    // 获取密码哈希
    const serverPasswordHash = await getPasswordHash();
    
    // 如果未设置密码，则不需要验证
    if (!serverPasswordHash) {
        return true;
    }
    
    const url = new URL(request.url);
    
    // 优先检查URL参数中的认证信息（与现有前端代码兼容）
    const authHash = url.searchParams.get('auth');
    const timestamp = url.searchParams.get('t');
    
    if (authHash) {
        // 验证密码哈希
        if (authHash !== serverPasswordHash) {
            logDebug('URL参数密码验证失败：哈希不匹配');
            return false;
        }
        
        // 验证时间戳（10分钟有效期）
        if (timestamp) {
            const now = Date.now();
            const maxAge = 10 * 60 * 1000; // 10分钟
            if (now - parseInt(timestamp) > maxAge) {
                logDebug('URL参数密码验证失败：时间戳过期');
                return false;
            }
        }
        
        logDebug('URL参数密码验证成功');
        return true;
    }
    
    // 如果没有URL参数，则检查Header（备用方式）
    const clientPasswordHash = request.headers.get('X-Password-Hash');
    if (clientPasswordHash) {
        const isValid = clientPasswordHash === serverPasswordHash;
        logDebug(`Header密码验证结果: ${isValid ? '通过' : '失败'}`);
        return isValid;
    }
    
    logDebug('请求中缺少认证信息');
    return false;
}

// 提取目标URL
function getTargetUrlFromPath(pathname) {
    try {
        // 移除开头的 /proxy/
        const pathWithoutPrefix = pathname.replace(/^\/proxy\//, '');
        
        // 解码路径
        const decodedPath = decodeURIComponent(pathWithoutPrefix);
        
        // 验证URL格式
        if (!decodedPath.startsWith('http://') && !decodedPath.startsWith('https://')) {
            throw new Error('目标URL必须以http://或https://开头');
        }
        
        // 验证URL的有效性
        new URL(decodedPath);
        
        logDebug(`提取的目标URL: ${decodedPath}`);
        return decodedPath;
    } catch (error) {
        console.error(`[简化代理] 提取目标URL时出错: ${error.message}`);
        return null;
    }
}

// 主要的代理处理函数
export default async function simpleProxyHandler(request) {
    try {
        const url = new URL(request.url);
        
        // 处理OPTIONS预检请求
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, X-Password-Hash',
                    'Access-Control-Max-Age': '86400'
                }
            });
        }
        
        // 验证请求方法
        if (!['GET', 'POST', 'HEAD'].includes(request.method)) {
            return createErrorResponse('不支持的请求方法', 405);
        }
        
        // 验证密码
        const isPasswordValid = await validatePassword(request);
        if (!isPasswordValid) {
            return createErrorResponse('密码验证失败', 401);
        }
        
        // 提取目标URL
        const targetUrl = getTargetUrlFromPath(url.pathname);
        if (!targetUrl) {
            return createErrorResponse('无效的目标URL');
        }
        
        logDebug(`开始代理请求: ${targetUrl}`);
        
        // 构建代理请求headers
        const proxyHeaders = new Headers();
        
        // 复制原始请求的headers，但排除一些不应该转发的
        const excludeHeaders = ['host', 'x-password-hash', 'x-forwarded-for', 'x-real-ip'];
        for (const [key, value] of request.headers.entries()) {
            if (!excludeHeaders.includes(key.toLowerCase())) {
                proxyHeaders.set(key, value);
            }
        }
        
        // 设置随机User Agent
        proxyHeaders.set('User-Agent', getRandomUserAgent());
        
        // 设置Referer
        try {
            const targetUrlObj = new URL(targetUrl);
            proxyHeaders.set('Referer', targetUrlObj.origin);
        } catch (e) {
            // 忽略Referer设置错误
        }
        
        // 发起代理请求
        const proxyRequest = new Request(targetUrl, {
            method: request.method,
            headers: proxyHeaders,
            body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
        });
        
        const response = await fetch(proxyRequest);
        logDebug(`代理响应状态: ${response.status}`);
        
        // 构建响应headers
        const responseHeaders = new Headers();
        
        // 复制响应headers，但排除一些不应该返回的
        const excludeResponseHeaders = ['set-cookie', 'server', 'x-powered-by'];
        for (const [key, value] of response.headers.entries()) {
            if (!excludeResponseHeaders.includes(key.toLowerCase())) {
                responseHeaders.set(key, value);
            }
        }
        
        // 设置CORS头
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
        responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, X-Password-Hash');
        
        // 设置缓存头
        if (response.ok && request.method === 'GET' && SIMPLE_PROXY_CONFIG.cacheEnabled) {
            responseHeaders.set('Cache-Control', `public, max-age=${SIMPLE_PROXY_CONFIG.cacheTTL}`);
        }
        
        // 添加自定义头标识服务
        responseHeaders.set('X-Proxy-Service', 'Simple Proxy');
        
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders
        });
        
    } catch (error) {
        console.error(`[简化代理] 处理请求时出错: ${error.message}`);
        return createErrorResponse('代理服务内部错误', 500);
    }
}

// 导出配置供其他模块使用
export { SIMPLE_PROXY_CONFIG };