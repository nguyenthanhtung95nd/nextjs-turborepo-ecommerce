import { NextResponse, type NextRequest } from "next/server";
import { AuthError, signIn, signOut } from "@repo/auth";
import type { ApiErrorBody } from "@repo/contracts";

function failure(statusCode: number, message: string): NextResponse {
  return NextResponse.json({ statusCode, message } satisfies ApiErrorBody, { status: statusCode });
}

/**
 * Signs in and sets the session cookie.
 *
 * `redirect: false` keeps the outcome a value rather than a thrown redirect, which is what lets
 * the caller stay a plain fetch. Bad credentials come back as one message for every cause, so
 * the form cannot be used to discover which emails exist.
 */
export async function POST(request: NextRequest) {
  const { email, password } = (await request.json()) as { email?: string; password?: string };
  if (!email?.trim() || !password) return failure(400, "Enter your email and password.");

  try {
    await signIn("credentials", { email: email.trim(), password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) return failure(401, "Invalid email or password.");
    throw error;
  }

  return new NextResponse(null, { status: 204 });
}

/** Clears the session cookie. */
export async function DELETE() {
  await signOut({ redirect: false });
  return new NextResponse(null, { status: 204 });
}
