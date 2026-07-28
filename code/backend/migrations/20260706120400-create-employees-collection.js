const COLLECTION = "employees";
const EMAIL_INDEX = "uq_tenant_email";
const SERVICES_INDEX = "idx_tenant_serviceIds";

const validator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["tenantId", "name", "email", "schemaVersion"],
    properties: {
      tenantId: { bsonType: "objectId" },
      name: { bsonType: "string" },
      email: { bsonType: "string" },
      serviceIds: {
        bsonType: "array",
        items: { bsonType: "objectId" }
      },
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

    await db.collection(COLLECTION).createIndex(
      { tenantId: 1, serviceIds: 1 },
      { name: SERVICES_INDEX }
    );
  },

  async down(db) {
    const exists = await db.listCollections({ name: COLLECTION }).hasNext();
    if (!exists) {
      return;
    }
    const indexes = await db.collection(COLLECTION).indexes();
    const names = indexes.map((i) => i.name);
    for (const name of [SERVICES_INDEX, EMAIL_INDEX]) {
      if (names.includes(name)) {
        await db.collection(COLLECTION).dropIndex(name);
      }
    }
    await db.command({
      collMod: COLLECTION,
      validator: {},
      validationLevel: "off"
    });
  }
};
