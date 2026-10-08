import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard, OptionalJwtGuard } from "./jwt-auth.guard";
import { PermissionsGuard } from "./permissions.guard";

/** Matches the Auth.js session lifetime, so both expire together. */
const TOKEN_TTL = "30d";

@Global()
@Module({
  imports: [
    // registerAsync, not register: the factory runs after ConfigModule has loaded .env, whereas
    // register() is evaluated at import time when JWT_SECRET is still undefined.
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        // Failing at boot beats signing tokens nobody can verify and returning 500s all day.
        if (!secret) throw new Error("JWT_SECRET is not set.");
        return { secret, signOptions: { expiresIn: TOKEN_TTL } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, OptionalJwtGuard, PermissionsGuard],
  // JwtModule is re-exported so guards used in other modules can resolve JwtService.
  exports: [AuthService, JwtModule, JwtAuthGuard, OptionalJwtGuard, PermissionsGuard],
})
export class AuthModule {}
