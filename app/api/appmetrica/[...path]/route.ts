import { NextRequest, NextResponse } from "next/server";

// Server-side proxy for Yandex AppMetrica API.
// Browsers cannot call api.appmetrica.yandex.ru directly (no CORS),
// so the frontend hits /api/appmetrica/<path> and we forward server-side.

const APPMETRICA_HOST = "https://api.appmetrica.yandex.ru";

const getToken = () =>
  process.env.APPMETRICA_OAUTH_TOKEN ?? process.env.NEXT_PUBLIC_OAUTH_TOKEN ?? process.env.NEXT_PULIC_OAUTH_TOKEN ?? "";

const buildTargetUrl = (segments: string[], search: string) => {
  const path = segments.join("/");
  return `${APPMETRICA_HOST}/${path}${search}`;
};

const proxy = async (req: NextRequest, segments: string[]) => {
  const token = getToken();
  if (!token) {
    return NextResponse.json({ error: "AppMetrica OAuth token is not configured" }, { status: 500 });
  }

  const url = new URL(req.url);
  const target = buildTargetUrl(segments, url.search);

  const init: RequestInit = {
    method: req.method,
    headers: {
      Authorization: `OAuth ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.text();
    if (body) init.body = body;
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (e: any) {
    return NextResponse.json({ error: `Upstream fetch failed: ${e?.message ?? "unknown"}` }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/json";
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "content-type": contentType },
  });
};

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
