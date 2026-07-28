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

const EMPLOYEES_PATH = '/api/v1/employees';

interface EmployeeBody {
  id: string;
  name: string;
  email: string;
  serviceIds: string[];
}

describe('Employees (e2e)', () => {
  let app: INestApplication<App>;
  let seedConnection: Connection;

  const tenantA = new Types.ObjectId();
  const tenantB = new Types.ObjectId();
  const acmeServiceId = new Types.ObjectId();
  const globexServiceId = new Types.ObjectId();
  const acmeEmployeeId = new Types.ObjectId();

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

  const serviceDoc = (tenantId: Types.ObjectId, id: Types.ObjectId) => ({
    _id: id,
    tenantId,
    name: 'Haircut',
    price: Types.Decimal128.fromString('25.00'),
    durationMinutes: 30,
    active: true,
    schemaVersion: 1,
  });

  const employeeDoc = (tenantId: Types.ObjectId, id: Types.ObjectId) => ({
    _id: id,
    tenantId,
    name: 'Ada Lovelace',
    email: 'ada@acme.test',
    serviceIds: [acmeServiceId],
    schemaVersion: 1,
  });

  const cleanEmployees = async (): Promise<void> => {
    await seedConnection
      .collection('employees')
      .deleteMany({ tenantId: { $in: seededTenantIds } });
  };

  const cleanServices = async (): Promise<void> => {
    await seedConnection
      .collection('services')
      .deleteMany({ tenantId: { $in: seededTenantIds } });
  };

  const cleanup = async (): Promise<void> => {
    await seedConnection
      .collection('businesses')
      .deleteMany({ subdomain: { $in: seededSubdomains } });
    await cleanEmployees();
    await cleanServices();
  };

  const seedServices = async (): Promise<void> => {
    await cleanServices();
    await seedConnection
      .collection('services')
      .insertMany([
        serviceDoc(tenantA, acmeServiceId),
        serviceDoc(tenantB, globexServiceId),
      ]);
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

  describe('POST /api/v1/employees', () => {
    beforeEach(async () => {
      await cleanEmployees();
      await seedServices();
    });

    it('creates an employee with a service assignment and returns 201 with the public contract', async () => {
      const response = await request(app.getHttpServer())
        .post(EMPLOYEES_PATH)
        .set('Host', 'acme.example.com')
        .send({
          name: 'Grace Hopper',
          email: 'grace@acme.test',
          serviceIds: [acmeServiceId.toString()],
        })
        .expect(201);

      const body = response.body as EmployeeBody;

      expect(body).toMatchObject({
        name: 'Grace Hopper',
        email: 'grace@acme.test',
      });
      expect(body.serviceIds).toEqual([acmeServiceId.toString()]);
      expect(typeof body.id).toBe('string');
      expect(body).not.toHaveProperty('_id');
      expect(body).not.toHaveProperty('tenantId');

      const list = await request(app.getHttpServer())
        .get(EMPLOYEES_PATH)
        .set('Host', 'acme.example.com')
        .expect(200);

      const emails = (list.body as EmployeeBody[]).map(
        (employee) => employee.email,
      );
      expect(emails).toContain('grace@acme.test');
    });

    it('rejects assigning a service that does not exist in the tenant without creating the employee', async () => {
      const unknownServiceId = new Types.ObjectId();

      const response = await request(app.getHttpServer())
        .post(EMPLOYEES_PATH)
        .set('Host', 'acme.example.com')
        .send({
          name: 'Grace Hopper',
          email: 'grace@acme.test',
          serviceIds: [unknownServiceId.toString()],
        });

      expect([400, 404]).toContain(response.status);

      const list = await request(app.getHttpServer())
        .get(EMPLOYEES_PATH)
        .set('Host', 'acme.example.com')
        .expect(200);

      const emails = (list.body as EmployeeBody[]).map(
        (employee) => employee.email,
      );
      expect(emails).not.toContain('grace@acme.test');
    });

    it('rejects an invalid email with 400', async () => {
      await request(app.getHttpServer())
        .post(EMPLOYEES_PATH)
        .set('Host', 'acme.example.com')
        .send({
          name: 'Grace Hopper',
          email: 'not-an-email',
          serviceIds: [],
        })
        .expect(400);
    });

    it('rejects a serviceIds element that is not a mongo id with 400', async () => {
      await request(app.getHttpServer())
        .post(EMPLOYEES_PATH)
        .set('Host', 'acme.example.com')
        .send({
          name: 'Grace Hopper',
          email: 'grace@acme.test',
          serviceIds: ['not-a-mongo-id'],
        })
        .expect(400);
    });

    it('rejects a body carrying a tenantId because the tenant never comes from the body', async () => {
      await request(app.getHttpServer())
        .post(EMPLOYEES_PATH)
        .set('Host', 'acme.example.com')
        .send({
          name: 'Grace Hopper',
          email: 'grace@acme.test',
          serviceIds: [],
          tenantId: tenantB.toString(),
        })
        .expect(400);
    });

    it('rejects a POST without a resolvable tenant with 403 (fail-closed)', async () => {
      await request(app.getHttpServer())
        .post(EMPLOYEES_PATH)
        .set('Host', 'localhost')
        .send({
          name: 'Grace Hopper',
          email: 'grace@acme.test',
          serviceIds: [],
        })
        .expect(403);
    });
  });

  describe('GET /api/v1/employees', () => {
    beforeEach(async () => {
      await cleanEmployees();
      await seedServices();
      await seedConnection
        .collection('employees')
        .insertOne(employeeDoc(tenantA, acmeEmployeeId));
    });

    it('returns the tenant own employees without internal fields', async () => {
      const response = await request(app.getHttpServer())
        .get(EMPLOYEES_PATH)
        .set('Host', 'acme.example.com')
        .expect(200);

      const seeded = (response.body as EmployeeBody[]).find(
        (employee) => employee.id === acmeEmployeeId.toString(),
      );

      expect(seeded).toBeDefined();
      expect(seeded).toMatchObject({
        name: 'Ada Lovelace',
        email: 'ada@acme.test',
      });
      expect(seeded).not.toHaveProperty('_id');
      expect(seeded).not.toHaveProperty('tenantId');
    });

    it('rejects a GET without a resolvable tenant with 403 (fail-closed)', async () => {
      await request(app.getHttpServer())
        .get(EMPLOYEES_PATH)
        .set('Host', 'localhost')
        .expect(403);
    });
  });

  describe('tenant isolation', () => {
    beforeEach(async () => {
      await cleanEmployees();
      await seedServices();
      await seedConnection
        .collection('employees')
        .insertOne(employeeDoc(tenantA, acmeEmployeeId));
    });

    it('lists an acme employee for acme but never leaks it into the globex list', async () => {
      const acmeList = await request(app.getHttpServer())
        .get(EMPLOYEES_PATH)
        .set('Host', 'acme.example.com')
        .expect(200);
      const acmeIds = (acmeList.body as EmployeeBody[]).map(
        (employee) => employee.id,
      );
      expect(acmeIds).toContain(acmeEmployeeId.toString());

      const globexList = await request(app.getHttpServer())
        .get(EMPLOYEES_PATH)
        .set('Host', 'globex.example.com')
        .expect(200);
      const globexIds = (globexList.body as EmployeeBody[]).map(
        (employee) => employee.id,
      );
      expect(globexIds).not.toContain(acmeEmployeeId.toString());
    });

    it('returns 404 when globex reads an employee that belongs to acme', async () => {
      await request(app.getHttpServer())
        .get(`${EMPLOYEES_PATH}/${acmeEmployeeId.toString()}`)
        .set('Host', 'globex.example.com')
        .expect(404);
    });

    it('rejects acme assigning a service that belongs to globex as if it did not exist', async () => {
      const response = await request(app.getHttpServer())
        .post(EMPLOYEES_PATH)
        .set('Host', 'acme.example.com')
        .send({
          name: 'Grace Hopper',
          email: 'grace@acme.test',
          serviceIds: [globexServiceId.toString()],
        });

      expect([400, 404]).toContain(response.status);

      const list = await request(app.getHttpServer())
        .get(EMPLOYEES_PATH)
        .set('Host', 'acme.example.com')
        .expect(200);
      const emails = (list.body as EmployeeBody[]).map(
        (employee) => employee.email,
      );
      expect(emails).not.toContain('grace@acme.test');
    });
  });
});
