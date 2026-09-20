import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { z } from "zod";
import {
  clearRateLimit,
  consumeRateLimit,
  getClientIp,
  LOGIN_EMAIL_LIMIT,
  LOGIN_IP_LIMIT,
  LOGIN_WINDOW,
} from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;

          // Brute-force protection. This lives here (not only in the login form's
          // action) so it also covers direct calls to /api/auth/callback/credentials.
          // Limited per account AND per IP; success clears the account's counter.
          const emailKey = `login:email:${email.toLowerCase()}`;
          const ipKey = `login:ip:${await getClientIp()}`;
          const [byEmail, byIp] = await Promise.all([
            consumeRateLimit(emailKey, LOGIN_EMAIL_LIMIT, LOGIN_WINDOW),
            consumeRateLimit(ipKey, LOGIN_IP_LIMIT, LOGIN_WINDOW),
          ]);
          if (!byEmail.allowed || !byIp.allowed) return null;

          const user = await prisma.user.findUnique({ where: { email } });

          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            await clearRateLimit(emailKey);
            return user;
          }
        }

        return null;
      },
    }),
  ],
});
