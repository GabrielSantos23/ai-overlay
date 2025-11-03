import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sessionStore } from "@/lib/proxy-session-store";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get("session");

    console.log("[Proxy] OAuth callback received, session ID:", sessionId);

    if (!sessionId) {
      return new NextResponse("No session ID provided", { status: 400 });
    }

    const session = sessionStore.get(sessionId);

    if (!session) {
      return new NextResponse("Session not found or expired", { status: 404 });
    }

    // Get the NextAuth session (cookies are automatically included)
    const nextAuthSession = await getServerSession(authOptions);

    console.log("[Proxy] NextAuth session:", nextAuthSession?.user?.email);

    if (!nextAuthSession || !nextAuthSession.user) {
      return new NextResponse("Authentication failed", { status: 401 });
    }

    // Update session with completion data
    sessionStore.set(sessionId, {
      ...session,
      callbackReceived: true,
      callbackReceivedAt: Date.now(),
      sessionData: nextAuthSession,
    });

    const callbackUrl = session.callbackUrl || "myapp://callback";

    // Return HTML that redirects to the Tauri app
    const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>Authentication Complete</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .container {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        text-align: center;
        max-width: 400px;
      }
      .spinner {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #667eea;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 20px auto;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .success { color: #10b981; }
      .error { color: #ef4444; }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Authentication Successful!</h2>
      <div class="spinner"></div>
      <p id="status">Redirecting to app...</p>
    </div>
    <script>
      const sessionId = ${JSON.stringify(sessionId)};
      const callbackUrl = ${JSON.stringify(callbackUrl)};
      const user = ${JSON.stringify(nextAuthSession.user)};
      const statusEl = document.getElementById('status');
      
      // Use sessionId as the token
      const token = sessionId;
      
      // Build deep link URL for Tauri app
      const deepLinkUrl = callbackUrl + 
        '?token=' + encodeURIComponent(token) + 
        '&sessionId=' + encodeURIComponent(sessionId) +
        '&email=' + encodeURIComponent(user.email || '') +
        '&name=' + encodeURIComponent(user.name || '');
      
      console.log('Redirecting to:', deepLinkUrl);
      
      // Attempt deep link
      window.location.href = deepLinkUrl;
      
      // Fallback message for web browsers
      setTimeout(() => {
        statusEl.innerHTML = 
          '<div class="success">' +
          '<h3>✓ Authentication Complete</h3>' +
          '<p>Please return to the application.</p>' +
          '<p style="font-size: 0.9em; color: #666;">If the app did not open automatically, please close this window.</p>' +
          '</div>';
      }, 2000);
    </script>
  </body>
</html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("[Proxy] Error in callback:", error);
    return new NextResponse(
      "Internal server error: " + (error as Error).message,
      { status: 500 }
    );
  }
}
