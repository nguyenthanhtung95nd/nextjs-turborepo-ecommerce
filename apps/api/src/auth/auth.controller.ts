import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { changePasswordSchema, loginSchema, registerSchema } from "@repo/contracts";
import { createZodDto } from "nestjs-zod";
import { AuthService } from "./auth.service";
import { type AuthedRequest, JwtAuthGuard } from "./jwt-auth.guard";

class LoginDto extends createZodDto(loginSchema) {}
class RegisterDto extends createZodDto(registerSchema) {}
class ChangePasswordDto extends createZodDto(changePasswordSchema) {}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Exchange credentials for an access token",
    description:
      "Returns 401 with one message for an unknown email, a wrong password or a deactivated account.",
  })
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }

  @Post("register")
  @ApiOperation({
    summary: "Create a customer account and sign in",
    description: "The new account gets no roles, so it can never reach the back office.",
  })
  register(@Body() body: RegisterDto) {
    return this.auth.register(body);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "The signed-in user and their current permissions",
    description: "Returns 401 once the account is deactivated, even with a token still in date.",
  })
  me(@Req() request: AuthedRequest) {
    return this.auth.currentUser(request.user!.id);
  }

  @Get("me/overview")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "The signed-in user with their roles and effective permissions" })
  overview(@Req() request: AuthedRequest) {
    return this.auth.overview(request.user!.id);
  }

  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Change your own password" })
  async changePassword(@Req() request: AuthedRequest, @Body() body: ChangePasswordDto) {
    await this.auth.changePassword(request.user!.id, body);
  }
}
