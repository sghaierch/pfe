// tests/helpers/db.js
const mongoose              = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  mongoServer = await MongoMemoryServer.create();
  const uri   = mongoServer.getUri();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
};

const clearTestDB = async () => {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

const closeTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) await mongoServer.stop();
};

module.exports = { connectTestDB, clearTestDB, closeTestDB };