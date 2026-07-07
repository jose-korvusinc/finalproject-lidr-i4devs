import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { Business } from '../src/tenants/schemas/business.schema';
import { TenantsController } from '../src/tenants/tenants.controller';
import { TenantsService } from '../src/tenants/tenants.service';

interface BusinessModelMock {
  exists: jest.Mock;
}

const AVAILABILITY_PATH = '/api/v1/tenants/subdomain-availability';

describe('Tenants subdomain availability (e2e)', () => {
  let app: INestApplication<App>;
  let modelMock: BusinessModelMock;

  beforeEach(async () => {
    modelMock = { exists: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        TenantsService,
        { provide: getModelToken(Business.name), useValue: modelMock },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('reports an available subdomain as { available: true }', async () => {
    modelMock.exists.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .get(AVAILABILITY_PATH)
      .query({ subdomain: 'barberia-ana' })
      .expect(200);

    expect(response.body).toEqual({ available: true });
  });

  it('reports a taken subdomain as { available: false }', async () => {
    modelMock.exists.mockResolvedValue({ _id: 'existing-id' });

    const response = await request(app.getHttpServer())
      .get(AVAILABILITY_PATH)
      .query({ subdomain: 'barberia-paco' })
      .expect(200);

    expect(response.body).toEqual({ available: false });
  });

  it('rejects a request without the subdomain query with 400', async () => {
    await request(app.getHttpServer()).get(AVAILABILITY_PATH).expect(400);
  });

  it('rejects an invalid subdomain slug with 400', async () => {
    await request(app.getHttpServer())
      .get(AVAILABILITY_PATH)
      .query({ subdomain: 'Invalid.Sub' })
      .expect(400);
  });

  it('rejects an undeclared extra query property with 400', async () => {
    await request(app.getHttpServer())
      .get(AVAILABILITY_PATH)
      .query({ subdomain: 'barberia-ana', role: 'admin' })
      .expect(400);
  });

  it('rejects an injected mongo operator query key with 400', async () => {
    await request(app.getHttpServer())
      .get(AVAILABILITY_PATH)
      .query({ subdomain: 'barberia-ana', $gt: '' })
      .expect(400);
  });
});
