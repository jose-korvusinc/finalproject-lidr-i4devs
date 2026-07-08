import 'dotenv/config';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose, { Connection, Types } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

const SERVICES_PATH = '/api/v1/services';

interface ServiceBody {
  id: string;
  name: string;
  price: string;
  durationMinutes: number;
  active: boolean;
}

describe('Services (e2e)', () => {
  let app: INestApplication<App>;
  let seedConnection: Connection;

  const tenantA = new Types.ObjectId();
  const tenantB = new Types.ObjectId();
  const acmeServiceId = new Types.ObjectId();

  const seededSubdomains = ['acme', 'globex'];
  const seededTenantIds = [tenantA, tenantB];

  const business = (id: Types.ObjectId, subdomain: string) => ({
    _id: id,
    name: subdomain,
    subdomain,
    status: 'active',
    owner: { name: subdomain, email: `owner@${subdomain}.test` },
    schemaVersion: 1,
  });

  const serviceDoc = (
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
    overrides: Record<string, unknown> = {},
  ) => ({
    _id: id,
    tenantId,
    name: 'Haircut',
    price: Types.Decimal128.fromString('25.00'),
    durationMinutes: 30,
    active: true,
    schemaVersion: 1,
    ...overrides,
  });

  const cleanServices = async (): Promise<void> => {
    await seedConnection
      .collection('services')
      .deleteMany({ tenantId: { $in: seededTenantIds } });
  };

  const cleanup = async (): Promise<void> => {
    await seedConnection
      .collection('businesses')
      .deleteMany({ subdomain: { $in: seededSubdomains } });
    await cleanServices();
  };

  const seedIsolationService = async (): Promise<void> => {
    await cleanServices();
    await seedConnection
      .collection('services')
      .insertOne(serviceDoc(tenantA, acmeServiceId));
  };

  beforeAll(async () => {
    seedConnection = mongoose.createConnection(
      process.env.MONGODB_URI as string,
    );
    await seedConnection.asPromise();

    await cleanup();

    await seedConnection
      .collection('businesses')
      .insertMany([business(tenantA, 'acme'), business(tenantB, 'globex')]);

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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

  afterAll(async () => {
    await cleanup();
    await app.close();
    await seedConnection.close();
  });

  describe('POST /api/v1/services', () => {
    beforeEach(async () => {
      await cleanServices();
    });

    it('creates a service for the tenant and returns 201 with the public contract', async () => {
      const response = await request(app.getHttpServer())
        .post(SERVICES_PATH)
        .set('Host', 'acme.example.com')
        .send({ name: 'Massage', price: '40.00', durationMinutes: 60 })
        .expect(201);

      const body = response.body as ServiceBody;

      expect(body).toMatchObject({
        name: 'Massage',
        price: '40.00',
        durationMinutes: 60,
        active: true,
      });
      expect(typeof body.id).toBe('string');
      expect(body).not.toHaveProperty('_id');
      expect(body).not.toHaveProperty('tenantId');

      const list = await request(app.getHttpServer())
        .get(SERVICES_PATH)
        .set('Host', 'acme.example.com')
        .expect(200);

      const names = (list.body as ServiceBody[]).map((service) => service.name);
      expect(names).toContain('Massage');
    });

    it('rejects a non-positive durationMinutes with 400', async () => {
      await request(app.getHttpServer())
        .post(SERVICES_PATH)
        .set('Host', 'acme.example.com')
        .send({ name: 'Massage', price: '40.00', durationMinutes: 0 })
        .expect(400);
    });

    it('rejects an invalid price format with 400', async () => {
      await request(app.getHttpServer())
        .post(SERVICES_PATH)
        .set('Host', 'acme.example.com')
        .send({ name: 'Massage', price: 'free', durationMinutes: 60 })
        .expect(400);
    });

    it('rejects a body carrying a tenantId because the tenant never comes from the body', async () => {
      await request(app.getHttpServer())
        .post(SERVICES_PATH)
        .set('Host', 'acme.example.com')
        .send({
          name: 'Massage',
          price: '40.00',
          durationMinutes: 60,
          tenantId: tenantB.toString(),
        })
        .expect(400);
    });

    it('rejects a body with an undeclared property (whitelist)', async () => {
      await request(app.getHttpServer())
        .post(SERVICES_PATH)
        .set('Host', 'acme.example.com')
        .send({
          name: 'Massage',
          price: '40.00',
          durationMinutes: 60,
          active: false,
        })
        .expect(400);
    });

    it('rejects a POST without a resolvable tenant with 403 (fail-closed)', async () => {
      await request(app.getHttpServer())
        .post(SERVICES_PATH)
        .set('Host', 'localhost')
        .send({ name: 'Massage', price: '40.00', durationMinutes: 60 })
        .expect(403);
    });
  });

  describe('GET /api/v1/services', () => {
    beforeEach(async () => {
      await seedIsolationService();
    });

    it('returns the tenant own services without internal fields', async () => {
      const response = await request(app.getHttpServer())
        .get(SERVICES_PATH)
        .set('Host', 'acme.example.com')
        .expect(200);

      const body = response.body as ServiceBody[];
      const seeded = body.find(
        (service) => service.id === acmeServiceId.toString(),
      );

      expect(seeded).toBeDefined();
      expect(seeded).toMatchObject({
        name: 'Haircut',
        price: '25.00',
        durationMinutes: 30,
        active: true,
      });
      expect(seeded).not.toHaveProperty('_id');
      expect(seeded).not.toHaveProperty('tenantId');
    });

    it('rejects a GET without a resolvable tenant with 403 (fail-closed)', async () => {
      await request(app.getHttpServer())
        .get(SERVICES_PATH)
        .set('Host', 'localhost')
        .expect(403);
    });
  });

  describe('tenant isolation', () => {
    beforeEach(async () => {
      await seedIsolationService();
    });

    it('does not leak a service from acme into the globex list', async () => {
      const acmeList = await request(app.getHttpServer())
        .get(SERVICES_PATH)
        .set('Host', 'acme.example.com')
        .expect(200);
      const acmeIds = (acmeList.body as ServiceBody[]).map(
        (service) => service.id,
      );
      expect(acmeIds).toContain(acmeServiceId.toString());

      const globexList = await request(app.getHttpServer())
        .get(SERVICES_PATH)
        .set('Host', 'globex.example.com')
        .expect(200);
      const globexIds = (globexList.body as ServiceBody[]).map(
        (service) => service.id,
      );
      expect(globexIds).not.toContain(acmeServiceId.toString());
    });

    it('returns 404 when globex reads a service that belongs to acme', async () => {
      await request(app.getHttpServer())
        .get(`${SERVICES_PATH}/${acmeServiceId.toString()}`)
        .set('Host', 'globex.example.com')
        .expect(404);
    });

    it('returns 200 with the service when acme reads its own service', async () => {
      const response = await request(app.getHttpServer())
        .get(`${SERVICES_PATH}/${acmeServiceId.toString()}`)
        .set('Host', 'acme.example.com')
        .expect(200);

      const body = response.body as ServiceBody;
      expect(body).toMatchObject({
        id: acmeServiceId.toString(),
        name: 'Haircut',
        price: '25.00',
        durationMinutes: 30,
        active: true,
      });
      expect(body).not.toHaveProperty('tenantId');
    });
  });
});
