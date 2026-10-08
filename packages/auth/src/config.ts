import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ApiError, apiFetch } from "@repo/api-client";
import type { AuthenticatedUserDto } from "@repo/contracts";
import "./types";

/**
 * Cookie names, kept distinct per app.
 *
 * Both apps run on `localhost` in development, and cookies ignore the port — so with the default
 * name they share one `authjs.session-token`. Each app signs with its own `AUTH_SECRET`, so the
 * storefront logs `JWTSessionError: no matching decryption secret` on every request made with the
 * admin's cookie, and whichever app signs in last silently signs the other one out.
 *
 * `AUTH_COOKIE_PREFIX` separates them. It is not a security control — the secrets already are —
 * but two apps sharing one session slot is a correctness problem whatever the secrets.
 *
 * The `__Secure-` prefix is a browser-enforced rule, not decoration: a cookie named with it is
 * only accepted over HTTPS. Auth.js adds it to its own defaults, so overriding the name means
 * adding it here, under the same condition Auth.js uses.
 */
const COOKIE_PREFIX = process.env.AUTH_COOKIE_PREFIX ?? "authjs";
const USE_SECURE_COOKIES = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
const SECURE = `${USE_SECURE_COOKIES ? "__Secure-" : ""}`;

// Auth.js v5 config shared by both apps. JWT strategy is mandatory for the Credentials
// provider; `providers` stays an array so OAuth can be appended later without a refactor.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  // Named in full rather than merged: Auth.js shallow-merges each cookie entry over its default,
  // so supplying `name` alone would drop `httpOnly` and `sameSite` with it.
  cookies: {
    sessionToken: {
      name: `${SECURE}${COOKIE_PREFIX}.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: USE_SECURE_COOKIES,
      },
    },
    callbackUrl: {
      name: `${SECURE}${COOKIE_PREFIX}.callback-url`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: USE_SECURE_COOKIES },
    },
    csrfToken: {
      // Auth.js uses the `__Host-` prefix here, which additionally forbids a Domain attribute.
      name: `${USE_SECURE_COOKIES ? "__Host-" : ""}${COOKIE_PREFIX}.csrf-token`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: USE_SECURE_COOKIES },
    },
  },
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

        try {
          const user = await apiFetch<AuthenticatedUserDto>("/auth/login", {
            method: "POST",
            body: { email, password },
          });
          return { ...user, id: user.id };
        } catch (error) {
          // 401 means bad credentials; anything else is a real fault worth seeing in the log.
          if (error instanceof ApiError && error.status === 401) return null;
          console.error("[auth] sign-in failed", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // Runs at sign-in only. The API already returned the permissions and the access token.
    jwt: async ({ token, user }) => {
      if (user?.id) {
        const authenticated = user as unknown as AuthenticatedUserDto;
        token.userId = authenticated.id;
        token.permissions = authenticated.permissions;
        token.accessToken = authenticated.accessToken;
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
        session.user.accessToken = typeof token.accessToken === "string" ? token.accessToken : "";
      }
      return session;
    },
  },
};
