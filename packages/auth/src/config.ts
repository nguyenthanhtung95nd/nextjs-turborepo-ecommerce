import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loadUserPermissions, verifyCredentials } from "./user";
import "./types";

// Auth.js v5 config shared by both apps. JWT strategy is mandatory for the Credentials
// provider; `providers` stays an array so OAuth can be appended later without a refactor.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = typeof credentials?.email === "string" ? credentials.email : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;
        return verifyCredentials(email, password);
      },
    }),
  ],
  callbacks: {
    // Runs at sign-in only (when `user` is set): stamp userId + the permission union onto the token.
    jwt: async ({ token, user }) => {
      if (user?.id) {
        token.userId = user.id;
        token.permissions = await loadUserPermissions(BigInt(user.id));
      }
      return token;
    },
    // Copy the token claims onto the session that Server Components / actions read via auth().
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = typeof token.userId === "string" ? token.userId : "";
        session.user.permissions = Array.isArray(token.permissions)
          ? (token.permissions as string[])
          : [];
      }
      return session;
    },
  },
};
