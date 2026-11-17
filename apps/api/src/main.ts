import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "@/app.module";
import { configureApp } from "@/app.setup";
import { env } from "@/config";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);

  const swagger = new DocumentBuilder()
    .setTitle("InspectFlow API")
    .setDescription(
      "Tester and client review demo. " +
        "Dashboard routes use a Bearer JWT; widget routes use X-InspectFlow-Key.",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, swagger));

  app.enableShutdownHooks();
  await app.listen(env.PORT, "127.0.0.1");
  console.log(`InspectFlow API listening on port ${env.PORT} (${env.NODE_ENV})`);
}

bootstrap();
