import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { kv } from "@vercel/kv";
import bcrypt from "bcryptjs";

// Exportamos esta variable para que el backend sepa cómo validar sesiones
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Por favor, ingresa correo y contraseña.");
        }

        const email = credentials.email.toLowerCase();
        const userKey = `budgy:user:auth:${email}`;
        
        const user: any = await kv.get(userKey);

        if (!user) {
          const hashedPassword = await bcrypt.hash(credentials.password, 10);
          const newUser = {
            id: Date.now().toString(),
            email: email,
            password: hashedPassword,
            name: email.split('@')[0]
          };
          
          await kv.set(userKey, newUser);
          return { id: newUser.id, email: newUser.email, name: newUser.name };
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Contraseña incorrecta.");
        }

        return { id: user.id, email: user.email, name: user.name };
      }
    })
  ],
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        // Le agregamos "as any" para que TypeScript no se queje del .id
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };