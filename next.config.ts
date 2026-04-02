import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
      appIsrStatus: false,   // Esto quita el ícono de la "N" (Static Indicator)
      buildActivity: false,  // Esto quita la burbuja de "Compiling"
  },
  /* config options here */
};

export default nextConfig;
