import { withAuth } from "next-auth/middleware";

// Exportamos explícitamente la función para evitar el error de Next.js
export default withAuth;

export const config = { 
  // Protege todas las rutas excepto el login, el registro y los estáticos
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
};