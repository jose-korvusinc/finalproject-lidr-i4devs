import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { SetWeeklyScheduleDto } from '../tenants/dto/set-weekly-schedule.dto';
import { WeeklyScheduleResponseDto } from '../tenants/dto/weekly-schedule-response.dto';
import { WorkingHours } from '../tenants/schemas/working-hours.schema';
import { WorkingHoursService } from './working-hours.service';

interface DayInput {
  weekday: string;
  isWorkingDay: boolean;
  openTime?: string;
  closeTime?: string;
  breakStart?: string;
  breakEnd?: string;
}

const dayInput = (
  weekday: string,
  overrides: Partial<DayInput> = {},
): DayInput => ({
  weekday,
  isWorkingDay: true,
  openTime: '09:00',
  closeTime: '18:00',
  breakStart: '14:00',
  breakEnd: '15:00',
  ...overrides,
});

const scheduleDto = (days: DayInput[]): SetWeeklyScheduleDto =>
  ({ days }) as unknown as SetWeeklyScheduleDto;

interface LeanWorkingHours {
  _id: string;
  tenantId: string;
  weekday: string;
  isWorkingDay: boolean;
  openTime?: string;
  closeTime?: string;
  breakStart?: string;
  breakEnd?: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

interface WorkingHoursModelMock {
  find: jest.Mock;
}

const leanDoc = (
  weekday: string,
  overrides: Partial<LeanWorkingHours> = {},
): LeanWorkingHours => ({
  _id: '665f1b2c9c1e4a0012ab34cd',
  tenantId: '665f1b2c9c1e4a0012abffff',
  weekday,
  isWorkingDay: true,
  openTime: '09:00',
  closeTime: '18:00',
  breakStart: '13:00',
  breakEnd: '14:00',
  schemaVersion: 1,
  createdAt: '2026-07-07T09:00:00.000Z',
  updatedAt: '2026-07-07T09:00:00.000Z',
  ...overrides,
});

describe('WorkingHoursService', () => {
  let service: WorkingHoursService;
  let modelMock: WorkingHoursModelMock;
  let leanMock: jest.Mock;

  const buildService = async (docs: LeanWorkingHours[]): Promise<void> => {
    leanMock = jest.fn().mockResolvedValue(docs);
    modelMock = { find: jest.fn().mockReturnValue({ lean: leanMock }) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        WorkingHoursService,
        { provide: getModelToken(WorkingHours.name), useValue: modelMock },
      ],
    }).compile();

    service = moduleRef.get(WorkingHoursService);
  };

