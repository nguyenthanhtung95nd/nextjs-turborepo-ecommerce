import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { ApiErrorBody } from "@repo/contracts";
import type { Response } from "express";
import { ZodValidationException } from "nestjs-zod";
import type { ZodError } from "zod";

/** Gives every error one shape, and keeps internal detail out of the response body. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ZodValidationException) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Please fix the highlighted fields.",
        errors: toFieldErrors(exception),
      } satisfies ApiErrorBody);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json({ statusCode: status, message: exception.message });
      return;
    }

    // Anything unrecognised is a bug. Log it in full, tell the caller nothing.
    this.logger.error(
      "Unhandled exception",
      exception instanceof Error ? exception.stack : exception,
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Something went wrong.",
    } satisfies ApiErrorBody);
  }
}

/** One message per field; the first issue wins, because fixing it often fixes the rest. */
function toFieldErrors(exception: ZodValidationException): Record<string, string> {
  const errors: Record<string, string> = {};
  const zodError = exception.getZodError() as ZodError;
  for (const issue of zodError.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) errors[field] = issue.message;
  }
  return errors;
}
