import type { Context } from "https://edge.netlify.com";

const BACKEND_URL = "http://3.209.80.206";
const ALLOWED_ORIGIN_REGEX =
  /^https:\/\/([a-zA-Z0-9-]+\.)?(netlify\.app|myshopify\.com|shopifypreview\.com)$/;

function buildCorsHeaders(origin: string | null): Headers {
  const headers = new Headers();
  if (origin && ALLOWED_ORIGIN_REGEX.test(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "600");
  headers.set("Vary", "Origin");
  return headers;
}

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return new Response("OK", {
      status: 200,
      headers: buildCorsHeaders(origin),
    });
  }
  
  // Build the backend URL
  const backendPath = url.pathname + url.search;
  const backendUrl = BACKEND_URL + backendPath;
  
  console.log(`Proxying ${request.method} ${backendPath} to ${backendUrl}`);
  
  try {
    // Clone headers but remove host
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.set("X-Forwarded-For", context.ip);
    headers.set("X-Forwarded-Proto", "https");
    
    // Make the request to backend with timeout
    const backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== "GET" && request.method !== "HEAD" 
        ? await request.text() 
        : undefined,
      signal: AbortSignal.timeout(60000), // 60 second timeout for large queries
    });
    
    // Clone response headers
    const responseHeaders = new Headers(backendResponse.headers);
    const corsHeaders = buildCorsHeaders(origin);
    corsHeaders.forEach((value, key) => responseHeaders.set(key, value));
    
    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(JSON.stringify({ 
      error: "Backend connection failed", 
      details: String(error),
      backendUrl: backendUrl 
    }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const config = { path: ["/api/*", "/health"] };
