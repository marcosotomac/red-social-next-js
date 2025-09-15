import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: "/Users/marcosotomaceda/Desktop/my-app",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pgavkwahqiywplcmaiqe.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      // Temporary for demo/example URLs
      {
        protocol: "https",
        hostname: "example.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
