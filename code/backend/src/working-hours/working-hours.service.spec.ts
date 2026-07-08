import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { WeeklyScheduleResponseDto } from '../tenants/dto/weekly-schedule-response.dto';
import { WorkingHours } from '../tenants/schemas/working-hours.schema';
import { WorkingHoursService } from './working-hours.service';

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
});
