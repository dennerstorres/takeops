import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { createTransport } from "nodemailer";
import { prisma } from "@/server/db";
import { redactForLog } from "./auth-log.ts";
import { loginMethods } from "./env.ts";
import { buildLoginEmail } from "./login-email.ts";

const methods = loginMethods(process.env);

// Cada método liga só se configurado por inteiro (ADR-040).
const providers = [
  ...(methods.google ? [Google] : []),
  ...(methods.email
    ? [
        Nodemailer({
          server: process.env.EMAIL_SERVER,
          from: process.env.EMAIL_FROM,
          async sendVerificationRequest({ identifier, url, provider }) {
            const host = new URL(url).host;
            const message = buildLoginEmail({ url, host });
            const result = await createTransport(provider.server).sendMail({
              to: identifier,
              from: provider.from,
              ...message,
            });
            if (result.rejected.length > 0) {
              throw new Error("O servidor de e-mail recusou o destinatário.");
            }
          },
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(
    prisma as unknown as Parameters<typeof PrismaAdapter>[0],
  ),
  session: { strategy: "database" },
  trustHost: true,
  pages: { signIn: "/login", verifyRequest: "/login/verificar" },
  providers,
  callbacks: {
    session({ session, user }) {
      // O id estável é o do banco, não o subject do provedor.
      session.user.id = user.id;
      // Idioma salvo segue na sessão para o i18n não consultar o banco de novo.
      session.user.locale = user.locale ?? null;
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
    // O debug padrão do Auth.js inclui tokens e o link de login.
    debug() {},
  },
});
