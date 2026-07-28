const COLLECTION = "customers";
const EMAIL_INDEX = "uq_tenant_email";

const validator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["tenantId", "name", "email", "schemaVersion"],
    properties: {
      tenantId: { bsonType: "objectId" },
      name: { bsonType: "string" },
      email: { bsonType: "string" },
      phone: { bsonType: "string" },
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
      { tenantId: 1, email: 1 },
      { name: EMAIL_INDEX, unique: true }
    );
  },

  async down(db) {
    const exists = await db.listCollections({ name: COLLECTION }).hasNext();
    if (!exists) {
      return;
    }
    const indexes = await db.collection(COLLECTION).indexes();
    const names = indexes.map((i) => i.name);
    if (names.includes(EMAIL_INDEX)) {
      await db.collection(COLLECTION).dropIndex(EMAIL_INDEX);
    }
    await db.command({
      collMod: COLLECTION,
      validator: {},
      validationLevel: "off"
    });
  }
};
