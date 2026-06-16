// Portable API Gateway — Next.js App Router handler.
// Optional catch-all that serves the /gateway console and the /gateway/v1 +
// /gateway/admin API from a single route. All logic lives in the framework-
// agnostic core (../../../../gateway/next-core.mjs); this file only adapts
// Next's Request/Response to it. Runs on the Node runtime (needs fs).
// @ts-ignore -- plain-JS core module, no type declarations needed
import { createGatewayCore } from "../../../../gateway/next-core.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handle = createGatewayCore({ dataDir: process.cwd() + "/data" });

function toHeaders(req: Request): Record<string, string> {
  const h: Record<string, string> = {};
  req.headers.forEach((v, k) => { h[k.toLowerCase()] = v; });
  return h;
}

async function run(method: string, req: Request, ctx: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await ctx.params;
  const pathname = "/gateway" + (slug && slug.length ? "/" + slug.join("/") : "");
  let body: any = {};
  if (method === "POST" || method === "PUT") {
    try { body = await req.json(); } catch { body = {}; }
  }
  const r = await handle(method, pathname, toHeaders(req), body);
  if (r.isHtml) {
    return new Response(r.body, { status: r.status, headers: { "Content-Type": "text/html" } });
  }
  return new Response(JSON.stringify(r.body), {
    status: r.status,
    headers: { "Content-Type": "application/json", ...(r.headers || {}) },
  });
}

export const GET = (req: Request, ctx: any) => run("GET", req, ctx);
export const POST = (req: Request, ctx: any) => run("POST", req, ctx);
export const PUT = (req: Request, ctx: any) => run("PUT", req, ctx);
export const DELETE = (req: Request, ctx: any) => run("DELETE", req, ctx);
