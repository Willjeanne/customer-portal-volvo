import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  // >>> CLAUDE — lot flotte, 20/09/2026 — à relire
  // Images produit du catalogue volvoemea, servies par le CDN VTEX.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "volvoemea.vtexassets.com", pathname: "/arquivos/**" },
    ],
  },
  // <<< CLAUDE
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;
