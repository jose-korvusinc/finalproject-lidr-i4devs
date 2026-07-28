const COLLECTION = "reminders";
const UNIQUE_INDEX = "uq_tenant_appointment_type";
const STATUS_INDEX = "idx_tenant_status_scheduledFor";

const validator = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "tenantId",
      "appointmentId",
      "customerId",
      "channel",
      "type",
      "scheduledFor",
      "status",
      "schemaVersion"
    ],
    properties: {
      tenantId: { bsonType: "objectId" },
      appointmentId: { bsonType: "objectId" },
      customerId: { bsonType: "objectId" },
      channel: { enum: ["email"] },
      type: { enum: ["reminder-24h"] },
      scheduledFor: { bsonType: "date" },
      sentAt: { bsonType: ["date", "null"] },
      status: { enum: ["pending", "sent", "failed"] },
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
      { tenantId: 1, appointmentId: 1, type: 1 },
      { name: UNIQUE_INDEX, unique: true }
    );

    await db.collection(COLLECTION).createIndex(
      { tenantId: 1, status: 1, scheduledFor: 1 },
      { name: STATUS_INDEX }
    );
  },

  async down(db) {
    const exists = await db.listCollections({ name: COLLECTION }).hasNext();
    if (!exists) {
      return;
    }
    const indexes = await db.collection(COLLECTION).indexes();
    const names = indexes.map((i) => i.name);
    for (const name of [STATUS_INDEX, UNIQUE_INDEX]) {
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
