import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pgavkwahqiywplcmaiqe.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Optimizaciones para producción
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // Configuración experimental para mejor rendimiento
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
};

export default nextConfig;
