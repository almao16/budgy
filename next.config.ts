import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore - Ignoramos el error de tipo solo para el deploy, pero mantenemos la funcionalidad local
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  /* Cualquier otra opción que tengas... */
};

export default nextConfig;