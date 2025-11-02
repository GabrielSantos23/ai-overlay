import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	transpilePackages: [
		"shiki",
		"@taur-next-0auth/auth",
		"@taur-next-0auth/api",
		"@taur-next-0auth/db",
	],
};

export default nextConfig;
