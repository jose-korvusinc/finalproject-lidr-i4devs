import { Module, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Business } from '../src/tenants/schemas/business.schema';
import { TenantsController } from '../src/tenants/tenants.controller';
import { TenantsService } from '../src/tenants/tenants.service';
import { buildOpenApiDocument } from '../src/swagger';

@Module({
  controllers: [TenantsController],
  providers: [
    TenantsService,
    { provide: getModelToken(Business.name), useValue: {} },
    { provide: ConfigService, useValue: { getOrThrow: () => 'example.com' } },
  ],
})
class OpenApiModule {}

async function generate(): Promise<void> {
  const app = await NestFactory.create(OpenApiModule, { logger: false });
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });

  const document = buildOpenApiDocument(app);
  const outputPath = join(__dirname, '..', 'openapi.json');
  writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);

  await app.close();
  process.stdout.write(`OpenAPI document written to ${outputPath}\n`);
}

void generate();
