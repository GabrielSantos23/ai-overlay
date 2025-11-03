/**
 * Shared session store for proxy routes
 * In production, replace this with Redis or a database
 */

interface ProxySession {
  provider: string;
  callbackUrl: string;
  createdAt: number;
  callbackReceived?: boolean;
  callbackReceivedAt?: number;
  sessionData?: any;
}

class SessionStore {
  private sessions = new Map<string, ProxySession>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval
    this.startCleanup();
  }

  set(sessionId: string, data: ProxySession) {
    this.sessions.set(sessionId, data);
  }

  get(sessionId: string): ProxySession | undefined {
    return this.sessions.get(sessionId);
  }

  delete(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  private startCleanup() {
    // Clean up expired sessions every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = 10 * 60 * 1000; // 10 minutes

      for (const [id, session] of this.sessions.entries()) {
        if (now - session.createdAt > maxAge) {
          console.log("[SessionStore] Cleaning up expired session:", id);
          this.sessions.delete(id);
        }
      }
    }, 5 * 60 * 1000);
  }

  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
export const sessionStore = new SessionStore();
