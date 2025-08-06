// EdgeOne Pages Functions 适配版 - functions/proxy/[[path]].js

// --- 常量定义 ---
const MEDIA_FILE_EXTENSIONS = [
    '.mp4', '.webm', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.f4v', '.m4v', '.3gp', '.3g2', '.ts', '.mts', '.m2ts',
    '.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac', '.wma', '.alac', '.aiff', '.opus',
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg', '.avif', '.heic'
];
const MEDIA_CONTENT_TYPES = ['video/', 'audio/', 'image/'];

/**
 * EdgeOne Pages Functions 主处理函数
 * 符合 EdgeOne 标准的函数签名
 */
export async function onRequest(context) {
    const { request, env, params, waitUntil } = context;
    const url = new URL(request.url);

    // --- 从环境变量读取配置 ---
    const DEBUG_ENABLED = (env.DEBUG === 'true');
    const CACHE_TTL = parseInt(env.CACHE_TTL || '86400');
    const MAX_RECURSION = parseInt(env.MAX_RECURSION || '5');
    
    let USER_AGENTS = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    try {
        const agentsJson = env.USER_AGENTS_JSON;
        if (agentsJson) {
            const parsedAgents = JSON.parse(agentsJson);
            if (Array.isArray(parsedAgents) && parsedAgents.length > 0) {
                USER_AGENTS = parsedAgents;
            } else {
                logDebug("环境变量 USER_AGENTS_JSON 格式无效或为空，使用默认值");
            }
        }
    } catch (e) {
        logDebug(`解析环境变量 USER_AGENTS_JSON 失败: ${e.message}，使用默认值`);
    }

    // --- 辅助函数 ---
    function logDebug(message) {
        if (DEBUG_ENABLED) {
            console.log(`[EdgeOne Proxy] ${message}`);
        }
    }

    function getTargetUrlFromPath(pathname) {
        // EdgeOne 的动态路由参数在 context.params 中
        // 路径格式: /proxy/path (使用 [[path]].js 捕获所有路径)
        const pathParam = params.path;
        if (!pathParam || !Array.isArray(pathParam) || pathParam.length === 0) {
            return null;
        }
        
        // 重建完整路径
        const encodedUrl = pathParam.join('/');
        if (!encodedUrl) return null;
        
        try {
            let decodedUrl = decodeURIComponent(encodedUrl);
            if (!decodedUrl.match(/^https?:\/\//i)) {
                if (encodedUrl.match(/^https?:\/\//i)) {
                    decodedUrl = encodedUrl;
                    logDebug(`Warning: Path was not encoded but looks like URL: ${decodedUrl}`);
                } else {
                   logDebug(`无效的目标URL格式 (解码后): ${decodedUrl}`);
                   return null;
                }
            }
            return decodedUrl;
        } catch (e) {
            logDebug(`解码目标URL时出错: ${encodedUrl} - ${e.message}`);
            return null;
        }
    }

    function createResponse(body, status = 200, headers = {}) {
        const responseHeaders = new Headers(headers);
        responseHeaders.set("Access-Control-Allow-Origin", "*");
        responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
        responseHeaders.set("Access-Control-Allow-Headers", "*");

        return new Response(body, { status, headers: responseHeaders });
    }

    function createM3u8Response(content) {
        return createResponse(content, 200, {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": `public, max-age=${CACHE_TTL}`
        });
    }

    function getRandomUserAgent() {
        return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    }

    function getBaseUrl(urlStr) {
        try {
            const parsedUrl = new URL(urlStr);
            if (!parsedUrl.pathname || parsedUrl.pathname === '/') {
                return `${parsedUrl.origin}/`;
            }
            const pathParts = parsedUrl.pathname.split('/');
            pathParts.pop();
            return `${parsedUrl.origin}${pathParts.join('/')}/`;
        } catch (e) {
            logDebug(`获取 BaseUrl 时出错: ${urlStr} - ${e.message}`);
            const lastSlashIndex = urlStr.lastIndexOf('/');
            return lastSlashIndex > urlStr.indexOf('://') + 2 ? urlStr.substring(0, lastSlashIndex + 1) : urlStr + '/';
        }
    }

    function resolveUrl(baseUrl, relativeUrl) {
        if (relativeUrl.match(/^https?:\/\//i)) {
            return relativeUrl;
        }
        try {
            return new URL(relativeUrl, baseUrl).toString();
        } catch (e) {
            logDebug(`解析 URL 失败: baseUrl=${baseUrl}, relativeUrl=${relativeUrl}, error=${e.message}`);
            if (relativeUrl.startsWith('/')) {
                const urlObj = new URL(baseUrl);
                return `${urlObj.origin}${relativeUrl}`;
            }
            return `${baseUrl.replace(/\/[^/]*$/, '/')}${relativeUrl}`;
        }
    }

    function rewriteUrlToProxy(targetUrl) {
        return `/proxy/${encodeURIComponent(targetUrl)}`;
    }

    async function fetchContentWithType(targetUrl) {
        const headers = new Headers({
            'User-Agent': getRandomUserAgent(),
            'Accept': '*/*',
            'Accept-Language': request.headers.get('Accept-Language') || 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': request.headers.get('Referer') || new URL(targetUrl).origin
        });

        try {
            logDebug(`开始直接请求: ${targetUrl}`);
            const response = await fetch(targetUrl, { headers, redirect: 'follow' });

            if (!response.ok) {
                const errorBody = await response.text().catch(() => '');
                logDebug(`请求失败: ${response.status} ${response.statusText} - ${targetUrl}`);
                throw new Error(`HTTP error ${response.status}: ${response.statusText}. URL: ${targetUrl}. Body: ${errorBody.substring(0, 150)}`);
            }

            const content = await response.text();
            const contentType = response.headers.get('Content-Type') || '';
            logDebug(`请求成功: ${targetUrl}, Content-Type: ${contentType}, 内容长度: ${content.length}`);
            return { content, contentType, responseHeaders: response.headers };

        } catch (error) {
            logDebug(`请求彻底失败: ${targetUrl}: ${error.message}`);
            throw new Error(`请求目标URL失败 ${targetUrl}: ${error.message}`);
        }
    }

    function isM3u8Content(content, contentType) {
        if (contentType && (contentType.includes('application/vnd.apple.mpegurl') || contentType.includes('application/x-mpegurl') || contentType.includes('audio/mpegurl'))) {
            return true;
        }
        return content && typeof content === 'string' && content.trim().startsWith('#EXTM3U');
    }

    function processKeyLine(line, baseUrl) {
        return line.replace(/URI="([^"]+)"/, (match, uri) => {
            const absoluteUri = resolveUrl(baseUrl, uri);
            logDebug(`处理 KEY URI: 原始='${uri}', 绝对='${absoluteUri}'`);
            return `URI="${rewriteUrlToProxy(absoluteUri)}"`;
        });
    }

    function processMapLine(line, baseUrl) {
        return line.replace(/URI="([^"]+)"/, (match, uri) => {
            const absoluteUri = resolveUrl(baseUrl, uri);
            logDebug(`处理 MAP URI: 原始='${uri}', 绝对='${absoluteUri}'`);
            return `URI="${rewriteUrlToProxy(absoluteUri)}"`;
        });
    }

    function processMediaPlaylist(url, content) {
        const baseUrl = getBaseUrl(url);
        const lines = content.split('\n');
        const output = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line && i === lines.length - 1) {
                output.push(line);
                continue;
            }
            if (!line) continue;

            if (line.startsWith('#EXT-X-KEY')) {
                output.push(processKeyLine(line, baseUrl));
                continue;
            }
            if (line.startsWith('#EXT-X-MAP')) {
                output.push(processMapLine(line, baseUrl));
                continue;
            }
            if (line.startsWith('#EXTINF')) {
                output.push(line);
                continue;
            }
            if (!line.startsWith('#')) {
                const absoluteUrl = resolveUrl(baseUrl, line);
                logDebug(`重写媒体片段: 原始='${line}', 绝对='${absoluteUrl}'`);
                output.push(rewriteUrlToProxy(absoluteUrl));
                continue;
            }
            output.push(line);
        }
        return output.join('\n');
    }

    // EdgeOne KV 存储操作
    async function getFromCache(key) {
        try {
            // 使用绑定的 KV 命名空间 - 需要在 EdgeOne 控制台绑定
            // 假设绑定的变量名为 LIBRETV_CACHE
            const kvNamespace = env.LIBRETV_CACHE;
            if (!kvNamespace) {
                logDebug('KV 命名空间 LIBRETV_CACHE 未绑定');
                return null;
            }
            
            const cachedData = await kvNamespace.get(key);
            logDebug(`KV 读取 ${key}: ${cachedData ? '命中' : '未命中'}`);
            return cachedData;
        } catch (e) {
            logDebug(`KV 读取失败 ${key}: ${e.message}`);
            return null;
        }
    }

    async function setCache(key, value, ttl) {
        try {
            const kvNamespace = env.LIBRETV_CACHE;
            if (!kvNamespace) {
                logDebug('KV 命名空间 LIBRETV_CACHE 未绑定，跳过缓存写入');
                return;
            }
            
            // EdgeOne KV put 方法
            await kvNamespace.put(key, value, { 
                expirationTtl: ttl 
            });
            logDebug(`KV 写入成功: ${key}`);
        } catch (e) {
            logDebug(`KV 写入失败 ${key}: ${e.message}`);
        }
    }

    async function processM3u8Content(targetUrl, content, recursionDepth = 0) {
        if (content.includes('#EXT-X-STREAM-INF') || content.includes('#EXT-X-MEDIA:')) {
            logDebug(`检测到主播放列表: ${targetUrl}`);
            return await processMasterPlaylist(targetUrl, content, recursionDepth);
        }
        logDebug(`检测到媒体播放列表: ${targetUrl}`);
        return processMediaPlaylist(targetUrl, content);
    }

    async function processMasterPlaylist(url, content, recursionDepth) {
        if (recursionDepth > MAX_RECURSION) {
            throw new Error(`处理主列表时递归层数过多 (${MAX_RECURSION}): ${url}`);
        }

        const baseUrl = getBaseUrl(url);
        const lines = content.split('\n');
        let highestBandwidth = -1;
        let bestVariantUrl = '';

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('#EXT-X-STREAM-INF')) {
                const bandwidthMatch = lines[i].match(/BANDWIDTH=(\d+)/);
                const currentBandwidth = bandwidthMatch ? parseInt(bandwidthMatch[1], 10) : 0;

                let variantUriLine = '';
                for (let j = i + 1; j < lines.length; j++) {
                    const line = lines[j].trim();
                    if (line && !line.startsWith('#')) {
                        variantUriLine = line;
                        i = j;
                        break;
                    }
                }

                if (variantUriLine && currentBandwidth >= highestBandwidth) {
                    highestBandwidth = currentBandwidth;
                    bestVariantUrl = resolveUrl(baseUrl, variantUriLine);
                }
            }
        }

        if (!bestVariantUrl) {
            logDebug(`主列表中未找到 BANDWIDTH 或 STREAM-INF，尝试查找第一个子列表引用: ${url}`);
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line && !line.startsWith('#') && (line.endsWith('.m3u8') || line.includes('.m3u8?'))) {
                   bestVariantUrl = resolveUrl(baseUrl, line);
                    logDebug(`备选方案：找到第一个子列表引用: ${bestVariantUrl}`);
                    break;
                }
            }
        }

        if (!bestVariantUrl) {
            logDebug(`在主列表 ${url} 中未找到任何有效的子播放列表 URL。将尝试按媒体列表处理原始内容。`);
            return processMediaPlaylist(url, content);
        }

        // 缓存检查
        const cacheKey = `m3u8_processed:${bestVariantUrl}`;
        const cachedContent = await getFromCache(cacheKey);
        if (cachedContent) {
            logDebug(`[缓存命中] 主列表的子列表: ${bestVariantUrl}`);
            return cachedContent;
        }

        logDebug(`选择的子列表 (带宽: ${highestBandwidth}): ${bestVariantUrl}`);
        const { content: variantContent, contentType: variantContentType } = await fetchContentWithType(bestVariantUrl);

        if (!isM3u8Content(variantContent, variantContentType)) {
            logDebug(`获取到的子列表 ${bestVariantUrl} 不是 M3U8 内容 (类型: ${variantContentType})。`);
            return processMediaPlaylist(bestVariantUrl, variantContent);
        }

        const processedVariant = await processM3u8Content(bestVariantUrl, variantContent, recursionDepth + 1);

        // 使用 waitUntil 异步缓存写入 (EdgeOne 支持)
        if (waitUntil) {
            waitUntil(setCache(cacheKey, processedVariant, CACHE_TTL));
            logDebug(`已安排将处理后的子列表写入缓存: ${bestVariantUrl}`);
        } else {
            // 如果没有 waitUntil，直接异步写入
            setCache(cacheKey, processedVariant, CACHE_TTL).catch(e => 
                logDebug(`缓存写入失败: ${e.message}`)
            );
        }

        return processedVariant;
    }

    // --- 主要请求处理逻辑 ---
    try {
        const targetUrl = getTargetUrlFromPath(url.pathname);

        if (!targetUrl) {
            logDebug(`无效的代理请求路径: ${url.pathname}`);
            return createResponse("无效的代理请求。路径应为 /proxy/<经过编码的URL>", 400);
        }

        logDebug(`收到代理请求: ${targetUrl}`);

        // 缓存检查
        const cacheKey = `proxy_raw:${targetUrl}`;
        const cachedDataJson = await getFromCache(cacheKey);
        
        if (cachedDataJson) {
            logDebug(`[缓存命中] 原始内容: ${targetUrl}`);
            try {
                const cachedData = JSON.parse(cachedDataJson);
                const content = cachedData.body;
                const headers = JSON.parse(cachedData.headers || '{}');
                const contentType = headers['content-type'] || headers['Content-Type'] || '';

                if (isM3u8Content(content, contentType)) {
                    logDebug(`缓存内容是 M3U8，重新处理: ${targetUrl}`);
                    const processedM3u8 = await processM3u8Content(targetUrl, content, 0);
                    return createM3u8Response(processedM3u8);
                } else {
                    logDebug(`从缓存返回非 M3U8 内容: ${targetUrl}`);
                    return createResponse(content, 200, new Headers(headers));
                }
            } catch (e) {
                logDebug(`解析缓存数据失败: ${e.message}`);
            }
        }

        // 实际请求
        const { content, contentType, responseHeaders } = await fetchContentWithType(targetUrl);

        // 写入缓存
        try {
            const headersToCache = {};
            responseHeaders.forEach((value, key) => { headersToCache[key.toLowerCase()] = value; });
            const cacheValue = { body: content, headers: JSON.stringify(headersToCache) };
            
            if (waitUntil) {
                waitUntil(setCache(cacheKey, JSON.stringify(cacheValue), CACHE_TTL));
                logDebug(`已安排将原始内容写入缓存: ${targetUrl}`);
            } else {
                setCache(cacheKey, JSON.stringify(cacheValue), CACHE_TTL).catch(e => 
                    logDebug(`缓存写入失败: ${e.message}`)
                );
            }
        } catch (e) {
            logDebug(`准备缓存数据失败: ${e.message}`);
        }

        // 处理响应
        if (isM3u8Content(content, contentType)) {
            logDebug(`内容是 M3U8，开始处理: ${targetUrl}`);
            const processedM3u8 = await processM3u8Content(targetUrl, content, 0);
            return createM3u8Response(processedM3u8);
        } else {
            logDebug(`内容不是 M3U8 (类型: ${contentType})，直接返回: ${targetUrl}`);
            const finalHeaders = new Headers(responseHeaders);
            finalHeaders.set('Cache-Control', `public, max-age=${CACHE_TTL}`);
            finalHeaders.set("Access-Control-Allow-Origin", "*");
            finalHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
            finalHeaders.set("Access-Control-Allow-Headers", "*");
            return createResponse(content, 200, finalHeaders);
        }

    } catch (error) {
        logDebug(`处理代理请求时发生严重错误: ${error.message} \n ${error.stack}`);
        return createResponse(`代理处理错误: ${error.message}`, 500);
    }
}

// EdgeOne 的 OPTIONS 处理
export async function onRequestOptions(context) {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "86400",
        },
    });
}
