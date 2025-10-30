import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: process.env.NEXT_ENABLE_REACT_COMPILER !== '0',
};

export default nextConfig;
