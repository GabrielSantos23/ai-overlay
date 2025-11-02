import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";

export async function loginWithGoogle() {
  // Gera URL de autorização
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}` +
    `&redirect_uri=http://localhost:3001/api/auth/callback/google` +
    `&response_type=code` +
    `&scope=openid%20profile%20email`;

  // Abre no navegador do sistema
  await open(authUrl);
}
