import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/server/db";
import { redactForLog } from "./auth-log.ts";

const googleReady = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(
    prisma as unknown as Parameters<typeof PrismaAdapter>[0],
  ),
  session: { strategy: "database" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: googleReady ? [Google] : [],
  callbacks: {
    session({ session, user }) {
      // O id estável é o do banco, não o subject do Google.
      session.user.id = user.id;
      return session;
    },
  },
  logger: {
    error(error) {
      console.error(redactForLog(error));
    },
    warn(code) {
      console.warn(redactForLog(code));
    },
    // O debug padrão do Auth.js inclui access_token e id_token.
    debug() {},
  },
});
