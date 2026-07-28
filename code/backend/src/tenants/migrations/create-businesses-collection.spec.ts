interface BusinessesMigration {
  up(db: DbMock): Promise<void>;
  down(db: DbMock): Promise<void>;
}

const migration =
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS migration module loaded by its real path for a contract test
  require('../../../migrations/20260706120100-create-businesses-collection.js') as BusinessesMigration;

const COLLECTION = 'businesses';
const SUBDOMAIN_INDEX = 'uq_subdomain';
const STATUS_INDEX = 'idx_status';

type IndexKeys = Record<string, number>;

interface IndexOptions {
  name: string;
  unique?: boolean;
}

interface JsonSchemaProperty {
  bsonType?: string;
  enum?: string[];
  required?: string[];
  properties?: Record<string, JsonSchemaProperty>;
}

interface JsonSchema {
  bsonType: string;
  required: string[];
  properties: Record<string, JsonSchemaProperty>;
  additionalProperties?: boolean;
}

type Validator = { $jsonSchema: JsonSchema } | Record<string, never>;

interface ValidationOptions {
  validator: Validator;
  validationLevel: string;
  validationAction?: string;
}

interface CollModCommand extends ValidationOptions {
  collMod: string;
}

interface CollectionMock {
  createIndex: jest.Mock<Promise<void>, [IndexKeys, IndexOptions]>;
  indexes: jest.Mock<Promise<Array<{ name: string }>>, []>;
  dropIndex: jest.Mock<Promise<void>, [string]>;
}

interface DbMock {
  listCollections: jest.Mock<
    { hasNext: () => Promise<boolean> },
    [{ name: string }]
  >;
  createCollection: jest.Mock<Promise<void>, [string, ValidationOptions]>;
  command: jest.Mock<Promise<void>, [CollModCommand]>;
  collection: jest.Mock<CollectionMock, [string]>;
  collectionMock: CollectionMock;
}

function buildDb(options: {
  collectionExists: boolean;
  existingIndexes: string[];
}): DbMock {
  const collectionMock: CollectionMock = {
    createIndex: jest
      .fn<Promise<void>, [IndexKeys, IndexOptions]>()
      .mockResolvedValue(undefined),
    indexes: jest
      .fn<Promise<Array<{ name: string }>>, []>()
      .mockResolvedValue([
        { name: '_id_' },
        ...options.existingIndexes.map((name) => ({ name })),
      ]),
    dropIndex: jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined),
  };

  return {
    listCollections: jest
      .fn<{ hasNext: () => Promise<boolean> }, [{ name: string }]>()
      .mockReturnValue({
        hasNext: jest
          .fn<Promise<boolean>, []>()
          .mockResolvedValue(options.collectionExists),
      }),
    createCollection: jest
      .fn<Promise<void>, [string, ValidationOptions]>()
      .mockResolvedValue(undefined),
    command: jest
      .fn<Promise<void>, [CollModCommand]>()
      .mockResolvedValue(undefined),
    collection: jest
      .fn<CollectionMock, [string]>()
      .mockReturnValue(collectionMock),
    collectionMock,
  };
}

function findCreateIndexCall(
  db: DbMock,
  indexName: string,
): [IndexKeys, IndexOptions] {
  const call = db.collectionMock.createIndex.mock.calls.find(
    ([, opts]) => opts.name === indexName,
  );
  if (!call) {
    throw new Error(`createIndex was not called for index ${indexName}`);
  }
  return call;
}

function getValidationOptions(db: DbMock): ValidationOptions {
  const created = db.createCollection.mock.calls[0];
  if (created) {
    return created[1];
  }
  const collMod = db.command.mock.calls.find(
    ([cmd]) => cmd.collMod === COLLECTION,
  );
  if (!collMod) {
    throw new Error('No validation options were applied');
  }
  return collMod[0];
}

function getAppliedSchema(db: DbMock): JsonSchema {
  const validator = getValidationOptions(db).validator;
  if (!('$jsonSchema' in validator)) {
    throw new Error('No $jsonSchema validator was applied');
  }
  return validator.$jsonSchema;
}

describe('businesses collection migration contract', () => {
  describe('up', () => {
    it('applies a $jsonSchema validator requiring the core business fields', async () => {
      const db = buildDb({ collectionExists: false, existingIndexes: [] });

      await migration.up(db);

      expect(getAppliedSchema(db).required).toEqual(
        expect.arrayContaining([
          'name',
          'subdomain',
          'status',
          'owner',
          'schemaVersion',
        ]),
      );
    });

    it('restricts status to the TenantStatus enum [active, suspended]', async () => {
      const db = buildDb({ collectionExists: false, existingIndexes: [] });

      await migration.up(db);

      expect(getAppliedSchema(db).properties.status.enum).toEqual([
        'active',
        'suspended',
      ]);
    });

    it('declares owner as an embedded object requiring name and email', async () => {
      const db = buildDb({ collectionExists: false, existingIndexes: [] });

      await migration.up(db);

      const owner = getAppliedSchema(db).properties.owner;
      expect(owner.bsonType).toBe('object');
      expect(owner.required).toEqual(expect.arrayContaining(['name', 'email']));
    });

    it('applies strict validation with errorAndLog action', async () => {
      const db = buildDb({ collectionExists: false, existingIndexes: [] });

      await migration.up(db);

      const options = getValidationOptions(db);
      expect(options.validationLevel).toBe('strict');
      expect(options.validationAction).toBe('errorAndLog');
    });

    it('creates the global unique uq_subdomain index on { subdomain: 1 }', async () => {
      const db = buildDb({ collectionExists: false, existingIndexes: [] });

      await migration.up(db);

      const [keys, opts] = findCreateIndexCall(db, SUBDOMAIN_INDEX);
      expect(keys).toEqual({ subdomain: 1 });
      expect(opts.unique).toBe(true);
    });

    it('creates the idx_status index on { status: 1 }', async () => {
      const db = buildDb({ collectionExists: false, existingIndexes: [] });

      await migration.up(db);

      const [keys, opts] = findCreateIndexCall(db, STATUS_INDEX);
      expect(keys).toEqual({ status: 1 });
      expect(opts.name).toBe(STATUS_INDEX);
    });
  });

  describe('down', () => {
    it('drops uq_subdomain and idx_status when they exist', async () => {
      const db = buildDb({
        collectionExists: true,
        existingIndexes: [SUBDOMAIN_INDEX, STATUS_INDEX],
      });

      await migration.down(db);

      expect(db.collectionMock.dropIndex).toHaveBeenCalledWith(SUBDOMAIN_INDEX);
      expect(db.collectionMock.dropIndex).toHaveBeenCalledWith(STATUS_INDEX);
    });

    it('clears the validator via collMod with validationLevel off', async () => {
      const db = buildDb({
        collectionExists: true,
        existingIndexes: [SUBDOMAIN_INDEX, STATUS_INDEX],
      });

      await migration.down(db);

      const collMod = db.command.mock.calls.find(
        ([cmd]) => cmd.collMod === COLLECTION,
      );
      expect(collMod).toBeDefined();
      const cmd = collMod![0];
      expect(cmd.validator).toEqual({});
      expect(cmd.validationLevel).toBe('off');
    });

    it('is a no-op when the collection does not exist', async () => {
      const db = buildDb({ collectionExists: false, existingIndexes: [] });

      await migration.down(db);

      expect(db.collectionMock.dropIndex).not.toHaveBeenCalled();
      expect(db.command).not.toHaveBeenCalled();
    });
  });
});
