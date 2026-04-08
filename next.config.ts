import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // No molesta mientras programas
});

const nextConfig = {
  // Aquí NO pongas 'output: export' para que tus APIs sigan funcionando en Vercel
};

export default withPWA(nextConfig);