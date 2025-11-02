import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  loginWithOAuth,
  getUserSession,
  logout as authLogout,
} from "@/hooks/auth2";
import { removeToken } from "@/stores/auth";

interface User {
  name?: string;
  email?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (provider: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      console.log("[Auth] Initializing auth state...");

      try {
        // Check localStorage for saved token
        const savedToken = localStorage.getItem("auth_token");

        if (savedToken) {
          console.log("[Auth] Found saved token, fetching user session...");

          try {
            // Verify token is still valid by fetching session
            const session = await getUserSession(savedToken);

            if (session && session.user) {
              console.log("[Auth] Session valid, user:", session.user.email);
              setToken(savedToken);
              setUser(session.user);
            } else {
              console.log("[Auth] Session invalid, clearing token");
              localStorage.removeItem("auth_token");
            }
          } catch (error) {
            console.error("[Auth] Failed to fetch session:", error);
            localStorage.removeItem("auth_token");
          }
        } else {
          console.log("[Auth] No saved token found");
        }
      } catch (error) {
        console.error("[Auth] Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (provider: string) => {
    console.log("[Auth] Starting login for provider:", provider);
    setIsLoading(true);

    try {
      // Get token from OAuth flow
      const receivedToken = await loginWithOAuth(provider);
      console.log("[Auth] Token received:", receivedToken);

      // Save token to localStorage
      localStorage.setItem("auth_token", receivedToken);
      setToken(receivedToken);

      // Fetch user session from NextAuth
      console.log("[Auth] Fetching user session...");
      const session = await getUserSession(receivedToken);

      if (session && session.user) {
        console.log("[Auth] User session loaded:", session.user.email);

        // Optionally fetch full user from database
        try {
          setUser({
            ...session.user,
          });
        } catch (dbError) {
          console.warn(
            "[Auth] Could not fetch user from database, using session data:",
            dbError
          );
          setUser(session.user);
        }
      } else {
        throw new Error("Failed to load user session");
      }
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      // Clean up on error
      localStorage.removeItem("auth_token");
      setToken(null);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log("[Auth] Logging out...");

    try {
      await authLogout();
      localStorage.removeItem("auth_token");
      setToken(null);
      setUser(null);
      console.log("[Auth] Logout complete");
    } catch (error) {
      console.error("[Auth] Logout error:", error);
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
