import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
  // The compiler API works in both Vercel and this constrained container. The
  // default CLI subprocess cannot reliably capture output in this environment.
  experimental: { useTypeScriptCli: false },
};

export default nextConfig;
