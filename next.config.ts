import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 确保环境变量在客户端可用
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
  /* config options here */
};

export default nextConfig;
