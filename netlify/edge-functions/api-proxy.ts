import type { Context } from "https://edge.netlify.com";

const BACKEND_URL = "http://3.209.80.206:8001";

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);
  
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
    
    // Make the request to backend
    const backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== "GET" && request.method !== "HEAD" 
        ? await request.text() 
        : undefined,
    });
    
    // Clone response headers
    const responseHeaders = new Headers(backendResponse.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
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
