import type { DefaultSession } from "next-auth";

// Types the claims the session callback adds. `accessToken` is the API credential; it stays
// inside the httpOnly cookie and never reaches the browser.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      permissions: string[];
      accessToken: string;
    } & DefaultSession["user"];
  }
}
