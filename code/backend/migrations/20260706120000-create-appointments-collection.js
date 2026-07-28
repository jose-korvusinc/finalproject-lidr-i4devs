const COLLECTION = "appointments";
const UNIQUE_INDEX = "uq_tenant_employee_startTime";
const SERVICE_INDEX = "idx_tenant_service_startTime";

const validator = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "tenantId",
      "serviceId",
      "employeeId",
      "customerId",
      "startTime",
      "endTime",
      "status",
      "schemaVersion"
    ],
    properties: {
      tenantId: { bsonType: "objectId" },
      serviceId: { bsonType: "objectId" },
      employeeId: { bsonType: "objectId" },
      customerId: { bsonType: "objectId" },
      startTime: { bsonType: "date" },
      endTime: { bsonType: "date" },
      status: { enum: ["pending", "confirmed", "cancelled"] },
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
      { tenantId: 1, employeeId: 1, startTime: 1 },
      {
        name: UNIQUE_INDEX,
        unique: true,
        partialFilterExpression: { status: { $in: ["pending", "confirmed"] } }
      }
    );

    await db.collection(COLLECTION).createIndex(
      { tenantId: 1, serviceId: 1, startTime: 1 },
      { name: SERVICE_INDEX }
    );
  },

  async down(db) {
    const exists = await db.listCollections({ name: COLLECTION }).hasNext();
    if (!exists) {
      return;
    }
    const indexes = await db.collection(COLLECTION).indexes();
    const names = indexes.map((i) => i.name);
    if (names.includes(SERVICE_INDEX)) {
      await db.collection(COLLECTION).dropIndex(SERVICE_INDEX);
    }
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
