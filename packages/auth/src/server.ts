import NextAuth from "next-auth";
import { authConfig } from "./config";

// The one NextAuth instance. Each app imports these; transpilePackages bundles a copy into
// the app, which signs tokens with its own AUTH_SECRET. Living here lets the guard use auth().
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