  it('maps the tenant working hours to the public weekly schedule contract', async () => {
    await buildService([leanDoc('mon')]);

    const result = await service.list();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      weekday: 'mon',
      isWorkingDay: true,
      openTime: '09:00',
      closeTime: '18:00',
      breakStart: '13:00',
      breakEnd: '14:00',
    });
  });

  it('does not expose internal persistence fields in the mapped dto', async () => {
    await buildService([leanDoc('mon')]);

    const result = await service.list();

    expect(result[0]).not.toHaveProperty('_id');
    expect(result[0]).not.toHaveProperty('tenantId');
    expect(result[0]).not.toHaveProperty('schemaVersion');
    expect(result[0]).not.toHaveProperty('createdAt');
    expect(result[0]).not.toHaveProperty('updatedAt');
  });

  it('returns instances of the weekly schedule response dto', async () => {
    await buildService([leanDoc('mon')]);

    const result = await service.list();

    expect(result[0]).toBeInstanceOf(WeeklyScheduleResponseDto);
  });

  it('orders the schedule by weekday from monday to sunday even when unsorted', async () => {
    await buildService([leanDoc('fri'), leanDoc('mon'), leanDoc('wed')]);

    const result = await service.list();

    expect(result.map((rule) => rule.weekday)).toEqual(['mon', 'wed', 'fri']);
  });

  it('orders a full unsorted week from monday to sunday', async () => {
    await buildService([
      leanDoc('sun'),
      leanDoc('sat'),
      leanDoc('wed'),
      leanDoc('mon'),
      leanDoc('fri'),
      leanDoc('thu'),
      leanDoc('tue'),
    ]);

    const result = await service.list();

    expect(result.map((rule) => rule.weekday)).toEqual([
      'mon',
      'tue',
      'wed',
      'thu',
      'fri',
      'sat',
      'sun',
    ]);
  });

  it('resolves to an empty list when the tenant has no rules', async () => {
    await buildService([]);

    const result = await service.list();

    expect(result).toEqual([]);
  });

  it('reads through a lean projection without adding a manual tenant filter', async () => {
    await buildService([]);

    await service.list();

    expect(modelMock.find).toHaveBeenCalledTimes(1);
    expect(modelMock.find).toHaveBeenCalledWith({});
    expect(leanMock).toHaveBeenCalledTimes(1);
  });

  describe('save', () => {
    let saveService: WorkingHoursService;
    let updateOneMock: jest.Mock;
    let bulkWriteMock: jest.Mock;
    let insertManyMock: jest.Mock;
    let createMock: jest.Mock;
    let saveLeanMock: jest.Mock;
    let saveFindMock: jest.Mock;

    const buildSaveService = async (
      persisted: LeanWorkingHours[],
    ): Promise<void> => {
      updateOneMock = jest
        .fn()
        .mockResolvedValue({ acknowledged: true, upsertedCount: 1 });
      bulkWriteMock = jest.fn().mockResolvedValue({});
      insertManyMock = jest.fn().mockResolvedValue([]);
      createMock = jest.fn().mockResolvedValue({});
      saveLeanMock = jest.fn().mockResolvedValue(persisted);
      saveFindMock = jest.fn().mockReturnValue({ lean: saveLeanMock });

      const model = {
        updateOne: updateOneMock,
        bulkWrite: bulkWriteMock,
        insertMany: insertManyMock,
        create: createMock,
        find: saveFindMock,
      };

      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          WorkingHoursService,
          { provide: getModelToken(WorkingHours.name), useValue: model },
        ],
      }).compile();

      saveService = moduleRef.get(WorkingHoursService);
    };

    it('performs one tenant-scoped upsert per day of the schedule', async () => {
      await buildSaveService([]);

      const days = [
        dayInput('mon'),
        dayInput('tue'),
        dayInput('wed'),
        dayInput('thu'),
        dayInput('fri'),
      ];

      await saveService.save(scheduleDto(days));

      expect(updateOneMock).toHaveBeenCalledTimes(days.length);
      for (const day of days) {
        const setMatcher: unknown = expect.objectContaining({
          isWorkingDay: day.isWorkingDay,
          openTime: day.openTime,
          closeTime: day.closeTime,
          breakStart: day.breakStart,
          breakEnd: day.breakEnd,
        });
        expect(updateOneMock).toHaveBeenCalledWith(
          expect.objectContaining({ weekday: day.weekday }),
          expect.objectContaining({ $set: setMatcher }),
          expect.objectContaining({ upsert: true }),
        );
      }
    });

    it('never injects tenantId manually in the filter or the update payload', async () => {
      await buildSaveService([]);

      await saveService.save(scheduleDto([dayInput('mon')]));

      const [filter, update] = updateOneMock.mock.calls[0] as [
        Record<string, unknown>,
        { $set: Record<string, unknown> },
      ];

      expect(filter).not.toHaveProperty('tenantId');
      expect(filter).toHaveProperty('weekday', 'mon');
      expect(update.$set).not.toHaveProperty('tenantId');
    });

    it('does not use bulkWrite, insertMany or create to avoid bypassing the tenant plugin', async () => {
      await buildSaveService([]);

      await saveService.save(
        scheduleDto([dayInput('mon'), dayInput('tue'), dayInput('wed')]),
      );

      expect(bulkWriteMock).not.toHaveBeenCalled();
      expect(insertManyMock).not.toHaveBeenCalled();
      expect(createMock).not.toHaveBeenCalled();
    });

    it('returns the persisted schedule as public dtos ordered mon->sun', async () => {
      await buildSaveService([leanDoc('fri'), leanDoc('mon'), leanDoc('wed')]);

      const result = await saveService.save(
        scheduleDto([dayInput('mon'), dayInput('wed'), dayInput('fri')]),
      );

      expect(result.map((rule) => rule.weekday)).toEqual(['mon', 'wed', 'fri']);
      expect(result[0]).toBeInstanceOf(WeeklyScheduleResponseDto);
      expect(result[0]).not.toHaveProperty('_id');
      expect(result[0]).not.toHaveProperty('tenantId');
    });

    it('keeps day updates idempotent by upserting instead of inserting on repeated saves', async () => {
      await buildSaveService([]);

      await saveService.save(
        scheduleDto([dayInput('mon', { closeTime: '18:00' })]),
      );
      await saveService.save(
        scheduleDto([dayInput('mon', { closeTime: '17:00' })]),
      );

      expect(updateOneMock).toHaveBeenCalledTimes(2);
      const calls = updateOneMock.mock.calls as Array<
        [unknown, unknown, ({ upsert?: boolean } | undefined)?]
      >;
      const everyUpsert = calls.every((call) => call[2]?.upsert === true);
      expect(everyUpsert).toBe(true);
      expect(insertManyMock).not.toHaveBeenCalled();
      expect(createMock).not.toHaveBeenCalled();
    });
  });
});
