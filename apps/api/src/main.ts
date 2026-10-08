import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { cleanupOpenApiDoc } from "nestjs-zod";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/http-exception.filter";

const DEFAULT_PORT = 3002;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle("Commerce API")
    .setDescription("Catalog, identity and RBAC for the ADMIN and CLIENT projects.")
    .setVersion("1.0")
    .build();

  SwaggerModule.setup(
    "api/docs",
    app,
    cleanupOpenApiDoc(SwaggerModule.createDocument(app, config)),
  );

  await app.listen(process.env.PORT ?? DEFAULT_PORT);
}

void bootstrap();
