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

  describe('PUT /api/v1/working-hours', () => {
    const fullWeek = (): { days: WeeklyScheduleBody[] } => ({
      days: [
        {
          weekday: 'mon',
          isWorkingDay: true,
          openTime: '09:00',
          closeTime: '18:00',
          breakStart: '14:00',
          breakEnd: '15:00',
        },
        {
          weekday: 'tue',
          isWorkingDay: true,
          openTime: '09:00',
          closeTime: '18:00',
          breakStart: '14:00',
          breakEnd: '15:00',
        },
        {
          weekday: 'wed',
          isWorkingDay: true,
          openTime: '09:00',
          closeTime: '18:00',
          breakStart: '14:00',
          breakEnd: '15:00',
        },
        {
          weekday: 'thu',
          isWorkingDay: true,
          openTime: '09:00',
          closeTime: '18:00',
          breakStart: '14:00',
          breakEnd: '15:00',
        },
        {
          weekday: 'fri',
          isWorkingDay: true,
          openTime: '09:00',
          closeTime: '18:00',
          breakStart: '14:00',
          breakEnd: '15:00',
        },
      ],
    });

    beforeEach(async () => {
      await seedConnection
        .collection('workingHours')
        .deleteMany({ tenantId: tenantA });
    });

    it('persists the weekly schedule and returns 200 with the saved rules ordered mon->sun', async () => {
      const putResponse = await request(app.getHttpServer())
        .put(WORKING_HOURS_PATH)
        .set('Host', 'acme.example.com')
        .send(fullWeek())
        .expect(200);

      const putBody = putResponse.body as WeeklyScheduleBody[];

      expect(putBody).toHaveLength(5);
      expect(putBody.map((rule) => rule.weekday)).toEqual([
        'mon',
        'tue',
        'wed',
        'thu',
        'fri',
      ]);
      expect(putBody[0]).toMatchObject({
        weekday: 'mon',
        isWorkingDay: true,
        openTime: '09:00',
        closeTime: '18:00',
        breakStart: '14:00',
        breakEnd: '15:00',
      });
      expect(putBody[0]).not.toHaveProperty('_id');
      expect(putBody[0]).not.toHaveProperty('tenantId');

      const getResponse = await request(app.getHttpServer())
        .get(WORKING_HOURS_PATH)
        .set('Host', 'acme.example.com')
        .expect(200);

      const getBody = getResponse.body as WeeklyScheduleBody[];

      expect(getBody.map((rule) => rule.weekday)).toEqual([
        'mon',
        'tue',
        'wed',
        'thu',
        'fri',
      ]);
      expect(getBody[0]).toMatchObject({
        weekday: 'mon',
        openTime: '09:00',
        closeTime: '18:00',
        breakStart: '14:00',
        breakEnd: '15:00',
      });
    });

    it('updates an existing day without creating duplicates', async () => {
      await request(app.getHttpServer())
        .put(WORKING_HOURS_PATH)
        .set('Host', 'acme.example.com')
        .send(fullWeek())
        .expect(200);

      const countBefore = await seedConnection
        .collection('workingHours')
        .countDocuments({ tenantId: tenantA });

      const changed = fullWeek();
      changed.days = changed.days.map((day) =>
        day.weekday === 'fri' ? { ...day, closeTime: '17:00' } : day,
      );

      await request(app.getHttpServer())
        .put(WORKING_HOURS_PATH)
        .set('Host', 'acme.example.com')
        .send(changed)
        .expect(200);

      const countAfter = await seedConnection
        .collection('workingHours')
        .countDocuments({ tenantId: tenantA });

      expect(countAfter).toBe(countBefore);

      const getResponse = await request(app.getHttpServer())
        .get(WORKING_HOURS_PATH)
        .set('Host', 'acme.example.com')
        .expect(200);

      const friday = (getResponse.body as WeeklyScheduleBody[]).find(
        (rule) => rule.weekday === 'fri',
      );
      expect(friday?.closeTime).toBe('17:00');
    });

    it('does not leak writes into another tenant space (isolation)', async () => {
      await request(app.getHttpServer())
        .put(WORKING_HOURS_PATH)
        .set('Host', 'acme.example.com')
        .send(fullWeek())
        .expect(200);

      const acmeGet = await request(app.getHttpServer())
        .get(WORKING_HOURS_PATH)
        .set('Host', 'acme.example.com')
        .expect(200);
      expect(
        (acmeGet.body as WeeklyScheduleBody[]).map((r) => r.weekday),
      ).toEqual(['mon', 'tue', 'wed', 'thu', 'fri']);

      const globexGet = await request(app.getHttpServer())
        .get(WORKING_HOURS_PATH)
        .set('Host', 'globex.example.com')
        .expect(200);
      const globexBody = globexGet.body as WeeklyScheduleBody[];
      expect(globexBody.map((rule) => rule.weekday)).toEqual(['tue']);
      expect(globexBody.find((rule) => rule.weekday === 'tue')).toMatchObject({
        weekday: 'tue',
        isWorkingDay: true,
        openTime: '09:00',
        closeTime: '18:00',
      });

      const leakedIntoGlobex = await seedConnection
        .collection('workingHours')
        .countDocuments({
          tenantId: tenantB,
          weekday: { $in: ['mon', 'wed', 'thu', 'fri'] },
        });
      expect(leakedIntoGlobex).toBe(0);
    });

    it('rejects a body carrying a tenantId because the tenant never comes from the body', async () => {
      await request(app.getHttpServer())
        .put(WORKING_HOURS_PATH)
        .set('Host', 'acme.example.com')
        .send({ ...fullWeek(), tenantId: tenantB.toString() })
        .expect(400);
    });

    it('rejects an invalid schedule where openTime is not before closeTime with 400', async () => {
      await request(app.getHttpServer())
        .put(WORKING_HOURS_PATH)
        .set('Host', 'acme.example.com')
        .send({
          days: [
            {
              weekday: 'mon',
              isWorkingDay: true,
              openTime: '18:00',
              closeTime: '09:00',
            },
          ],
        })
        .expect(400);
    });

    it('rejects a schedule with duplicated weekdays with 400', async () => {
      await request(app.getHttpServer())
        .put(WORKING_HOURS_PATH)
        .set('Host', 'acme.example.com')
        .send({
          days: [
            {
              weekday: 'mon',
              isWorkingDay: true,
              openTime: '09:00',
              closeTime: '18:00',
            },
            {
              weekday: 'mon',
              isWorkingDay: true,
              openTime: '10:00',
              closeTime: '17:00',
            },
          ],
        })
        .expect(400);
    });

    it('rejects a PUT without a resolvable tenant with 403 (fail-closed)', async () => {
      await request(app.getHttpServer())
        .put(WORKING_HOURS_PATH)
        .set('Host', 'localhost')
        .send(fullWeek())
        .expect(403);
    });
  });
});
