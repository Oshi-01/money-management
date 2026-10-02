import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { z } from "zod";
import { emailSchema, loginPasswordSchema } from "@/lib/auth-validation";
import { findUserByEmail, verifyPassword } from "@/lib/user-auth";
import {
  clearRateLimit,
  consumeRateLimit,
  getClientIp,
  LOGIN_EMAIL_LIMIT,
  LOGIN_IP_LIMIT,
  LOGIN_WINDOW,
} from "@/lib/rate-limit";

const credentialsSchema = z.object({ email: emailSchema, password: loginPasswordSchema });

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.sessionVersion = (user as { sessionVersion?: number }).sessionVersion ?? 0;
        return token;
      }

      // Reject tokens issued before the last password reset, or for deleted users.
      if (!token.sub) return null;
      const current = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { sessionVersion: true },
      });
      if (!current || current.sessionVersion !== (token.sessionVersion ?? 0)) return null;
      return token;
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = credentialsSchema.safeParse(credentials);
        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;

        // Brute-force protection. This lives here (not only in the login form's
        // action) so it also covers direct calls to /api/auth/callback/credentials.
        // Limited per account AND per IP; success clears the account's counter.
        const emailKey = `login:email:${email}`;
        const ipKey = `login:ip:${await getClientIp()}`;
        const [byEmail, byIp] = await Promise.all([
          consumeRateLimit(emailKey, LOGIN_EMAIL_LIMIT, LOGIN_WINDOW),
          consumeRateLimit(ipKey, LOGIN_IP_LIMIT, LOGIN_WINDOW),
        ]);
        if (!byEmail.allowed || !byIp.allowed) return null;

        const user = await findUserByEmail(email);
        if (!(await verifyPassword(password, user?.password)) || !user) return null;

        await clearRateLimit(emailKey);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
});
