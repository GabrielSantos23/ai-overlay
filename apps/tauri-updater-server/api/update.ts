import type { VercelRequest, VercelResponse } from "@vercel/node";

interface Platform {
  signature: string;
  url: string;
}

// ⚙️ CONFIGURAÇÕES - ATUALIZE AQUI A CADA NOVA VERSÃO
const LATEST_VERSION = "0.0.1"; // Versão atual do seu app
const RELEASE_NOTES = "Versão inicial";
const PUB_DATE = new Date().toISOString();

// 📦 Substitua pelos seus dados
const GITHUB_REPO = "seu-usuario/seu-repo"; // Ex: joao/meu-app
const RELEASE_TAG = `v${LATEST_VERSION}`; // Ex: v1.0.0

// 🔐 Cole aqui o conteúdo dos arquivos .sig (gerados após o build)
const SIGNATURES: Record<string, string> = {
  "linux-x86_64": "COLE_ASSINATURA_LINUX_AQUI",
  "windows-x86_64": "COLE_ASSINATURA_WINDOWS_AQUI",
  "darwin-x86_64": "COLE_ASSINATURA_MACOS_INTEL_AQUI",
  "darwin-aarch64": "COLE_ASSINATURA_MACOS_ARM_AQUI",
};

// 🔗 URLs dos binários no GitHub Releases
const DOWNLOAD_URLS: Record<string, string> = {
  "linux-x86_64": `https://github.com/${GITHUB_REPO}/releases/download/${RELEASE_TAG}/seu-app.AppImage.tar.gz`,
  "windows-x86_64": `https://github.com/${GITHUB_REPO}/releases/download/${RELEASE_TAG}/seu-app-setup.exe`,
  "darwin-x86_64": `https://github.com/${GITHUB_REPO}/releases/download/${RELEASE_TAG}/seu-app.app.tar.gz`,
  "darwin-aarch64": `https://github.com/${GITHUB_REPO}/releases/download/${RELEASE_TAG}/seu-app.app.tar.gz`,
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { target, arch, current_version } = req.query;

  console.log("🔍 Verificação de atualização:", {
    target,
    arch,
    current_version,
  });

  // Validação
  if (!target || !arch || !current_version) {
    return res.status(400).json({
      error: "Parâmetros obrigatórios: target, arch, current_version",
    });
  }

  const platformKey = `${target}-${arch}`;

  if (!SIGNATURES[platformKey] || !DOWNLOAD_URLS[platformKey]) {
    console.log("❌ Plataforma não suportada:", platformKey);
    return res
      .status(400)
      .json({ error: `Plataforma não suportada: ${platformKey}` });
  }

  // Comparar versões
  const currentVersion = (current_version as string).replace(/^v/, "");
  const latestVersion = LATEST_VERSION.replace(/^v/, "");

  if (
    currentVersion === latestVersion ||
    compareVersions(currentVersion, latestVersion) >= 0
  ) {
    console.log("✅ Cliente já está atualizado");
    return res.status(204).end(); // Sem atualização disponível
  }

  // Atualização disponível
  const updateInfo = {
    version: LATEST_VERSION,
    notes: RELEASE_NOTES,
    pub_date: PUB_DATE,
    url: DOWNLOAD_URLS[platformKey],
    signature: SIGNATURES[platformKey],
  };

  console.log("🎉 Atualização disponível:", updateInfo.version);
  return res.status(200).json(updateInfo);
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  return 0;
}
