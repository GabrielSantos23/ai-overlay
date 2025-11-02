"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const DEEP_LINK_SCHEME = "taur-next-0auth";

export default function TauriCallback() {
  const { data: session, status } = useSession();
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user && !sent) {
      setSent(true);

      const userData = {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      };

      console.log("Sending auth data to Tauri:", userData);

      // Gera um token simples baseado no email e timestamp
      const sessionToken = btoa(
        JSON.stringify({
          email: session.user.email,
          name: session.user.name,
          timestamp: Date.now(),
        })
      );

      // Redireciona para o deep link com o token
      const deepLinkUrl = `${DEEP_LINK_SCHEME}://login?session_token=${encodeURIComponent(
        sessionToken
      )}`;

      console.log("Redirecting to deep link:", deepLinkUrl);

      // Salva também localmente para backup
      localStorage.setItem("tauri_user_session", JSON.stringify(userData));
      localStorage.setItem("tauri_session_token", sessionToken);

      // Tenta redirecionar para o deep link
      try {
        window.location.href = deepLinkUrl;
      } catch (error) {
        console.error("Error redirecting to deep link:", error);
        // Fallback: tenta enviar via postMessage
        if (window.opener) {
          try {
            window.opener.postMessage(
              {
                type: "tauri-auth-success",
                user: userData,
                token: sessionToken,
              },
              "*"
            );
            console.log("Message sent to opener");
          } catch (postError) {
            console.error("Error sending message:", postError);
          }
        }
      }

      // Mostra instruções para fechar após alguns segundos
      setTimeout(() => {
        if (window.opener) {
          window.close();
        }
      }, 2000);
    }
  }, [status, session, sent]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Autenticando...</p>
        </div>
      </div>
    );
  }

  if (status === "authenticated" && session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Login realizado!
            </h2>
            <p className="text-gray-600 mb-4">Bem-vindo, {session.user.name}</p>

            {session.user.image && (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-20 h-20 rounded-full mx-auto mb-4"
              />
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                ✅ Dados enviados para o aplicativo Tauri
              </p>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Você pode fechar esta janela manualmente ou aguardar o fechamento
              automático
            </p>

            <button
              onClick={() => window.close()}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Fechar janela
            </button>

            <button
              onClick={() => (window.location.href = "/")}
              className="w-full mt-2 px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              Ou voltar para o app
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
}
