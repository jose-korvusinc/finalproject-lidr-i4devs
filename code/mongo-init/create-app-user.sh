#!/usr/bin/env bash
set -euo pipefail

mongosh --quiet \
  -u "$MONGO_INITDB_ROOT_USERNAME" \
  -p "$MONGO_INITDB_ROOT_PASSWORD" \
  --authenticationDatabase admin <<EOF
db = db.getSiblingDB("$MONGO_INITDB_DATABASE");
if (!db.getUser("$MONGO_APP_USERNAME")) {
  db.createUser({
    user: "$MONGO_APP_USERNAME",
    pwd: "$MONGO_APP_PASSWORD",
    roles: [
      { role: "readWrite", db: "$MONGO_INITDB_DATABASE" },
      { role: "dbAdmin", db: "$MONGO_INITDB_DATABASE" }
    ]
  });
}
EOF
