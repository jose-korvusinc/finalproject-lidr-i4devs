const COLLECTION = "services";
const ACTIVE_INDEX = "idx_tenant_active";

const validator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["tenantId", "name", "price", "durationMinutes", "active", "schemaVersion"],
    properties: {
      tenantId: { bsonType: "objectId" },
      name: { bsonType: "string" },
      price: { bsonType: "decimal" },
      durationMinutes: { bsonType: "int" },
      active: { bsonType: "bool" },
      schemaVersion: { bsonType: "int" },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" }
    },
    additionalProperties: true
  }
};

module.exports = {
  async up(db) {
    const exists = await db.listCollections({ name: COLLECTION }).hasNext();
    if (!exists) {
      await db.createCollection(COLLECTION, {
        validator,
        validationLevel: "strict",
        validationAction: "errorAndLog"
      });
    } else {
      await db.command({
        collMod: COLLECTION,
        validator,
        validationLevel: "strict",
        validationAction: "errorAndLog"
      });
    }

    await db.collection(COLLECTION).createIndex(
      { tenantId: 1, active: 1 },
      { name: ACTIVE_INDEX }
    );
  },

  async down(db) {
    const exists = await db.listCollections({ name: COLLECTION }).hasNext();
    if (!exists) {
      return;
    }
    const indexes = await db.collection(COLLECTION).indexes();
    const names = indexes.map((i) => i.name);
    if (names.includes(ACTIVE_INDEX)) {
      await db.collection(COLLECTION).dropIndex(ACTIVE_INDEX);
    }
    await db.command({
      collMod: COLLECTION,
      validator: {},
      validationLevel: "off"
    });
  }
};
