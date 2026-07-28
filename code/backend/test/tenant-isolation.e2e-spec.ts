import 'dotenv/config';
import { ForbiddenException } from '@nestjs/common';
import mongoose, {
  Connection,
  HydratedDocument,
  Model,
  Schema,
} from 'mongoose';
import { tenantStorage } from '../src/tenants/context/tenant-context.storage';
import { tenantScopePlugin } from '../src/tenants/plugins/tenant-scope.plugin';

interface Fixture {
  tenantId: mongoose.Types.ObjectId;
  name: string;
}

const COLLECTION = '__tenant_isolation_fixtures';

describe('Tenant isolation (e2e)', () => {
  let connection: Connection;
  let fixtureModel: Model<Fixture>;
  const tenantA = new mongoose.Types.ObjectId();
  const tenantB = new mongoose.Types.ObjectId();

  const asTenant = <T>(tenantId: string, cb: () => Promise<T>): Promise<T> =>
    tenantStorage.run({ tenantId, requestId: 'r' }, cb);

  const dropFixtureCollection = async (): Promise<void> => {
    await connection
      .collection(COLLECTION)
      .drop()
      .catch(() => undefined);
  };

  beforeAll(async () => {
    connection = mongoose.createConnection(process.env.MONGODB_URI as string);
    await connection.asPromise();

    const fixtureSchema = new Schema<Fixture>({
      tenantId: Schema.Types.ObjectId,
      name: String,
    });
    fixtureSchema.plugin(tenantScopePlugin);
    fixtureModel = connection.model<Fixture>(
      'IsolationFixture',
      fixtureSchema,
      COLLECTION,
    );

    await dropFixtureCollection();
    await connection.collection(COLLECTION).insertMany([
      { tenantId: tenantA, name: 'a1' },
      { tenantId: tenantA, name: 'a2' },
      { tenantId: tenantB, name: 'b1' },
    ]);
  });

  afterAll(async () => {
    await dropFixtureCollection();
    await connection.close();
  });

  it('reads only documents owned by the active tenant A, never tenant B', async () => {
    const docs = await asTenant(tenantA.toString(), () =>
      fixtureModel.find({}).exec(),
    );

    expect(docs).toHaveLength(2);
    expect(
      docs.every((doc) => doc.tenantId.toString() === tenantA.toString()),
    ).toBe(true);
  });

  it('reads only documents owned by the active tenant B, never tenant A', async () => {
    const docs = await asTenant(tenantB.toString(), () =>
      fixtureModel.find({}).exec(),
    );

    expect(docs).toHaveLength(1);
    expect(docs[0].tenantId.toString()).toBe(tenantB.toString());
  });

  it('stamps the active tenant on writes instead of trusting the payload', async () => {
    const saved: HydratedDocument<Fixture> = await asTenant(
      tenantA.toString(),
      () => new fixtureModel({ name: 'written' }).save(),
    );

    expect(saved.tenantId.toString()).toBe(tenantA.toString());
  });

  it('rejects a business query executed without a tenant context (fail-closed)', async () => {
    await expect(fixtureModel.find({}).exec()).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
