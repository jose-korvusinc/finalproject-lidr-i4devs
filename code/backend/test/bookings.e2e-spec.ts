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

const BOOKINGS_PATH = '/api/v1/bookings';
const DURATION_MINUTES = 30;
const START_ISO = '2026-07-10T09:00:00.000Z';

interface BookingBody {
  id: string;
  status: string;
  startsAt: string;
}

describe('Bookings (e2e)', () => {
  let app: INestApplication<App>;
  let seedConnection: Connection;

  const tenantA = new Types.ObjectId();
  const tenantB = new Types.ObjectId();
  const acmeServiceId = new Types.ObjectId();
  const globexServiceId = new Types.ObjectId();
  const acmeEmployeeId = new Types.ObjectId();
  const globexEmployeeId = new Types.ObjectId();

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
    durationMinutes: DURATION_MINUTES,
    active: true,
    schemaVersion: 1,
  });

  const employeeDoc = (
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
    serviceId: Types.ObjectId,
  ) => ({
    _id: id,
    tenantId,
    name: 'Ada Lovelace',
    email: 'ada@acme.test',
    serviceIds: [serviceId],
    schemaVersion: 1,
  });

  const validCustomer = {
    name: 'Grace Hopper',
    email: 'grace@acme.test',
    phone: '+34600000000',
  };

  const acmeBooking = (startsAt: string = START_ISO) => ({
    serviceId: acmeServiceId.toString(),
    employeeId: acmeEmployeeId.toString(),
    startsAt,
    customer: validCustomer,
  });

  const cleanBusinessData = async (): Promise<void> => {
    await Promise.all(
      ['appointments', 'customers', 'services', 'employees'].map((collection) =>
        seedConnection
          .collection(collection)
          .deleteMany({ tenantId: { $in: seededTenantIds } }),
      ),
    );
  };

  const seedCatalog = async (): Promise<void> => {
    await seedConnection
      .collection('services')
      .insertMany([
        serviceDoc(tenantA, acmeServiceId),
        serviceDoc(tenantB, globexServiceId),
      ]);
    await seedConnection
      .collection('employees')
      .insertMany([
        employeeDoc(tenantA, acmeEmployeeId, acmeServiceId),
        employeeDoc(tenantB, globexEmployeeId, globexServiceId),
      ]);
  };

  const cleanup = async (): Promise<void> => {
    await seedConnection
      .collection('businesses')
      .deleteMany({ subdomain: { $in: seededSubdomains } });
    await cleanBusinessData();
  };

  const countAppointments = (
    tenantId: Types.ObjectId,
    filter: Record<string, unknown> = {},
  ): Promise<number> =>
    seedConnection
      .collection('appointments')
      .countDocuments({ tenantId, ...filter });

  const countCustomers = (
    tenantId: Types.ObjectId,
    filter: Record<string, unknown> = {},
  ): Promise<number> =>
    seedConnection
      .collection('customers')
      .countDocuments({ tenantId, ...filter });

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

  beforeEach(async () => {
    await cleanBusinessData();
    await seedCatalog();
  });

  describe('POST /api/v1/bookings', () => {
    it('locks the slot creating a pending appointment and a customer for the tenant (201)', async () => {
      const response = await request(app.getHttpServer())
        .post(BOOKINGS_PATH)
        .set('Host', 'acme.example.com')
        .send(acmeBooking())
        .expect(201);

      const body = response.body as BookingBody;
      expect(typeof body.id).toBe('string');
      expect(body.status).toBe('pending');
      expect(body.startsAt).toBe(START_ISO);
      expect(body).not.toHaveProperty('_id');
      expect(body).not.toHaveProperty('tenantId');
      expect(body).not.toHaveProperty('customer');

      expect(
        await countAppointments(tenantA, {
          employeeId: acmeEmployeeId,
          startTime: new Date(START_ISO),
          status: 'pending',
        }),
      ).toBe(1);
      expect(await countCustomers(tenantA, { email: 'grace@acme.test' })).toBe(
        1,
      );
    });

    it('rejects a second booking of the same employee and slot with 409 and keeps a single appointment (no double booking)', async () => {
      await request(app.getHttpServer())
        .post(BOOKINGS_PATH)
        .set('Host', 'acme.example.com')
        .send(acmeBooking())
        .expect(201);

      await request(app.getHttpServer())
        .post(BOOKINGS_PATH)
        .set('Host', 'acme.example.com')
        .send(acmeBooking())
        .expect(409);

      expect(
        await countAppointments(tenantA, {
          employeeId: acmeEmployeeId,
          startTime: new Date(START_ISO),
        }),
      ).toBe(1);
    });

    it('rejects an invalid contact email with 400 without locking a slot', async () => {
      await request(app.getHttpServer())
        .post(BOOKINGS_PATH)
        .set('Host', 'acme.example.com')
        .send({
          ...acmeBooking(),
          customer: { ...validCustomer, email: 'not-an-email' },
        })
        .expect(400);

      expect(await countAppointments(tenantA)).toBe(0);
    });

    it('rejects an empty contact name with 400 without locking a slot', async () => {
      await request(app.getHttpServer())
        .post(BOOKINGS_PATH)
        .set('Host', 'acme.example.com')
        .send({
          ...acmeBooking(),
          customer: { ...validCustomer, name: '' },
        })
        .expect(400);

      expect(await countAppointments(tenantA)).toBe(0);
    });

    it('rejects a body carrying a tenantId because the tenant never comes from the body (400)', async () => {
      await request(app.getHttpServer())
        .post(BOOKINGS_PATH)
        .set('Host', 'acme.example.com')
        .send({ ...acmeBooking(), tenantId: tenantB.toString() })
        .expect(400);
    });

    it('rejects a POST without a resolvable tenant with 403 (fail-closed)', async () => {
      await request(app.getHttpServer())
        .post(BOOKINGS_PATH)
        .set('Host', 'localhost')
        .send(acmeBooking())
        .expect(403);
    });
  });

  describe('tenant isolation (no cross-tenant booking)', () => {
    it('keeps an acme booking out of the globex appointment space', async () => {
      await request(app.getHttpServer())
        .post(BOOKINGS_PATH)
        .set('Host', 'acme.example.com')
        .send(acmeBooking())
        .expect(201);

      expect(await countAppointments(tenantA)).toBe(1);
      expect(await countAppointments(tenantB)).toBe(0);
    });

    it('rejects globex booking with an acme service and employee as if they did not exist (400) and writes nothing into acme', async () => {
      const response = await request(app.getHttpServer())
        .post(BOOKINGS_PATH)
        .set('Host', 'globex.example.com')
        .send({
          serviceId: acmeServiceId.toString(),
          employeeId: acmeEmployeeId.toString(),
          startsAt: START_ISO,
          customer: validCustomer,
        });

      expect(response.status).toBe(400);
      expect(await countAppointments(tenantA)).toBe(0);
      expect(await countAppointments(tenantB)).toBe(0);
    });
  });
});
