import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "../app";

// We'll need a reference to the 'mongod' server
let mongod: MongoMemoryServer;

// We'll export 'server' so our tests can use it
export const server = require("supertest")(app);

//Runs BEFORE all tests
beforeAll(async () => {
  jest.setTimeout(60000);

  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

//  Runs BEFORE EACH test
beforeEach(async () => {
  const db = mongoose.connection.db;
  if (db) {
    const collections = await db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

//  Runs AFTER all tests
afterAll(async () => {
  // We also check for 'db' here for safety
  const db = mongoose.connection.db;
  if (db) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.connection.close();

  // Only stop mongod *if* it successfully started
  if (mongod) {
    await mongod.stop();
  }
});
