import type { VercelRequest, VercelResponse } from "@vercel/node";

interface Platform {
  signature: string;
  url: string;
}

// ⚙️ CONFIGURAÇÕES - ATUALIZE AQUI A CADA NOVA VERSÃO
const LATEST_VERSION = "0.1.2";
const RELEASE_NOTES = "Better ui on configurations";
const PUB_DATE = new Date().toISOString();

// 📦 Substitua pelos seus dados
const GITHUB_REPO = "GabrielSantos23/ai-overlay"; // Ex: joao/meu-app
const RELEASE_TAG = `v${LATEST_VERSION}`; // Ex: v1.0.0

// 🔐 Cole aqui o conteúdo dos arquivos .sig (gerados após o build)
const SIGNATURES: Record<string, string> = {
  "linux-x86_64": "COLE_ASSINATURA_LINUX_AQUI",
  "windows-x86_64":
    "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUakRZd1R0MUZmS2k0NCswUXpvR05VWitreWRDZTVxRWlpL1ZuTzB2Qkg1U2lHUW8xNDVMYjJqZHd0Y2NrcmNpcnBUQUd5Rnp4VGF1c1NrWmpFQjUySHNLM0JDWXRoV1F3PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYxNzg1NjIzCWZpbGU6QUktT3ZlcmxheV8wLjEuMl94NjQtc2V0dXAuZXhlCnRBaitPMDNpaHlvV1NGQXpaSDZtNE5SK0JXRktJSFZKQ2NMRTNLWmZKWjk0NGpFakd1SlRnVFZiOFhvUjNqOUdDVWtXcEpZazlPL1V4Mlh1VnkybUNBPT0K",
  "darwin-x86_64": "COLE_ASSINATURA_MACOS_INTEL_AQUI",
  "darwin-aarch64": "COLE_ASSINATURA_MACOS_ARM_AQUI",
};

// 🔗 URLs dos binários no GitHub Releases
// Em apps/updater/api/update.ts
const DOWNLOAD_URLS: Record<string, string> = {
  "linux-x86_64": `https://github.com/${GITHUB_REPO}/releases/download/${RELEASE_TAG}/AI-Overlay_0.1.2_amd64.AppImage.tar.gz`,
  "windows-x86_64": `https://github.com/${GITHUB_REPO}/releases/download/${RELEASE_TAG}/AI-Overlay_0.1.2_x64-setup.exe`,
  "darwin-x86_64": `https://github.com/${GITHUB_REPO}/releases/download/${RELEASE_TAG}/AI-Overlay.app.tar.gz`,
  "darwin-aarch64": `https://github.com/${GITHUB_REPO}/releases/download/${RELEASE_TAG}/AI-Overlay.app.tar.gz`,
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
