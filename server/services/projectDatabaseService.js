const mongoose = require("mongoose");

const connections = new Map();

async function getProjectConnection(uri) {
  if (!uri) {
    throw new Error("Project database URI is not configured.");
  }

  if (connections.has(uri)) {
    const existing = connections.get(uri);
    if (existing.readyState === 1) return existing;
  }

  const connection = await mongoose.createConnection(uri).asPromise();
  connections.set(uri, connection);
  return connection;
}

function normalizeDocument(doc) {
  if (!doc) return doc;
  return {
    ...doc,
    _id: String(doc._id),
  };
}

async function runCrudOperation({ connection, collectionName, method, id, body }) {
  const collection = connection.collection(collectionName);

  if (method === "GET" && !id) {
    const items = await collection.find({}).limit(50).toArray();
    return {
      success: true,
      data: items.map(normalizeDocument),
      count: items.length,
    };
  }

  const query =
    id && mongoose.Types.ObjectId.isValid(id)
      ? { _id: new mongoose.Types.ObjectId(id) }
      : { _id: id };

  if (method === "GET") {
    const item = await collection.findOne(query);
    return {
      success: !!item,
      data: normalizeDocument(item),
    };
  }

  if (method === "POST") {
    const payload = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await collection.insertOne(payload);
    return {
      success: true,
      data: {
        _id: String(result.insertedId),
        ...payload,
      },
    };
  }

  if (method === "PUT" || method === "PATCH") {
    const payload = {
      ...body,
      updatedAt: new Date(),
    };
    await collection.updateOne(query, { $set: payload }, { upsert: false });
    const item = await collection.findOne(query);
    return {
      success: !!item,
      data: normalizeDocument(item),
    };
  }

  if (method === "DELETE") {
    const item = await collection.findOne(query);
    await collection.deleteOne(query);
    return {
      success: !!item,
      data: normalizeDocument(item),
    };
  }

  throw new Error("Unsupported CRUD method.");
}

module.exports = {
  getProjectConnection,
  runCrudOperation,
};
