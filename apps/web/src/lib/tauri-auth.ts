import { listen } from "@tauri-apps/api/event";
import { isRegistered, register } from "@tauri-apps/plugin-deep-link";
import { open } from "@tauri-apps/plugin-shell";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
const DEEP_LINK_SCHEME = "myapp"; // Troque pelo nome do seu app

export const signInWithTauri = () =>
  new Promise<string>(async (resolve, reject) => {
    try {
      // Registra o deep link se ainda não estiver registrado
      if (!(await isRegistered(DEEP_LINK_SCHEME))) {
        await register(DEEP_LINK_SCHEME);
        console.log(`Registered "${DEEP_LINK_SCHEME}" deep link`);
      }

      // URL de signin com redirecionamento para callback HTTP (que depois redireciona para deep link)
      const signInUrl = `${APP_URL}/api/auth/signin/google?callbackUrl=${encodeURIComponent(
        `${APP_URL}/auth/tauri-callback`
      )}`;

      // Abre o navegador externo
      await open(signInUrl);

      // Escuta o evento de deep link
      const unlisten = await listen<string>("deep-link-received", (event) => {
        console.log("Deep link received:", event.payload);

        try {
          const url = new URL(event.payload);
          const sessionToken = url.searchParams.get("session_token");

          if (sessionToken) {
            // Salva o token no localStorage
            localStorage.setItem("tauri_session_token", sessionToken);
            unlisten(); // Para de escutar
            resolve(sessionToken);
          }
        } catch (error) {
          console.error("Error parsing deep link:", error);
          reject(error);
        }
      });

      // Timeout de 5 minutos
      setTimeout(() => {
        unlisten();
        reject(new Error("Login timeout"));
      }, 300000);
    } catch (error) {
      console.error("Error in signInWithTauri:", error);
      reject(error);
    }
  });

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tauri_session_token");
};

export const clearStoredToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("tauri_session_token");
};
