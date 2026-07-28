const COLLECTION = "otps";
const TTL_INDEX = "ttl_expiresAt";
const APPOINTMENT_INDEX = "idx_tenant_appointment";

const validator = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "tenantId",
      "appointmentId",
      "email",
      "codeHash",
      "attempts",
      "expiresAt",
      "schemaVersion"
    ],
    properties: {
      tenantId: { bsonType: "objectId" },
      appointmentId: { bsonType: "objectId" },
      email: { bsonType: "string" },
      codeHash: { bsonType: "string" },
      attempts: { bsonType: "int" },
      expiresAt: { bsonType: "date" },
      consumedAt: { bsonType: ["date", "null"] },
      schemaVersion: { bsonType: "int" },
      createdAt: { bsonType: "date" }
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
      { expiresAt: 1 },
      { name: TTL_INDEX, expireAfterSeconds: 0 }
    );

    await db.collection(COLLECTION).createIndex(
      { tenantId: 1, appointmentId: 1 },
      { name: APPOINTMENT_INDEX }
    );
  },

  async down(db) {
    const exists = await db.listCollections({ name: COLLECTION }).hasNext();
    if (!exists) {
      return;
    }
    const indexes = await db.collection(COLLECTION).indexes();
    const names = indexes.map((i) => i.name);
    for (const name of [APPOINTMENT_INDEX, TTL_INDEX]) {
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
