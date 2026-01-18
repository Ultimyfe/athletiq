// web/src/app/api/diagnose/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBase) {
    return NextResponse.json({ detail: "NEXT_PUBLIC_API_BASE_URL is not set" }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const bodyText = await req.text();

  const res = await fetch(`${apiBase}/diagnose`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": auth,
    },
    body: bodyText,
    cache: "no-store",
  });

  const txt = await res.text().catch(() => "");
  return new NextResponse(txt, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}