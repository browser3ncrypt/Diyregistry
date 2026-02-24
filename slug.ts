// src/index.ts

export interface Env {
  URL_SHORTENER: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();

    // Route: Create short URL (POST /api/shorten)
    if (path === "/api/shorten" && request.method === "POST") {
      return handleShorten(request, env);
    }

    // Route: Analytics (GET /stats/:slug) – protected by simple header for demo
    if (path.startsWith("/stats/")) {
      const slug = path.slice(7);
      return handleStats(slug, request, env);
    }

    // Route: Redirect short URL (GET /:slug)
    if (path !== "/" && path !== "/favicon.ico") {
      const slug = path.slice(1);
      return handleRedirect(slug, request, env);
    }

    // Fallback for root or unmatched paths
    return new Response("URL Shortener Service – Use /api/shorten", { status: 200 });
  },
} satisfies ExportedHandler<Env>;

async function handleShorten(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json<any>();

    // Debug: log the received body (visible in Worker logs in dashboard)
    console.log("Received body:", JSON.stringify(body));

    const originalUrl = body.originalUrl ?? body.original_url; // allow snake_case fallback
    if (typeof originalUrl !== "string" || originalUrl.trim() === "") {
      return new Response(
        JSON.stringify({ error: "originalUrl must be a non-empty string" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Stricter check with new URL()
    try {
      new URL(originalUrl);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let slug = body.customSlug
      ? String(body.customSlug).toLowerCase().replace(/[^a-z0-9-]/g, "")
      : generateSlug();

    if (slug.length < 3 || slug.length > 20) slug = generateSlug();

    const existing = await env.URL_SHORTENER.get(slug);
    if (existing) {
      return new Response(JSON.stringify({ error: "Slug already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = {
      originalUrl,
      createdAt: Date.now(),
      clicks: 0,
    };

    await env.URL_SHORTENER.put(slug, JSON.stringify(data));

    const shortUrl = `https://\( {url.hostname}/ \){slug}`;

    return new Response(JSON.stringify({ shortUrl, slug }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Shorten error:", err);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleRedirect(slug: string, request: Request, env: Env): Promise<Response> {
  const dataStr = await env.URL_SHORTENER.get(slug);
  if (!dataStr) {
    return new Response("Not found", { status: 404 });
  }

  const data = JSON.parse(dataStr) as { originalUrl: string; clicks: number };

  // Log visitor (Grabify-style tracking)
  const visit = {
    timestamp: Date.now(),
    ip: request.headers.get("cf-connecting-ip") ?? null,
    country: request.cf?.country ?? "Unknown",
    city: request.cf?.city ?? "Unknown",
    userAgent: request.headers.get("user-agent") ?? "Unknown",
    referrer: request.headers.get("referer") ?? "Direct",
  };

  // Increment clicks
  data.clicks = (data.clicks || 0) + 1;
  await env.URL_SHORTENER.put(slug, JSON.stringify(data));

  // Store detailed visit
  const visitKey = `visits:\( {slug}: \){Date.now()}`;
  await env.URL_SHORTENER.put(visitKey, JSON.stringify(visit), {
    expirationTtl: 60 * 60 * 24 * 90, // 90 days
  });

  return Response.redirect(data.originalUrl, 302);
}

async function handleStats(slug: string, request: Request, env: Env): Promise<Response> {
  // Simple demo protection – replace with proper auth in production
  if (request.headers.get("X-Auth") !== "your-secret-token") {
    return new Response("Unauthorized", { status: 401 });
  }

  const dataStr = await env.URL_SHORTENER.get(slug);
  if (!dataStr) {
    return new Response("Not found", { status: 404 });
  }

  const data = JSON.parse(dataStr) as { originalUrl: string; clicks: number };

  // List recent visits
  const visits: typeof visit[] = [];
  const list = await env.URL_SHORTENER.list({ prefix: `visits:${slug}:` });

  for (const key of list.keys) {
    const v = await env.URL_SHORTENER.get(key.name);
    if (v) {
      visits.push(JSON.parse(v));
    }
  }

  return new Response(
    JSON.stringify({
      slug,
      originalUrl: data.originalUrl,
      clicks: data.clicks,
      visits: visits.slice(-50), // Last 50 visits
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

function generateSlug(): string {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(36))
    .join("")
    .slice(0, 8)
    .toUpperCase();
}