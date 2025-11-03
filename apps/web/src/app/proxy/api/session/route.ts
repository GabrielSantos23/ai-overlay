import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sessionStore } from "@/lib/proxy-session-store";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    console.log(
      "[Proxy] Validating session with token:",
      token.substring(0, 10) + "..."
    );

    // Check if token is a sessionId
    const session = sessionStore.get(token);

    if (session && session.sessionData) {
      console.log("[Proxy] Found cached session data");
      return NextResponse.json(session.sessionData, {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Fallback: try to get current session from NextAuth
    const nextAuthSession = await getServerSession(authOptions);

    if (!nextAuthSession || !nextAuthSession.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    console.log(
      "[Proxy] Session validated for user:",
      nextAuthSession.user.email
    );
    return NextResponse.json(nextAuthSession, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("[Proxy] Session validation error:", error);
    return NextResponse.json(
      { error: "Session validation failed" },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
