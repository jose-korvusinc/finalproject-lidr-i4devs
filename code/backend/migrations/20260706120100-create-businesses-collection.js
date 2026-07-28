const COLLECTION = "businesses";
const SUBDOMAIN_INDEX = "uq_subdomain";
const STATUS_INDEX = "idx_status";

const validator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "subdomain", "status", "owner", "schemaVersion"],
    properties: {
      name: { bsonType: "string" },
      subdomain: { bsonType: "string" },
      status: { bsonType: "string", enum: ["active", "suspended"] },
      owner: {
        bsonType: "object",
        required: ["name", "email"],
        properties: {
          name: { bsonType: "string" },
          email: { bsonType: "string" }
        }
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
      { subdomain: 1 },
      { name: SUBDOMAIN_INDEX, unique: true }
    );

    await db.collection(COLLECTION).createIndex(
      { status: 1 },
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
    for (const name of [STATUS_INDEX, SUBDOMAIN_INDEX]) {
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
