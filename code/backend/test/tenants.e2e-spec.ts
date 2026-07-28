import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { Business } from '../src/tenants/schemas/business.schema';
import { TenantsController } from '../src/tenants/tenants.controller';
import { TenantsService } from '../src/tenants/tenants.service';

interface BusinessModelMock {
  exists: jest.Mock;
  create: jest.Mock;
}

const AVAILABILITY_PATH = '/api/v1/tenants/subdomain-availability';

describe('Tenants subdomain availability (e2e)', () => {
  let app: INestApplication<App>;
  let modelMock: BusinessModelMock;

  beforeEach(async () => {
    modelMock = { exists: jest.fn(), create: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        TenantsService,
        { provide: getModelToken(Business.name), useValue: modelMock },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => 'jpasoftware.com' },
        },
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
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
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

  it('reports the reserved registro subdomain as { available: false }', async () => {
    modelMock.exists.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .get(AVAILABILITY_PATH)
      .query({ subdomain: 'registro' })
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

  describe('POST /api/v1/tenants', () => {
    const REGISTER_PATH = '/api/v1/tenants';
    const validBody = {
      name: 'Barberia Paco',
      ownerEmail: 'paco@barberia-paco.test',
      subdomain: 'barberia-paco',
    };

    it('registers a tenant and returns 201 with only its public representation', async () => {
      modelMock.create.mockResolvedValue({
        _id: 'abc123',
        name: 'Barberia Paco',
        subdomain: 'barberia-paco',
        status: 'active',
        owner: { name: 'Barberia Paco', email: 'paco@barberia-paco.test' },
        schemaVersion: 1,
      });

      const response = await request(app.getHttpServer())
        .post(REGISTER_PATH)
        .send(validBody)
        .expect(201);

      const body = response.body as Record<string, unknown>;

      expect(Object.keys(body).sort()).toEqual([
        'id',
        'name',
        'portalUrl',
        'status',
        'subdomain',
      ]);
      expect(body).toEqual({
        id: 'abc123',
        name: 'Barberia Paco',
        subdomain: 'barberia-paco',
        status: 'active',
        portalUrl: 'https://barberia-paco.jpasoftware.com',
      });
      expect(body).not.toHaveProperty('_id');
      expect(body).not.toHaveProperty('tenantId');
      expect(body).not.toHaveProperty('owner');
      expect(body).not.toHaveProperty('schemaVersion');
    });

    it('returns 409 Conflict when the subdomain is already taken', async () => {
      modelMock.create.mockRejectedValue(
        Object.assign(new Error('dup'), { code: 11000 }),
      );

      await request(app.getHttpServer())
        .post(REGISTER_PATH)
        .send(validBody)
        .expect(409);
    });

    it.each([['registro'], ['www'], ['api'], ['admin'], ['app']])(
      'rejects the reserved subdomain %s with 400 without creating anything',
      async (subdomain) => {
        await request(app.getHttpServer())
          .post(REGISTER_PATH)
          .send({ ...validBody, subdomain })
          .expect(400);

        expect(modelMock.create).not.toHaveBeenCalled();
      },
    );

    it('rejects a body missing the subdomain with 400', async () => {
      await request(app.getHttpServer())
        .post(REGISTER_PATH)
        .send({ name: validBody.name, ownerEmail: validBody.ownerEmail })
        .expect(400);
    });

    it('rejects a non-email owner email with 400', async () => {
      await request(app.getHttpServer())
        .post(REGISTER_PATH)
        .send({ ...validBody, ownerEmail: 'not-an-email' })
        .expect(400);
    });

    it('rejects an undeclared extra property with 400', async () => {
      await request(app.getHttpServer())
        .post(REGISTER_PATH)
        .send({ ...validBody, role: 'admin' })
        .expect(400);
    });

    it('rejects an injected mongo operator body key with 400', async () => {
      await request(app.getHttpServer())
        .post(REGISTER_PATH)
        .send({ ...validBody, $gt: '' })
        .expect(400);
    });
  });
});
