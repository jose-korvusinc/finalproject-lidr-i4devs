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

const WORKING_HOURS_PATH = '/api/v1/working-hours';

interface WeeklyScheduleBody {
  weekday: string;
  isWorkingDay: boolean;
  openTime?: string;
  closeTime?: string;
  breakStart?: string;
  breakEnd?: string;
}

describe('Working hours (e2e)', () => {
  let app: INestApplication<App>;
  let seedConnection: Connection;

  const tenantA = new Types.ObjectId();
  const tenantB = new Types.ObjectId();
  const tenantEmpty = new Types.ObjectId();

  const seededSubdomains = ['acme', 'globex', 'emptyco'];
  const seededTenantIds = [tenantA, tenantB, tenantEmpty];

  const business = (id: Types.ObjectId, subdomain: string) => ({
    _id: id,
    name: subdomain,
    subdomain,
    status: 'active',
    owner: { name: subdomain, email: `owner@${subdomain}.test` },
    schemaVersion: 1,
  });

  const workingHour = (
    tenantId: Types.ObjectId,
    weekday: string,
    overrides: Record<string, unknown> = {},
  ) => ({
    tenantId,
    weekday,
    isWorkingDay: true,
    openTime: '09:00',
    closeTime: '18:00',
    schemaVersion: 1,
    ...overrides,
  });

  const cleanup = async (): Promise<void> => {
    await seedConnection
      .collection('businesses')
      .deleteMany({ subdomain: { $in: seededSubdomains } });
    await seedConnection
      .collection('workingHours')
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
        business(tenantA, 'acme'),
        business(tenantB, 'globex'),
        business(tenantEmpty, 'emptyco'),
      ]);

    await seedConnection.collection('workingHours').insertMany([
      workingHour(tenantA, 'fri', { isWorkingDay: false }),
      workingHour(tenantA, 'mon', {
        breakStart: '13:00',
        breakEnd: '14:00',
      }),
      workingHour(tenantA, 'wed'),
      workingHour(tenantB, 'tue'),
    ]);

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

  it('returns 200 with the tenant own weekly rules ordered mon->sun without internal fields', async () => {
    const response = await request(app.getHttpServer())
      .get(WORKING_HOURS_PATH)
      .set('Host', 'acme.example.com')
      .expect(200);

    const body = response.body as WeeklyScheduleBody[];

    expect(body).toHaveLength(3);
    expect(body.map((rule) => rule.weekday)).toEqual(['mon', 'wed', 'fri']);

    const monday = body[0];
    expect(monday).toMatchObject({
      weekday: 'mon',
      isWorkingDay: true,
      openTime: '09:00',
      closeTime: '18:00',
      breakStart: '13:00',
      breakEnd: '14:00',
    });
    expect(monday).not.toHaveProperty('_id');
    expect(monday).not.toHaveProperty('tenantId');
  });

  it('does not leak rules across tenants (tenant A never sees tenant B data)', async () => {
    const responseA = await request(app.getHttpServer())
      .get(WORKING_HOURS_PATH)
      .set('Host', 'acme.example.com')
      .expect(200);
    const weekdaysA = (responseA.body as WeeklyScheduleBody[]).map(
      (rule) => rule.weekday,
    );

    expect(weekdaysA).toEqual(['mon', 'wed', 'fri']);
    expect(weekdaysA).not.toContain('tue');

    const responseB = await request(app.getHttpServer())
      .get(WORKING_HOURS_PATH)
      .set('Host', 'globex.example.com')
      .expect(200);
    const weekdaysB = (responseB.body as WeeklyScheduleBody[]).map(
      (rule) => rule.weekday,
    );

    expect(weekdaysB).toEqual(['tue']);
    expect(weekdaysB).not.toContain('mon');
  });

  it('returns 200 with an empty list for a tenant without rules', async () => {
    const response = await request(app.getHttpServer())
      .get(WORKING_HOURS_PATH)
      .set('Host', 'emptyco.example.com')
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it('rejects a request without a resolvable tenant with 403 (fail-closed)', async () => {
    await request(app.getHttpServer())
      .get(WORKING_HOURS_PATH)
      .set('Host', 'localhost')
      .expect(403);
  });
});
