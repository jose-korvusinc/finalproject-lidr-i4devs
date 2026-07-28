import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_DOCS_PATH = 'api/docs';

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Bookings API')
    .setDescription(
      'Multitenant SaaS booking platform backend. Routes are served under the ' +
        'global prefix "api" with URI versioning (/api/v1/...).',
    )
    .setVersion('1.0')
    .addTag('tenants', 'Tenant registration (public, pre-tenant)')
    .build();

  return SwaggerModule.createDocument(app, config);
}
