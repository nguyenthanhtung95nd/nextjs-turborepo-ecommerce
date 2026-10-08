import {
  CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { AuthService } from "./auth.service";

/** What a verified request carries. Read by `PermissionsGuard` and by controllers. */
export interface RequestUser {
  id: bigint;
  email: string;
  permissions: string[];
}

export interface AuthedRequest extends Request {
  user?: RequestUser;
}

function bearerToken(request: Request): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length) || null;
}

/**
 * Verifies the token and loads the caller's current permissions from the database.
 *
 * Permissions are re-read on every request rather than taken from the token: a role removed
 * after sign-in cannot reach a token that has already been issued.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = bearerToken(request);
    if (!token) throw new UnauthorizedException("Sign in to continue.");

    request.user = await verify(this.jwt, this.auth, token);
    return true;
  }
}

/**
 * Attaches the caller when a valid token is present, and lets anonymous requests through.
 *
 * Used by endpoints the storefront reads without signing in, where holding a permission still
 * widens what comes back — `GET /products` returning drafts to staff, for example.
 */
@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = bearerToken(request);
    if (!token) return true;

    try {
      request.user = await verify(this.jwt, this.auth, token);
    } catch {
      // A bad token is treated as no token here: the endpoint is public either way.
    }
    return true;
  }
}

async function verify(jwt: JwtService, auth: AuthService, token: string): Promise<RequestUser> {
  let payload: { sub?: string; email?: string };
  try {
    payload = await jwt.verifyAsync(token);
  } catch {
    throw new UnauthorizedException("Your session has expired. Sign in again.");
  }

  if (!payload.sub || !/^\d+$/.test(payload.sub)) {
    throw new UnauthorizedException("Sign in to continue.");
  }

  const userId = BigInt(payload.sub);
  // Throws when the account was deactivated after the token was issued.
  const user = await auth.currentUser(userId);

  return { id: userId, email: user.email, permissions: user.permissions };
}
