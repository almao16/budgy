import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  // Esta línea le dice a Next.js que ignore el conflicto y use Webpack para la PWA
  turbopack: {}, 
};

export default withPWA(nextConfig);