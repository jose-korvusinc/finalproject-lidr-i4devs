const COLLECTION = "workingHours";
const UNIQUE_INDEX = "uq_tenant_weekday";

const validator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["tenantId", "weekday", "isWorkingDay", "schemaVersion"],
    properties: {
      tenantId: { bsonType: "objectId" },
      weekday: { bsonType: "string" },
      isWorkingDay: { bsonType: "bool" },
      openTime: { bsonType: "string" },
      closeTime: { bsonType: "string" },
      breakStart: { bsonType: ["string", "null"] },
      breakEnd: { bsonType: ["string", "null"] },
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
      { tenantId: 1, weekday: 1 },
      { name: UNIQUE_INDEX, unique: true }
    );
  },

  async down(db) {
    const exists = await db.listCollections({ name: COLLECTION }).hasNext();
    if (!exists) {
      return;
    }
    const indexes = await db.collection(COLLECTION).indexes();
    const names = indexes.map((i) => i.name);
    if (names.includes(UNIQUE_INDEX)) {
      await db.collection(COLLECTION).dropIndex(UNIQUE_INDEX);
    }
    await db.command({
      collMod: COLLECTION,
      validator: {},
      validationLevel: "off"
    });
  }
};
