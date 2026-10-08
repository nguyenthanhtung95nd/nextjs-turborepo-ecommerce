import {
  CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Permission } from "@repo/contracts";
import type { AuthedRequest } from "./jwt-auth.guard";

const PERMISSIONS_KEY = "permissions";

/** Declares which permissions a route needs. Enforced by `PermissionsGuard`. */
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * The real authorization check. Hiding a button is cosmetic; this runs on every request.
 *
 * Must be listed after `JwtAuthGuard`, which is what puts the caller on the request.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const user = context.switchToHttp().getRequest<AuthedRequest>().user;
    const granted = user?.permissions ?? [];
    const missing = required.filter((permission) => !granted.includes(permission));

    if (missing.length > 0) {
      throw new ForbiddenException(`You do not have permission to do that.`);
    }
    return true;
  }
}
