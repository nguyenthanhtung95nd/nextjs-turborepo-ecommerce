import type { DefaultSession } from "next-auth";

// Type the claims the session callback adds, so `session.user.id` / `.permissions` are typed
// wherever auth() is used. (The JWT isn't augmented: @auth/core's JWT already allows arbitrary
// keys, which the callback writes and narrows on read.)
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      permissions: string[];
    } & DefaultSession["user"];
  }
}
