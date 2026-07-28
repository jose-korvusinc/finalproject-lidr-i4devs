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

const AVAILABILITY_PATH = '/api/v1/availability';
const TARGET_DATE = '2026-07-10';

interface SlotBody {
  startsAt: string;
  endsAt: string;
}

describe('Availability (e2e)', () => {
  let app: INestApplication<App>;
  let seedConnection: Connection;

  const acmeTenantId = new Types.ObjectId();
  const globexTenantId = new Types.ObjectId();
  const serviceId = new Types.ObjectId();
  const employeeId = new Types.ObjectId();
  const customerId = new Types.ObjectId();
  const appointmentId = new Types.ObjectId();

  const seededSubdomains = ['acme', 'globex'];
  const seededTenantIds = [acmeTenantId, globexTenantId];

  const business = (id: Types.ObjectId, subdomain: string) => ({
    _id: id,
    name: subdomain,
    subdomain,
    status: 'active',
    owner: { name: subdomain, email: `owner@${subdomain}.test` },
    schemaVersion: 1,
  });

  const validQuery = (): Record<string, string> => ({
    serviceId: serviceId.toString(),
    employeeId: employeeId.toString(),
    date: TARGET_DATE,
  });

  const startsAtList = (body: SlotBody[]): string[] =>
    body.map((slot) => slot.startsAt);

  const cleanup = async (): Promise<void> => {
    await seedConnection
      .collection('businesses')
      .deleteMany({ subdomain: { $in: seededSubdomains } });
    await seedConnection
      .collection('workingHours')
      .deleteMany({ tenantId: { $in: seededTenantIds } });
    await seedConnection
      .collection('services')
      .deleteMany({ tenantId: { $in: seededTenantIds } });
    await seedConnection
      .collection('employees')
      .deleteMany({ tenantId: { $in: seededTenantIds } });
    await seedConnection
      .collection('appointments')
      .deleteMany({ tenantId: { $in: seededTenantIds } });
  };

  beforeAll(async () => {
    seedConnection = mongoose.createConnection(
      process.env.MONGODB_URI as string,
    );
    await seedConnection.asPromise();

    await cleanup();

    await seedConnection
      .collection('businesses')
      .insertMany([
        business(acmeTenantId, 'acme'),
        business(globexTenantId, 'globex'),
      ]);

    await seedConnection.collection('workingHours').insertOne({
      tenantId: acmeTenantId,
      weekday: 'fri',
      isWorkingDay: true,
      openTime: '09:00',
      closeTime: '18:00',
      breakStart: '14:00',
      breakEnd: '15:00',
      schemaVersion: 1,
    });

    await seedConnection.collection('services').insertOne({
      _id: serviceId,
      tenantId: acmeTenantId,
      name: 'Haircut',
      price: Types.Decimal128.fromString('25.00'),
      durationMinutes: 30,
      active: true,
      schemaVersion: 1,
    });

    await seedConnection.collection('employees').insertOne({
      _id: employeeId,
      tenantId: acmeTenantId,
      name: 'Ada',
      email: 'ada@acme.test',
      serviceIds: [serviceId],
      schemaVersion: 1,
    });

    await seedConnection.collection('appointments').insertOne({
      _id: appointmentId,
      tenantId: acmeTenantId,
      serviceId,
      employeeId,
      customerId,
      startTime: new Date(`${TARGET_DATE}T10:00:00.000Z`),
      endTime: new Date(`${TARGET_DATE}T10:30:00.000Z`),
      status: 'confirmed',
      schemaVersion: 1,
    });

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

  it('returns 200 with the free slots excluding the booked slot and the break', async () => {
    const response = await request(app.getHttpServer())
      .get(AVAILABILITY_PATH)
      .query(validQuery())
      .set('Host', 'acme.example.com')
      .expect(200);

    const body = response.body as SlotBody[];
    const starts = startsAtList(body);

    expect(body).toHaveLength(15);
    expect(starts).toContain(`${TARGET_DATE}T09:00:00.000Z`);
    expect(starts).toContain(`${TARGET_DATE}T15:00:00.000Z`);
    expect(starts).not.toContain(`${TARGET_DATE}T10:00:00.000Z`);
    expect(starts).not.toContain(`${TARGET_DATE}T14:00:00.000Z`);
    expect(starts).not.toContain(`${TARGET_DATE}T14:30:00.000Z`);

    expect(body[0]).toMatchObject({
      startsAt: `${TARGET_DATE}T09:00:00.000Z`,
      endsAt: `${TARGET_DATE}T09:30:00.000Z`,
    });
    expect(body[0]).not.toHaveProperty('_id');
    expect(body[0]).not.toHaveProperty('tenantId');
  });

  describe('validation', () => {
    it('rejects a serviceId that is not a mongo id with 400', async () => {
      await request(app.getHttpServer())
        .get(AVAILABILITY_PATH)
        .query({ ...validQuery(), serviceId: 'not-a-mongo-id' })
        .set('Host', 'acme.example.com')
        .expect(400);
    });

    it('rejects a missing date with 400', async () => {
      const { serviceId: sid, employeeId: eid } = validQuery();
      await request(app.getHttpServer())
        .get(AVAILABILITY_PATH)
        .query({ serviceId: sid, employeeId: eid })
        .set('Host', 'acme.example.com')
        .expect(400);
    });

    it('rejects a date that is not ISO 8601 with 400', async () => {
      await request(app.getHttpServer())
        .get(AVAILABILITY_PATH)
        .query({ ...validQuery(), date: '10-07-2026' })
        .set('Host', 'acme.example.com')
        .expect(400);
    });

    it('rejects an undeclared extra property with 400', async () => {
      await request(app.getHttpServer())
        .get(AVAILABILITY_PATH)
        .query({ ...validQuery(), role: 'admin' })
        .set('Host', 'acme.example.com')
        .expect(400);
    });
  });

  it('does not leak availability across tenants (globex never sees acme slots)', async () => {
    const acmeResponse = await request(app.getHttpServer())
      .get(AVAILABILITY_PATH)
      .query(validQuery())
      .set('Host', 'acme.example.com')
      .expect(200);
    const acmeStarts = startsAtList(acmeResponse.body as SlotBody[]);

    expect(acmeStarts).toContain(`${TARGET_DATE}T09:00:00.000Z`);
    expect(acmeStarts.length).toBeGreaterThan(0);

    const globexResponse = await request(app.getHttpServer())
      .get(AVAILABILITY_PATH)
      .query(validQuery())
      .set('Host', 'globex.example.com')
      .expect(200);
    const globexBody = globexResponse.body as SlotBody[];

    expect(globexBody).toEqual([]);
    expect(startsAtList(globexBody)).not.toContain(
      `${TARGET_DATE}T09:00:00.000Z`,
    );
  });

  it('rejects a request without a resolvable tenant with 403 (fail-closed)', async () => {
    await request(app.getHttpServer())
      .get(AVAILABILITY_PATH)
      .query(validQuery())
      .set('Host', 'localhost')
      .expect(403);
  });
});
