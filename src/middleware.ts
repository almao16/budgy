export { default } from "next-auth/middleware";

export const config = { 
  // Protege todas las rutas excepto el login y el registro
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
};