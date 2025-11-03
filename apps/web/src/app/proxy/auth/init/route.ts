// src/app/proxy/auth/init/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sessionStore } from "@/lib/proxy-session-store";

export async function POST(req: NextRequest) {
  try {
    const { provider, callbackUrl } = await req.json();

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    const sessionId = Math.random().toString(36).substring(2, 15);

    sessionStore.set(sessionId, {
      provider,
      callbackUrl: callbackUrl || "myapp://callback",
      createdAt: Date.now(),
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001";

    // Use the same domain for callback
    const authUrl = `${baseUrl}/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(
      `${baseUrl}/proxy/auth/callback?session=${sessionId}`
    )}`;

    console.log("[Proxy] Generated auth URL:", authUrl);

    return NextResponse.json(
      {
        authUrl,
        sessionId,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("[Proxy] Error in /proxy/auth/init:", error);
    return NextResponse.json(
      { error: "Failed to initialize OAuth flow" },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
