import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { kv } from '@vercel/kv';
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const userKey = `budgy:user:auth:${credentials.email}`;
        let user: any = await kv.get(userKey);

        if (!user) {
          // Registro automático si no existe
          const hashedPassword = await bcrypt.hash(credentials.password, 10);
          user = {
            id: Math.random().toString(36).substring(7),
            email: credentials.email,
            password: hashedPassword,
            name: credentials.email.split('@')[0]
          };
          await kv.set(userKey, user);
        } else {
          const isCorrect = await bcrypt.compare(credentials.password, user.password);
          if (!isCorrect) return null;
        }

        return { id: user.id, name: user.name, email: user.email };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }: any) {
      if (token && session.user) session.user.id = token.id;
      return session;
    }
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET || "secreto-muy-seguro",
  session: { strategy: "jwt" }
};