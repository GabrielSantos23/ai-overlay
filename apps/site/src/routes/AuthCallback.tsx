import { useEffect, useState } from "react";

export default function AuthCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Pega os parâmetros da URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const state = params.get("state");

        if (!code) {
          throw new Error("No authorization code received");
        }

        console.log("✅ Received authorization code");

        // Cria o deep link para o app Tauri
        const deepLink = `ai-overlay://auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || "")}`;

        console.log("🔗 Opening deep link:", deepLink);

        // Tenta abrir o app automaticamente
        window.location.href = deepLink;

        setStatus("success");

        // Fecha a aba após 3 segundos
        setTimeout(() => {
          window.close();
        }, 3000);
      } catch (err) {
        console.error("❌ Error handling callback:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
      }
    };

    handleCallback();
  }, []);

  const openApp = () => {
    const params = new URLSearchParams(window.location.search);
    const deepLink = `ai-overlay://auth/callback${window.location.search}`;
    window.location.href = deepLink;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Processando autenticação...
            </h1>
            <p className="text-gray-600">Redirecionando para o aplicativo</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ✓ Autenticação bem-sucedida!
            </h1>
            <p className="text-gray-600 mb-6">
              Retornando para o aplicativo...
            </p>
            <button
              onClick={openApp}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Clique aqui se o app não abrir
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Esta janela será fechada automaticamente
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Erro na autenticação
            </h1>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => window.close()}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Fechar janela
            </button>
          </>
        )}
      </div>
    </div>
  );
}
